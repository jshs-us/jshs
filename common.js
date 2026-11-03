// ── Bestwing Common (앱 전체 로그인 + 네비/푸터) ─────────────────
(function () {
  const STYLE = `
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css');

:root {
  --navy:  #091f62;
  --navy2: #061442;
  --yellow:#ffec00;
  --paper: #f4f6fb;
  --card:  #ffffff;
  --line:  #dfe3ee;
  --ink:   #1b1f2e;
  --muted: #6b7080;
  --ff: "Pretendard", -apple-system, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif;
  --r: 14px;
}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
html{scroll-behavior:smooth;}
body{
  font-family:var(--ff);
  background:var(--paper);
  color:var(--ink);
  font-size:16px;
  line-height:1.65;
  padding-top:58px;
  min-height:100vh;
}

/* ── TOP NAV ── */
.bw-nav{
  position:fixed;top:0;left:0;right:0;z-index:9999;
  height:58px;
  background:rgba(6,20,66,0.97);
  backdrop-filter:blur(12px);
  border-bottom:1px solid rgba(255,236,0,.14);
  display:flex;align-items:center;
}
.bw-nav-inner{
  width:100%;max-width:1100px;margin:0 auto;
  padding:0 22px;
  display:flex;align-items:center;justify-content:space-between;
}
.bw-logo{
  display:flex;align-items:center;gap:10px;
  text-decoration:none;
  font-size:17px;font-weight:900;letter-spacing:-.02em;color:#fff;
}
.bw-logo img{
  width:34px;height:34px;border-radius:50%;
  background:#fff;padding:2px;
  object-fit:contain;flex-shrink:0;
}
.bw-logo-star{display:none;}
.bw-nav-links{
  list-style:none;display:flex;align-items:center;gap:2px;
}
.bw-nav-links a{
  text-decoration:none;
  color:rgba(255,255,255,.72);
  font-size:14px;font-weight:500;
  padding:6px 12px;border-radius:8px;
  transition:.15s;white-space:nowrap;
}
.bw-nav-links a:hover,.bw-nav-links a.active{background:rgba(255,255,255,.1);color:#fff;}
.bw-hamburger{
  display:none;flex-direction:column;gap:5px;
  background:none;border:none;cursor:pointer;padding:4px;
}
.bw-hamburger span{display:block;width:22px;height:2px;background:#fff;border-radius:2px;transition:.2s;}

/* ── NAV USER / LOGOUT ── */
.bw-nav-userwrap{display:flex;align-items:center;gap:10px;margin-left:8px;padding-left:14px;border-left:1px solid rgba(255,255,255,.18);}
.bw-nav-username{color:rgba(255,255,255,.75);font-size:13px;white-space:nowrap;}
.bw-nav-username b{color:#fff;}
.bw-nav-logout{
  background:rgba(255,255,255,.1);color:#fff;border:1px solid rgba(255,255,255,.32);
  border-radius:8px;padding:6px 13px;font-size:12.5px;font-weight:700;
  font-family:var(--ff);cursor:pointer;white-space:nowrap;transition:.15s;
}
.bw-nav-logout:hover{background:rgba(255,255,255,.2);}

/* ── FOOTER ── */
.bw-footer{
  background:var(--navy2);
  border-top:1px solid rgba(255,236,0,.1);
  padding:26px 24px;
  text-align:center;font-size:13px;color:rgba(255,255,255,.38);
  margin-top:60px;
}
.bw-footer a{color:rgba(255,255,255,.55);text-decoration:none;}
.bw-footer a:hover{color:#fff;}

/* ── PAGE WRAPPER ── */
.bw-page{max-width:960px;margin:0 auto;padding:40px 22px 60px;}
.bw-page-title{
  font-size:clamp(24px,4vw,34px);font-weight:900;
  letter-spacing:-.03em;color:var(--navy2);
  margin-bottom:6px;
}
.bw-page-sub{font-size:15px;color:var(--muted);margin-bottom:30px;}

/* ── CARD ── */
.bw-card{
  background:var(--card);
  border:1px solid var(--line);
  border-radius:var(--r);
  padding:28px;
}

/* ── LOGIN GATE (전체 앱 로그인 오버레이) ── */
.bw-authgate{
  position:fixed;inset:0;z-index:999999;
  background:linear-gradient(155deg,var(--navy) 0%,var(--navy2) 100%);
  display:flex;align-items:center;justify-content:center;
  padding:24px;overflow-y:auto;
}
.bw-authbox{
  background:var(--card);border-radius:var(--r);
  padding:40px 34px 34px;max-width:380px;width:100%;
  text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.32);
}
.bw-authlogo{width:60px;height:60px;object-fit:contain;margin-bottom:12px;}
.bw-authbox h2{font-size:21px;font-weight:900;color:var(--navy2);margin-bottom:4px;letter-spacing:-.02em;}
.bw-authsub{font-size:13.5px;color:var(--muted);margin-bottom:22px;}
.bw-authtabs{display:flex;gap:6px;margin-bottom:18px;background:var(--paper);border-radius:10px;padding:4px;}
.bw-authtab{flex:1;font-family:var(--ff);border:none;background:transparent;padding:9px 0;border-radius:8px;font-size:14px;font-weight:700;color:var(--muted);cursor:pointer;transition:.15s;}
.bw-authtab.active{background:#fff;color:var(--navy);box-shadow:0 1px 3px rgba(9,31,98,.12);}
.bw-authbox input{
  display:block;width:100%;border:1.5px solid var(--line);border-radius:10px;
  padding:13px 15px;font-size:15px;font-family:var(--ff);
  margin-bottom:11px;background:#fbfcfe;color:var(--ink);
}
.bw-authbox input:focus{outline:none;border-color:var(--navy);background:#fff;}
.bw-authsubmit{
  width:100%;background:var(--yellow);color:var(--navy2);
  border:none;border-radius:10px;padding:13px 0;
  font-size:15px;font-weight:800;font-family:var(--ff);
  cursor:pointer;margin-top:4px;transition:.15s;
}
.bw-authsubmit:hover{filter:brightness(.96);}
.bw-authsubmit:disabled{opacity:.6;cursor:default;}
.bw-authmsg{font-size:13px;margin-top:12px;min-height:16px;}
.bw-authmsg.err{color:#c23b3b;}
.bw-authmsg.ok{color:#1f8a5c;}

/* ── RESPONSIVE ── */
@media(max-width:680px){
  .bw-hamburger{display:flex;}
  .bw-nav-links{
    display:none;flex-direction:column;gap:4px;
    position:absolute;top:58px;left:0;right:0;
    background:rgba(6,20,66,.98);
    padding:14px 18px 18px;
    border-bottom:1px solid rgba(255,236,0,.12);
  }
  .bw-nav-links.open{display:flex;}
  .bw-nav-links a{width:100%;padding:10px 14px;}
  .bw-nav-userwrap{margin:8px 0 0;padding:12px 0 0;border-left:none;border-top:1px solid rgba(255,255,255,.16);width:100%;justify-content:space-between;}
  .bw-page{padding:28px 14px 50px;}
}
`;
  const s=document.createElement('style');s.textContent=STYLE;
  document.head.insertBefore(s,document.head.firstChild);

  // ── AUTH (앱 전체 로그인) ─────────────────────────────────────
  // Apps Script 배포 주소는 config.js 한 곳에서만 관리합니다.
  const AUTH_SCRIPT_URL = (window.APP_CONFIG && window.APP_CONFIG.SCRIPT_URL) || "";
  const SESSION_KEY = "gwakuriSession";
  // 앱(Capacitor 네이티브)에서는 완전히 껐다 켜도 로그인이 유지되도록 localStorage를 쓰고,
  // 웹사이트(브라우저)에서는 기존처럼 탭/창을 닫으면 로그아웃되도록 sessionStorage를 씁니다.
  const isNativeApp = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  const sessionStore = isNativeApp ? window.localStorage : window.sessionStorage;

  function authCall(action, params){
    return fetch(AUTH_SCRIPT_URL, {
      method: "POST",
      body: new URLSearchParams(Object.assign({ action }, params || {}))
    }).then(r => r.json());
  }
  function getSession(){
    try{
      const raw = sessionStore.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    }catch(e){ return null; }
  }
  function setSession(sess){
    sessionStore.setItem(SESSION_KEY, JSON.stringify(sess));
  }
  function logout(){
    sessionStore.removeItem(SESSION_KEY);
    location.reload();
  }

  // 다른 페이지(board.html 등)에서 쓸 수 있도록 전역으로 공개
  window.GwakuriAuth = { getSession, setSession, logout, call: authCall };

  const session = getSession();

  // NAV
  const current = location.pathname.split('/').pop()||'index.html';
  const userBlock = session
    ? `<li class="bw-nav-userwrap"><a href="mypage.html" ${current==='mypage.html'?'class="active"':''}>마이페이지</a><span class="bw-nav-username"><b>${escapeHtml(session.username)}</b>님</span><button class="bw-nav-logout" id="bw-logout-btn" type="button">로그아웃</button></li>`
    : '';
  const NAV = `
<nav class="bw-nav">
  <div class="bw-nav-inner">
    <a class="bw-logo" href="index.html"><img src="logo.png" alt="전남과학고 로고"/>과학구리</a>
    <button class="bw-hamburger" id="bw-hbg" aria-label="메뉴"><span></span><span></span><span></span></button>
    <ul class="bw-nav-links" id="bw-nl">
      <li><a href="homework.html"  ${current==='homework.html'?'class="active"':''}>과제</a></li>
      <li><a href="timetable.html" ${current==='timetable.html'?'class="active"':''}>시간표</a></li>
      <li><a href="calendar.html"  ${current==='calendar.html'?'class="active"':''}>학사일정</a></li>
      <li><a href="meal.html"      ${current==='meal.html'?'class="active"':''}>급식</a></li>
      <li><a href="board.html" ${current==='board.html'?'class="active"':''}>게시판</a></li>
      <li><a href="fine.html" ${current==='fine.html'?'class="active"':''}>벌금</a></li>
      <li><a href="admin.html"     ${current==='admin.html'?'class="active"':''}>관리자</a></li>
      ${userBlock}
    </ul>
  </div>
</nav>`;
  document.body.insertAdjacentHTML('afterbegin',NAV);

  // FOOTER
  const FOOT=`
<footer class="bw-footer">
  과학구리 정보 제공 ${isNativeApp ? '앱' : '사이트'} &nbsp;·&nbsp; Made by <strong style="color:rgba(255,255,255,.6)" id="bw-egg-hub-trigger">Jvnxyk</strong>
  &nbsp;&nbsp;|&nbsp;&nbsp;
  문의: <a href="mailto:roysjh7@gmail.com">roysjh7@gmail.com</a>
</footer>`;
  document.body.insertAdjacentHTML('beforeend',FOOT);

  // Hamburger
  document.getElementById('bw-hbg').addEventListener('click',()=>{
    document.getElementById('bw-nl').classList.toggle('open');
  });

  // Logout
  const logoutBtn = document.getElementById('bw-logout-btn');
  if(logoutBtn) logoutBtn.addEventListener('click', logout);

  // ── LOGIN GATE ───────────────────────────────────────────────────
  if(!session){
    renderAuthGate();
  } else {
    revealPage();
  }

  function revealPage(){
    document.documentElement.style.visibility = 'visible';
  }

  function escapeHtml(str){
    const d=document.createElement('div'); d.textContent=String(str??''); return d.innerHTML;
  }

  function renderAuthGate(){
    let mode = 'login';
    const wrap = document.createElement('div');
    wrap.className = 'bw-authgate';
    wrap.id = 'bw-authgate';
    wrap.innerHTML = `
      <div class="bw-authbox">
        <img src="logo.png" class="bw-authlogo" alt="전남과학고 로고"/>
        <h2>과학구리${isNativeApp ? ' 앱' : ''}</h2>
        <p class="bw-authsub">로그인해야 ${isNativeApp ? '앱을' : '사이트를'} 이용할 수 있어요.</p>
        <div class="bw-authtabs">
          <button type="button" class="bw-authtab active" data-m="login">로그인</button>
          <button type="button" class="bw-authtab" data-m="signup">회원가입</button>
        </div>
        <input id="bw-au" type="text" placeholder="이름" autocomplete="username"/>
        <input id="bw-ap" type="password" placeholder="비밀번호" autocomplete="current-password"/>
        <button class="bw-authsubmit" id="bw-asubmit" type="button">로그인</button>
        <div class="bw-authmsg" id="bw-amsg"></div>
      </div>`;
    document.body.appendChild(wrap);
    revealPage(); // 오버레이 자체는 보여줘야 하므로 여기서 visibility 해제

    const tabs = wrap.querySelectorAll('.bw-authtab');
    const submitBtn = wrap.querySelector('#bw-asubmit');
    const msgEl = wrap.querySelector('#bw-amsg');
    const userEl = wrap.querySelector('#bw-au');
    const passEl = wrap.querySelector('#bw-ap');

    tabs.forEach(tab=>{
      tab.addEventListener('click', ()=>{
        mode = tab.dataset.m;
        tabs.forEach(t=>t.classList.toggle('active', t===tab));
        submitBtn.textContent = mode==='login' ? '로그인' : '가입하기';
        msgEl.textContent=''; msgEl.className='bw-authmsg';
      });
    });

    async function submit(){
      const u = userEl.value.trim(), p = passEl.value;
      if(!u || !p){ msgEl.textContent='이름과 비밀번호를 모두 입력해주세요.'; msgEl.className='bw-authmsg err'; return; }
      submitBtn.disabled = true;
      msgEl.textContent = '처리 중...'; msgEl.className='bw-authmsg';
      try{
        const action = mode==='login' ? 'login' : 'signup';
        const r = await authCall(action, { username:u, password:p });
        if(r.success){
          if(action==='signup'){
            msgEl.textContent = (r.message||'가입되었습니다. 로그인해주세요.'); msgEl.className='bw-authmsg ok';
            mode='login';
            tabs.forEach(t=>t.classList.toggle('active', t.dataset.m==='login'));
            submitBtn.textContent='로그인';
            passEl.value='';
          } else {
            setSession({ username:r.username, role:r.role||'user', muted:!!r.muted, ts:Date.now() });
            location.reload();
            return;
          }
        } else {
          msgEl.textContent = r.message || '처리에 실패했어요.'; msgEl.className='bw-authmsg err';
        }
      }catch(e){
        msgEl.textContent = '연결 실패. 잠시 후 다시 시도해주세요.'; msgEl.className='bw-authmsg err';
      }
      submitBtn.disabled = false;
    }
    submitBtn.addEventListener('click', submit);
    passEl.addEventListener('keydown', e=>{ if(e.key==='Enter') submit(); });
    userEl.addEventListener('keydown', e=>{ if(e.key==='Enter') passEl.focus(); });
  }
})();

