# Manual Setup Instructions for ClickHouse Data Ingestion Tool

If the automated scripts are not working, you can follow these manual steps to set up and test the application.

## Step 1: Start the Containers

```bash
# Navigate to the project directory
cd clickhouse-data-ingestion-tool

# Stop any existing containers
docker-compose down

# Start fresh containers
docker-compose up -d
```

## Step 2: Verify Containers are Running

```bash
docker ps
```

You should see two containers running:
- A container with "clickhouse" in the name
- A container with "webapp" in the name

Take note of their container IDs.

## Step 3: Access the Web Application

Open your browser and go to:
```
http://localhost:5001
```

## Step 4: Manual Test Setup

### Check ClickHouse Connection

First, verify that you can connect to ClickHouse:

```bash
# Replace CONTAINER_ID with the actual ClickHouse container ID
docker exec -it CONTAINER_ID clickhouse-client --user default --password clickhouse
```

If you get the ClickHouse prompt, the connection is working.

### Create Test Tables

Once connected to ClickHouse, create the test tables:

```sql
-- Create uk_price_paid table
CREATE TABLE uk_price_paid
(
    price UInt32,
    date Date,
    postcode1 String,
    postcode2 String,
    type Enum8('terraced' = 1, 'semi-detached' = 2, 'detached' = 3, 'flat' = 4, 'other' = 0),
    is_new UInt8,
    duration Enum8('freehold' = 1, 'leasehold' = 2, 'unknown' = 0),
    addr1 String,
    addr2 String,
    street String,
    locality String,
    town String,
    district String,
    county String
)
ENGINE = MergeTree
ORDER BY (postcode1, postcode2, addr1, addr2);

-- Insert sample data
INSERT INTO uk_price_paid VALUES
(295000, '2022-01-15', 'SW1A', '1AA', 'terraced', 0, 'freehold', '10', '', 'Downing Street', 'Westminster', 'London', 'Westminster', 'Greater London'),
(425000, '2022-02-10', 'M1', '1AA', 'flat', 1, 'leasehold', '15', 'Apt 10', 'Oxford Road', 'City Centre', 'Manchester', 'Manchester', 'Greater Manchester'),
(350000, '2022-03-05', 'B1', '1AA', 'semi-detached', 0, 'freehold', '25', '', 'New Street', 'City Centre', 'Birmingham', 'Birmingham', 'West Midlands');

-- Create employees table
CREATE TABLE employees
(
    id UInt32,
    name String,
    department String,
    salary UInt32
)
ENGINE = MergeTree
ORDER BY id;

-- Insert data
INSERT INTO employees VALUES
(1, 'John Smith', 'Sales', 50000),
(2, 'Jane Doe', 'Marketing', 60000),
(3, 'Bob Johnson', 'Engineering', 75000);

-- Create departments table
CREATE TABLE departments
(
    department String,
    location String,
    manager String
)
ENGINE = MergeTree
ORDER BY department;

-- Insert data
INSERT INTO departments VALUES
('Sales', 'New York', 'David Wilson'),
('Marketing', 'Chicago', 'Sarah Lee'),
('Engineering', 'San Francisco', 'Michael Clark');
```

Type `exit` to exit the ClickHouse client.

### Create Test CSV Files

Create the test files in the data directory:

```bash
# Replace CONTAINER_ID with the webapp container ID
docker exec -it CONTAINER_ID bash
```

Once inside the container:

```bash
# Create directory if it doesn't exist
mkdir -p /app/data

# Create test_import.csv
cat > /app/data/test_import.csv << EOF
id,name,age,city
1,John,30,"New York"
2,Mary,25,Boston
3,Bob,40,Chicago
EOF

# Create sample.csv
cat > /app/data/sample.csv << EOF
id,name,age,city,country,salary
1,John Smith,35,New York,USA,75000
2,Mary Johnson,28,London,UK,65000
3,Robert Lee,42,Toronto,Canada,80000
4,Sarah Kim,31,Sydney,Australia,70000
5,David Chen,39,Singapore,Singapore,85000
6,Emma Wilson,26,Berlin,Germany,60000
7,Michael Brown,45,Paris,France,90000
8,Sofia Garcia,33,Madrid,Spain,72000
9,James Patel,37,Mumbai,India,68000
10,Olivia Anderson,30,Moscow,Russia,64000
EOF

# Verify files were created
ls -l /app/data

# Exit container
exit
```

## Step 5: Run Test Cases

Now you can use the web application to test:

1. Export from ClickHouse to flat file
2. Import from flat file to ClickHouse
3. Join ClickHouse tables and export to flat file

## ClickHouse Connection Details

When prompted for connection details, use:
- Host: localhost
- Port: 9000
- Database: default
- User: default
- Password: clickhouse

## Cleanup

When finished testing:

```bash
docker-compose down
``` 