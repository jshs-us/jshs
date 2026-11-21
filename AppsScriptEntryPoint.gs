const APP_DB_SPREADSHEET_ID = '1YKZiIhG2btyLzf49e10yl3HjpDhNi-wtZ2b1kSC9G4c';

const APP_TABLES = {
  members: {
    name: '회원',
    headers: ['이름', '권한', '작성금지', '이메일', '비밀번호솔트', '비밀번호해시', '가입일', '최초관리자']
  },
  posts: {
    name: '앱_게시글',
    headers: ['id', 'title', 'content', 'author', 'createdAt', 'fileUrl', 'fileName', 'likes', 'views', 'deleted']
  },
  comments: {
    name: '앱_댓글',
    headers: ['id', 'postId', 'author', 'content', 'createdAt', 'deleted']
  },
  likes: {
    name: '앱_좋아요',
    headers: ['postId', 'username', 'createdAt']
  },
  fines: {
    name: '앱_벌금',
    headers: ['id', 'student', 'amount', 'reason', 'createdBy', 'createdAt', 'status', 'proofUrl', 'updatedAt', 'updatedBy']
  },
  devices: {
    name: '앱_기기토큰',
    headers: ['username', 'token', 'platform', 'createdAt', 'updatedAt']
  },
  eggs: {
    name: '앱_이스터에그',
    headers: ['username', 'eggId', 'name', 'score', 'found', 'updatedAt']
  }
};

const PASSWORD_ITERATIONS = 60000;
const PASSWORD_MIN_LENGTH = 8;
const MAX_POST_TITLE = 120;
const MAX_POST_CONTENT = 12000;
const MAX_COMMENT_LENGTH = 2000;

function doPost(e) {
  if (typeof Security === 'undefined' || typeof Security.wrap !== 'function') {
    return jsonResponse_('Security.gs 보안 모듈을 불러오지 못했어요.');
  }
  return Security.wrap(e, doPost_original);
}

function doPost_original(e) {
  const p = (e && e.parameter) || {};
  const action = String(p.action || '');
  const handlers = {
    login: actionLogin_,
    signup: actionSignup_,
    updateEmail: actionUpdateEmail_,
    changePassword: actionChangePassword_,
    getMyInfo: actionGetMyInfo_,
    listPosts: actionListPosts_,
    getPost: actionGetPost_,
    createPostDirect: actionCreatePost_,
    adminDeletePost: actionDeletePost_,
    likePost: actionLikePost_,
    listComments: actionListComments_,
    addComment: actionAddComment_,
    deleteComment: actionDeleteComment_,
    listUsers: actionListUsers_,
    setRole: actionSetRole_,
    setMuted: actionSetMuted_,
    resetPassword: actionResetPassword_,
    kickUser: actionKickUser_,
    fineListMine: actionFineListMine_,
    fineListAll: actionFineListAll_,
    fineCreate: actionFineCreate_,
    fineSubmitProof: actionFineSubmitProof_,
    fineUpdateStatus: actionFineUpdateStatus_,
    registerDeviceToken: actionRegisterDeviceToken_,
    eggSubmitScore: actionEggSubmitScore_,
    eggMyProgress: actionEggMyProgress_,
    eggLeaderboard: actionEggLeaderboard_
  };
  if (!handlers[action]) return jsonResponse_('지원하지 않는 요청이에요.', 'ACTION');
  return jsonResponse_(handlers[action](p));
}

function jsonResponse_(value, code) {
  const result = value && typeof value === 'object'
    ? value
    : { success: false, message: String(value || '요청을 처리하지 못했어요.'), code: code || 'SERVER' };
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function setupBackend() {
  const ss = database_();
  Object.keys(APP_TABLES).forEach(function (key) {
    table_(key);
  });
  return '초기화 완료: ' + ss.getName();
}

function authorizeBackend() {
  database_().getName();
  const remaining = MailApp.getRemainingDailyQuota();
  return '스프레드시트 및 이메일 권한 확인 완료. 오늘 발송 가능 메일 수: ' + remaining;
}

function bootstrapFounder() {
  const username = String(PropertiesService.getScriptProperties().getProperty('BOOTSTRAP_ADMIN_USERNAME') || '').trim();
  if (!username) throw new Error('프로젝트 설정 > 스크립트 속성에 BOOTSTRAP_ADMIN_USERNAME을 먼저 설정하세요.');
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = table_('members');
    const rows = tableRows_('members');
    if (rows.some(function (row) { return truthy_(row['최초관리자']); })) {
      throw new Error('최초 관리자가 이미 지정되어 있어요.');
    }
    const member = rows.find(function (row) { return sameName_(row['이름'], username); });
    if (!member) throw new Error('먼저 해당 계정으로 회원가입한 뒤 다시 실행하세요.');
    const rowIndex = member.__row;
    setByHeader_(sheet, rowIndex, '권한', 'admin');
    setByHeader_(sheet, rowIndex, '최초관리자', true);
    PropertiesService.getScriptProperties().deleteProperty('BOOTSTRAP_ADMIN_USERNAME');
    return '최초 관리자 지정 완료: ' + username;
  } finally {
    lock.releaseLock();
  }
}

