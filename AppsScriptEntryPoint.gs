function doPost(e) {
  if (typeof Security === 'undefined' || typeof Security.wrap !== 'function') {
    return jsonResponse_('보안 모듈 Security를 불러오지 못했어요.');
  }
  if (typeof doPost_original !== 'function') {
    return jsonResponse_('기존 요청 처리기 doPost_original을 찾을 수 없어요.');
  }
  return Security.wrap(e, doPost_original);
}

function jsonResponse_(message) {
  return ContentService
    .createTextOutput(JSON.stringify({ success: false, message: message, code: 'SERVER' }))
    .setMimeType(ContentService.MimeType.JSON);
}