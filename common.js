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
  과학구리 정보 제공 ${isNativeApp ? '앱' : '사이트'} &nbsp;·&nbsp; Made by <strong style="color:rgba(255,255,255,.6)">Jvnxyk</strong>
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
// 🥚 이스터에그 — 헤더 로고를 2.5초 안에 7번 연속으로 탭하면 발동
// (평범하게 한 번 누르면 원래대로 index.html로 이동하고, 여러 번
// 눌러도 마지막 탭 후 잠깐 있다가 정상 이동하니 기존 동작은 그대로)
// ============================================================
(function () {
  const NEEDED = 7;
  const TAP_WINDOW = 2500;
  const NAV_DELAY = 350;
  let tapCount = 0;
  let resetTimer = null;
  let navTimer = null;

  document.addEventListener('click', (e) => {
    const logo = e.target.closest('.bw-logo');
    if (!logo) return;
    e.preventDefault();
    clearTimeout(navTimer);

    tapCount++;
    if (tapCount === 1) {
      clearTimeout(resetTimer);
      resetTimer = setTimeout(() => { tapCount = 0; }, TAP_WINDOW);
    }

    if (tapCount >= NEEDED) {
      clearTimeout(resetTimer);
      tapCount = 0;
      _showEasterEgg_();
      return;
    }

    // 평범한 탭이었으면 잠깐 뒤 원래 목적지로 이동 (연타 카운트 여유를 줌)
    navTimer = setTimeout(() => {
      location.href = logo.getAttribute('href') || 'index.html';
    }, NAV_DELAY);
  });

  function _showEasterEgg_() {
    if (document.getElementById('bw-egg')) return;

    const style = document.createElement('style');
    style.textContent = `
      #bw-egg{position:fixed;inset:0;z-index:999999;background:#040d29;
        display:flex;flex-direction:column;animation:bwEggFade .22s ease;
        padding:env(safe-area-inset-top) 0 env(safe-area-inset-bottom) 0;
        font-family:inherit;}
      @keyframes bwEggFade{from{opacity:0}to{opacity:1}}
      .bw-egg-top{display:flex;align-items:center;justify-content:space-between;
        padding:14px 18px;color:#fff;flex-shrink:0;position:relative;z-index:3;
        background:linear-gradient(to bottom, rgba(4,13,41,.85), rgba(4,13,41,0));}
      .bw-egg-top .title{font-weight:800;font-size:15px;letter-spacing:.2px;
        display:flex;align-items:center;gap:6px;}
      .bw-egg-top .score-pill{background:rgba(255,236,0,.14);border:1px solid rgba(255,236,0,.35);
        color:#ffec00;font-weight:800;font-size:13px;padding:5px 12px;border-radius:999px;}
      .bw-egg-close{background:rgba(255,255,255,.1);border:none;color:#fff;
        width:30px;height:30px;border-radius:50%;font-size:15px;line-height:1;cursor:pointer;
        display:flex;align-items:center;justify-content:center;}
      .bw-egg-field{position:relative;flex:1;overflow:hidden;}
      .bw-egg-field canvas{position:absolute;inset:0;width:100%;height:100%;touch-action:none;}

      .bw-egg-panel{position:absolute;inset:0;display:flex;flex-direction:column;
        align-items:center;justify-content:center;gap:14px;text-align:center;
        padding:24px;background:rgba(4,13,41,.72);backdrop-filter:blur(2px);z-index:2;}
      .bw-egg-card{background:linear-gradient(180deg,#0d2358,#0a1c47);
        border:1px solid rgba(255,255,255,.08);border-radius:20px;
        padding:26px 22px;width:100%;max-width:300px;
        box-shadow:0 12px 40px rgba(0,0,0,.45);}
      .bw-egg-card .emoji{font-size:46px;filter:drop-shadow(0 4px 10px rgba(0,0,0,.4));}
      .bw-egg-card h3{margin:10px 0 4px;color:#fff;font-size:19px;font-weight:800;}
      .bw-egg-card p{margin:0;font-size:12.5px;color:rgba(255,255,255,.6);line-height:1.5;}
      .bw-egg-card .score{font-size:42px;font-weight:900;color:#ffec00;margin:10px 0 2px;
        text-shadow:0 2px 12px rgba(255,236,0,.35);}
      .bw-egg-card .best{font-size:12.5px;color:rgba(255,255,255,.55);margin-bottom:14px;}
      .bw-egg-btnrow{display:flex;gap:8px;margin-top:14px;}
      .bw-egg-btn{border:none;border-radius:12px;padding:11px 16px;font-weight:800;
        font-size:13.5px;cursor:pointer;flex:1;transition:transform .1s;}
      .bw-egg-btn:active{transform:scale(.96);}
      .bw-egg-btn.primary{background:linear-gradient(180deg,#ffec00,#ffd400);color:#061442;
        box-shadow:0 4px 14px rgba(255,236,0,.35);}
      .bw-egg-btn.ghost{background:rgba(255,255,255,.08);color:#fff;border:1px solid rgba(255,255,255,.12);}

      .bw-egg-board{margin-top:16px;width:100%;max-width:300px;
        background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);
        border-radius:16px;padding:14px 16px;text-align:left;}
      .bw-egg-board-title{color:#fff;font-weight:800;font-size:12.5px;
        display:flex;align-items:center;gap:5px;margin-bottom:8px;opacity:.85;}
      .bw-egg-board-list{list-style:none;margin:0;padding:0;
        display:flex;flex-direction:column;gap:6px;max-height:150px;overflow-y:auto;}
      .bw-egg-board-list li{display:flex;align-items:center;gap:8px;
        font-size:13px;color:rgba(255,255,255,.85);padding:2px 0;}
      .bw-egg-board-list .rank{width:22px;flex-shrink:0;text-align:center;font-weight:800;
        color:rgba(255,255,255,.45);font-size:12px;}
      .bw-egg-board-list li.r1 .rank,.bw-egg-board-list li.r2 .rank,.bw-egg-board-list li.r3 .rank{font-size:15px;}
      .bw-egg-board-list .name{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
      .bw-egg-board-list .pts{font-weight:800;color:#ffec00;font-size:12.5px;}
      .bw-egg-board-list li.me{background:rgba(255,236,0,.1);border-radius:8px;
        margin:0 -8px;padding:4px 8px;}
      .bw-egg-board-empty,.bw-egg-board-loading{color:rgba(255,255,255,.4);font-size:12.5px;padding:4px 0;}

      .bw-egg-flash{position:absolute;inset:0;background:#ff2d2d;opacity:0;pointer-events:none;
        z-index:5;animation:bwEggFlash .28s ease forwards;}
      @keyframes bwEggFlash{0%{opacity:.55}100%{opacity:0}}
    `;
    document.head.appendChild(style);

    const BEST_KEY = 'bw_egg_flap_best';
    const CHAR = '🧪';
    const GRAVITY = 1500;
    const FLAP_V = -430;
    const MAX_FALL_V = 620;
    const PIPE_W = 60;
    const PIPE_CAP_H = 18;
    const PIPE_CAP_OVERHANG = 7;
    const PIPE_GAP_START = 190;
    const PIPE_GAP_MIN = 130;
    const PIPE_SPEED_START = 165;
    const PIPE_INTERVAL = 1.35;

    const session = (window.GwakuriAuth && window.GwakuriAuth.getSession) ? window.GwakuriAuth.getSession() : null;
    const myUsername = session ? session.username : null;

    const box = document.createElement('div');
    box.id = 'bw-egg';
    box.innerHTML = `
      <div class="bw-egg-top">
        <span class="title">🧪 과학구리 날다</span>
        <span class="score-pill" id="bw-egg-score">0점</span>
        <button class="bw-egg-close" type="button" aria-label="닫기">✕</button>
      </div>
      <div class="bw-egg-field" id="bw-egg-field">
        <canvas id="bw-egg-canvas"></canvas>
        <div class="bw-egg-panel" id="bw-egg-ready">
          <div class="bw-egg-card">
            <div class="emoji">🧪</div>
            <h3>탭해서 시작!</h3>
            <p>화면을 탭해서 날아올라요.<br/>파이프에 부딪히지 마세요.</p>
          </div>
          <div class="bw-egg-board" id="bw-egg-board-ready">
            <div class="bw-egg-board-title">🏆 전체 순위</div>
            <ol class="bw-egg-board-list"><li class="bw-egg-board-loading">불러오는 중...</li></ol>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(box);

    const field = box.querySelector('#bw-egg-field');
    const canvas = box.querySelector('#bw-egg-canvas');
    const scoreEl = box.querySelector('#bw-egg-score');
    const readyEl = box.querySelector('#bw-egg-ready');
    const ctx = canvas.getContext('2d');

    let W = 0, H = 0, DPR = Math.min(window.devicePixelRatio || 1, 2);
    function resize() {
      W = field.clientWidth || 320;
      H = field.clientHeight || 480;
      canvas.width = W * DPR;
      canvas.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    resize();

    function haptic(kind) {
      try {
        const H = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Haptics;
        if (!H) return;
        if (kind === 'flap') H.impact && H.impact({ style: 'LIGHT' });
        else if (kind === 'dead') H.notification && H.notification({ type: 'ERROR' });
      } catch (e) {}
    }

    // ── 순위표 불러오기 (여러 패널에 동시에 렌더링될 수 있어 리스트로 관리) ──
    function medalOrRank(i) { return i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1); }
    function _esc(s) { const d = document.createElement('div'); d.textContent = String(s ?? ''); return d.innerHTML; }
    function renderBoard(container, list) {
      const ol = container.querySelector('.bw-egg-board-list');
      if (!list || !list.length) { ol.innerHTML = '<li class="bw-egg-board-empty">아직 기록이 없어요. 1등을 노려보세요!</li>'; return; }
      ol.innerHTML = list.map((row, i) => `
        <li class="${i < 3 ? 'r' + (i + 1) : ''} ${row.username === myUsername ? 'me' : ''}">
          <span class="rank">${medalOrRank(i)}</span>
          <span class="name">${_esc(row.username)}</span>
          <span class="pts">${row.best}점</span>
        </li>`).join('');
    }
    function loadLeaderboard() {
      if (!window.GwakuriAuth) return;
      window.GwakuriAuth.call('eggLeaderboard', { limit: 10 }).then(r => {
        const list = (r && r.success) ? r.list : [];
        box.querySelectorAll('.bw-egg-board').forEach(el => renderBoard(el, list));
      }).catch(() => {
        box.querySelectorAll('.bw-egg-board-list').forEach(ol => {
          ol.innerHTML = '<li class="bw-egg-board-empty">순위표를 불러오지 못했어요.</li>';
        });
      });
    }
    loadLeaderboard();

    const birdX = () => W * 0.28;
    let bird = { y: 0, v: 0, rot: 0 };
    let pipes = [];
    let bubbles = []; // 배경 장식용 파티클
    let score = 0;
    let scorePulse = 0; // 점수 획득 시 살짝 커지는 연출용
    let state = 'ready';
    let running = true;
    let lastTs = 0;
    let spawnClock = 0;
    let elapsed = 0;
    let rafId = null;

    function initBubbles() {
      bubbles = [];
      for (let i = 0; i < 14; i++) {
        bubbles.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: 2 + Math.random() * 4,
          v: 8 + Math.random() * 16
        });
      }
    }

    function resetRun() {
      bird = { y: H * 0.42, v: 0, rot: 0 };
      pipes = [];
      score = 0;
      elapsed = 0;
      spawnClock = 0;
      scorePulse = 0;
      scoreEl.textContent = '0점';
      initBubbles();
    }
    resetRun();

    function currentSpeed() { return PIPE_SPEED_START + Math.min(elapsed * 6, 140); }
    function currentGap() { return Math.max(PIPE_GAP_MIN, PIPE_GAP_START - elapsed * 2.2); }
    function currentInterval() { return Math.max(0.95, PIPE_INTERVAL - elapsed * 0.01); }

    function spawnPipe() {
      const gap = currentGap();
      const margin = 40;
      const gapY = margin + Math.random() * (H - margin * 2 - gap);
      pipes.push({ x: W + PIPE_W, gapY, gapSize: gap, passed: false });
    }

    function flap() {
      if (state === 'ready') {
        state = 'playing';
        readyEl.style.display = 'none';
      }
      if (state !== 'playing') return;
      bird.v = FLAP_V;
      haptic('flap');
    }

    function onPointerDown(e) { e.preventDefault(); flap(); }
    canvas.addEventListener('pointerdown', onPointerDown);

    function flashScreen() {
      const f = document.createElement('div');
      f.className = 'bw-egg-flash';
      field.appendChild(f);
      f.addEventListener('animationend', () => f.remove());
    }

    function die() {
      if (state === 'dead') return;
      state = 'dead';
      haptic('dead');
      flashScreen();
      running = false;
      cancelAnimationFrame(rafId);

      const localBest = Math.max(score, Number(localStorage.getItem(BEST_KEY) || 0));
      localStorage.setItem(BEST_KEY, String(localBest));

      const panel = document.createElement('div');
      panel.className = 'bw-egg-panel';
      panel.innerHTML = `
        <div class="bw-egg-card">
          <h3>💥 충돌!</h3>
          <div class="score">${score}점</div>
          <div class="best">내 최고 기록: ${localBest}점</div>
          <div class="bw-egg-btnrow">
            <button class="bw-egg-btn primary" id="bw-egg-retry">다시 하기</button>
            <button class="bw-egg-btn ghost" id="bw-egg-done">닫기</button>
          </div>
        </div>
        <div class="bw-egg-board" id="bw-egg-board-result">
          <div class="bw-egg-board-title">🏆 전체 순위</div>
          <ol class="bw-egg-board-list"><li class="bw-egg-board-loading">불러오는 중...</li></ol>
        </div>
      `;
      field.appendChild(panel);
      panel.querySelector('#bw-egg-retry').addEventListener('click', () => { box.remove(); _showEasterEgg_(); });
      panel.querySelector('#bw-egg-done').addEventListener('click', () => box.remove());

      // 서버에 점수 제출 (로그인 상태일 때만) → 갱신되면 전체 순위표도 새로고침
      if (myUsername && window.GwakuriAuth) {
        window.GwakuriAuth.call('eggSubmitScore', { username: myUsername, score: score })
          .then(() => loadLeaderboard())
          .catch(() => loadLeaderboard());
      } else {
        loadLeaderboard();
      }
    }

    function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
      return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
    }

    function update(dt) {
      bubbles.forEach(b => {
        b.y -= b.v * dt;
        if (b.y < -6) { b.y = H + 6; b.x = Math.random() * W; }
      });

      if (state !== 'playing') return;
      elapsed += dt;
      scorePulse = Math.max(0, scorePulse - dt * 3);

      bird.v = Math.min(bird.v + GRAVITY * dt, MAX_FALL_V);
      bird.y += bird.v * dt;
      bird.rot = Math.max(-0.5, Math.min(1.1, bird.v / 500));

      const speed = currentSpeed();
      spawnClock += dt;
      if (spawnClock >= currentInterval()) { spawnClock = 0; spawnPipe(); }

      const bx = birdX(), bs = 15;
      for (let i = pipes.length - 1; i >= 0; i--) {
        const p = pipes[i];
        p.x -= speed * dt;

        if (!p.passed && p.x + PIPE_W < bx - bs) {
          p.passed = true;
          score++;
          scorePulse = 1;
          scoreEl.textContent = score + '점';
        }

        const topH = p.gapY;
        const bottomY = p.gapY + p.gapSize;
        const hitTop = rectsOverlap(bx - bs, bird.y - bs, bs * 2, bs * 2, p.x, 0, PIPE_W, topH);
        const hitBottom = rectsOverlap(bx - bs, bird.y - bs, bs * 2, bs * 2, p.x, bottomY, PIPE_W, H - bottomY);
        if (hitTop || hitBottom) { die(); return; }

        if (p.x + PIPE_W < -10) pipes.splice(i, 1);
      }

      if (bird.y - bs > H || bird.y + bs < 0) { die(); return; }
    }

    function drawPipe(x, gapY, gapSize) {
      const bottomY = gapY + gapSize;
      const grad = ctx.createLinearGradient(x, 0, x + PIPE_W, 0);
      grad.addColorStop(0, '#0f9d58');
      grad.addColorStop(0.5, '#22c46f');
      grad.addColorStop(1, '#0f9d58');
      ctx.fillStyle = grad;

      // 위쪽 파이프
      ctx.fillRect(x, 0, PIPE_W, Math.max(0, gapY - PIPE_CAP_H));
      ctx.fillRect(x - PIPE_CAP_OVERHANG, Math.max(0, gapY - PIPE_CAP_H), PIPE_W + PIPE_CAP_OVERHANG * 2, PIPE_CAP_H);
      // 아래쪽 파이프
      ctx.fillRect(x, bottomY + PIPE_CAP_H, PIPE_W, H - (bottomY + PIPE_CAP_H));
      ctx.fillRect(x - PIPE_CAP_OVERHANG, bottomY, PIPE_W + PIPE_CAP_OVERHANG * 2, PIPE_CAP_H);

      // 하이라이트 줄무늬
      ctx.fillStyle = 'rgba(255,255,255,.18)';
      ctx.fillRect(x + 8, 0, 6, Math.max(0, gapY - PIPE_CAP_H));
      ctx.fillRect(x + 8, bottomY + PIPE_CAP_H, 6, H - (bottomY + PIPE_CAP_H));
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);

      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#0d2358');
      g.addColorStop(1, '#040d29');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      // 배경 파티클(기포)
      ctx.fillStyle = 'rgba(255,255,255,.12)';
      bubbles.forEach(b => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
      });

      pipes.forEach(p => drawPipe(p.x, p.gapY, p.gapSize));

      // 캐릭터 (그림자 + 이모지)
      ctx.save();
      ctx.translate(birdX(), bird.y);
      ctx.rotate(bird.rot * 0.6);
      ctx.beginPath();
      ctx.ellipse(0, 20, 14, 5, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,.25)';
      ctx.fill();
      ctx.font = '32px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(CHAR, 0, 0);
      ctx.restore();

      // 점수 획득 펄스 텍스트 (화면 중앙 상단)
      if (scorePulse > 0) {
        ctx.save();
        ctx.globalAlpha = scorePulse;
        ctx.fillStyle = '#ffec00';
        ctx.font = `${28 + scorePulse * 10}px system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('+1', W / 2, H * 0.22);
        ctx.restore();
      }
    }

    function loop(ts) {
      if (!running) return;
      if (!lastTs) lastTs = ts;
      const dt = Math.min((ts - lastTs) / 1000, 0.033);
      lastTs = ts;
      update(dt);
      draw();
      rafId = requestAnimationFrame(loop);
    }
    rafId = requestAnimationFrame(loop);

    box.querySelector('.bw-egg-close').addEventListener('click', () => {
      running = false;
      cancelAnimationFrame(rafId);
      canvas.removeEventListener('pointerdown', onPointerDown);
      box.remove();
    });
  }
})();