function resetMemberPasswordFromEditor() {
  const props = PropertiesService.getScriptProperties();
  const username = String(props.getProperty('RESET_MEMBER_USERNAME') || '').trim();
  const password = String(props.getProperty('RESET_MEMBER_TEMP_PASSWORD') || '');
  if (!username || password.length < PASSWORD_MIN_LENGTH || password.length > 128) {
    throw new Error('RESET_MEMBER_USERNAME 및 8자 이상 RESET_MEMBER_TEMP_PASSWORD 설정이 필요해요.');
  }
  const salt = Utilities.getUuid() + Utilities.getUuid();
  const hash = passwordHash_(password, salt);
  withWriteLock_(function () {
    const member = findMember_(username);
    if (!member) throw new Error('회원을 찾을 수 없어요: ' + username);
    setByHeader_(table_('members'), member.__row, '비밀번호솔트', salt);
    setByHeader_(table_('members'), member.__row, '비밀번호해시', hash);
  });
  Security.bumpTokenVersion(username);
  props.deleteProperty('RESET_MEMBER_USERNAME');
  props.deleteProperty('RESET_MEMBER_TEMP_PASSWORD');
  return '임시 비밀번호를 설정하고 기존 로그인 토큰을 만료시켰어요.';
}

function database_() {
  return SpreadsheetApp.openById(APP_DB_SPREADSHEET_ID);
}

function table_(key) {
  const spec = APP_TABLES[key];
  if (!spec) throw new Error('알 수 없는 데이터 테이블입니다: ' + key);
  const ss = database_();
  let sheet = ss.getSheetByName(spec.name);
  if (!sheet) {
    sheet = ss.insertSheet(spec.name);
    writeRow_(sheet, 1, spec.headers);
    return sheet;
  }
  if (sheet.getLastRow() === 0 || sheet.getLastColumn() === 0) {
    writeRow_(sheet, 1, spec.headers);
    return sheet;
  }
  const current = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0]
    .map(function (value) { return String(value).trim(); });
  if (key === 'members') {
    spec.headers.forEach(function (header) {
      if (current.indexOf(header) < 0) {
        const col = sheet.getLastColumn() + 1;
        sheet.getRange(1, col).setNumberFormat('@').setValue(header);
        current.push(header);
      }
    });
  } else {
    const missing = spec.headers.filter(function (header) { return current.indexOf(header) < 0; });
    if (missing.length) {
      throw new Error('"' + spec.name + '" 탭의 1행에 필요한 열이 없습니다: ' + missing.join(', ') +
        '. 기존 데이터를 확인한 뒤 열 제목을 맞춰주세요.');
    }
  }
  return sheet;
}

function tableRows_(key) {
  const sheet = table_(key);
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) return [];
  const headers = sheet.getRange(1, 1, 1, lastCol).getDisplayValues()[0].map(String);
  return sheet.getRange(2, 1, lastRow - 1, lastCol).getValues().map(function (cells, index) {
    const item = { __row: index + 2 };
    headers.forEach(function (header, col) { item[header] = cells[col]; });
    return item;
  }).filter(function (item) {
    return Object.keys(item).some(function (key) { return key !== '__row' && item[key] !== '' && item[key] != null; });
  });
}

function actionUpdateEmail_(p) {
  const username = String(p.username || '').trim();
  const email = String(p.email || '').trim().toLowerCase();
  if (!Security.validEmail(email)) throw new Error('학교 이메일 주소를 확인해주세요.');
  return withWriteLock_(function () {
    if (emailInUse_(email, username)) throw new Error('이미 다른 계정에서 쓰는 이메일이에요.');
    if (!Security.consumeEmailProof(p.emailProof, email, 'update', username)) {
      throw new Error('이메일 인증이 만료됐어요. 다시 인증해주세요.');
    }
    if (!setMemberEmail_(username, email)) throw new Error('회원 정보를 찾을 수 없어요.');
    return { success: true, email: email, message: '이메일을 변경했어요.' };
  });
}

