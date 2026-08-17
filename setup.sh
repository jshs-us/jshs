#!/bin/bash
# ── 1-3반 앱 최초 셋업 스크립트 ─────────────────────────────────────
# 사용법: 이 프로젝트 폴더(bestwing-app)에서 터미널을 열고
#   chmod +x setup.sh && ./setup.sh
# 를 실행하세요. (macOS 기준, iOS 빌드는 Xcode가 설치된 Mac이 필요합니다)

set -e

echo "▶ 1) 패키지 설치 중..."
npm install

echo "▶ 2) iOS / Android 네이티브 프로젝트 생성 중..."
npx cap add ios
npx cap add android

echo "▶ 3) 앱 아이콘 / 스플래시 스크린 생성 중..."
npx @capacitor/assets generate \
  --iconBackgroundColor '#061442' \
  --iconBackgroundColorDark '#061442' \
  --splashBackgroundColor '#061442' \
  --splashBackgroundColorDark '#061442'

echo "▶ 4) 웹 리소스를 네이티브 프로젝트에 동기화 중..."
npx cap sync

echo ""
echo "✅ 완료! 다음 명령으로 각 IDE를 열 수 있어요:"
echo "   iOS:     npm run open:ios      (Xcode 필요, Mac 전용)"
echo "   Android: npm run open:android  (Android Studio 필요)"
echo ""
echo "아이패드에서 실행하려면 iOS 빌드를 그대로 쓰면 됩니다."
echo "(Universal 앱이라 아이폰/아이패드 겸용입니다)"
