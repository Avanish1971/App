@echo off
echo ==== Step 1: web build ====
call npm run build
if errorlevel 1 goto fail

echo ==== Step 2: Capacitor sync ====
call npx cap sync android
if errorlevel 1 goto fail

echo ==== Step 3: check karo ki APK AWS wale mode me hai ====
findstr /C:"54.253.216.68:3000" android\app\src\main\assets\capacitor.config.json
if errorlevel 1 (
  echo.
  echo ERROR: config me AWS ki url nahi mili.
  echo capacitor.config.ts is folder me replace karo aur script dobara chalao.
  goto fail
)

echo ==== Step 4: GitHub par push ====
git add -f android/app/src/main/assets
git add .
git commit -m "remote url mode"
git push origin main

echo.
echo DONE. Ab Appcircle se naya APK banao, phone se purana app uninstall karke naya install karo.
goto end

:fail
echo.
echo FAILED. Upar jo error likha hai wo mujhe bhej do.

:end
pause