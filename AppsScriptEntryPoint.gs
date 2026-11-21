const APP_DB_SPREADSHEET_ID = '1YKZiIhG2btyLzf49e10yl3HjpDhNi-wtZ2b1kSC9G4c';

const APP_TABLES = {
  members: {
    name: '회원',
    headers: [
      'username', 'createdAt', 'role', 'muted', 'email', 'passwordSalt', 'passwordHash', 'isFounder',
      'lastLoginAt', 'inactivityBaselineAt', 'inactivity3MonthNoticeAt', 'inactivity5MonthNoticeAt'
    ],
    appendMissing: true
  },
  posts: {
    name: '게시글',
    headers: ['id', 'title', 'content', 'author', 'createdAt', 'likes', 'views', 'fileUrl', 'fileName', 'deleted'],
    appendMissing: true
  },
  comments: {
    name: '댓글',
    headers: ['id', 'postId', 'author', 'content', 'createdAt', 'deleted'],
    appendMissing: true
  },
  likes: {
    name: '좋아요',
    headers: ['postId', 'username', 'createdAt']
  },
  fines: {
    name: '벌금',
    headers: ['ID', '학생', '사유', '금액', '상태', '부과자', '부과일시', '인증사진URL', '처리일시'],
    columns: {
      id: 'ID', student: '학생', reason: '사유', amount: '금액', status: '상태',
      createdBy: '부과자', createdAt: '부과일시', proofUrl: '인증사진URL', updatedAt: '처리일시'
    }
  },
  devices: {
    name: '기기토큰',
    headers: ['username', 'token', 'platform', 'updatedAt']
  },
  eggs: {
    name: '이스터에그기록',
    headers: ['username', 'eggId', 'best', 'updatedAt'],
    columns: { username: 'username', eggId: 'eggId', score: 'best', updatedAt: 'updatedAt' }
  }
};

const PASSWORD_ITERATIONS = 60000;
const PASSWORD_HASH_PREFIX = 'v2$';
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
  const migrated = withWriteLock_(function () {
    return {
      members: migrateLegacyMemberFields_(),
      posts: migrateLegacyRows_('앱_게시글', 'posts', function (row) { return row; }, function (row) { return String(row.id || ''); }),
      comments: migrateLegacyRows_('앱_댓글', 'comments', function (row) { return row; }, function (row) { return String(row.id || ''); }),
      fines: migrateLegacyRows_('앱_벌금', 'fines', function (row) {
        return {
          id: row.id, student: row.student, reason: row.reason, amount: row.amount,
          status: row.status, createdBy: row.createdBy, createdAt: row.createdAt,
          proofUrl: row.proofUrl, updatedAt: row.updatedAt || row.createdAt
        };
      }, function (row) { return String(row.id || ''); }),
      devices: migrateLegacyRows_('앱_기기토큰', 'devices', function (row) {
        return { username: row.username, token: row.token, platform: row.platform, updatedAt: row.updatedAt };
      }, function (row) { return String(row.token || ''); }),
      eggs: migrateLegacyEggs_()
    };
  });
  return '초기화 및 기존 데이터 연결 완료: ' + ss.getName() +
    ' (회원 값 ' + migrated.members + '개, 게시글 ' + migrated.posts + ', 댓글 ' + migrated.comments + ', 벌금 ' + migrated.fines +
    ', 기기 토큰 ' + migrated.devices + ', 이스터에그 ' + migrated.eggs + '건 이관)';
}

function setupInactivityMaintenance() {
  table_('members');
  initializeInactivityBaseline_();
  const handler = 'runInactivityAccountMaintenance';
  const triggers = ScriptApp.getProjectTriggers().filter(function (trigger) {
    return trigger.getHandlerFunction() === handler;
  });
  if (triggers.length === 1) return '비활성 계정 점검 트리거가 이미 설정되어 있어요.';
  triggers.forEach(function (trigger) { ScriptApp.deleteTrigger(trigger); });
  ScriptApp.newTrigger(handler).timeBased().everyDays(1).atHour(3).create();
  return '비활성 계정 점검 트리거를 매일 오전 3시에 설정했어요.';
}

