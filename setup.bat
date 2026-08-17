@echo off
REM ── 1-3반 앱 최초 셋업 스크립트 (Windows 11 전용) ──────────────────
REM 사용법: 이 폴더(bestwing-app)에서 더블클릭하거나
REM   cmd 창에서 setup.bat 실행하세요.
REM
REM 준비물: Node.js (https://nodejs.org 에서 LTS 버전 설치),
REM         Android Studio (https://developer.android.com/studio)

echo ============================================
echo  1-3반 앱 셋업을 시작합니다 (Android 전용)
echo ============================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [오류] Node.js가 설치되어 있지 않아요.
    echo https://nodejs.org 에서 LTS 버전을 먼저 설치해주세요.
    pause
    exit /b 1
)

echo [1/4] 패키지 설치 중...
call npm install
if %errorlevel% neq 0 goto :error

echo.
echo [2/4] Android 네이티브 프로젝트 생성 중...
call npx cap add android
if %errorlevel% neq 0 goto :error

echo.
echo [3/4] 앱 아이콘 / 스플래시 스크린 생성 중...
call npx @capacitor/assets generate --iconBackgroundColor "#061442" --iconBackgroundColorDark "#061442" --splashBackgroundColor "#061442" --splashBackgroundColorDark "#061442"
if %errorlevel% neq 0 goto :error

echo.
echo [4/4] 웹 리소스를 네이티브 프로젝트에 동기화 중...
call npx cap sync android
if %errorlevel% neq 0 goto :error

echo.
echo ============================================
echo  완료! 아래 명령으로 Android Studio를 여세요:
echo    npm run open:android
echo ============================================
echo.
echo (iOS/아이패드 앱은 Windows에서 직접 빌드할 수 없어요.
echo  codemagic.yaml 파일과 README의 iOS 안내를 참고해주세요.)
pause
exit /b 0

:error
echo.
echo [오류] 위 단계에서 문제가 발생했어요. 메시지를 확인해주세요.
pause
exit /b 1
