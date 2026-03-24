@echo off
echo Organizing Shridev Engineering Study Platform files...

REM Create necessary folders
mkdir css 2>nul
mkdir js 2>nul
mkdir data 2>nul
mkdir assets\icons 2>nul
mkdir assets\images 2>nul

REM Move CSS files to css folder
move *.css css\ 2>nul

REM Move JS files to js folder
move *.js js\ 2>nul

REM Move JSON files to data folder
move *.json data\ 2>nul

REM Check if quiz-generator folder exists and convert to HTML
if exist "quiz-generator" (
    echo Converting quiz-generator folder to HTML file...
    copy "quiz-generator\*.html" "quiz-generator.html" 2>nul
    rmdir /s /q "quiz-generator"
)

echo Organization complete!
echo.
echo Your files are now properly structured:
echo - HTML files are in root directory
echo - CSS files are in /css/ folder
echo - JS files are in /js/ folder
echo - JSON data is in /data/ folder
echo.
pause