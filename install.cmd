@echo off
rem Copies the skills and agents into your user-level Claude Code folders (~/.claude).
rem Existing files with the same names are overwritten; nothing else is touched.
setlocal
set "SRC=%~dp0"
set "DST=%USERPROFILE%\.claude"
if not exist "%DST%\skills" mkdir "%DST%\skills"
if not exist "%DST%\agents" mkdir "%DST%\agents"
xcopy /E /I /Y /Q "%SRC%skills" "%DST%\skills" >nul
xcopy /I /Y /Q "%SRC%agents\*.md" "%DST%\agents" >nul
echo Installed skills to %DST%\skills and agents to %DST%\agents
echo.
echo Optional - register the agent hub for every Claude Code session:
echo   claude mcp add --transport http --scope user agenthub http://127.0.0.1:8799/mcp
echo and start it with agenthub\start_hub.cmd
endlocal
