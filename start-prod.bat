@echo off
REM EzyBill Pro - Production Startup (Windows)
REM This script prepares and starts EzyBill Pro for production

setlocal enabledelayedexpansion

echo.
echo ========================================
echo  EzyBill Pro - Production Startup
echo ========================================
echo.

cd /d "%~dp0"

echo [1/5] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed!
    echo Please download from https://nodejs.org/
    pause
    exit /b 1
)
echo OK - Node.js found

echo.
echo [2/5] Installing dependencies...
call npm run install:all --silent
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo OK - Dependencies installed

echo.
echo [3/5] Checking environment configuration...
if exist "server\.env" (
    echo OK - .env file exists
) else (
    echo WARNING: No .env file found
    echo Creating one from template...
    copy server\.env.example server\.env >nul
    echo ! Please edit server\.env with your production secrets
    echo ! Especially: JWT_SECRET and ALLOWED_ORIGINS
    pause
)

echo.
echo [4/5] Building frontend...
call npm run build >nul 2>&1
if errorlevel 1 (
    echo ERROR: Frontend build failed
    pause
    exit /b 1
)
echo OK - Frontend built successfully

echo.
echo [5/5] Starting EzyBill Pro...
echo.
echo ========================================
echo  Server starting...
echo  http://localhost:4000
echo ========================================
echo.

cd server
call npm start