function writeRow_(sheet, rowIndex, values) {
  const range = sheet.getRange(rowIndex, 1, 1, values.length);
  range.setNumberFormat('@');
  range.setValues([values]);
}

function appendRow_(sheet, values) {
  writeRow_(sheet, sheet.getLastRow() + 1, values);
}

function setByHeader_(sheet, rowIndex, header, value) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
  const col = headers.indexOf(header);
  if (col < 0) throw new Error('필요한 열을 찾을 수 없어요: ' + header);
  const cell = sheet.getRange(rowIndex, col + 1);
  cell.setNumberFormat('@');
  cell.setValue(value);
}

function findMember_(username) {
  const target = String(username || '').trim().toLowerCase();
  return tableRows_('members').find(function (row) {
    return String(row['이름'] || '').trim().toLowerCase() === target;
  }) || null;
}

function findMemberByEmail_(email) {
  const target = String(email || '').trim().toLowerCase();
  return tableRows_('members').find(function (row) {
    return String(row['이메일'] || '').trim().toLowerCase() === target;
  }) || null;
}

function memberForSecurity_(username) {
  const row = findMember_(username);
  if (!row) return null;
  return {
    username: String(row['이름'] || '').trim(),
    role: normalizeRole_(row['권한']),
    muted: truthy_(row['작성금지']),
    email: String(row['이메일'] || '').trim(),
    isFounder: truthy_(row['최초관리자']),
    salt: String(row['비밀번호솔트'] || ''),
    passwordHash: String(row['비밀번호해시'] || ''),
    row: row.__row
  };
}

function emailInUse_(email, exceptUsername) {
  const target = String(email || '').trim().toLowerCase();
  const except = String(exceptUsername || '').trim().toLowerCase();
  return tableRows_('members').some(function (row) {
    return String(row['이메일'] || '').trim().toLowerCase() === target &&
      String(row['이름'] || '').trim().toLowerCase() !== except;
  });
}

function setMemberEmail_(username, email) {
  const member = findMember_(username);
  if (!member) return false;
  setByHeader_(table_('members'), member.__row, '이메일', email);
  return true;
}

function normalizeRole_(value) {
  const role = String(value == null ? '' : value).trim().toLowerCase();
  if (role === 'admin' || role === '관리자') return 'admin';
  if (role === 'manager' || role === '매니저') return 'manager';
  return 'user';
}

function truthy_(value) {
  return value === true || ['true', 'y', 'yes', '1', 'o', '금지', '작성금지']
    .indexOf(String(value == null ? '' : value).trim().toLowerCase()) >= 0;
}

function sameName_(a, b) {
  return String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();
}

function text_(value, maxLength) {
  const result = String(value == null ? '' : value).trim();
  if (result.length > maxLength) throw new Error('입력 길이가 너무 길어요.');
  return result;
}

function requiredText_(value, label, maxLength) {
  const result = text_(value, maxLength);
  if (!result) throw new Error(label + '을(를) 입력해주세요.');
  return result;
}

function nowIso_() {
  return new Date().toISOString();
}

function newId_() {
  return Utilities.getUuid();
}

function withWriteLock_(callback) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    return callback();
  } finally {
    lock.releaseLock();
  }
}

function passwordHash_(password, salt) {
  const key = Utilities.newBlob(String(password)).getBytes();
  const saltBytes = Utilities.newBlob(String(salt)).getBytes().concat([0, 0, 0, 1]);
  let u = Utilities.computeHmacSha256Signature(saltBytes, key);
  const result = u.slice();
  for (let i = 1; i < PASSWORD_ITERATIONS; i++) {
    u = Utilities.computeHmacSha256Signature(u, key);
    for (let j = 0; j < result.length; j++) result[j] ^= u[j];
  }
  return Utilities.base64Encode(result);
}

function passwordMatches_(password, salt, expected) {
  if (!salt || !expected) return false;
  const actual = passwordHash_(password, salt);
  if (actual.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < actual.length; i++) mismatch |= actual.charCodeAt(i) ^ expected.charCodeAt(i);
  return mismatch === 0;
}