function initializeInactivityBaseline_() {
  const properties = PropertiesService.getScriptProperties();
  if (properties.getProperty('INACTIVITY_BASELINE_INITIALIZED')) return;
  withWriteLock_(function () {
    if (properties.getProperty('INACTIVITY_BASELINE_INITIALIZED')) return;
    const sheet = table_('members');
    const baseline = nowIso_();
    tableRows_('members').forEach(function (member) {
      if (!member.inactivityBaselineAt) setByHeader_(sheet, member.__row, 'inactivityBaselineAt', baseline);
    });
    properties.setProperty('INACTIVITY_BASELINE_INITIALIZED', baseline);
  });
}

function runInactivityAccountMaintenance() {
  const now = new Date();
  const summary = { sent3Month: 0, sent5Month: 0, deleted: 0, failedEmails: 0, protected: 0 };
  const members = tableRows_('members').sort(function (a, b) { return b.__row - a.__row; });
  members.forEach(function (member) {
    const outcome = withWriteLock_(function () {
      const current = findMember_(member.username);
      if (!current) return null;
      if (isInactivityDeletionProtected_(current)) {
        return { protected: true };
      }
      const lastLogin = parseInactivityDate_(current.lastLoginAt) ||
        parseInactivityDate_(current.inactivityBaselineAt) || parseInactivityDate_(current.createdAt);
      if (!lastLogin) {
        console.warn('[Inactivity maintenance] 로그인 기준일을 확인할 수 없어 건너뜀: ' + current.username);
        return null;
      }
      if (now.getTime() >= addCalendarMonths_(lastLogin, 6).getTime()) {
        deleteInactiveMember_(current);
        return { deleted: true };
      }
      const result = {};
      if (now.getTime() >= addCalendarMonths_(lastLogin, 3).getTime() && !current.inactivity3MonthNoticeAt) {
        if (sendInactivityNotice_(current.email, 3)) {
          setByHeader_(table_('members'), current.__row, 'inactivity3MonthNoticeAt', nowIso_());
          result.sent3Month = true;
        } else {
          result.failedEmails = (result.failedEmails || 0) + 1;
        }
      }
      if (now.getTime() >= addCalendarMonths_(lastLogin, 5).getTime() && !current.inactivity5MonthNoticeAt) {
        if (sendInactivityNotice_(current.email, 5)) {
          setByHeader_(table_('members'), current.__row, 'inactivity5MonthNoticeAt', nowIso_());
          result.sent5Month = true;
        } else {
          result.failedEmails = (result.failedEmails || 0) + 1;
        }
      }
      return result;
    });
    if (!outcome) return;
    if (outcome.protected) summary.protected++;
    if (outcome.deleted) summary.deleted++;
    if (outcome.sent3Month) summary.sent3Month++;
    if (outcome.sent5Month) summary.sent5Month++;
    summary.failedEmails += outcome.failedEmails || 0;
  });
  const result = '비활성 계정 점검 완료: 3개월 안내 ' + summary.sent3Month +
    '건, 삭제 예정 안내 ' + summary.sent5Month + '건, 계정 삭제 ' + summary.deleted +
    '건, 이메일 실패 ' + summary.failedEmails + '건, 보호 계정 ' + summary.protected + '건';
  if (summary.failedEmails) console.error('[Inactivity maintenance] ' + result);
  return result;
}

function isInactivityDeletionProtected_(member) {
  if (truthy_(member.isFounder)) return true;
  if (normalizeRole_(member.role) !== 'admin') return false;
  return tableRows_('members').filter(function (row) {
    return normalizeRole_(row.role) === 'admin';
  }).length <= 1;
}

function deleteInactiveMember_(member) {
  tableRows_('devices').filter(function (row) {
    return sameName_(row.username, member.username);
  }).sort(function (a, b) { return b.__row - a.__row; }).forEach(function (row) {
    table_('devices').deleteRow(row.__row);
  });
  table_('members').deleteRow(member.__row);
  Security.bumpTokenVersion(member.username);
}

