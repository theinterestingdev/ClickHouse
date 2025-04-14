# ClickHouse Data Ingestion Tool

A web-based tool for importing, exporting, and joining data between ClickHouse databases and CSV files. This application provides an intuitive interface for data engineers and analysts to work with ClickHouse data without writing SQL queries.

## Features

- **Connect to ClickHouse**: Configure connection to any ClickHouse server
- **Export Data**: Export table data from ClickHouse to CSV files
- **Import Data**: Import CSV files into ClickHouse tables
- **Join Tables**: Join multiple ClickHouse tables and export the results
- **Column Selection**: Choose specific columns for import/export operations
- **Data Preview**: Preview data before importing or exporting
- **Sample Tables**: Includes setup scripts to create sample tables for testing

## Architecture

The application follows a client-server architecture:

- **Frontend**: Built with HTML, CSS, and JavaScript
- **Backend**: Flask-based REST API in Python
- **Database**: Connects to ClickHouse for data storage
- **Docker**: Containerized for easy deployment

## Prerequisites

- Python 3.7+
- Docker and Docker Compose
- Web browser

## Quick Start

### Option 1: Using Setup Scripts (Recommended for First-Time Users)

This method automatically creates the sample tables in ClickHouse using SQL commands.

#### Windows

1. Clone the repository
2. Run the setup script to create sample tables:
   ```
   setup_tables.bat
   ```
3. Start the application:
   ```
   run_with_logs.bat
   ```
4. Open your browser and navigate to: http://localhost:5001

#### Linux/macOS

1. Clone the repository
2. Make the scripts executable:
   ```bash
   chmod +x setup_tables.sh run_with_logs.sh
   ```
3. Run the setup script to create sample tables:
   ```bash
   ./setup_tables.sh
   ```
4. Start the application:
   ```bash
   ./run_with_logs.sh
   ```
5. Open your browser and navigate to: http://localhost:5001

### Option 2: Manual CSV Import

This method requires you to import the CSV files manually through the application interface.

1. Start the application without running the setup scripts:
   ```
   run_with_logs.bat  # Windows
   ./run_with_logs.sh  # Linux/macOS
   ```

2. Open your browser and navigate to http://localhost:5001

3. **IMPORTANT: You must first import CSV files before they'll appear as tables for joining or exporting**

4. Follow these steps to import each CSV file:

   a. Click on "Import to ClickHouse" in the main navigation
   
   b. Enter the ClickHouse connection details:
      - Host: localhost
      - Port: 9000
      - User: default
      - Password: clickhouse
      - Database: default
   
   c. Upload the sample CSV files from the `data` directory one by one:
      - Choose `employees.csv` and create a new table named `employees`
      - Map columns: id (UInt32), name (String), department (String), salary (UInt32)
      - Click "Import Data"
      
      - Choose `departments.csv` and create a new table named `departments`
      - Map columns: department (String), location (String), manager (String)
      - Click "Import Data"
      
      - Choose `uk_price_paid.csv` and create a new table named `uk_price_paid`
      - Map columns appropriately (all columns as String except price as UInt32, date as Date, is_new as UInt8)
      - Click "Import Data"

5. After importing all files, you can proceed to use the "Join ClickHouse Tables & Export" feature, where the tables will now appear in the selection dropdown.

### Using Docker Only

```bash
docker-compose up
```
Then follow either Option 1 or Option 2 to set up the sample tables.

## Usage Guide

### Exporting Data from ClickHouse to CSV

1. Click on "Export to CSV" in the main navigation
2. Enter ClickHouse connection details
3. Select the table to export
4. Choose columns to export
5. Specify output file path
6. Click "Export Data"

### Importing Data from CSV to ClickHouse

1. Click on "Import to ClickHouse" in the main navigation
2. Enter ClickHouse connection details
3. Upload or specify path to CSV file
4. Choose target table (existing or new)
5. Map CSV columns to table columns
6. Click "Import Data"

### Joining ClickHouse Tables & Exporting

1. Click on "Join ClickHouse Tables & Export"
2. Enter ClickHouse connection details
3. Select tables to join (these must exist in the database already - either created by setup scripts or imported via CSV)
4. Specify join conditions (e.g., employees.department = departments.department)
5. Choose columns to include in the output (recommended: id, name, salary, department, location, manager)
6. Specify output file path (e.g., /app/data/joined_export.csv)
7. Click "Export Joined Data"

## Sample Tables

The application includes three sample tables:

1. **employees**: Contains employee records with id, name, department, and salary
2. **departments**: Contains department information with department name, location, and manager
3. **uk_price_paid**: Contains real estate transaction data with various details

These tables can be used to test the application's functionality, especially the join feature.

## Troubleshooting

- **Tables Not Appearing**: Ensure you've either run the setup scripts or manually imported the CSV files
- **Connection Issues**: Verify ClickHouse connection details and network settings
- **Docker Errors**: Ensure Docker is running and required ports are available
- **Permission Issues**: For Linux/macOS, use `sudo` if necessary

## License

This project is open source under the MIT license.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. 