function randomPassword_() {
  return Utilities.getUuid().replace(/-/g, '').slice(0, 16);
}

function actionSignup_(p) {
  const username = requiredText_(p.username, '이름', 30);
  if (!/^[가-힣A-Za-z0-9._ -]{2,30}$/.test(username)) throw new Error('이름은 한글, 영문, 숫자, 공백, ., _, -만 사용할 수 있어요.');
  const password = String(p.password || '');
  if (password.length < PASSWORD_MIN_LENGTH || password.length > 128) {
    throw new Error('비밀번호는 8자 이상 128자 이하로 입력해주세요.');
  }
  const email = String(p.email || '').trim().toLowerCase();
  if (!Security.validEmail(email)) throw new Error('학교 이메일 주소를 확인해주세요.');
  const salt = Utilities.getUuid() + Utilities.getUuid();
  const hash = passwordHash_(password, salt);
  return withWriteLock_(function () {
    if (findMember_(username)) throw new Error('이미 사용 중인 이름이에요.');
    if (emailInUse_(email, '')) throw new Error('이미 다른 계정에서 쓰는 이메일이에요.');
    if (!Security.consumeEmailProof(p.emailProof, email, 'signup', '')) {
      throw new Error('이메일 인증이 만료됐어요. 다시 인증해주세요.');
    }
    const sheet = table_('members');
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
    const values = {
      '이름': username, '권한': 'user', '작성금지': false, '이메일': email,
      '비밀번호솔트': salt, '비밀번호해시': hash, '가입일': nowIso_(), '최초관리자': false
    };
    appendRow_(sheet, headers.map(function (header) { return values[header] == null ? '' : values[header]; }));
    return { success: true, message: '가입되었습니다. 로그인해주세요.' };
  });
}

function actionLogin_(p) {
  const username = requiredText_(p.username, '이름', 30);
  const password = String(p.password || '');
  if (!password || password.length > 128) throw new Error('이름 또는 비밀번호를 확인해주세요.');
  const member = memberForSecurity_(username);
  if (!member) {
    passwordHash_(password, 'invalid-user-salt');
    throw new Error('이름 또는 비밀번호를 확인해주세요.');
  }
  if (!passwordMatches_(password, member.salt, member.passwordHash)) {
    throw new Error('이름 또는 비밀번호를 확인해주세요.');
  }
  return {
    success: true,
    username: member.username,
    role: member.role,
    muted: member.muted
  };
}

function actionChangePassword_(p) {
  const username = String(p.username || '').trim();
  const oldPassword = String(p.oldPassword || '');
  const newPassword = String(p.newPassword || '');
  if (newPassword.length < PASSWORD_MIN_LENGTH || newPassword.length > 128) {
    throw new Error('새 비밀번호는 8자 이상 128자 이하로 입력해주세요.');
  }
  const member = memberForSecurity_(username);
  if (!member || !passwordMatches_(oldPassword, member.salt, member.passwordHash)) {
    throw new Error('현재 비밀번호가 올바르지 않아요.');
  }
  const salt = Utilities.getUuid() + Utilities.getUuid();
  const hash = passwordHash_(newPassword, salt);
  withWriteLock_(function () {
    const latest = findMember_(username);
    if (!latest || !passwordMatches_(oldPassword, latest['비밀번호솔트'], latest['비밀번호해시'])) {
      throw new Error('현재 비밀번호가 변경되었어요. 다시 로그인해주세요.');
    }
    const sheet = table_('members');
    setByHeader_(sheet, latest.__row, '비밀번호솔트', salt);
    setByHeader_(sheet, latest.__row, '비밀번호해시', hash);
  });
  return { success: true, message: '비밀번호를 변경했어요.' };
}

function actionGetMyInfo_(p) {
  const member = findMember_(p.username);
  if (!member) throw new Error('회원 정보를 찾을 수 없어요.');
  const posts = tableRows_('posts').filter(function (row) {
    return !truthy_(row.deleted) && sameName_(row.author, member['이름']);
  }).length;
  const comments = tableRows_('comments').filter(function (row) {
    return !truthy_(row.deleted) && sameName_(row.author, member['이름']);
  }).length;
  return {
    success: true,
    username: String(member['이름']),
    role: normalizeRole_(member['권한']),
    muted: truthy_(member['작성금지']),
    email: String(member['이메일'] || ''),
    postCount: posts,
    commentCount: comments
  };
}

