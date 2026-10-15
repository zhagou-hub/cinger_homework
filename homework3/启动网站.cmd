@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo 请先安装 Node.js 20 或更新版本，然后重新运行本文件。
  pause
  exit /b 1
)
echo 请在浏览器中打开 http://127.0.0.1:4173
echo 关闭此窗口即可停止网站。
node server.mjs
pause
