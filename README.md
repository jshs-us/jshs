# 과학구리
전남과학고 학생을 위한 정보 제공 웹사이트입니다. 과제, 시간표, 학사일정, 급식과 게시판 등의 정보를 한곳에서 확인할 수 있습니다
웹사이트: <https://jshs-us.github.io/jshs/>

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
사이트는 GitHub Pages의 프로젝트 사이트로 제공됩니다. 정적 파일의 변경 사항을 저장소의 기본 배포 브랜치에 반영하면 Pages 설정에 따라 배포됩니다.

## Apps Script 백엔드 설치

백엔드 소스는 `AppsScriptEntryPoint.gs`와 `Security.gs`입니다. `AppsScriptEntryPoint.gs`의 내용을 Apps Script 프로젝트의 `Code.gs`에 넣고, `Security.gs`는 별도 파일로 추가합니다. 기존 `doPost`가 있다면 중복으로 남겨두지 마세요.

1. 게시판 스프레드시트에서 Apps Script 프로젝트를 열고 두 파일을 추가합니다.
2. 스크립트 속성에 Cloudinary 값을 설정합니다. 하나의 Cloudinary 계정을 쓰면 공통 키를, 게시판과 벌금에 서로 다른 계정을 쓰면 용도별 키를 설정합니다.
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
   - 또는 `CLOUDINARY_BOARD_CLOUD_NAME`, `CLOUDINARY_BOARD_API_KEY`, `CLOUDINARY_BOARD_API_SECRET` 및 `CLOUDINARY_FINE_CLOUD_NAME`, `CLOUDINARY_FINE_API_KEY`, `CLOUDINARY_FINE_API_SECRET`
3. Apps Script 편집기에서 `authorizeBackend`, `setupSecurityOnce`, `setupBackend`를 각각 한 번 실행해 스프레드시트·메일 권한과 토큰 비밀키를 준비합니다. `setupBackend`는 필요한 탭을 만들며, 기존 `회원` 탭에는 없는 백엔드 열을 추가합니다. 기존 데이터를 덮어쓰지는 않습니다.
4. 웹 앱으로 배포할 때 실행 주체는 소유자, 호출 권한은 사이트에서 요청을 보낼 수 있는 범위로 설정합니다. 웹 앱 호출은 `Security.gs`의 토큰·역할 검사를 거칩니다. 배포된 `/exec` 주소를 [config.js](./config.js)의 `SCRIPT_URL`에 반영하세요.
5. 회원가입 후 `BOOTSTRAP_ADMIN_USERNAME` 스크립트 속성에 해당 계정명을 임시로 설정하고 `bootstrapFounder`를 실행합니다. 최초 관리자가 이미 지정되어 있으면 다시 지정할 수 없습니다.
6. 기존 회원 행에 `비밀번호솔트`와 `비밀번호해시`가 없다면 기존 비밀번호 형식을 추측해 로그인시키지 않습니다. 계정별로 `RESET_MEMBER_USERNAME`과 `RESET_MEMBER_TEMP_PASSWORD`를 스크립트 속성에 설정한 뒤 `resetMemberPasswordFromEditor`를 실행해 임시 비밀번호를 발급하고, 사용자가 로그인 후 비밀번호를 바꾸도록 안내하세요. 실행이 끝나면 두 속성은 삭제됩니다. 기존 `비밀번호` 열이 있다면 계정 이관 후 평문 비밀번호가 남지 않았는지 확인하고 안전하게 제거하세요.

백엔드는 `회원` 외에 `앱_게시글`, `앱_댓글`, `앱_좋아요`, `앱_벌금`, `앱_기기토큰`, `앱_이스터에그` 탭을 사용합니다. 이 탭들은 기존 탭과 충돌하지 않도록 별도 이름으로 생성합니다. 기존 게시판 데이터는 자동 이관되지 않습니다.

이메일 인증은 `ai.jne.kr` 주소만 허용합니다. 벌금 관리자 이름은 프론트엔드 `fine.html`과 백엔드 `Security.gs`의 목록을 함께 수정해야 합니다. 업로드는 사용자별 폴더와 일회성 public ID에 서명하지만, 업로드 최대 크기는 Cloudinary 계정에서도 제한해야 합니다. 이스터에그 점수는 클라이언트가 제출하므로 순위는 변조 방지 보상에 사용하면 안 됩니다. 네이티브 앱의 기기 토큰 등록은 구현되어 있지만, 실제 FCM 푸시 발송에는 별도의 Firebase 서버 인증 설정과 발송 로직이 필요합니다.
