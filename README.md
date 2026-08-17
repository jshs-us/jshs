# 1-3반 앱 (bestwing-app)

전남과학고 1-3반 정보 제공 사이트(jshs-us.github.io/jshs/)를
**Capacitor**로 감싼 iOS / iPadOS / Android 앱 프로젝트입니다.

기존 웹사이트(HTML/CSS/JS, Google Apps Script + Sheets 연동)를 거의 그대로 쓰면서
네이티브 앱 껍데기(아이콘, 스플래시, 앱스토어 배포, 오프라인 감지, 로그인 유지 등)를 씌운 구조입니다.

---

## 폴더 구조

```
bestwing-app/
├── www/                      ← 실제 웹 소스 (기존 파일 + 앱 패치)
│   ├── index.html, board.html, admin.html, calendar.html,
│   │   homework.html, meal.html, mypage.html, timetable.html
│   ├── common.js             ← 원본 그대로 (로그인/네비/푸터)
│   ├── native-bridge.js      ← ★ 새로 추가: 앱 전용 동작 처리
│   └── logo.png
├── assets/
│   ├── icon-source.png       ← 원본 로고
│   ├── icon-1024.png         ← 앱 아이콘용 (네이비 배경 정사각형)
│   └── splash-2732.png       ← 스플래시 스크린용
├── capacitor.config.ts       ← 앱 이름/ID/색상 설정
├── package.json
├── setup.sh                  ← Mac/Linux용 셋업 스크립트
├── setup.bat                 ← ★ Windows용 셋업 스크립트 (더블클릭 실행)
├── codemagic.yaml             ← ★ 클라우드 Mac에서 iOS 자동 빌드 설정
└── ios-info-plist-additions.xml  ← iOS 회전 지원 등 추가 설정
```

## `native-bridge.js`가 하는 일 (왜 필요한가)

기존 사이트는 "브라우저"를 전제로 짜여 있어서, 앱(웹뷰) 안에서 그대로 쓰면
아래 문제들이 생깁니다. 이 파일이 그걸 자동으로 고쳐줍니다.

| 문제 | 해결 |
|---|---|
| 앱 껐다 켜면 로그인이 매번 풀림 (`sessionStorage`는 탭 종료 시 삭제) | 로그인 시 기기에 영구 저장 → 재실행해도 로그인 유지 |
| 구글 스프레드시트 링크, 첨부파일, mailto 등을 누르면 앱 안에서 어색하게 열림 | 시스템 브라우저/메일앱으로 열리도록 처리 |
| 안드로이드 뒤로가기 버튼이 아예 동작 안 함 | 페이지 뒤로가기 + "한 번 더 누르면 종료" 처리 |
| 아이폰 노치, 다이나믹 아일랜드, 안드로이드 제스처 바에 상단 네비/하단 푸터가 가려짐 | safe-area 여백 자동 적용 |
| 앱 실행 중 인터넷이 끊겨도 사용자가 이유를 모름 | 오프라인 시 하단 토스트 안내 |
| 앱 켜자마자 흰 화면이 잠깐 보임 | 스플래시 스크린이 로그인 게이트/콘텐츠가 뜨는 순간까지 유지 |

브라우저에서 그냥 열면(`isNativePlatform()`이 false) 이 스크립트는 아무 일도 하지 않으므로
기존 GitHub Pages 웹사이트는 지금처럼 그대로 정상 작동합니다.

---

## 처음 시작하는 방법 (Windows 11 기준)

### 준비물
- **Node.js 18+ LTS**: https://nodejs.org 에서 설치 (설치 시 npm 자동 포함)
- **Android 앱 빌드**: Android Studio 설치 → https://developer.android.com/studio
  (설치 중 "Android SDK", "Android Virtual Device" 항목 체크 유지)
- **iOS/iPad 앱 빌드**: ⚠️ Windows에서는 직접 빌드 불가 (Apple 정책).
  아래 "iOS 빌드하기" 섹션 참고.

### Android — 실행 순서 (Windows)

1. 이 zip을 원하는 폴더에 압축 해제 (예: `C:\dev\bestwing-app`)
2. 그 폴더에서 **`setup.bat`을 더블클릭** (또는 cmd에서 `setup.bat` 실행)
   - `npm install` → `npx cap add android` → 아이콘 생성 → `npx cap sync android` 를 자동으로 진행합니다.
3. 완료되면:
   ```
   npm run open:android
   ```
   Android Studio가 열립니다. 상단 ▶(Run) 버튼을 누르면
   에뮬레이터 또는 USB로 연결한 실제 안드로이드 폰에서 바로 실행됩니다.

4. 코드(`www` 폴더)를 수정한 뒤에는 항상:
   ```
   npx cap sync android
   ```
   를 다시 실행해야 Android Studio 쪽에 반영됩니다.

