@echo off
:: ========================================================
::  GLOBAL REGION & TIME CONTROLLER (GRTC) - Launcher
:: ========================================================

:: Auto-elevate to Administrator (only prompts once at launch)
net session >nul 2>&1
if %errorLevel% neq 0 (
    powershell -NoProfile -Command "Start-Process cmd.exe -ArgumentList '/c \"\"%~f0\"\"' -Verb RunAs"
    exit /b
)

title GLOBAL REGION ^& TIME CONTROLLER (GRTC)
cls
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0grtc.ps1"
pause
