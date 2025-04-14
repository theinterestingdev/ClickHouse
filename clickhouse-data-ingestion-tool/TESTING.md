# Testing the ClickHouse Data Ingestion Tool

This document provides instructions for automated testing of the ClickHouse Data Ingestion Tool.

## Prerequisites

- Docker and Docker Compose installed and running
- The application containers must be running

## Automated Test Setup

We've provided scripts to automatically create test tables and sample data for testing the application. These scripts will:

1. Create and populate three test tables in ClickHouse:
   - `uk_price_paid` (property sales data)
   - `employees` (employee information)
   - `departments` (department information)
2. Create sample CSV files in the data directory for testing imports

### Running the Test Setup

#### On Windows:

```
cd clickhouse-data-ingestion-tool
setup_test_env.bat
```

#### On Linux/macOS:

```
cd clickhouse-data-ingestion-tool
chmod +x setup_test_env.sh
./setup_test_env.sh
```

## Test Cases

After setting up the test environment, you can perform the following test cases:

### Test Case 1: ClickHouse → Flat File

1. Open your browser and go to http://localhost:5001
2. Click "Export Data from ClickHouse"
3. Enter connection details:
   - Host: clickhouse
   - Port: 9000
   - Database: default
   - User: default
   - JWT Token: clickhouse
4. Click "Connect to ClickHouse"
5. Select "uk_price_paid" table
6. Select columns: price, date, postcode1, town, county
7. Set output file: `/app/data/uk_prices_export.csv`
8. Click "Export Data"
9. Verify success message shows 5 records exported

### Test Case 2: Flat File → ClickHouse

1. Click "Import Data to ClickHouse" in the navigation
2. Set file path: `/app/data/test_import.csv`
3. Delimiter: `,`
4. Click "Load Columns"
5. Enter ClickHouse connection details (same as above)
6. Target table: `imported_data_test`
7. Click "Import Data"
8. Verify success message shows 5 records imported

### Test Case 3: Joined Tables → Flat File

1. Click "Join ClickHouse Tables & Export"
2. Enter ClickHouse connection details (same as above)
3. Select tables: employees, departments
4. JOIN condition: `employees.department = departments.department`
5. Click "Load Columns"
6. Select columns: employees.id, employees.name, employees.department, departments.location, departments.manager
7. Set output file: `/app/data/joined_data.csv`
8. Click "Export Joined Data"
9. Verify success message shows correct record count

### Test Case 4: Connection Failures

1. Try connecting with incorrect credentials:
   - Host: clickhouse
   - Port: 9000
   - Database: nonexistent
   - User: wrong
   - JWT Token: wrong
2. Verify error message appears

### Test Case 5: Data Preview

1. Follow the first few steps of any import/export operation
2. Click "Preview Data" instead of the action button
3. Verify sample data appears in a table format

## Cleaning Up

After testing, you can clean up the test environment by running:

### On Windows:

```
cd clickhouse-data-ingestion-tool
setup_test_env.bat cleanup
```

### On Linux/macOS:

```
cd clickhouse-data-ingestion-tool
./setup_test_env.sh cleanup
```

This will:
1. Drop all test tables from ClickHouse
2. Remove all CSV files from the data directory 