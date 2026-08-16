@echo off

echo.
echo ==============================
echo   GitHub Login
echo ==============================
echo.

"C:\Program Files\Git\bin\bash.exe" -lc "printf 'protocol=https\nhost=github.com\n\n' | git credential-manager get"

echo.
echo ==============================
echo   Git User Setup
echo ==============================
echo.

set /p GIT_NAME=Enter your Git name: 
git config --global user.name "%GIT_NAME%"

set /p GIT_EMAIL=Enter your GitHub email: 
git config --global user.email "%GIT_EMAIL%"

echo.
echo Git identity configured.
echo.

echo ==============================
echo   Installing dependencies
echo ==============================
echo.


echo ==============================
echo   Git Upstream Setup
echo ==============================
echo.

git remote remove upstream 2>nul
git remote add upstream https://github.com/fardm/arman-portfolio-template.git

echo.
call npm install

if %errorlevel% neq 0 (
    echo.
    echo npm install failed.
    pause
    exit /b 1
)

echo.
echo ==============================
echo   Setup completed successfully
echo ==============================
echo.
echo Now run admin-panel.bat
echo.

pause