function postObject_(row) {
  const postId = String(row.id);
  return {
    id: postId,
    title: String(row.title || ''),
    content: String(row.content || ''),
    author: String(row.author || ''),
    createdAt: row.createdAt,
    fileUrl: String(row.fileUrl || ''),
    fileName: String(row.fileName || ''),
    likes: Number(row.likes || 0),
    views: Number(row.views || 0)
  };
}

function actionListPosts_() {
  const posts = tableRows_('posts').filter(function (row) { return !truthy_(row.deleted); });
  posts.sort(function (a, b) { return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); });
  return { success: true, posts: posts.map(postObject_) };
}

function actionGetPost_(p) {
  const id = requiredText_(p.id, '게시글', 80);
  return withWriteLock_(function () {
    const sheet = table_('posts');
    const row = tableRows_('posts').find(function (item) { return String(item.id) === id && !truthy_(item.deleted); });
    if (!row) throw new Error('게시글을 찾을 수 없어요.');
    const views = Number(row.views || 0) + 1;
    setByHeader_(sheet, row.__row, 'views', views);
    row.views = views;
    return { success: true, post: postObject_(row) };
  });
}

function cloudinaryUrl_(value, folder, resourceType) {
  const url = String(value || '');
  const properties = PropertiesService.getScriptProperties();
  const purpose = folder.indexOf('gwakuri-fine/') === 0 ? 'FINE' : 'BOARD';
  const cloud = String(properties.getProperty('CLOUDINARY_' + purpose + '_CLOUD_NAME') ||
    properties.getProperty('CLOUDINARY_CLOUD_NAME') || '');
  if (!cloud) return false;
  const escapedCloud = cloud.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const types = resourceType === 'image' ? 'image' : '(?:image|video|raw)';
  const pattern = new RegExp('^https://res\\.cloudinary\\.com/' + escapedCloud +
    '/' + types + '/upload/(?:v[0-9]+/)?' + folder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
    '/[A-Za-z0-9_./%\\-]+(?:\\.[A-Za-z0-9]+)?(?:\\?[^#]*)?$');
  return pattern.test(url);
}

function userUploadFolder_(purpose, username) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(username));
  const digest = bytes.map(function (byte) {
    return ('0' + (byte < 0 ? byte + 256 : byte).toString(16)).slice(-2);
  }).join('');
  return 'gwakuri-' + purpose + '/' + digest.slice(0, 24);
}

function fineUploadFolder_(username, fineId) {
  return userUploadFolder_('fine', username) + '/' + String(fineId);
}

function canUploadFineProof_(username, fineId) {
  const fine = tableRows_('fines').find(function (row) { return String(row.id) === String(fineId); });
  return !!fine && sameName_(fine.student, username) && String(fine.status) === '미납';
}

function actionCreatePost_(p) {
  const title = requiredText_(p.title, '제목', MAX_POST_TITLE);
  const content = requiredText_(p.content, '내용', MAX_POST_CONTENT);
  const fileUrl = text_(p.fileUrlDirect, 1000);
  const fileName = text_(p.fileNameDirect, 255);
  if (fileUrl && !cloudinaryUrl_(fileUrl, userUploadFolder_('board', p.author), 'any')) {
    throw new Error('허용되지 않은 첨부파일 주소예요.');
  }
  const post = {
    id: newId_(), title: title, content: content, author: requiredText_(p.author, '작성자', 30),
    createdAt: nowIso_(), fileUrl: fileUrl, fileName: fileName, likes: 0, views: 0, deleted: false
  };
  withWriteLock_(function () {
    const sheet = table_('posts');
    appendRow_(sheet, APP_TABLES.posts.headers.map(function (header) { return post[header]; }));
  });
  return { success: true, post: postObject_(post) };
}

function actionDeletePost_(p) {
  const id = requiredText_(p.id, '게시글', 80);
  return withWriteLock_(function () {
    const sheet = table_('posts');
    const row = tableRows_('posts').find(function (item) { return String(item.id) === id && !truthy_(item.deleted); });
    if (!row) throw new Error('게시글을 찾을 수 없어요.');
    setByHeader_(sheet, row.__row, 'deleted', true);
    return { success: true };
  });
}

