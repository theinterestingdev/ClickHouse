from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import clickhouse_driver
import pandas as pd
import csv
import os
import json
import sys
import logging

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Ensure the data directory exists
os.makedirs('../data', exist_ok=True)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/connect-clickhouse', methods=['POST'])
def connect_clickhouse():
    try:
        data = request.json
        host = data.get('host', '')
        port = int(data.get('port', 9000))
        database = data.get('database', '')
        user = data.get('user', '')
        jwt_token = data.get('jwt_token', '')
        
        # Create ClickHouse client with JWT token authentication
        client = clickhouse_driver.Client(
            host=host,
            port=port,
            database=database,
            user=user,
            password=jwt_token
        )
        
        # Test connection
        tables = client.execute("SHOW TABLES")
        
        return jsonify({
            'success': True,
            'tables': [table[0] for table in tables]
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/api/get-table-columns', methods=['POST'])
def get_table_columns():
    try:
        data = request.json
        host = data.get('host', '')
        port = int(data.get('port', 9000))
        database = data.get('database', '')
        user = data.get('user', '')
        jwt_token = data.get('jwt_token', '')
        table = data.get('table', '')
        
        # Create ClickHouse client
        client = clickhouse_driver.Client(
            host=host,
            port=port,
            database=database,
            user=user,
            password=jwt_token
        )
        
        # Get table columns
        columns = client.execute(f"DESCRIBE TABLE {table}")
        
        return jsonify({
            'success': True,
            'columns': [{'name': col[0], 'type': col[1]} for col in columns]
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/api/get-flatfile-columns', methods=['POST'])
def get_flatfile_columns():
    try:
        file_path = request.json.get('filePath', '')
        delimiter = request.json.get('delimiter', ',')
        
        if not os.path.exists(file_path):
            return jsonify({
                'success': False,
                'error': 'File not found'
            }), 404
        
        # Read CSV header
        with open(file_path, 'r') as file:
            csv_reader = csv.reader(file, delimiter=delimiter)
            headers = next(csv_reader)
        
        return jsonify({
            'success': True,
            'columns': [{'name': col, 'type': 'String'} for col in headers]
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/api/clickhouse-to-flatfile', methods=['POST'])
def clickhouse_to_flatfile():
    try:
        data = request.json
        host = data.get('host', '')
        port = int(data.get('port', 9000))
        database = data.get('database', '')
        user = data.get('user', '')
        jwt_token = data.get('jwt_token', '')
        table = data.get('table', '')
        selected_columns = data.get('selectedColumns', [])
        output_file = data.get('outputFile', '')
        delimiter = data.get('delimiter', ',')
        
        # Create ClickHouse client
        client = clickhouse_driver.Client(
            host=host,
            port=port,
            database=database,
            user=user,
            password=jwt_token
        )
        
        # Define the query
        columns_str = ', '.join(selected_columns)
        query = f"SELECT {columns_str} FROM {table}"
        
        # Execute query and get data
        result = client.execute(query, with_column_types=True)
        data, column_types = result
        
        # Convert to DataFrame for easier writing
        df = pd.DataFrame(data, columns=[col[0] for col in column_types])
        
        # Write to file
        df.to_csv(output_file, index=False, sep=delimiter)
        
        # Count records
        record_count = len(df)
        
        return jsonify({
            'success': True,
            'recordCount': record_count,
            'message': f'Successfully exported {record_count} records to {output_file}'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/api/flatfile-to-clickhouse', methods=['POST'])
def flatfile_to_clickhouse():
    try:
        data = request.json
        host = data.get('host', '')
        port = int(data.get('port', 9000))
        database = data.get('database', '')
        user = data.get('user', '')
        jwt_token = data.get('jwt_token', '')
        target_table = data.get('targetTable', '')
        file_path = data.get('filePath', '')
        delimiter = data.get('delimiter', ',')
        selected_columns = data.get('selectedColumns', [])
        
        # Read flat file
        df = pd.read_csv(file_path, delimiter=delimiter, usecols=selected_columns if selected_columns else None)
        
        # Convert all columns to strings to avoid encoding issues
        for col in df.columns:
            df[col] = df[col].astype(str)
        
        # Create ClickHouse client
        client = clickhouse_driver.Client(
            host=host,
            port=port,
            database=database,
            user=user,
            password=jwt_token
        )
        
        # Prepare data for insertion
        columns = df.columns.tolist()
        values = df.values.tolist()
        
        # Drop the table if it exists and create a new one
        try:
            client.execute(f"DROP TABLE IF EXISTS {target_table}")
            # Create table with all columns as String type
            columns_str = ', '.join([f"`{col}` String" for col in columns])
            create_query = f"CREATE TABLE {target_table} ({columns_str}) ENGINE = MergeTree() ORDER BY tuple()"
            client.execute(create_query)
        except Exception as e:
            return jsonify({
                'success': False,
                'error': f"Error creating table: {str(e)}"
            }), 400
        
        # Insert data
        columns_str = ', '.join([f"`{col}`" for col in columns])
        client.execute(
            f"INSERT INTO {target_table} ({columns_str}) VALUES",
            values
        )
        
        record_count = len(df)
        
        return jsonify({
            'success': True,
            'recordCount': record_count,
            'message': f'Successfully imported {record_count} records to ClickHouse table {target_table}'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/api/preview-data', methods=['POST'])
def preview_data():
    try:
        data = request.json
        source_type = data.get('sourceType', '')
        
        if source_type == 'clickhouse':
            host = data.get('host', '')
            port = int(data.get('port', 9000))
            database = data.get('database', '')
            user = data.get('user', '')
            jwt_token = data.get('jwt_token', '')
            selected_columns = data.get('selectedColumns', [])
            
            # Create ClickHouse client
            client = clickhouse_driver.Client(
                host=host,
                port=port,
                database=database,
                user=user,
                password=jwt_token
            )
            
            # Check if this is a JOIN query
            is_join = data.get('isJoin', False)
            
            if is_join:
                tables = data.get('tables', [])
                join_condition = data.get('joinCondition', '')
                
                if not tables or len(tables) < 2:
                    return jsonify({
                        'success': False,
                        'error': 'At least two tables are required for a join'
                    }), 400
                
                # Construct the JOIN query
                from_clause = tables[0]
                join_clauses = []
                
                for i in range(1, len(tables)):
                    join_clauses.append(f"JOIN {tables[i]} ON {join_condition}")
                
                join_query = f"SELECT {', '.join(selected_columns)} FROM {from_clause} {' '.join(join_clauses)} LIMIT 100"
                
                # Execute query and get data
                result = client.execute(join_query, with_column_types=True)
                data, column_types = result
                
                column_names = [col[0] for col in column_types]
                
                return jsonify({
                    'success': True,
                    'columns': column_names,
                    'data': data
                })
            else:
                table = data.get('table', '')
                # Define the query with limit
                columns_str = ', '.join(selected_columns)
                query = f"SELECT {columns_str} FROM {table} LIMIT 100"
                
                # Execute query and get data
                result = client.execute(query, with_column_types=True)
                data, column_types = result
                
                column_names = [col[0] for col in column_types]
                
                return jsonify({
                    'success': True,
                    'columns': column_names,
                    'data': data
                })
        elif source_type == 'flatfile':
            file_path = data.get('filePath', '')
            delimiter = data.get('delimiter', ',')
            selected_columns = data.get('selectedColumns', [])
            
            # Read CSV with limit
            df = pd.read_csv(file_path, delimiter=delimiter, nrows=100, 
                         usecols=selected_columns if selected_columns else None)
            
            return jsonify({
                'success': True,
                'columns': df.columns.tolist(),
                'data': df.values.tolist()
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Invalid source type'
            }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/api/clickhouse-join-to-flatfile', methods=['POST'])
def clickhouse_join_to_flatfile():
    try:
        data = request.json
        host = data.get('host', '')
        port = int(data.get('port', 9000))
        database = data.get('database', '')
        user = data.get('user', '')
        jwt_token = data.get('jwt_token', '')
        tables = data.get('tables', [])
        join_condition = data.get('joinCondition', '')
        selected_columns = data.get('selectedColumns', [])
        output_file = data.get('outputFile', '')
        delimiter = data.get('delimiter', ',')
        
        if not tables or len(tables) < 2:
            return jsonify({
                'success': False,
                'error': 'At least two tables are required for a join'
            }), 400
        
        # Create ClickHouse client
        client = clickhouse_driver.Client(
            host=host,
            port=port,
            database=database,
            user=user,
            password=jwt_token
        )
        
        # Construct the JOIN query
        from_clause = tables[0]
        join_clauses = []
        
        for i in range(1, len(tables)):
            join_clauses.append(f"JOIN {tables[i]} ON {join_condition}")
        
        join_query = f"SELECT {', '.join(selected_columns)} FROM {from_clause} {' '.join(join_clauses)}"
        
        # Execute query and get data
        result = client.execute(join_query, with_column_types=True)
        data, column_types = result
        
        # Convert to DataFrame for easier writing
        df = pd.DataFrame(data, columns=[col[0] for col in column_types])
        
        # Write to file
        df.to_csv(output_file, index=False, sep=delimiter)
        
        # Count records
        record_count = len(df)
        
        return jsonify({
            'success': True,
            'recordCount': record_count,
            'message': f'Successfully exported {record_count} records to {output_file}'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

if __name__ == '__main__':
    HOST = os.environ.get('HOST', '0.0.0.0')
    PORT = int(os.environ.get('PORT', 5000))
    DEBUG = os.environ.get('FLASK_ENV', 'production') == 'development'
    
    logger.info(f"Starting ClickHouse Data Ingestion Tool on {HOST}:{PORT}")
    logger.info(f"Debug mode: {DEBUG}")
    
    try:
        app.run(host=HOST, port=PORT, debug=DEBUG)
    except Exception as e:
        logger.error(f"Error starting application: {str(e)}")
        sys.exit(1) 