function sendInactivityNotice_(email, inactiveMonths) {
  const recipient = String(email || '').trim();
  if (!recipient) {
    console.error('[Inactivity maintenance] 가입 이메일이 없어 알림을 보내지 못했어요.');
    return false;
  }
  const isDeletionNotice = inactiveMonths >= 5;
  const subject = isDeletionNotice
    ? '[과학구리] 1개월 내 계정 삭제 예정 안내'
    : '[과학구리] 장기 미접속 계정 안내';
  const body = isDeletionNotice
    ? '5개월 이상 로그인하지 않아 계정 삭제 예정임을 안내드립니다. 마지막 로그인일로부터 6개월이 되는 시점에 계정이 삭제됩니다. 계정을 유지하려면 그 전에 로그인해주세요.'
    : '3개월 이상 로그인하지 않아 장기 미접속 계정임을 안내드립니다. 마지막 로그인일로부터 6개월 동안 로그인하지 않으면 계정이 삭제됩니다. 계정을 계속 이용하려면 로그인해주세요.';
  try {
    MailApp.sendEmail({
      to: recipient,
      name: '과학구리',
      subject: subject,
      body: body,
      htmlBody: '<div style="font-family:sans-serif"><p>' + body + '</p></div>'
    });
    return true;
  } catch (error) {
    console.error('[Inactivity maintenance] 이메일 발송 실패: ' +
      (error && error.message ? error.message : error));
    return false;
  }
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
    if (rows.some(function (row) { return truthy_(row.isFounder); })) {
      throw new Error('최초 관리자가 이미 지정되어 있어요.');
    }
    const member = rows.find(function (row) { return sameName_(row.username, username); });
    if (!member) throw new Error('먼저 해당 계정으로 회원가입한 뒤 다시 실행하세요.');
    const rowIndex = member.__row;
    setByHeader_(sheet, rowIndex, 'role', 'admin');
    setByHeader_(sheet, rowIndex, 'isFounder', true);
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
    const sheet = table_('members');
    setByHeader_(sheet, member.__row, 'passwordSalt', salt);
    setByHeader_(sheet, member.__row, 'passwordHash', hash);
    clearLegacyPassword_(sheet, member.__row);
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
  if (spec.appendMissing) {
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
  const spec = APP_TABLES[key];
  const sheet = table_(key);
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) return [];
  const headers = sheet.getRange(1, 1, 1, lastCol).getDisplayValues()[0].map(function (value) {
    return String(value).trim();
  });
  return sheet.getRange(2, 1, lastRow - 1, lastCol).getValues().map(function (cells, index) {
    const item = { __row: index + 2 };
    headers.forEach(function (header, col) {
      const canonical = Object.keys(spec.columns || {}).find(function (field) {
        return spec.columns[field] === header;
      }) || header;
      item[canonical] = cells[col];
    });
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

function appendRecord_(key, record) {
  const spec = APP_TABLES[key];
  const sheet = table_(key);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0].map(function (value) {
    return String(value).trim();
  });
  const values = headers.map(function (header) {
    const canonical = Object.keys(spec.columns || {}).find(function (field) {
      return spec.columns[field] === header;
    }) || header;
    return record[canonical] == null ? '' : record[canonical];
  });
  appendRow_(sheet, values);
}

function rawRowsFromSheet_(sheetName) {
  const sheet = database_().getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() < 2 || sheet.getLastColumn() < 1) return [];
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0].map(function (value) {
    return String(value).trim();
  });
  return sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues().map(function (cells) {
    const row = {};
    headers.forEach(function (header, col) { row[header] = cells[col]; });
    return row;
  }).filter(function (row) {
    return Object.keys(row).some(function (key) { return row[key] !== '' && row[key] != null; });
  });
}

