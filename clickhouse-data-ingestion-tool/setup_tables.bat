@echo off
echo Setting up test tables in ClickHouse...

REM Drop and recreate employees table
echo Creating employees table...
docker exec -it clickhouse-data-ingestion-tool-clickhouse-1 clickhouse-client --user default --password clickhouse -q "DROP TABLE IF EXISTS employees"
docker exec -it clickhouse-data-ingestion-tool-clickhouse-1 clickhouse-client --user default --password clickhouse -q "CREATE TABLE employees (id UInt32, name String, department String, salary UInt32) ENGINE = MergeTree ORDER BY id"
docker exec -it clickhouse-data-ingestion-tool-clickhouse-1 clickhouse-client --user default --password clickhouse -q "INSERT INTO employees VALUES (1, 'John Smith', 'Sales', 50000), (2, 'Jane Doe', 'Marketing', 60000), (3, 'Bob Johnson', 'Engineering', 75000), (4, 'Alice Brown', 'Sales', 55000), (5, 'Charlie Davis', 'Engineering', 85000)"

REM Drop and recreate departments table
echo Creating departments table...
docker exec -it clickhouse-data-ingestion-tool-clickhouse-1 clickhouse-client --user default --password clickhouse -q "DROP TABLE IF EXISTS departments"
docker exec -it clickhouse-data-ingestion-tool-clickhouse-1 clickhouse-client --user default --password clickhouse -q "CREATE TABLE departments (department String, location String, manager String) ENGINE = MergeTree ORDER BY department"
docker exec -it clickhouse-data-ingestion-tool-clickhouse-1 clickhouse-client --user default --password clickhouse -q "INSERT INTO departments VALUES ('Sales', 'New York', 'David Wilson'), ('Marketing', 'Chicago', 'Sarah Lee'), ('Engineering', 'San Francisco', 'Michael Clark'), ('HR', 'Boston', 'Emily White')"

REM Drop and recreate uk_price_paid table
echo Creating uk_price_paid table...
docker exec -it clickhouse-data-ingestion-tool-clickhouse-1 clickhouse-client --user default --password clickhouse -q "DROP TABLE IF EXISTS uk_price_paid"
docker exec -it clickhouse-data-ingestion-tool-clickhouse-1 clickhouse-client --user default --password clickhouse -q "CREATE TABLE uk_price_paid (price UInt32, date Date, postcode1 String, postcode2 String, type Enum8('terraced' = 1, 'semi-detached' = 2, 'detached' = 3, 'flat' = 4, 'other' = 0), is_new UInt8, duration Enum8('freehold' = 1, 'leasehold' = 2, 'unknown' = 0), addr1 String, addr2 String, street String, locality String, town String, district String, county String) ENGINE = MergeTree ORDER BY (postcode1, postcode2, addr1, addr2)"
docker exec -it clickhouse-data-ingestion-tool-clickhouse-1 clickhouse-client --user default --password clickhouse -q "INSERT INTO uk_price_paid VALUES (295000, '2022-01-15', 'SW1A', '1AA', 'terraced', 0, 'freehold', '10', '', 'Downing Street', 'Westminster', 'London', 'Westminster', 'Greater London'), (425000, '2022-02-10', 'M1', '1AA', 'flat', 1, 'leasehold', '15', 'Apt 10', 'Oxford Road', 'City Centre', 'Manchester', 'Manchester', 'Greater Manchester'), (350000, '2022-03-05', 'B1', '1AA', 'semi-detached', 0, 'freehold', '25', '', 'New Street', 'City Centre', 'Birmingham', 'Birmingham', 'West Midlands')"

REM Verify tables
echo Verifying tables...
docker exec -it clickhouse-data-ingestion-tool-clickhouse-1 clickhouse-client --user default --password clickhouse -q "SHOW TABLES"

REM Show contents
echo Employees table:
docker exec -it clickhouse-data-ingestion-tool-clickhouse-1 clickhouse-client --user default --password clickhouse -q "SELECT * FROM employees"

echo Departments table:
docker exec -it clickhouse-data-ingestion-tool-clickhouse-1 clickhouse-client --user default --password clickhouse -q "SELECT * FROM departments"

echo UK Price Paid table:
docker exec -it clickhouse-data-ingestion-tool-clickhouse-1 clickhouse-client --user default --password clickhouse -q "SELECT * FROM uk_price_paid"

echo Setup complete!
echo You can now test the application at http://localhost:5001 