@echo off
rem Starts the local agenthub on http://127.0.0.1:8799 (stdlib Python, no third-party code).
title agenthub
where py >nul 2>nul && (py -3 -I "%~dp0agenthub.py" & goto :eof)
python -I "%~dp0agenthub.py"