function migrateLegacyMemberFields_() {
  const sheet = table_('members');
  const legacyFields = {
    username: '이름', password: '비밀번호', createdAt: '가입일', role: '권한', muted: '작성금지',
    email: '이메일', passwordSalt: '비밀번호솔트', passwordHash: '비밀번호해시', isFounder: '최초관리자'
  };
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0].map(function (value) {
    return String(value).trim();
  });
  const rows = sheet.getLastRow() < 2 ? [] : sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  const usernameCol = headers.indexOf('username');
  let migrated = 0;
  rows.forEach(function (cells, index) {
    if (usernameCol < 0 || cells[usernameCol] !== '' && cells[usernameCol] != null) return;
    Object.keys(legacyFields).forEach(function (field) {
      const currentCol = headers.indexOf(field);
      const legacyCol = headers.indexOf(legacyFields[field]);
      if (currentCol < 0 || legacyCol < 0 || cells[currentCol] !== '' && cells[currentCol] != null) return;
      const value = cells[legacyCol];
      if (value === '' || value == null) return;
      setByHeader_(sheet, index + 2, field, value);
      migrated++;
    });
  });
  return migrated;
}

function migrateLegacyRows_(sourceName, targetKey, transform, identityFor) {
  if (sourceName === APP_TABLES[targetKey].name) return 0;
  const existing = tableRows_(targetKey);
  const known = {};
  existing.forEach(function (row) {
    const identity = identityFor(row);
    if (identity) known[identity] = true;
  });
  let migrated = 0;
  rawRowsFromSheet_(sourceName).forEach(function (source) {
    const record = transform(source);
    const identity = identityFor(record);
    if (!identity || known[identity]) return;
    appendRecord_(targetKey, record);
    known[identity] = true;
    migrated++;
  });
  return migrated;
}

function migrateLegacyEggs_() {
  const existing = tableRows_('eggs');
  const byIdentity = {};
  existing.forEach(function (row) {
    byIdentity[String(row.username).toLowerCase() + ':' + String(row.eggId)] = row;
  });
  let migrated = 0;
  rawRowsFromSheet_('앱_이스터에그').forEach(function (source) {
    const username = String(source.username || '').trim();
    const eggId = String(source.eggId || '').trim();
    if (!username || !eggId) return;
    const identity = username.toLowerCase() + ':' + eggId;
    const score = Math.max(0, Number(source.score) || 0);
    const current = byIdentity[identity];
    if (!current) {
      const record = { username: username, eggId: eggId, score: score, updatedAt: source.updatedAt || nowIso_() };
      appendRecord_('eggs', record);
      record.__row = table_('eggs').getLastRow();
      byIdentity[identity] = record;
      migrated++;
    } else if (score > Number(current.score || 0)) {
      const sheet = table_('eggs');
      setByHeader_(sheet, current.__row, 'score', score);
      setByHeader_(sheet, current.__row, 'updatedAt', source.updatedAt || nowIso_());
      current.score = score;
      migrated++;
    }
  });
  return migrated;
}

function setByHeader_(sheet, rowIndex, header, value) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0].map(function (value) {
    return String(value).trim();
  });
  const spec = Object.keys(APP_TABLES).map(function (key) { return APP_TABLES[key]; })
    .find(function (item) { return item.name === sheet.getName(); });
  const physicalHeader = spec && spec.columns && spec.columns[header] || header;
  const col = headers.indexOf(physicalHeader);
  if (col < 0) throw new Error('필요한 열을 찾을 수 없어요: ' + physicalHeader);
  const cell = sheet.getRange(rowIndex, col + 1);
  cell.setNumberFormat('@');
  cell.setValue(value);
}

function legacyPasswordValue_(row) {
  return String(row.password || row['비밀번호'] || '');
}

function clearLegacyPassword_(sheet, rowIndex) {
  const lastCol = sheet.getLastColumn();
  if (lastCol < 1) return;
  const headers = sheet.getRange(1, 1, 1, lastCol).getDisplayValues()[0].map(function (value) {
    return String(value).trim();
  });
  headers.forEach(function (header, index) {
    if (header === 'password' || header === '비밀번호') {
      sheet.getRange(rowIndex, index + 1).clearContent();
    }
  });
}

