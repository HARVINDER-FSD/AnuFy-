@echo off
echo Testing common PostgreSQL passwords...
echo.

echo Trying password: postgres
psql -U postgres -h localhost -p 5432 -c "SELECT version();" 2>nul
if %errorlevel% == 0 (
    echo SUCCESS! Password is: postgres
    echo.
    echo Update your .env file with:
    echo DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres
    pause
    exit
)

echo Trying password: admin
psql -U postgres -h localhost -p 5432 -c "SELECT version();" -W admin 2>nul
if %errorlevel% == 0 (
    echo SUCCESS! Password is: admin
    echo.
    echo Update your .env file with:
    echo DATABASE_URL=postgresql://postgres:admin@localhost:5432/postgres
    pause
    exit
)

echo Trying password: password
psql -U postgres -h localhost -p 5432 -c "SELECT version();" -W password 2>nul
if %errorlevel% == 0 (
    echo SUCCESS! Password is: password
    echo.
    echo Update your .env file with:
    echo DATABASE_URL=postgresql://postgres:password@localhost:5432/postgres
    pause
    exit
)

echo.
echo None of the common passwords worked.
echo.
echo You need to either:
echo 1. Remember your PostgreSQL password
echo 2. Reset it (see FIX_DATABASE_CONNECTION.md)
echo 3. Use Neon instead (RECOMMENDED - see IMMEDIATE_FIX.md)
echo.
pause
