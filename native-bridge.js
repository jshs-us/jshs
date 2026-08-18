// ── Bestwing Native Bridge ──────────────────────────────────────────
// Capacitor 앱(iOS/iPadOS/Android)에서 실행될 때만 동작합니다.
// 웹 브라우저에서 열면 이 파일의 코드는 조용히 아무 일도 하지 않습니다.
(function () {
  const isNative = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  if (!isNative) return;

  // ⚠ 버그 수정: 번들러 없는(vanilla) Capacitor 프로젝트에서 플러그인은
  // window.CapacitorApp / window.CapacitorPushNotifications 같은 개별 전역으로
  // 노출되지 않습니다. 전부 window.Capacitor.Plugins 안에 모여 있습니다.
  // (예전 코드는 존재하지 않는 전역을 참조하고 있어서 App/SplashScreen/StatusBar/
  //  Browser/Preferences/Network/LocalNotifications/PushNotifications가 전부
  //  undefined였고, 그 결과 급식 알림 예약도 푸시 토큰 등록도 아무 에러 없이
  //  조용히 실패하고 있었습니다 — 기기토큰 시트가 비어있던 진짜 원인입니다.)
  const Plugins = (window.Capacitor && window.Capacitor.Plugins) || {};
  const { App, SplashScreen, StatusBar, Browser, Preferences, Network, LocalNotifications, PushNotifications } = Plugins;
  const Style = undefined; // Style enum은 런타임 플러그인이 아니라 타입 전용 export라 원래도 못 가져왔음 — 아래서 문자열 'DARK'로 대체됨(정상)

  // ── 1) 세션 저장은 common.js가 localStorage로 직접 처리합니다 ──
  // (예전엔 여기서 Preferences로 sessionStorage를 비동기 복원했는데,
  //  common.js가 그 복원을 기다리지 않고 먼저 로그인 여부를 판단해버려서
  //  "앱을 다시 열면 로그아웃되는" 버그가 있었습니다. localStorage는 동기적으로
  //  즉시 읽히므로 이 문제가 근본적으로 없습니다.)

  // ── 2) 외부 링크(스프레드시트, mailto 등)는 인앱 대신 시스템 브라우저/메일앱으로 ──
  document.addEventListener('click', function (e) {
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href') || '';

    if (href.startsWith('mailto:')) {
      // mailto는 OS가 알아서 처리하도록 그대로 둡니다.
      return;
    }
    if (a.target === '_blank' || /^https?:\/\//i.test(href)) {
      e.preventDefault();
      if (Browser) {
        Browser.open({ url: href });
      } else {
        window.open(href, '_system');
      }
    }
  }, true);

  // ── 3) 안드로이드 하드웨어 뒤로가기 버튼 처리 ──
  // 페이지 이동 히스토리가 없으면(홈이면) 뒤로가기 두 번으로 앱 종료
  if (App) {
    let lastBackPress = 0;
    App.addListener('backButton', ({ canGoBack }) => {
      const path = location.pathname.split('/').pop() || 'index.html';
      const isHome = path === 'index.html' || path === '';
      if (!isHome && canGoBack) {
        history.back();
        return;
      }
      const now = Date.now();
      if (now - lastBackPress < 2000) {
        App.exitApp();
      } else {
        lastBackPress = now;
        toast('한 번 더 누르면 앱이 종료돼요');
      }
    });
  }

  function toast(msg) {
    const el = document.createElement('div');
    el.textContent = msg;
    el.style.cssText = `
      position:fixed;left:50%;bottom:34px;transform:translateX(-50%);
      background:rgba(6,20,66,.92);color:#fff;padding:10px 18px;border-radius:999px;
      font-size:13px;font-family:var(--ff, sans-serif);z-index:999999;
      box-shadow:0 6px 18px rgba(0,0,0,.25);
    `;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1800);
  }

  // ── 4) 오프라인 감지 배너 ──
  if (Network) {
    Network.addListener('networkStatusChange', (status) => {
      if (!status.connected) toast('인터넷 연결이 끊겼어요. 일부 정보가 안 보일 수 있어요.');
    });
  }

  // ── 5) 상태바 스타일 (네이비 배경 + 흰 글씨) ──
  if (StatusBar) {
    StatusBar.setBackgroundColor({ color: '#061442' }).catch(() => {});
    StatusBar.setStyle({ style: Style ? Style.Dark : 'DARK' }).catch(() => {});
  }

  // ── 6) 스플래시 스크린은 콘텐츠(로그인 게이트 포함)가 보인 뒤 닫기 ──
  // common.js가 로그인 상태에 따라 documentElement.style.visibility를 'visible'로 바꾸는데,
  // 그 시점을 감지해서 스플래시를 자연스럽게 내립니다.
  function hideSplashWhenVisible() {
    if (document.documentElement.style.visibility === 'visible') {
      SplashScreen && SplashScreen.hide().catch(() => {});
      return;
    }
    requestAnimationFrame(hideSplashWhenVisible);
  }
  if (SplashScreen) {
    requestAnimationFrame(hideSplashWhenVisible);
    // 안전장치: 3초 뒤엔 무조건 닫기
    setTimeout(() => SplashScreen.hide().catch(() => {}), 3000);
  }

  // ── 7) 사파리 상단 노치/다이나믹 아일랜드, 안드로이드 제스처 바 여백 ──
  const safeAreaStyle = document.createElement('style');
  safeAreaStyle.textContent = `
    .bw-nav{ padding-top:env(safe-area-inset-top); height:calc(58px + env(safe-area-inset-top)); }
    body{ padding-top:calc(58px + env(safe-area-inset-top)); }
    .bw-authgate{ padding-top:env(safe-area-inset-top); padding-bottom:env(safe-area-inset-bottom); }
    .bw-footer{ padding-bottom:calc(26px + env(safe-area-inset-bottom)); }
  `;
  document.head.appendChild(safeAreaStyle);

  // ── 8) 알림 채널(카테고리) 정의 ────────────────────────────────
  // 채널을 미리 만들어두지 않으면 안드로이드가 모든 알림을 시스템 기본
  // "Default" 채널 하나로 묶어버려서, 사용자가 급식 알림/벌금 알림을
  // 따로 켜고 끌 수 없습니다. 두 종류를 서로 다른 채널로 분리합니다.
  //
  // ⚠ 급식 알림은 더 이상 기기에서 "매일 8:05에 무조건" 예약하지 않습니다.
  // (그렇게 하면 급식 정보가 없는 날에도 알림이 옵니다.) 대신 서버(Apps
  // Script)가 매일 아침 급식 시트를 직접 확인해서, 정보가 있는 날에만
  // 이 채널로 푸시를 보냅니다. 그래서 두 알림 다 PushNotifications
  // 플러그인으로 채널을 만듭니다.
  const MEAL_CHANNEL_ID = 'meal_reminder';
  const FINE_CHANNEL_ID = 'fine_notice';
  const BOARD_CHANNEL_ID = 'board_notice';

  async function ensureMealChannel() {
    if (!PushNotifications || !PushNotifications.createChannel) return;
    try {
      await PushNotifications.createChannel({
        id: MEAL_CHANNEL_ID,
        name: '급식 알림',
        description: '급식 정보가 있는 날 아침에만 알려드려요',
        importance: 3,   // NotificationManager.IMPORTANCE_DEFAULT
        visibility: 1
      });
    } catch (e) { console.warn('[meal-channel] failed', e); }
  }

  // 푸시 알림(벌금)용 채널 — PushNotifications 플러그인으로 생성
  // ⚠ 이 채널이 기기에 미리 만들어져 있어야, 서버(Apps Script)가 FCM으로
  // 보낼 때 payload에 channelId: 'fine_notice' 를 넣었을 때 실제로 이
  // 채널로 알림이 들어옵니다. (서버 쪽에서 channelId를 안 보내면 계속
  // Default로 들어가니, 이 부분은 Apps Script 코드도 같이 확인해야 합니다.)
  async function ensureFineChannel() {
    if (!PushNotifications || !PushNotifications.createChannel) return;
    try {
      await PushNotifications.createChannel({
        id: FINE_CHANNEL_ID,
        name: '벌금 알림',
        description: '벌금이 부과되면 바로 알려드려요',
        importance: 4,   // NotificationManager.IMPORTANCE_HIGH (헤드업 표시)
        visibility: 1
      });
    } catch (e) { console.warn('[fine-channel] failed', e); }
  }

  async function ensureBoardChannel() {
    if (!PushNotifications || !PushNotifications.createChannel) return;
    try {
      await PushNotifications.createChannel({
        id: BOARD_CHANNEL_ID,
        name: '게시판 알림',
        description: '새 글이 올라오거나 내 글에 댓글이 달리면 알려드려요',
        importance: 3,   // NotificationManager.IMPORTANCE_DEFAULT
        visibility: 1
      });
    } catch (e) { console.warn('[board-channel] failed', e); }
  }

  // 푸시 알림을 탭했을 때: data.route로 이동 (급식/벌금 알림 공통)
  if (PushNotifications) {
    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      const route = action && action.notification && action.notification.data && action.notification.data.route;
      if (!route) return;
      const current = location.pathname.split('/').pop() || 'index.html';
      if (current !== route) location.href = route;
    });
  }

  // ── 10) 벌금 부과 푸시 알림 (FCM) 등록 ──────────────────────────
  // 로그인된 사용자의 기기 토큰을 서버(Apps Script)에 등록해두면,
  // 벌금이 부과되는 순간 서버가 이 토큰으로 직접 푸시를 보냅니다.
  const SCRIPT_URL = (window.APP_CONFIG && window.APP_CONFIG.SCRIPT_URL) || "";
  const PUSH_SENT_PREFIX = 'pushTokenSent:';

  function getCurrentUsername() {
    try {
      const raw = localStorage.getItem('gwakuriSession');
      if (!raw) return null;
      const s = JSON.parse(raw);
      return s && s.username ? s.username : null;
    } catch (e) { return null; }
  }

  async function sendTokenToServer(token) {
    const username = getCurrentUsername();
    if (!username || !token) return;

    // 같은 사용자 + 같은 토큰이면 중복 전송하지 않음
    if (Preferences) {
      try {
        const key = PUSH_SENT_PREFIX + username;
        const { value } = await Preferences.get({ key });
        if (value === token) return;
      } catch (e) { /* no-op */ }
    }

    try {
      const res = await fetch(SCRIPT_URL, {
        method: 'POST',
        body: new URLSearchParams({ action: 'registerDeviceToken', actor: username, token, platform: 'android' })
      });
      const r = await res.json();
      if (r && r.success && Preferences) {
        Preferences.set({ key: PUSH_SENT_PREFIX + username, value: token }).catch(() => {});
      }
    } catch (e) { console.warn('[push-token-send] failed', e); }
  }

  async function ensurePushRegistration() {
    if (!PushNotifications) return;
    try {
      await ensureFineChannel();
      await ensureMealChannel();
      await ensureBoardChannel();
      let perm = await PushNotifications.checkPermissions();
      if (perm.receive !== 'granted') {
        perm = await PushNotifications.requestPermissions();
      }
      if (perm.receive !== 'granted') return; // 사용자가 알림 권한을 거부함
      await PushNotifications.register();
    } catch (e) { console.warn('[push-reg] failed', e); }
  }

  if (PushNotifications) {
    PushNotifications.addListener('registration', (token) => {
      sendTokenToServer(token && token.value);
    });
    PushNotifications.addListener('registrationError', (err) => {
      console.warn('[push] registration error', err);
    });
  }

  ensurePushRegistration();
})();