function removeLegacyPasswordColumns() {
  return withWriteLock_(function () {
    const sheet = table_('members');
    const lastCol = sheet.getLastColumn();
    const headers = sheet.getRange(1, 1, 1, lastCol).getDisplayValues()[0].map(function (value) {
      return String(value).trim();
    });
    const columns = [];
    headers.forEach(function (header, index) {
      if (header === 'password' || header === '비밀번호') columns.push(index + 1);
    });
    if (!columns.length) return '삭제할 기존 비밀번호 열이 없어요.';

    const usernameCol = headers.indexOf('username');
    const legacyUsernameCol = headers.indexOf('이름');
    const saltCol = headers.indexOf('passwordSalt');
    const hashCol = headers.indexOf('passwordHash');
    if (usernameCol < 0 || saltCol < 0 || hashCol < 0) {
      throw new Error('회원 이름, passwordSalt, passwordHash 열을 확인할 수 없어 삭제하지 않았어요.');
    }
    const rowCount = Math.max(0, sheet.getLastRow() - 1);
    if (rowCount) {
      const usernames = sheet.getRange(2, usernameCol + 1, rowCount, 1).getValues();
      const legacyUsernames = legacyUsernameCol < 0
        ? []
        : sheet.getRange(2, legacyUsernameCol + 1, rowCount, 1).getValues();
      const salts = sheet.getRange(2, saltCol + 1, rowCount, 1).getValues();
      const hashes = sheet.getRange(2, hashCol + 1, rowCount, 1).getValues();
      let unsupportedAccounts = 0;
      for (let i = 0; i < rowCount; i++) {
        const username = String(usernames[i][0] || (legacyUsernames[i] && legacyUsernames[i][0]) || '').trim();
        if (!username) continue;
        const salt = String(salts[i][0] || '').trim();
        const hash = String(hashes[i][0] || '').trim();
        const supportedHash = /^v2\$[A-Za-z0-9+/]{43}=$/.test(hash) || /^[A-Za-z0-9+/]{43}=$/.test(hash);
        if (!salt || !supportedHash) {
          unsupportedAccounts++;
        }
      }
      if (unsupportedAccounts) {
        throw new Error('비밀번호 해시가 확인되지 않는 회원이 ' + unsupportedAccounts +
          '명 있어 열을 삭제하지 않았어요. 해당 회원의 비밀번호를 먼저 재설정해주세요.');
      }
    }

    columns.sort(function (a, b) { return b - a; }).forEach(function (column) {
      sheet.deleteColumn(column);
    });
    return '기존 평문 비밀번호 열을 삭제했어요. 저장된 솔트와 해시는 유지됩니다.';
  });
}

function findMember_(username) {
  const target = String(username || '').trim();
  if (!target) return null;
  const sheet = table_('members');
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) return null;
  const headers = sheet.getRange(1, 1, 1, lastCol).getDisplayValues()[0].map(function (value) {
    return String(value).trim();
  });
  const usernameCol = headers.indexOf('username');
  if (usernameCol < 0) throw new Error('회원 탭에서 username 열을 찾을 수 없어요.');
  const finder = sheet.getRange(2, usernameCol + 1, lastRow - 1, 1)
    .createTextFinder(target)
    .matchCase(false);
  let found = finder.findNext();
  while (found && !sameName_(found.getDisplayValue(), target)) {
    found = finder.findNext();
  }
  if (!found) return null;
  const row = { __row: found.getRow() };
  sheet.getRange(found.getRow(), 1, 1, lastCol).getValues()[0].forEach(function (value, col) {
    row[headers[col]] = value;
  });
  return row;
}

function findMemberByEmail_(email) {
  const target = String(email || '').trim().toLowerCase();
  return tableRows_('members').find(function (row) {
    return String(row.email || '').trim().toLowerCase() === target;
  }) || null;
}

