@echo off
title VND Money Tracker
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-app.ps1"