// ============================================================
// 당겨서 새로고침 (Pull-to-refresh) — 모든 페이지 공통 적용
// 화면 맨 위에서 아래로 당기면 새로고침됩니다.
// (터치 기반이라 폰 앱/모바일 브라우저에서만 동작하고, 데스크톱
// 브라우저는 터치 이벤트가 없어 자연히 아무 영향 없습니다.)
// ============================================================
(function () {
  const THRESHOLD = 70; // 이만큼 당겨야 새로고침 실행 (px)
  let startY = 0;
  let pulling = false;
  let indicator = null;

  function scrollTop() {
    return document.scrollingElement ? document.scrollingElement.scrollTop : window.scrollY;
  }

  function ensureIndicator() {
    if (indicator) return indicator;
    indicator = document.createElement('div');
    indicator.textContent = '↓ 당겨서 새로고침';
    indicator.style.cssText = [
      'position:fixed', 'top:0', 'left:0', 'right:0', 'z-index:99999',
      'display:flex', 'align-items:center', 'justify-content:center',
      'height:0', 'overflow:hidden',
      'font-size:13px', 'font-weight:700', 'color:#fff',
      'background:var(--navy,#0b1f4d)',
      'padding-top:env(safe-area-inset-top)',
      'transition:height .12s',
      'pointer-events:none'
    ].join(';');
    document.body.appendChild(indicator);
    return indicator;
  }

  document.addEventListener('touchstart', (e) => {
    if (scrollTop() > 0 || e.touches.length !== 1) { pulling = false; return; }
    startY = e.touches[0].clientY;
    pulling = true;
  }, { passive: true });

  document.addEventListener('touchmove', (e) => {
    if (!pulling) return;
    if (scrollTop() > 0) { pulling = false; if (indicator) indicator.style.height = '0px'; return; }
    const dy = e.touches[0].clientY - startY;
    const ind = ensureIndicator();
    if (dy <= 0) { ind.style.height = '0px'; return; }
    const h = Math.min(dy * 0.5, 90);
    ind.style.height = h + 'px';
    ind.textContent = h >= THRESHOLD ? '↑ 놓으면 새로고침' : '↓ 당겨서 새로고침';
  }, { passive: true });

  document.addEventListener('touchend', () => {
    if (!pulling) return;
    pulling = false;
    if (!indicator) return;
    const h = parseInt(indicator.style.height || '0', 10);
    if (h >= THRESHOLD) {
      indicator.textContent = '새로고침 중...';
      location.reload();
    } else {
      indicator.style.height = '0px';
    }
  }, { passive: true });
})();