function memberForSecurity_(username) {
  const row = findMember_(username);
  if (!row) return null;
  return {
    username: String(row.username || '').trim(),
    role: normalizeRole_(row.role),
    muted: truthy_(row.muted),
    email: String(row.email || '').trim(),
    isFounder: truthy_(row.isFounder),
    salt: String(row.passwordSalt || ''),
    passwordHash: String(row.passwordHash || ''),
    legacyPassword: legacyPasswordValue_(row),
    row: row.__row
  };
}

function emailInUse_(email, exceptUsername) {
  const target = String(email || '').trim().toLowerCase();
  const except = String(exceptUsername || '').trim().toLowerCase();
  return tableRows_('members').some(function (row) {
    return String(row.email || '').trim().toLowerCase() === target &&
      String(row.username || '').trim().toLowerCase() !== except;
  });
}

function setMemberEmail_(username, email) {
  const member = findMember_(username);
  if (!member) return false;
  setByHeader_(table_('members'), member.__row, 'email', email);
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

function parseInactivityDate_(value) {
  if (!value) return null;
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  return isFinite(date.getTime()) ? date : null;
}

function addCalendarMonths_(date, months) {
  const result = new Date(date.getTime());
  const day = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
  result.setUTCDate(Math.min(day, lastDay));
  return result;
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
  const pepper = passwordPepper_();
  const value = 'gwakuri-password-v2\u0000' + String(salt) + '\u0000' + String(password);
  const pepperBytes = Utilities.newBlob(pepper).getBytes();
  return PASSWORD_HASH_PREFIX + Utilities.base64Encode(
    Utilities.computeHmacSha256Signature(Utilities.newBlob(value).getBytes(), pepperBytes)
  );
}

function passwordPepper_() {
  const properties = PropertiesService.getScriptProperties();
  let pepper = properties.getProperty('PASSWORD_PEPPER');
  if (pepper && pepper.length >= 32) return pepper;

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    pepper = properties.getProperty('PASSWORD_PEPPER');
    if (!pepper) {
      pepper = Utilities.getUuid() + Utilities.getUuid() + Utilities.getUuid();
      properties.setProperty('PASSWORD_PEPPER', pepper);
    }
    if (pepper.length < 32) throw new Error('PASSWORD_PEPPER 설정이 올바르지 않아요.');
    return pepper;
  } finally {
    lock.releaseLock();
  }
}

function legacyPasswordHash_(password, salt) {
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

function legacySha256PasswordHash_(password) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(password))
    .map(function (byte) {
      return ('0' + (byte < 0 ? byte + 256 : byte).toString(16)).slice(-2);
    }).join('');
}

function passwordMatches_(password, salt, expected) {
  const storedHash = String(expected || '');
  if (!storedHash) return false;
  let actual;
  let comparableHash = storedHash;
  if (/^[a-f0-9]{64}$/i.test(storedHash)) {
    actual = legacySha256PasswordHash_(password);
    comparableHash = storedHash.toLowerCase();
  } else if (storedHash.indexOf(PASSWORD_HASH_PREFIX) === 0) {
    if (!salt || !/^v2\$[A-Za-z0-9+/]{43}=$/.test(storedHash)) return false;
    actual = passwordHash_(password, salt);
  } else if (salt && /^[A-Za-z0-9+/]{43}=$/.test(storedHash)) {
    actual = legacyPasswordHash_(password, salt);
  } else {
    return false;
  }
  if (actual.length !== comparableHash.length) return false;
  let mismatch = 0;
  for (let i = 0; i < actual.length; i++) mismatch |= actual.charCodeAt(i) ^ comparableHash.charCodeAt(i);
  return mismatch === 0;
}

function randomPassword_() {
  return Utilities.getUuid().replace(/-/g, '').slice(0, 16);
}