function actionLikePost_(p) {
  const id = requiredText_(p.id, '게시글', 80);
  const username = requiredText_(p.username, '사용자', 30);
  return withWriteLock_(function () {
    const post = tableRows_('posts').find(function (row) { return String(row.id) === id && !truthy_(row.deleted); });
    if (!post) throw new Error('게시글을 찾을 수 없어요.');
    const likesSheet = table_('likes');
    const likes = tableRows_('likes');
    if (!likes.some(function (row) { return String(row.postId) === id && sameName_(row.username, username); })) {
      appendRow_(likesSheet, [id, username, nowIso_()]);
      const postSheet = table_('posts');
      setByHeader_(postSheet, post.__row, 'likes', Number(post.likes || 0) + 1);
      post.likes = Number(post.likes || 0) + 1;
    }
    return { success: true, likes: Number(post.likes || 0) };
  });
}

function actionListComments_(p) {
  const postId = requiredText_(p.postId, '게시글', 80);
  const postExists = tableRows_('posts').some(function (row) {
    return String(row.id) === postId && !truthy_(row.deleted);
  });
  if (!postExists) throw new Error('게시글을 찾을 수 없어요.');
  const comments = tableRows_('comments').filter(function (row) {
    return String(row.postId) === postId && !truthy_(row.deleted);
  }).sort(function (a, b) { return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(); });
  return {
    success: true,
    comments: comments.map(function (row) {
      return { id: String(row.id), postId: String(row.postId), author: String(row.author), content: String(row.content), createdAt: row.createdAt };
    })
  };
}

function actionAddComment_(p) {
  const postId = requiredText_(p.postId, '게시글', 80);
  const content = requiredText_(p.content, '댓글', MAX_COMMENT_LENGTH);
  return withWriteLock_(function () {
    const postExists = tableRows_('posts').some(function (row) {
      return String(row.id) === postId && !truthy_(row.deleted);
    });
    if (!postExists) throw new Error('게시글을 찾을 수 없어요.');
    const comment = {
      id: newId_(), postId: postId, author: requiredText_(p.author, '작성자', 30),
      content: content, createdAt: nowIso_(), deleted: false
    };
    appendRow_(table_('comments'), APP_TABLES.comments.headers.map(function (header) { return comment[header]; }));
    return { success: true, comment: comment };
  });
}

function actionDeleteComment_(p) {
  const id = requiredText_(p.id, '댓글', 80);
  return withWriteLock_(function () {
    const sheet = table_('comments');
    const comment = tableRows_('comments').find(function (row) { return String(row.id) === id && !truthy_(row.deleted); });
    if (!comment) throw new Error('댓글을 찾을 수 없어요.');
    const actor = memberForSecurity_(p.author);
    const role = actor ? actor.role : 'user';
    if (!sameName_(comment.author, p.author) && role !== 'admin' && role !== 'manager') {
      throw new Error('이 댓글을 삭제할 권한이 없어요.');
    }
    setByHeader_(sheet, comment.__row, 'deleted', true);
    return { success: true };
  });
}

function actionListUsers_() {
  return {
    success: true,
    users: tableRows_('members').map(function (row) {
      return {
        username: String(row['이름'] || ''),
        role: normalizeRole_(row['권한']),
        muted: truthy_(row['작성금지']),
        createdAt: row['가입일'] || '',
        isFounder: truthy_(row['최초관리자'])
      };
    }).sort(function (a, b) { return a.username.localeCompare(b.username); })
  };
}

function ensureNotProtectedMember_(member, actor) {
  if (!member) throw new Error('회원을 찾을 수 없어요.');
  if (truthy_(member['최초관리자'])) throw new Error('최초 관리자는 이 기능으로 변경할 수 없어요.');
  if (sameName_(member['이름'], actor)) throw new Error('현재 로그인한 계정에는 이 작업을 할 수 없어요.');
}

function actionSetRole_(p) {
  const target = requiredText_(p.targetUsername, '대상 회원', 30);
  const role = String(p.newRole || '').trim();
  if (['user', 'manager', 'admin'].indexOf(role) < 0) throw new Error('올바르지 않은 권한이에요.');
  return withWriteLock_(function () {
    const member = findMember_(target);
    ensureNotProtectedMember_(member, p.actor);
    if (normalizeRole_(member['권한']) === 'admin' && role !== 'admin' &&
      tableRows_('members').filter(function (row) { return normalizeRole_(row['권한']) === 'admin'; }).length <= 1) {
      throw new Error('마지막 관리자의 권한은 해제할 수 없어요.');
    }
    setByHeader_(table_('members'), member.__row, '권한', role);
    return { success: true };
  });
}

