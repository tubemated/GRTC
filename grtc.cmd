@echo off
:: Self-elevation to Administrator so UAC only prompts ONCE at launch
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Requesting Administrator privileges to manage time zones...
    powershell -Command "Start-Process cmd.exe -ArgumentList '/c \"\"%~f0\"\"' -Verb RunAs"
    exit /b
)

title GLOBAL REGION ^& TIME CONTROLLER (GRTC CLI)
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0grtc.ps1"
pause