function actionSignup_(p) {
  const username = requiredText_(p.username, '아이디', 30);
  if (!/^[가-힣A-Za-z0-9._ -]{2,30}$/.test(username)) throw new Error('아이디는 한글, 영문, 숫자, 공백, ., _, -만 사용할 수 있어요.');
  const password = String(p.password || '');
  if (password.length < PASSWORD_MIN_LENGTH || password.length > 128) {
    throw new Error('비밀번호는 8자 이상 128자 이하로 입력해주세요.');
  }
  const email = String(p.email || '').trim().toLowerCase();
  if (!Security.validEmail(email)) throw new Error('학교 이메일 주소를 확인해주세요.');
  const salt = Utilities.getUuid() + Utilities.getUuid();
  const hash = passwordHash_(password, salt);
  return withWriteLock_(function () {
    if (findMember_(username)) throw new Error('이미 사용 중인 아이디예요.');
    if (emailInUse_(email, '')) throw new Error('이미 다른 계정에서 쓰는 이메일이에요.');
    if (!Security.consumeEmailProof(p.emailProof, email, 'signup', '')) {
      throw new Error('이메일 인증이 만료됐어요. 다시 인증해주세요.');
    }
    const sheet = table_('members');
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
    const values = {
      username: username, role: 'user', muted: false, email: email,
      passwordSalt: salt, passwordHash: hash, createdAt: nowIso_(), isFounder: false
    };
    appendRow_(sheet, headers.map(function (header) { return values[header] == null ? '' : values[header]; }));
    return { success: true, message: '가입되었습니다. 로그인해주세요.' };
  });
}

function actionLogin_(p) {
  const username = requiredText_(p.username, '아이디', 30);
  const password = String(p.password || '');
  if (!password || password.length > 128) throw new Error('아이디 또는 비밀번호를 확인해주세요.');
  const member = memberForSecurity_(username);
  if (!member) {
    passwordHash_(password, 'invalid-user-salt');
    throw new Error('아이디 또는 비밀번호를 확인해주세요.');
  }
  let validPassword = passwordMatches_(password, member.salt, member.passwordHash);
  if (!validPassword && member.legacyPassword && member.legacyPassword === password) {
    validPassword = true;
  }
  if (!validPassword) throw new Error('아이디 또는 비밀번호를 확인해주세요.');

  const shouldUpgradePassword = member.passwordHash.indexOf(PASSWORD_HASH_PREFIX) !== 0 || member.legacyPassword;
  const upgradedSalt = shouldUpgradePassword ? Utilities.getUuid() + Utilities.getUuid() : '';
  const upgradedHash = shouldUpgradePassword ? passwordHash_(password, upgradedSalt) : '';
  return withWriteLock_(function () {
    const latest = findMember_(username);
    if (!latest || String(latest.passwordHash || '') !== member.passwordHash ||
        legacyPasswordValue_(latest) !== member.legacyPassword) {
      throw new Error('계정 정보가 변경되었어요. 다시 로그인해주세요.');
    }
    const sheet = table_('members');
    if (shouldUpgradePassword) {
      setByHeader_(sheet, latest.__row, 'passwordSalt', upgradedSalt);
      setByHeader_(sheet, latest.__row, 'passwordHash', upgradedHash);
      clearLegacyPassword_(sheet, latest.__row);
    }
    setByHeader_(sheet, latest.__row, 'lastLoginAt', nowIso_());
    setByHeader_(sheet, latest.__row, 'inactivity3MonthNoticeAt', '');
    setByHeader_(sheet, latest.__row, 'inactivity5MonthNoticeAt', '');
    return {
      success: true,
      username: String(latest.username || ''),
      role: normalizeRole_(latest.role),
      muted: truthy_(latest.muted)
    };
  });
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
    if (!latest || String(latest.passwordSalt || '') !== member.salt ||
        String(latest.passwordHash || '') !== member.passwordHash) {
      throw new Error('현재 비밀번호가 변경되었어요. 다시 로그인해주세요.');
    }
    const sheet = table_('members');
    setByHeader_(sheet, latest.__row, 'passwordSalt', salt);
    setByHeader_(sheet, latest.__row, 'passwordHash', hash);
    clearLegacyPassword_(sheet, latest.__row);
  });
  return { success: true, message: '비밀번호를 변경했어요.' };
}