function actionSetMuted_(p) {
  const target = requiredText_(p.targetUsername, '대상 회원', 30);
  return withWriteLock_(function () {
    const member = findMember_(target);
    ensureNotProtectedMember_(member, p.actor);
    setByHeader_(table_('members'), member.__row, '작성금지', truthy_(p.muted));
    return { success: true };
  });
}

function actionResetPassword_(p) {
  const target = requiredText_(p.targetUsername, '대상 회원', 30);
  const temporaryPassword = randomPassword_();
  const salt = Utilities.getUuid() + Utilities.getUuid();
  const hash = passwordHash_(temporaryPassword, salt);
  withWriteLock_(function () {
    const member = findMember_(target);
    ensureNotProtectedMember_(member, p.actor);
    setByHeader_(table_('members'), member.__row, '비밀번호솔트', salt);
    setByHeader_(table_('members'), member.__row, '비밀번호해시', hash);
  });
  return { success: true, message: '임시 비밀번호: ' + temporaryPassword + ' (로그인 후 즉시 변경해주세요.)' };
}

function actionKickUser_(p) {
  const target = requiredText_(p.targetUsername, '대상 회원', 30);
  return withWriteLock_(function () {
    const member = findMember_(target);
    ensureNotProtectedMember_(member, p.actor);
    if (normalizeRole_(member['권한']) === 'admin' &&
      tableRows_('members').filter(function (row) { return normalizeRole_(row['권한']) === 'admin'; }).length <= 1) {
      throw new Error('마지막 관리자는 탈퇴 처리할 수 없어요.');
    }
    tableRows_('devices').filter(function (row) {
      return sameName_(row.username, member['이름']);
    }).sort(function (a, b) { return b.__row - a.__row; }).forEach(function (row) {
      table_('devices').deleteRow(row.__row);
    });
    table_('members').deleteRow(member.__row);
    return { success: true };
  });
}

function fineObject_(row) {
  return {
    id: String(row.id),
    student: String(row.student || ''),
    amount: Number(row.amount || 0),
    reason: String(row.reason || ''),
    createdBy: String(row.createdBy || ''),
    createdAt: row.createdAt,
    status: String(row.status || '미납'),
    proofUrl: String(row.proofUrl || '')
  };
}

function actionFineListMine_(p) {
  const username = String(p.username || '');
  const fines = tableRows_('fines').filter(function (row) { return sameName_(row.student, username); })
    .sort(function (a, b) { return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); });
  return { success: true, fines: fines.map(fineObject_) };
}