// ============================================================
// 좁은 화면(폰) 자동 최적화 — 같은 코드, 화면 크기에 따라 CSS로만 조정
// 이 앱은 안드로이드 전용이라 항상 세로 모드의 좁은 화면에서 열립니다.
// 별도의 "모바일 전용 페이지"를 따로 만들면 두 벌의 코드를 계속 같이
// 관리해야 해서 더 위험합니다 — 대신 화면 폭에 따라 자동으로 버튼/입력
// 요소 크기를 조정하는 전역 규칙 하나만 추가합니다.
// ============================================================
(function () {
  const style = document.createElement('style');
  style.textContent = `
    @media (max-width: 400px) {
      button, input[type="button"], input[type="submit"] {
        min-height: 40px;
        font-size: 14px;
        padding-left: 12px;
        padding-right: 12px;
      }
      input[type="text"], input[type="password"], input[type="number"],
      select, textarea {
        font-size: 16px; /* 16px 미만이면 안드로이드에서 입력창 탭 시 화면이 확대되는 문제 방지 */
      }
    }
    @media (max-width: 340px) {
      button, input[type="button"], input[type="submit"] {
        min-height: 36px;
        font-size: 13px;
      }
    }
  `;
  document.head.appendChild(style);
})();

// ============================================================
// 🥚 이스터에그 시스템
// 각 페이지마다 그 페이지 테마에 맞는 숨은 미니게임이 따로 있고,
// 푸터의 "Jvnxyk"를 3초 안에 3번 탭하면 전체 진행 상황을 모아보는
// "나의 이스터에그" 화면이 열립니다 (한 번 찾으면 계속 버튼이 보여요).
// ============================================================
(function () {
  const HUB_UNLOCK_KEY = 'bw_egg_hub_unlocked';

  const session = (window.GwakuriAuth && window.GwakuriAuth.getSession) ? window.GwakuriAuth.getSession() : null;
  const myUsername = session ? session.username : null;

  function _esc(s) { const d = document.createElement('div'); d.textContent = String(s ?? ''); return d.innerHTML; }

  function playFoundChime() {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const notes = [880, 1108.73, 1318.51]; // 또로롱 하고 올라가는 3음 차임
      notes.forEach((freq, i) => {
        const t0 = ctx.currentTime + i * 0.1;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, t0);
        gain.gain.linearRampToValueAtTime(0.28, t0 + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.55);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t0);
        osc.stop(t0 + 0.6);
      });
      setTimeout(() => ctx.close(), 900);
    } catch (e) {}
  }

  function ensureRevealStyle() {
    if (document.getElementById('bw-egg-reveal-style')) return;
    const s = document.createElement('style');
    s.id = 'bw-egg-reveal-style';
    s.textContent = `
      #bw-egg-reveal{position:fixed;inset:0;z-index:999998;display:flex;
        flex-direction:column;align-items:center;justify-content:center;gap:6px;
        background:rgba(6,20,66,.55);pointer-events:none;
        animation:bwRevealFade .9s ease forwards;}
      .bw-egg-reveal-emoji{font-size:44px;
        animation:bwRevealPop .55s cubic-bezier(.34,1.56,.64,1);}
      .bw-egg-reveal-text{color:#ffec00;font-weight:900;font-size:16px;
        letter-spacing:.2px;text-shadow:0 2px 10px rgba(0,0,0,.5);
        opacity:0;animation:bwRevealTextIn .5s ease .15s forwards;}
      @keyframes bwRevealFade{0%{opacity:0}18%{opacity:1}75%{opacity:1}100%{opacity:0}}
      @keyframes bwRevealPop{0%{transform:scale(.3) rotate(-15deg);opacity:0}
        60%{transform:scale(1.18) rotate(6deg);opacity:1}
        100%{transform:scale(1) rotate(0);opacity:1}}
      @keyframes bwRevealTextIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    `;
    document.head.appendChild(s);
  }

  /** 이스터에그를 찾았을 때 공통으로 쓰는 연출 (효과음 + 반짝임 텍스트) 후 콜백 실행 */
  function revealThen(label, cb) {
    ensureRevealStyle();
    playFoundChime();
    const flash = document.createElement('div');
    flash.id = 'bw-egg-reveal';
    flash.innerHTML = `<div class="bw-egg-reveal-emoji">✨🥚✨</div><div class="bw-egg-reveal-text">${_esc(label)}</div>`;
    document.body.appendChild(flash);
    setTimeout(() => { flash.remove(); cb && cb(); }, 850);
  }
  window.BwEgg = window.BwEgg || {};
  window.BwEgg.revealThen = revealThen;
  window.BwEgg.esc = _esc;

  /** 개별 미니게임에서 점수를 서버에 제출할 때 공통으로 쓰는 함수 */
  window.BwEgg.submitScore = function (eggId, score) {
    if (!myUsername || !window.GwakuriAuth) return Promise.resolve(null);
    return window.GwakuriAuth.call('eggSubmitScore', { username: myUsername, eggId, score }).catch(() => null);
  };

  // ── 허브 잠금 해제 트리거: 푸터의 "Jvnxyk"를 3초 안에 3번 탭 ──────
  const NEEDED = 3, TAP_WINDOW = 3000;
  let tapCount = 0, resetTimer = null;

  function unlockHub() {
    if (localStorage.getItem(HUB_UNLOCK_KEY) === '1') { showHub(); return; }
    localStorage.setItem(HUB_UNLOCK_KEY, '1');
    injectHubNavButton();
    revealThen('이스터에그 허브 발견!', showHub);
  }

  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('#bw-egg-hub-trigger');
    if (!trigger) return;
    tapCount++;
    clearTimeout(resetTimer);
    resetTimer = setTimeout(() => { tapCount = 0; }, TAP_WINDOW);
    if (tapCount >= NEEDED) { tapCount = 0; unlockHub(); }
  });

  function injectHubNavButton() {
    if (document.getElementById('bw-egg-hub-navbtn')) return;
    const userwrap = document.querySelector('.bw-nav-userwrap');
    if (!userwrap) return;
    const btn = document.createElement('a');
    btn.id = 'bw-egg-hub-navbtn';
    btn.href = 'javascript:void(0)';
    btn.textContent = '🥚 이스터에그';
    btn.style.cssText = 'margin-left:6px;';
    btn.addEventListener('click', showHub);
    userwrap.insertBefore(btn, userwrap.firstChild);
  }

  // 이미 이전에 찾아둔 상태라면 페이지 로드 시 바로 버튼 노출
  if (localStorage.getItem(HUB_UNLOCK_KEY) === '1') {
    // nav가 비동기로 그려질 수 있어 살짝 지연 후 삽입 시도
    setTimeout(injectHubNavButton, 0);
    setTimeout(injectHubNavButton, 300);
  }

  function ensureHubStyle() {
    if (document.getElementById('bw-egg-hub-style')) return;
    const s = document.createElement('style');
    s.id = 'bw-egg-hub-style';
    s.textContent = `
      #bw-egg-hub{position:fixed;inset:0;z-index:999999;background:#040d29;
        display:flex;flex-direction:column;animation:bwEggFade .2s ease;
        padding:env(safe-area-inset-top) 0 env(safe-area-inset-bottom) 0;overflow-y:auto;}
      @keyframes bwEggFade{from{opacity:0}to{opacity:1}}
      .bw-egg-hub-top{display:flex;align-items:center;justify-content:space-between;
        padding:14px 18px;color:#fff;font-weight:800;font-size:15px;}
      .bw-egg-hub-close{background:rgba(255,255,255,.1);border:none;color:#fff;
        width:30px;height:30px;border-radius:50%;font-size:15px;cursor:pointer;}
      .bw-egg-hub-body{padding:6px 18px 28px;max-width:420px;margin:0 auto;width:100%;}
      .bw-egg-hub-section-title{color:rgba(255,255,255,.55);font-size:12.5px;font-weight:800;
        margin:18px 0 8px;letter-spacing:.3px;}
      .bw-egg-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px;}
      .bw-egg-list li{display:flex;align-items:center;justify-content:space-between;
        background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);
        border-radius:12px;padding:12px 14px;}
      .bw-egg-list li.found{background:rgba(255,236,0,.08);border-color:rgba(255,236,0,.25);}
      .bw-egg-list .n{color:#fff;font-weight:700;font-size:13.5px;}
      .bw-egg-list li:not(.found) .n{color:rgba(255,255,255,.35);}
      .bw-egg-list .s{font-weight:800;font-size:13.5px;color:#ffec00;}
      .bw-egg-list li:not(.found) .s{color:rgba(255,255,255,.25);}
      .bw-egg-board2{margin-top:6px;display:flex;flex-direction:column;gap:6px;}
      .bw-egg-board2 li{display:flex;align-items:center;gap:10px;
        background:rgba(255,255,255,.04);border-radius:10px;padding:9px 12px;
        list-style:none;}
      .bw-egg-board2 .crown{font-size:16px;width:22px;text-align:center;}
      .bw-egg-board2 .name{flex:1;color:rgba(255,255,255,.85);font-size:13.5px;
        overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
      .bw-egg-board2 .pts{color:#ffec00;font-weight:800;font-size:13px;}
      .bw-egg-empty{color:rgba(255,255,255,.4);font-size:13px;padding:8px 2px;}
    `;
    document.head.appendChild(s);
  }

  function showHub() {
    if (document.getElementById('bw-egg-hub')) return;
    ensureHubStyle();
    const box = document.createElement('div');
    box.id = 'bw-egg-hub';
    box.innerHTML = `
      <div class="bw-egg-hub-top">
        <span>🥚 나의 이스터에그</span>
        <button class="bw-egg-hub-close" type="button" aria-label="닫기">✕</button>
      </div>
      <div class="bw-egg-hub-body">
        <div class="bw-egg-hub-section-title">내가 찾은 이스터에그</div>
        <ul class="bw-egg-list" id="bw-egg-hub-mine"><li class="bw-egg-empty">불러오는 중...</li></ul>
        <div class="bw-egg-hub-section-title">🏆 합산 점수 TOP 5</div>
        <ul class="bw-egg-board2" id="bw-egg-hub-board"><li class="bw-egg-empty">불러오는 중...</li></ul>
      </div>
    `;
    document.body.appendChild(box);
    box.querySelector('.bw-egg-hub-close').addEventListener('click', () => box.remove());

    if (!myUsername || !window.GwakuriAuth) {
      box.querySelector('#bw-egg-hub-mine').innerHTML = '<li class="bw-egg-empty">로그인 후 이용할 수 있어요.</li>';
    } else {
      window.GwakuriAuth.call('eggMyProgress', { username: myUsername }).then(r => {
        const eggs = (r && r.success) ? r.eggs : [];
        const ul = box.querySelector('#bw-egg-hub-mine');
        if (!eggs.length) { ul.innerHTML = '<li class="bw-egg-empty">아직 이스터에그 정보가 없어요.</li>'; return; }
        ul.innerHTML = eggs.map(egg => `
          <li class="${egg.found ? 'found' : ''}">
            <span class="n">${egg.found ? _esc(egg.name) : '--'}</span>
            <span class="s">${egg.found ? egg.score + '점' : '--'}</span>
          </li>`).join('');
      }).catch(() => {
        box.querySelector('#bw-egg-hub-mine').innerHTML = '<li class="bw-egg-empty">불러오지 못했어요.</li>';
      });
    }

    const call = window.GwakuriAuth ? window.GwakuriAuth.call('eggLeaderboard', { limit: 5 }) : Promise.resolve(null);
    call.then(r => {
      const list = (r && r.success) ? r.list : [];
      const ul = box.querySelector('#bw-egg-hub-board');
      if (!list.length) { ul.innerHTML = '<li class="bw-egg-empty">아직 기록이 없어요.</li>'; return; }
      const crowns = ['🥇', '🥈', '🥉'];
      ul.innerHTML = list.map((row, i) => `
        <li>
          <span class="crown">${crowns[i] || (i + 1)}</span>
          <span class="name">${_esc(row.username)}</span>
          <span class="pts">${row.best}점</span>
        </li>`).join('');
    }).catch(() => {
      box.querySelector('#bw-egg-hub-board').innerHTML = '<li class="bw-egg-empty">불러오지 못했어요.</li>';
    });
  }
})();