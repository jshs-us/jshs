// ============================================================
// ⚙️ 앱 전체 설정 — Apps Script 배포 주소를 "여기 한 곳에서만" 관리합니다.
//
// Apps Script 배포 URL이 또 바뀌었다면, 아래 SCRIPT_URL 값 하나만
// 고치고 저장하면 index.html / board.html / fine.html / common.js /
// native-bridge.js 전부에 자동으로 반영됩니다. (다른 파일들은 더 이상
// URL을 직접 갖고 있지 않고, 전부 여기서 읽어갑니다.)
//
// 이 파일은 반드시 native-bridge.js / common.js 보다 "먼저" 로드되어야
// 하므로, 모든 html 파일에서 <script src="config.js">가 맨 위에 있어야
// 합니다. (이미 그렇게 넣어뒀습니다.)
//
// 💡 URL이 계속 바뀌는 걸 아예 막고 싶다면: Apps Script 편집기에서
//    "배포 > 새 배포"를 누르지 말고, "배포 > 배포 관리 > (연필 아이콘) >
//    새 버전 > 배포"를 누르세요. 기존 배포를 "수정"하는 방식이라
//    URL이 절대 바뀌지 않습니다. "새 배포"는 매번 새 URL을 만듭니다.
// ============================================================
window.APP_CONFIG = {
  SCRIPT_URL: "https://script.google.com/macros/s/AKfycbzW-xU_o08DAb9ygIlwUjjCWttoQlHbrdmOSjv1chavfcinSrbhxXjotSonOF6T5QoVeQ/exec"
};