### iOS/iPad 빌드하기 (Windows에는 없는 Mac 환경이 필요)

Windows 11에서는 Xcode 자체가 존재하지 않기 때문에 iOS 앱을 로컬에서 빌드할 수 없어요.
세 가지 방법 중 하나를 선택하세요.

**방법 A — 클라우드 Mac 빌드 서비스 (추천, Windows에서 전부 가능)**

이 프로젝트에는 이미 `codemagic.yaml` 설정을 넣어뒀습니다.
1. https://codemagic.io 무료 가입 (매달 macOS 빌드 500분 무료 제공)
2. 이 프로젝트를 GitHub(또는 GitLab/Bitbucket)에 올리기
   - GitHub Desktop(윈도우용, 클릭만으로 사용 가능)을 쓰면 git 명령어 없이도 업로드 가능
3. Codemagic에서 "Add application" → 방금 올린 레포 선택
   → `codemagic.yaml`을 자동으로 인식합니다
4. `ios-workflow` 실행 → 클라우드의 실제 Mac에서 iOS 앱이 빌드됩니다
5. App Store에 올리려면 Codemagic 콘솔에 Apple Developer 서명 정보 등록 필요
   (Codemagic 문서의 "iOS code signing" 참고, 화면 안내를 따라가면 됩니다)

**방법 B — 지인/학교의 Mac을 한 번 빌린다**
- `setup.sh`(Mac용)를 그 Mac에서 실행 → Xcode로 빌드 → App Store Connect 업로드
- 이후 업데이트 때도 그때그때 잠깐씩 빌리면 됩니다

**방법 C — 지금은 Android만 출시**
- 웹사이트 자체는 아이폰/아이패드 사파리에서도 잘 열리니 급하지 않다면 나중에 진행해도 무방합니다

### 코드(www 폴더)를 수정한 뒤에는
```bash
npx cap sync
```
을 꼭 다시 실행해야 네이티브 프로젝트에 반영됩니다.

---

## 앱스토어 정식 출시 전 체크리스트

### 공통
- [ ] `capacitor.config.ts`의 `appId`를 최종 확정 (배포 후 변경 어려움)
  - 예: `kr.jshs13.bestwing` 형태 권장 (역도메인 표기)
- [ ] 앱 이름(`appName`) 확정 — 스토어에 노출될 이름
- [ ] 개인정보처리방침 페이지 준비 (스토어 등록 시 URL 필수)
  - 로그인 시 이름/비밀번호를 Google Apps Script 서버에 저장하므로,
    수집 항목·목적·보관 방식을 간단히 문서화해두는 게 좋습니다.
- [ ] `mailto:roysjh7@gmail.com` 등 실제 문의 채널이 살아있는지 확인
- [ ] 앱 아이콘 배경(현재 네이비+로고)이 마음에 드는지 확인, 다르게 하고 싶으면
      `assets/icon-source.png`를 교체하고 다시 `npx @capacitor/assets generate`

### iOS (App Store)
- [ ] Apple Developer Program 가입 (연 $99)
- [ ] Xcode에서 `ios/App/App/Info.plist`에 `ios-info-plist-additions.xml` 내용 추가
- [ ] Bundle Identifier를 Apple Developer 콘솔에서 등록한 값과 일치시키기
- [ ] 스크린샷 준비: 6.7형(아이폰), 12.9형(아이패드) 필수 사이즈
- [ ] App Store Connect에서 앱 등록 → 심사 제출
- [ ] 심사 가이드라인상 "로그인 기능이 있는 앱"은 테스트 계정 정보를 심사자에게 제공해야 함
      (App Store Connect 제출 화면의 "App Review Information"에 테스트용 아이디/비번 기입)

### Android (Google Play)
- [ ] Google Play Console 개발자 등록 (최초 1회 $25)
- [ ] `android/app/build.gradle`에서 `applicationId`, `versionCode`, `versionName` 확인
- [ ] 서명 키(keystore) 생성 후 안전하게 백업 (분실 시 업데이트 불가)
- [ ] 스크린샷 + 그래픽 준비 (휴대전화용, 선택적으로 태블릿용)
- [ ] Play Console에서 비공개 테스트 트랙으로 먼저 배포 후 반 친구들과 테스트 권장

---

## 참고: 지금 이 프로젝트가 "완성"이 아닌 이유

이 컨테이너는 네트워크가 꺼져 있어서 `npm install`, `npx cap add ios/android` 같은
실제 패키지 다운로드·네이티브 프로젝트 생성은 이 안에서 실행할 수 없었습니다.
대신 그 명령들을 실행하기만 하면 바로 동작하도록 **필요한 모든 설정과 패치 코드**를
미리 다 만들어 놨습니다. 로컬 컴퓨터(Mac 권장)에 폴더를 다운로드한 뒤
`./setup.sh` 한 번만 실행하시면 됩니다.
