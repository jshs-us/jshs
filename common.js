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
        <h2>과학구리 앱</h2>
        <p class="bw-authsub">로그인해야 앱을 이용할 수 있어요.</p>
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