function actionGetMyInfo_(p) {
  const member = findMember_(p.username);
  if (!member) throw new Error('회원 정보를 찾을 수 없어요.');
  const posts = tableRows_('posts').filter(function (row) {
    return !truthy_(row.deleted) && sameName_(row.author, member.username);
  }).length;
  const comments = tableRows_('comments').filter(function (row) {
    return !truthy_(row.deleted) && sameName_(row.author, member.username);
  }).length;
  return {
    success: true,
    username: String(member.username),
    role: normalizeRole_(member.role),
    muted: truthy_(member.muted),
    email: String(member.email || ''),
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

function postSummaryObject_(row) {
  return {
    id: String(row.id),
    title: String(row.title || ''),
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
  return { success: true, posts: posts.map(postSummaryObject_) };
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
    appendRecord_('posts', post);
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
    appendRecord_('comments', comment);
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
        username: String(row.username || ''),
        role: normalizeRole_(row.role),
        muted: truthy_(row.muted),
        createdAt: row.createdAt || '',
        isFounder: truthy_(row.isFounder)
      };
    }).sort(function (a, b) { return a.username.localeCompare(b.username); })
  };
}

function ensureNotProtectedMember_(member, actor) {
  if (!member) throw new Error('회원을 찾을 수 없어요.');
  if (truthy_(member.isFounder)) throw new Error('최초 관리자는 이 기능으로 변경할 수 없어요.');
  if (sameName_(member.username, actor)) throw new Error('현재 로그인한 계정에는 이 작업을 할 수 없어요.');
}

function actionSetRole_(p) {
  const target = requiredText_(p.targetUsername, '대상 회원', 30);
  const role = String(p.newRole || '').trim();
  if (['user', 'manager', 'admin'].indexOf(role) < 0) throw new Error('올바르지 않은 권한이에요.');
  return withWriteLock_(function () {
    const member = findMember_(target);
    ensureNotProtectedMember_(member, p.actor);
    if (normalizeRole_(member.role) === 'admin' && role !== 'admin' &&
      tableRows_('members').filter(function (row) { return normalizeRole_(row.role) === 'admin'; }).length <= 1) {
      throw new Error('마지막 관리자의 권한은 해제할 수 없어요.');
    }
    setByHeader_(table_('members'), member.__row, 'role', role);
    return { success: true };
  });
}

function actionSetMuted_(p) {
  const target = requiredText_(p.targetUsername, '대상 회원', 30);
  return withWriteLock_(function () {
    const member = findMember_(target);
    ensureNotProtectedMember_(member, p.actor);
    setByHeader_(table_('members'), member.__row, 'muted', truthy_(p.muted));
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
    const sheet = table_('members');
    setByHeader_(sheet, member.__row, 'passwordSalt', salt);
    setByHeader_(sheet, member.__row, 'passwordHash', hash);
    clearLegacyPassword_(sheet, member.__row);
  });
  return { success: true, message: '임시 비밀번호: ' + temporaryPassword + ' (로그인 후 즉시 변경해주세요.)' };
}

function actionKickUser_(p) {
  const target = requiredText_(p.targetUsername, '대상 회원', 30);
  return withWriteLock_(function () {
    const member = findMember_(target);
    ensureNotProtectedMember_(member, p.actor);
    if (normalizeRole_(member.role) === 'admin' &&
      tableRows_('members').filter(function (row) { return normalizeRole_(row.role) === 'admin'; }).length <= 1) {
      throw new Error('마지막 관리자는 탈퇴 처리할 수 없어요.');
    }
    tableRows_('devices').filter(function (row) {
      return sameName_(row.username, member.username);
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
    status: '미납', proofUrl: '', updatedAt: nowIso_()
  };
  withWriteLock_(function () {
    appendRecord_('fines', fine);
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
      appendRecord_('devices', { username: p.actor, token: token, platform: platform, updatedAt: nowIso_() });
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
    if (existing) {
      setByHeader_(sheet, existing.__row, 'score', best);
      setByHeader_(sheet, existing.__row, 'updatedAt', nowIso_());
    } else {
      appendRecord_('eggs', { username: p.username, eggId: eggId, score: best, updatedAt: nowIso_() });
    }
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
        found: !!row,
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
