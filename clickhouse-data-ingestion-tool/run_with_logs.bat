@echo off
echo ===== ClickHouse Data Ingestion Tool - Running with Logs =====

:: Stop any existing containers
echo Stopping any existing containers...
docker-compose down

:: Start containers in the foreground with logs
echo Starting containers with logs visible...
echo.
echo Connection Details (for when the app is running):
echo   URL: http://localhost:5001
echo   ClickHouse Host: clickhouse
echo   ClickHouse Port: 9000
echo   ClickHouse Database: default
echo   ClickHouse User: default
echo   ClickHouse Password: clickhouse
echo.
echo Press Ctrl+C to stop the containers when finished
echo.
echo Starting containers...
echo =====================================================
docker-compose up 