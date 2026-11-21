# 과학구리
전남과학고 학생을 위한 정보 제공 웹사이트입니다. 과제, 시간표, 학사일정, 급식과 게시판 등의 정보를 한곳에서 확인할 수 있습니다
웹사이트: <https://jshs-us.github.io/jshs/>

## 버전
`jshs-us v1.7.8 [회원가입·로그인 개선]`

## 주요 기능
- 과제 및 최근 과제 미리보기
- 시간표 및 오늘의 시간표 미리보기
- 학사일정 및 월간 일정 미리보기
- 급식 메뉴와 원산지 정보
- 로그인 기반 게시판
- 벌금 정보와 관리자 안내
- 모바일 화면 및 PWA 지원
- Capacitor 네이티브 앱에서 실행할 때 외부 링크, 뒤로가기, 네트워크 상태 등을 처리하는 브리지
- 과제, 시간표, 학사일정, 급식 데이터는 각 페이지에서 참조하는 Google 스프레드시트와 연동

## 페이지
| 파일 | 내용 |
| --- | --- |
| `index.html` | 홈 및 주요 정보 미리보기 |
| `homework.html` | 과제 |
| `timetable.html` | 시간표 |
| `calendar.html` | 학사일정 |
| `meal.html` | 급식 |
| `board.html` | 게시판 |
| `fine.html` | 벌금 관리 |
| `mypage.html` | 마이페이지 |
| `admin.html` | 관리자 정보 |

## 배포
GitHub Pages는 GitHub Actions가 `dist` 폴더의 최소화된 파일만 배포하도록 구성합니다.

1. 저장소 Settings > Pages에서 Build and deployment의 Source를 **GitHub Actions**로 설정합니다.
2. 기본 브랜치에 변경 사항을 푸시하거나 Actions에서 `Deploy minified site to GitHub Pages`를 수동 실행합니다.
3. 로컬 빌드는 Node.js 설치 후 `npm ci`와 `npm run build`를 실행합니다. 산출물은 `dist`에 생성됩니다.

빌드 과정은 HTML·인라인 CSS·인라인 JavaScript의 공백과 주석을 제거하고 외부 JavaScript를 압축합니다. 백엔드 `.gs`, 문서, 빌드 도구 및 원본 소스 디렉터리는 Pages 산출물에 포함되지 않습니다.

최소화는 코드를 숨기는 보안 기능이 아닙니다. 사이트에 전달된 코드는 브라우저 개발자 도구로 확인할 수 있고, 저장소가 공개라면 원본도 저장소에서 볼 수 있습니다. 비밀번호, API 비밀키, 토큰 서명키 등 비밀값은 프론트엔드에 넣지 말고 서버 스크립트 속성에만 보관하세요. 저장소 원본까지 비공개로 유지하려면 저장소 공개 범위와 GitHub Pages 사용 조건을 확인해야 합니다.

## Apps Script 백엔드 설치

백엔드 소스는 `AppsScriptEntryPoint.gs`와 `Security.gs`입니다. `AppsScriptEntryPoint.gs`의 내용을 Apps Script 프로젝트의 `Code.gs`에 넣고, `Security.gs`는 별도 파일로 추가합니다. 기존 `doPost`가 있다면 중복으로 남겨두지 마세요.

1. 게시판 스프레드시트에서 Apps Script 프로젝트를 열고 두 파일을 추가합니다.
2. 스크립트 속성에 Cloudinary 값을 설정합니다. 하나의 Cloudinary 계정을 쓰면 공통 키를, 게시판과 벌금에 서로 다른 계정을 쓰면 용도별 키를 설정합니다.
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
   - 또는 `CLOUDINARY_BOARD_CLOUD_NAME`, `CLOUDINARY_BOARD_API_KEY`, `CLOUDINARY_BOARD_API_SECRET` 및 `CLOUDINARY_FINE_CLOUD_NAME`, `CLOUDINARY_FINE_API_KEY`, `CLOUDINARY_FINE_API_SECRET`
