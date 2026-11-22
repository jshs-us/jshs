var Security = (function () {
  var CONFIG = {
    TOKEN_TTL_SEC: 60 * 60 * 24 * 7,
    PROOF_TTL_SEC: 60 * 15,
    CODE_TTL_SEC: 60 * 10,
    CODE_MAX_TRIES: 5,
    ALLOWED_EMAIL_DOMAINS: ['ai.jne.kr'],
    FINE_ADMINS: ['서준혁', '정의찬'],
    RATE: {
      login: { limit: 8, windowSec: 300 },
      signup: { limit: 5, windowSec: 3600 },
      requestEmailCode: { limit: 3, windowSec: 600 },
      verifyEmailCode: { limit: 10, windowSec: 600 },
      getUploadSignature: { limit: 20, windowSec: 3600 },
      createPostDirect: { limit: 10, windowSec: 600 },
      addComment: { limit: 20, windowSec: 300 },
      sendDm: { limit: 30, windowSec: 60 },
      fineSubmitProof: { limit: 10, windowSec: 3600 },
      eggSubmitScore: { limit: 30, windowSec: 600 },
      _default: { limit: 120, windowSec: 60 }
    },
    GLOBAL_RATE: { limit: 600, windowSec: 60 },
    PUBLIC_ACTIONS: ['login', 'signup', 'requestEmailCode', 'verifyEmailCode'],
    ADMIN_ONLY: ['listUsers', 'setRole', 'setMuted', 'resetPassword', 'kickUser'],
    MANAGER_UP: ['adminDeletePost'],
    ACTIVITY_MANAGERS: ['activityCreate', 'activityUpdate', 'activityDelete'],
    FINE_ADMIN_ONLY: ['fineListAll', 'fineCreate', 'fineUpdateStatus']
  };

  function properties_() {
    return PropertiesService.getScriptProperties();
  }

  function secret_() {
    var secret = properties_().getProperty('TOKEN_SECRET');
    if (!secret || secret.length < 32) throw new Error('TOKEN_SECRET 설정이 필요해요.');
    return secret;
  }

  function nowSec_() {
    return Math.floor(Date.now() / 1000);
  }

  function base64Url_(bytes) {
    return Utilities.base64EncodeWebSafe(bytes).replace(/=+$/, '');
  }

  function encodeString_(value) {
    return base64Url_(Utilities.newBlob(value).getBytes());
  }

  function decodeString_(value) {
    var padding = '===='.slice(value.length % 4 || 4);
    return Utilities.newBlob(Utilities.base64DecodeWebSafe(value + padding)).getDataAsString();
  }

  function hmac_(message) {
    return base64Url_(Utilities.computeHmacSha256Signature(message, secret_()));
  }

  function sha256_(value) {
    return Utilities.base64Encode(Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256, String(value)
    ));
  }

  function safeEqual_(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
    var difference = 0;
    for (var i = 0; i < a.length; i++) difference |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return difference === 0;
  }

  function normalizedEmail_(value) {
    return String(value == null ? '' : value).trim().toLowerCase();
  }

  function validEmail(email) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 120) return false;
    var domain = email.split('@').pop();
    return CONFIG.ALLOWED_EMAIL_DOMAINS.indexOf(domain) >= 0;
  }

  function tokenVersion_(username) {
    return properties_().getProperty('tv:' + username) || '0';
  }

  function bumpTokenVersion(username) {
    var next = parseInt(tokenVersion_(username), 10) + 1;
    properties_().setProperty('tv:' + username, String(next));
  }

  function sign_(payload) {
    var body = encodeString_(JSON.stringify(payload));
    return body + '.' + hmac_(body);
  }

  function unsign_(token) {
    if (typeof token !== 'string' || token.length > 2000) return null;
    var separator = token.indexOf('.');
    if (separator < 1) return null;
    var body = token.slice(0, separator);
    var signature = token.slice(separator + 1);
    if (!safeEqual_(signature, hmac_(body))) return null;
    try {
      var payload = JSON.parse(decodeString_(body));
      if (!payload || !payload.exp || payload.exp < nowSec_()) return null;
      return payload;
    } catch (error) {
      return null;
    }
  }

  function issueToken(username) {
    return sign_({
      t: 's',
      u: username,
      v: tokenVersion_(username),
      exp: nowSec_() + CONFIG.TOKEN_TTL_SEC
    });
  }

  function verifyToken(token) {
    var payload = unsign_(token);
    if (!payload || payload.t !== 's' || !payload.u) return null;
    return String(payload.v) === String(tokenVersion_(payload.u)) ? payload.u : null;
  }

  function rateHit_(key, limit, windowSec) {
    var cache = CacheService.getScriptCache();
    var lock = LockService.getScriptLock();
    lock.waitLock(3000);
    try {
      return rateHitLocked_(cache, key, limit, windowSec);
    } finally {
      lock.releaseLock();
    }
  }

  function rateHitLocked_(cache, key, limit, windowSec) {
    var cacheKey = 'rl:' + sha256_(key);
    var count = parseInt(cache.get(cacheKey) || '0', 10) + 1;
    cache.put(cacheKey, String(count), Math.min(windowSec, 21600));
    return count <= limit;
  }

  function rateOk_(action, identity) {
    var lock = LockService.getScriptLock();
    lock.waitLock(3000);
    try {
      var cache = CacheService.getScriptCache();
      if (!rateHitLocked_(cache, 'global', CONFIG.GLOBAL_RATE.limit, CONFIG.GLOBAL_RATE.windowSec)) return false;
      var rule = CONFIG.RATE[action] || CONFIG.RATE._default;
      return rateHitLocked_(cache, action + ':' + identity, rule.limit, rule.windowSec);
    } finally {
      lock.releaseLock();
    }
  }

  function userCodeKey_(purpose, email) {
    return 'email-code:' + purpose + ':' + sha256_(email);
  }

  function randomCode_() {
    var number = parseInt(Utilities.getUuid().replace(/-/g, '').slice(0, 8), 16) % 1000000;
    return ('000000' + number).slice(-6);
  }

  function requestEmailCode_(params, user) {
    var purpose = String(params.purpose || '').trim();
    var email = normalizedEmail_(params.email);
    if (purpose !== 'signup' && purpose !== 'update') return { success: false, message: '잘못된 요청이에요.' };
    if (purpose === 'update' && !user) return { success: false, message: '로그인이 필요해요.', code: 'AUTH' };
    if (!validEmail(email)) return { success: false, message: '학교 이메일 주소를 확인해주세요.' };
    if (purpose === 'signup' && emailInUse_(email, '')) {
      return { success: false, message: '이미 다른 계정에서 쓰는 이메일이에요.' };
    }
    if (purpose === 'update' && emailInUse_(email, user.username)) {
      return { success: false, message: '이미 다른 계정에서 쓰는 이메일이에요.' };
    }
    if (!rateHit_('email:' + email, 3, 3600) || !rateHit_('email-daily', 80, 21600)) {
      return { success: false, message: '인증번호 요청이 너무 많아요. 잠시 후 다시 시도해주세요.', code: 'RATE' };
    }
    var code = randomCode_();
    var key = userCodeKey_(purpose, email);
    CacheService.getScriptCache().put(key, JSON.stringify({
      hash: sha256_(code + ':' + email + ':' + secret_()),
      tries: 0
    }), CONFIG.CODE_TTL_SEC);
    MailApp.sendEmail({
      to: email,
      name: '과학구리',
      subject: '[과학구리] 이메일 인증번호 ' + code,
      htmlBody: '<div style="font-family:sans-serif"><p>인증번호는 <b style="font-size:22px;letter-spacing:3px">' +
        code + '</b> 입니다.</p><p>10분 안에 입력해주세요. 본인이 요청하지 않았다면 이 메일을 무시하세요.</p></div>'
    });
    return { success: true, message: '인증번호를 보냈어요. 메일함(스팸함 포함)을 확인해주세요.' };
  }

  function verifyEmailCode_(params, user) {
    var purpose = String(params.purpose || '').trim();
    var email = normalizedEmail_(params.email);
    var code = String(params.code || '').trim();
    if (purpose !== 'signup' && purpose !== 'update') return { success: false, message: '잘못된 요청이에요.' };
    if (purpose === 'update' && !user) return { success: false, message: '로그인이 필요해요.', code: 'AUTH' };
    if (!validEmail(email) || !/^\d{6}$/.test(code)) return { success: false, message: '인증번호를 확인해주세요.' };
    var lock = LockService.getScriptLock();
    lock.waitLock(3000);
    try {
      var cache = CacheService.getScriptCache();
      var key = userCodeKey_(purpose, email);
      var saved = cache.get(key);
      if (!saved) return { success: false, message: '인증번호가 만료됐거나 요청하지 않았어요. 다시 받아주세요.' };
      var state = JSON.parse(saved);
      if (state.tries >= CONFIG.CODE_MAX_TRIES) {
        cache.remove(key);
        return { success: false, message: '시도 횟수를 넘었어요. 인증번호를 다시 받아주세요.' };
      }
      if (!safeEqual_(state.hash, sha256_(code + ':' + email + ':' + secret_()))) {
        state.tries++;
        cache.put(key, JSON.stringify(state), CONFIG.CODE_TTL_SEC);
        return { success: false, message: '인증번호가 맞지 않아요.' };
      }
      cache.remove(key);
      var proofId = Utilities.getUuid();
      var owner = purpose === 'update' ? user.username : '';
      cache.put('email-proof:' + proofId, JSON.stringify({ email: email, purpose: purpose, username: owner }), CONFIG.PROOF_TTL_SEC);
      return {
        success: true,
        emailProof: sign_({
          t: 'e', id: proofId, e: email, p: purpose, u: owner,
          exp: nowSec_() + CONFIG.PROOF_TTL_SEC
        }),
        message: '이메일이 인증됐어요.'
      };
    } finally {
      lock.releaseLock();
    }
  }

  function consumeEmailProof(proof, email, purpose, username) {
    var payload = unsign_(proof);
    if (!payload || payload.t !== 'e' || payload.e !== normalizedEmail_(email) || payload.p !== purpose) return false;
    if (purpose === 'update' && payload.u !== username) return false;
    if (purpose === 'signup' && payload.u !== '') return false;
    var cache = CacheService.getScriptCache();
    var key = 'email-proof:' + payload.id;
    var saved = cache.get(key);
    if (!saved) return false;
    var state;
    try { state = JSON.parse(saved); } catch (error) { return false; }
    if (state.email !== payload.e || state.purpose !== payload.p || state.username !== payload.u) return false;
    cache.remove(key);
    return true;
  }

  function uploadSignature_(params, user) {
    var properties = properties_();
    var purpose = String(params.purpose || 'board');
    if (purpose !== 'board' && purpose !== 'fine' && purpose !== 'profile' && purpose !== 'dm') {
      return { success: false, message: '업로드 용도가 올바르지 않아요.' };
    }
    var prefix = 'CLOUDINARY_' + purpose.toUpperCase() + '_';
    var apiKey = properties.getProperty(prefix + 'API_KEY') || properties.getProperty('CLOUDINARY_API_KEY');
    var apiSecret = properties.getProperty(prefix + 'API_SECRET') || properties.getProperty('CLOUDINARY_API_SECRET');
    var cloud = properties.getProperty(prefix + 'CLOUD_NAME') || properties.getProperty('CLOUDINARY_CLOUD_NAME');
    if (!apiKey || !apiSecret || !cloud) {
      return { success: false, message: '업로드 설정이 아직 안 되어 있어요. 관리자에게 문의해주세요.' };
    }
    if ((purpose === 'board' || purpose === 'dm') && user.muted) {
      return { success: false, message: '작성 금지 상태예요.', code: 'MUTED' };
    }
    var folder;
    if (purpose === 'fine') {
      var fineId = String(params.id || '').trim();
      if (!fineId || !canUploadFineProof_(user.username, fineId)) {
        return { success: false, message: '본인에게 부과된 미납 벌금이 있어야 인증사진을 올릴 수 있어요.' };
      }
      folder = fineUploadFolder_(user.username, fineId);
    } else {
      folder = userUploadFolder_(purpose, user.username);
    }
    var publicId = Utilities.getUuid();
    var timestamp = nowSec_();
    var signature = Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_1,
      'folder=' + folder + '&overwrite=false&public_id=' + publicId + '&timestamp=' + timestamp + apiSecret
    ).map(function (byte) {
      return ('0' + (byte < 0 ? byte + 256 : byte).toString(16)).slice(-2);
    }).join('');
    return {
      success: true,
      cloud: cloud,
      apiKey: apiKey,
      timestamp: timestamp,
      folder: folder,
      publicId: publicId,
      overwrite: false,
      signature: signature,
      resourceType: purpose === 'board' || purpose === 'dm' ? 'auto' : 'image'
    };
  }

  function guard_(params) {
    var action = String(params.action || '').trim();
    if (!action) return { ok: false, response: { success: false, message: '요청 종류를 확인할 수 없어요.', code: 'ACTION' } };
    var isPublic = CONFIG.PUBLIC_ACTIONS.indexOf(action) >= 0;
    var username = null;
    var user = null;
    if (!isPublic || params.authToken) {
      username = verifyToken(params.authToken);
      user = username ? memberForSecurity_(username) : null;
      if (!user && !isPublic) {
        return { ok: false, response: { success: false, message: '로그인이 필요해요. 다시 로그인해주세요.', code: 'AUTH' } };
      }
    }
    var identity = user ? user.username : 'anon:' + normalizedEmail_(params.username || params.email || 'unknown').slice(0, 80);
    var rateIdentity = action === 'login' ? String(params.username || '').trim().toLowerCase() : identity;
    if (!rateOk_(action, rateIdentity)) {
      return { ok: false, response: { success: false, message: '요청이 너무 많아요. 잠시 후 다시 시도해주세요.', code: 'RATE' } };
    }
    if (user) {
      if (CONFIG.ADMIN_ONLY.indexOf(action) >= 0 && user.role !== 'admin') {
        return { ok: false, response: { success: false, message: '권한이 없어요.', code: 'FORBIDDEN' } };
      }
      if (CONFIG.MANAGER_UP.indexOf(action) >= 0 && user.role !== 'admin' && user.role !== 'manager') {
        return { ok: false, response: { success: false, message: '권한이 없어요.', code: 'FORBIDDEN' } };
      }
      if (CONFIG.ACTIVITY_MANAGERS.indexOf(action) >= 0 && user.role !== 'admin' && user.role !== 'teacher') {
        return { ok: false, response: { success: false, message: '탐활 관리 권한이 없어요.', code: 'FORBIDDEN' } };
      }
      if (CONFIG.FINE_ADMIN_ONLY.indexOf(action) >= 0 && CONFIG.FINE_ADMINS.indexOf(user.username) < 0) {
        return { ok: false, response: { success: false, message: '권한이 없어요.', code: 'FORBIDDEN' } };
      }
      if (user.muted && (action === 'createPostDirect' || action === 'addComment' || action === 'sendDm')) {
        return { ok: false, response: { success: false, message: '작성 금지 상태예요.', code: 'MUTED' } };
      }
      if (!isPublic) {
        ['actor', 'author', 'username'].forEach(function (key) { params[key] = user.username; });
      }
    }
    return { ok: true, user: user, action: action };
  }

  function response_(value) {
    return ContentService.createTextOutput(JSON.stringify(value))
      .setMimeType(ContentService.MimeType.JSON);
  }

  function wrap(e, handler) {
    var params = Object.assign({}, (e && e.parameter) || {});
    try {
      var result = guard_(params);
      if (!result.ok) return response_(result.response);
      var action = result.action;
      var user = result.user;
      if (action === 'requestEmailCode') return response_(requestEmailCode_(params, user));
      if (action === 'verifyEmailCode') return response_(verifyEmailCode_(params, user));
      if (action === 'getUploadSignature') return response_(uploadSignature_(params, user));
      if (action === 'logout') {
        bumpTokenVersion(user.username);
        return response_({ success: true });
      }
      if (action === 'signup') {
        var signupEmail = normalizedEmail_(params.email);
        if (!validEmail(signupEmail) || !consumeProofExists_(params.emailProof, signupEmail, 'signup', '')) {
          return response_({ success: false, message: '이메일 인증이 필요하거나 만료됐어요.' });
        }
      }
      if (action === 'updateEmail') {
        var updateEmail = normalizedEmail_(params.email);
        if (!validEmail(updateEmail) || !consumeProofExists_(params.emailProof, updateEmail, 'update', user.username)) {
          return response_({ success: false, message: '이메일 인증이 필요하거나 만료됐어요.' });
        }
      }

      var handlerEvent = { parameter: params, postData: e && e.postData };
      var output = handler(handlerEvent);
      var parsed;
      try {
        parsed = JSON.parse(output.getContent());
      } catch (parseError) {
        return output;
      }
      if (!parsed || !parsed.success) return response_(parsed);
      if (action === 'login') {
        parsed.token = issueToken(parsed.username);
      } else if (action === 'changePassword' && user) {
        bumpTokenVersion(user.username);
        parsed.token = issueToken(user.username);
      } else if (action === 'resetPassword' || action === 'kickUser') {
        bumpTokenVersion(String(params.targetUsername || '').trim());
      }
      return response_(parsed);
    } catch (error) {
      console.error('[AppsScript backend]', error && error.stack ? error.stack : error);
      var message = error && error.message ? String(error.message).slice(0, 240) : '서버 오류가 발생했어요.';
      return response_({ success: false, message: message, code: 'ERR' });
    }
  }

  function consumeProofExists_(proof, email, purpose, username) {
    var payload = unsign_(proof);
    if (!payload || payload.t !== 'e' || payload.e !== email || payload.p !== purpose) return false;
    if (purpose === 'update' && payload.u !== username) return false;
    if (purpose === 'signup' && payload.u !== '') return false;
    var state = CacheService.getScriptCache().get('email-proof:' + payload.id);
    if (!state) return false;
    try {
      state = JSON.parse(state);
      return state.email === payload.e && state.purpose === payload.p && state.username === payload.u;
    } catch (error) {
      return false;
    }
  }

  function setupSecurityOnce() {
    var props = properties_();
    var secret = props.getProperty('TOKEN_SECRET');
    if (!secret || secret.length < 32) {
      props.setProperty('TOKEN_SECRET', Utilities.getUuid() + Utilities.getUuid() + Utilities.getUuid());
    }
    return 'TOKEN_SECRET 준비 완료.';
  }

  return {
    CONFIG: CONFIG,
    wrap: wrap,
    issueToken: issueToken,
    verifyToken: verifyToken,
    bumpTokenVersion: bumpTokenVersion,
    validEmail: validEmail,
    consumeEmailProof: consumeEmailProof,
    setupSecurityOnce: setupSecurityOnce
  };
})();

function setupSecurityOnce() {
  return Security.setupSecurityOnce();
}