function actionFineListAll_() {
  const fines = tableRows_('fines').sort(function (a, b) {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  return { success: true, fines: fines.map(fineObject_) };
}

function actionFineCreate_(p) {
  const student = requiredText_(p.student, '학생 이름', 30);
  const reason = requiredText_(p.reason, '사유', 500);
  const amount = Number(p.amount);
  if (!isFinite(amount) || amount <= 0 || amount > 1000000 ||
    Math.abs(amount * 100 - Math.round(amount * 100)) > 0.000001) {
    throw new Error('금액은 0보다 크고 소수점 둘째 자리까지 입력해주세요.');
  }
  if (!findMember_(student)) throw new Error('등록된 회원을 찾을 수 없어요.');
  const fine = {
    id: newId_(), student: student, amount: amount, reason: reason,
    createdBy: requiredText_(p.actor, '부과자', 30), createdAt: nowIso_(),
    status: '미납', proofUrl: '', updatedAt: nowIso_(), updatedBy: requiredText_(p.actor, '부과자', 30)
  };
  withWriteLock_(function () {
    appendRow_(table_('fines'), APP_TABLES.fines.headers.map(function (header) { return fine[header]; }));
  });
  return { success: true, fine: fineObject_(fine) };
}

function actionFineSubmitProof_(p) {
  const id = requiredText_(p.id, '벌금', 80);
  const url = requiredText_(p.proofUrl, '인증사진', 1000);
  if (!cloudinaryUrl_(url, fineUploadFolder_(p.actor, id), 'image')) {
    throw new Error('본인 벌금 건에 연결된 인증사진 주소만 사용할 수 있어요.');
  }
  return withWriteLock_(function () {
    const sheet = table_('fines');
    const fine = tableRows_('fines').find(function (row) { return String(row.id) === id; });
    if (!fine) throw new Error('벌금 내역을 찾을 수 없어요.');
    if (!sameName_(fine.student, p.actor)) throw new Error('본인에게 부과된 벌금만 제출할 수 있어요.');
    if (String(fine.status) !== '미납') throw new Error('미납 상태인 벌금만 인증사진을 제출할 수 있어요.');
    setByHeader_(sheet, fine.__row, 'proofUrl', url);
    setByHeader_(sheet, fine.__row, 'status', '확인대기');
    setByHeader_(sheet, fine.__row, 'updatedAt', nowIso_());
    setByHeader_(sheet, fine.__row, 'updatedBy', p.actor);
    return { success: true };
  });
}

function actionFineUpdateStatus_(p) {
  const id = requiredText_(p.id, '벌금', 80);
  const status = String(p.status || '');
  if (['미납', '완납'].indexOf(status) < 0) throw new Error('올바르지 않은 처리 상태예요.');
  return withWriteLock_(function () {
    const sheet = table_('fines');
    const fine = tableRows_('fines').find(function (row) { return String(row.id) === id; });
    if (!fine) throw new Error('벌금 내역을 찾을 수 없어요.');
    setByHeader_(sheet, fine.__row, 'status', status);
    setByHeader_(sheet, fine.__row, 'updatedAt', nowIso_());
    setByHeader_(sheet, fine.__row, 'updatedBy', p.actor);
    return { success: true };
  });
}

function actionRegisterDeviceToken_(p) {
  const token = requiredText_(p.token, '기기 토큰', 4096);
  if (/[\u0000-\u001F\u007F]/.test(token)) throw new Error('기기 토큰 형식이 올바르지 않아요.');
  const platform = String(p.platform || '').toLowerCase();
  if (['android', 'ios'].indexOf(platform) < 0) throw new Error('지원하지 않는 기기예요.');
  return withWriteLock_(function () {
    const sheet = table_('devices');
    const devices = tableRows_('devices');
    const existing = devices.find(function (row) { return String(row.token) === token; });
    if (existing) {
      setByHeader_(sheet, existing.__row, 'username', p.actor);
      setByHeader_(sheet, existing.__row, 'platform', platform);
      setByHeader_(sheet, existing.__row, 'updatedAt', nowIso_());
    } else {
      appendRow_(sheet, [p.actor, token, platform, nowIso_(), nowIso_()]);
    }
    return { success: true };
  });
}

const EGG_NAMES = { calendar: '학사일정', meal: '급식' };

function actionEggSubmitScore_(p) {
  const eggId = String(p.eggId || '');
  const rawScore = Number(p.score);
  const maxScore = eggId === 'calendar' ? 8 : 3600;
  if (!EGG_NAMES[eggId] || !isFinite(rawScore) || rawScore < 0 || rawScore > maxScore) {
    throw new Error('점수 정보가 올바르지 않아요.');
  }
  const score = Math.floor(rawScore);
  return withWriteLock_(function () {
    const sheet = table_('eggs');
    const rows = tableRows_('eggs');
    const existing = rows.find(function (row) { return sameName_(row.username, p.username) && String(row.eggId) === eggId; });
    const best = Math.max(Number(existing && existing.score || 0), score);
    const values = [p.username, eggId, EGG_NAMES[eggId], best, best > 0, nowIso_()];
    if (existing) writeRow_(sheet, existing.__row, values);
    else appendRow_(sheet, values);
    return { success: true, score: best };
  });
}

function actionEggMyProgress_(p) {
  const rows = tableRows_('eggs').filter(function (row) { return sameName_(row.username, p.username); });
  return {
    success: true,
    eggs: Object.keys(EGG_NAMES).map(function (eggId) {
      const row = rows.find(function (item) { return String(item.eggId) === eggId; });
      return {
        id: eggId,
        name: EGG_NAMES[eggId],
        found: !!row && truthy_(row.found),
        score: Number(row && row.score || 0)
      };
    })
  };
}

function actionEggLeaderboard_(p) {
  const limit = Math.max(1, Math.min(20, Math.floor(Number(p.limit) || 5)));
  const totals = {};
  tableRows_('eggs').forEach(function (row) {
    const username = String(row.username || '');
    if (!username) return;
    totals[username] = (totals[username] || 0) + Number(row.score || 0);
  });
  const list = Object.keys(totals).map(function (username) {
    return { username: username, best: totals[username] };
  }).sort(function (a, b) { return b.best - a.best || a.username.localeCompare(b.username); }).slice(0, limit);
  return { success: true, list: list };
}