3. Apps Script 편집기에서 `authorizeBackend`, `setupSecurityOnce`, `setupBackend`, `setupInactivityMaintenance`를 각각 한 번 실행해 스프레드시트·메일 권한, 토큰 비밀키, 비활성 계정 점검 트리거를 준비합니다. 비활성 계정 점검은 매일 실행되며, 마지막 로그인 후 3개월·5개월 시점에 이메일을 보내고 6개월 시점에 계정을 삭제합니다. 기존 회원은 과거 로그인 시각을 알 수 없으므로 최초 트리거 설정 시점부터 비활성 기간을 계산해 기존 활동 회원이 잘못 삭제되지 않게 합니다. 최초 관리자와 마지막 관리자는 자동 삭제 대상에서 보호됩니다. `setupBackend`는 기존 탭을 확인하고 필요한 보조 열을 추가하며, 기존 `앱_...` 탭 데이터는 표준 탭으로 중복 없이 복사합니다. 원본 탭과 기존 행은 삭제하지 않습니다.
4. 웹 앱으로 배포할 때 실행 주체는 소유자, 호출 권한은 사이트에서 요청을 보낼 수 있는 범위로 설정합니다. 웹 앱 호출은 `Security.gs`의 토큰·역할 검사를 거칩니다. 배포된 `/exec` 주소를 [config.js](./config.js)의 `SCRIPT_URL`에 반영하세요.
5. 회원가입 후 `BOOTSTRAP_ADMIN_USERNAME` 스크립트 속성에 해당 계정명을 임시로 설정하고 `bootstrapFounder`를 실행합니다. 최초 관리자가 이미 지정되어 있으면 다시 지정할 수 없습니다.
6. 새 비밀번호는 평문으로 저장하지 않습니다. `passwordSalt`와 `passwordHash`에 솔트와 해시를 저장합니다. 해시용 `PASSWORD_PEPPER` 스크립트 속성은 최초 가입·비밀번호 설정 시 자동 생성되므로 삭제하거나 바꾸지 마세요. 기존 평문 또는 이전 반복 해시 계정은 올바른 비밀번호로 로그인하면 새 해시로 자동 전환됩니다. 이전 반복 해시 계정의 첫 로그인은 전환 때문에 느릴 수 있지만 이후 로그인은 빨라집니다. `회원` 탭에 기존 `password` 또는 `비밀번호` 열이 남아 있다면 `removeLegacyPasswordColumns`를 한 번 실행해 삭제할 수 있습니다. 이 함수는 모든 이름 있는 회원의 솔트와 지원되는 해시가 확인될 때만 열을 삭제하고, 조건을 충족하지 않으면 삭제를 거부합니다. 다른 형식의 해시이거나 로그인이 안 되는 계정은 계정별로 `RESET_MEMBER_USERNAME`과 `RESET_MEMBER_TEMP_PASSWORD` 스크립트 속성을 설정한 뒤 `resetMemberPasswordFromEditor`를 실행해 임시 비밀번호를 발급하세요. 실행이 끝나면 두 속성은 삭제됩니다.

백엔드는 기존 탭인 `회원`, `게시글`, `좋아요`, `댓글`, `벌금`, `기기토큰`, `이스터에그기록`을 사용합니다. `setupBackend`는 이전 실행에서 만들어진 `앱_게시글`, `앱_댓글`, `앱_벌금`, `앱_기기토큰`, `앱_이스터에그`의 데이터를 기존 탭으로 중복 없이 이관하며, 원본 탭은 자동 삭제하지 않습니다. 이관은 ID, 기기 토큰, 사용자·이스터에그 조합을 기준으로 반복 실행해도 중복되지 않습니다.

`setupBackend`는 `회원`에 비밀번호 해시·최초 관리자·로그인 이력·비활성 기준일·알림 상태용 열을, 게시글·댓글에 삭제 표시 열을 없을 때만 추가합니다.

이메일 인증은 `ai.jne.kr` 주소만 허용합니다. 벌금 관리자 이름은 프론트엔드 `fine.html`과 백엔드 `Security.gs`의 목록을 함께 수정해야 합니다. 업로드는 사용자별 폴더와 일회성 public ID에 서명하지만, 업로드 최대 크기는 Cloudinary 계정에서도 제한해야 합니다. 이스터에그 점수는 클라이언트가 제출하므로 순위는 변조 방지 보상에 사용하면 안 됩니다. 네이티브 앱의 기기 토큰 등록은 구현되어 있지만, 실제 FCM 푸시 발송에는 별도의 Firebase 서버 인증 설정과 발송 로직이 필요합니다.
