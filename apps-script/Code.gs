/**
 * Hộp thư (Inbox) cho Văn phòng agent — CHỈ CHỦ TÀI KHOẢN được gửi lệnh.
 *
 * Triển khai: Ứng dụng web · Thực thi với tư cách: NGƯỜI DÙNG TRUY CẬP ỨNG DỤNG
 *             · Người có quyền truy cập: CHỈ MÌNH TÔI
 * → Google tự chặn mọi tài khoản khác; script còn kiểm tra thêm email người gửi
 *   trùng với tài khoản chủ (lưu trong Script Properties, KHÔNG ghi trong mã công khai).
 *
 * Trang web gửi lệnh bằng form POST (trường `payload` chứa JSON) mở trong một cửa sổ nhỏ,
 * để trình duyệt dùng đúng phiên đăng nhập Google của bạn. Script trả về trang "Đã gửi".
 * File gửi kèm được lưu vào thư mục Drive "Văn phòng agent · Tệp gửi".
 * Script chỉ GHI THÊM dòng vào tab Inbox và tạo file mới trong thư mục trên.
 */
const SHEET_ID = '1oiuUuNbyVBbLuhJmtOhiCTnqZyTxu1c0OexZSOs1EWw';
const TYPES = ['message', 'teach', 'handoff', 'approve'];
const FOLDER_NAME = 'Văn phòng agent · Tệp gửi';
const HEAD = ['timestamp', 'from', 'to', 'type', 'text', 'status', 'note', 'files', 'paths'];
const MAX_FILES = 10;
const MAX_BYTES = 25 * 1024 * 1024;

// Chạy một lần trong trình sửa: ghi nhớ tài khoản chủ, cấp quyền Drive, tạo thư mục nhận file.
function caiDatChuSoHuu() {
  const me = Session.getActiveUser().getEmail();
  PropertiesService.getScriptProperties().setProperty('OWNER', me);
  Logger.log('Chủ sở hữu: ' + me + ' · thư mục: ' + getFolder_().getUrl());
}

function doPost(e) {
  const fromForm = !!(e && e.parameter && e.parameter.payload);
  let res;
  try {
    const raw = fromForm ? e.parameter.payload : ((e && e.postData && e.postData.contents) || '{}');
    res = handle_(JSON.parse(raw));
  } catch (err) {
    res = { ok: false, error: String(err) };
  }
  return fromForm ? page_(res) : out(res);
}

function handle_(data) {
  // chỉ chủ tài khoản
  const me = Session.getActiveUser().getEmail();
  const props = PropertiesService.getScriptProperties();
  let owner = props.getProperty('OWNER');
  if (!owner && me && me === Session.getEffectiveUser().getEmail()) { owner = me; props.setProperty('OWNER', me); }
  if (!me || me !== owner) return { ok: false, error: 'Chỉ tài khoản chủ được gửi lệnh.' };

  const type = TYPES.indexOf(data.type) >= 0 ? data.type : 'message';
  const clip = (s, n) => String(s == null ? '' : s).slice(0, n);

  // file đính kèm → Drive. Lỗi lưu file không làm mất tin nhắn.
  const links = [];
  let note = '';
  const files = Array.isArray(data.files) ? data.files.slice(0, MAX_FILES) : [];
  if (files.length) {
    try {
      const folder = getFolder_();
      let total = 0;
      files.forEach(function (f) {
        const bytes = Utilities.base64Decode(String(f.data || ''));
        total += bytes.length;
        if (total > MAX_BYTES) throw new Error('Tổng file quá 25 MB');
        const blob = Utilities.newBlob(bytes, clip(f.type, 100) || 'application/octet-stream', clip(f.name, 200) || 'tep');
        const file = folder.createFile(blob);
        links.push(file.getName() + ' — ' + file.getUrl());
      });
    } catch (err) {
      note = 'Không lưu được file (' + files.map(function (f) { return clip(f.name, 80); }).join(', ') + '): ' + clip(String(err), 300);
    }
  }
  const paths = Array.isArray(data.paths) ? data.paths.map(function (p) { return clip(p, 500); }).slice(0, 20) : [];

  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sh = ss.getSheetByName('Inbox') || ss.insertSheet('Inbox');
  if (sh.getLastRow() === 0) sh.appendRow(HEAD);
  sh.appendRow(["'" + new Date().toISOString(), clip(data.from, 40), clip(data.to, 40), type,
    clip(data.text, 4000), 'new', note, links.join('\n'), paths.join('\n')]);
  return { ok: !note, files: links.length, error: note || undefined };
}

function page_(res) {
  const msg = res.ok
    ? '✅ Đã gửi vào Inbox.' + (res.files ? ' Đã lưu ' + res.files + ' file vào Drive.' : '')
    : '⚠ ' + (res.error || 'Gửi lỗi');
  const html = '<div style="font:15px/1.5 system-ui,sans-serif;padding:18px">' +
    '<p style="margin:0 0 8px;font-weight:600">' + msg.replace(/</g, '&lt;') + '</p>' +
    '<p style="margin:0;color:#667">Bạn có thể đóng cửa sổ này và quay lại Văn phòng agent.</p></div>';
  return HtmlService.createHtmlOutput(html).setTitle(res.ok ? 'Đã gửi' : 'Chưa gửi được');
}

function getFolder_() {
  const it = DriveApp.getFoldersByName(FOLDER_NAME);
  return it.hasNext() ? it.next() : DriveApp.createFolder(FOLDER_NAME);
}

function doGet() {
  return HtmlService.createHtmlOutput('<p style="font:15px system-ui,sans-serif;padding:18px">Hộp thư Văn phòng agent đang hoạt động. Gửi lệnh từ trang Văn phòng agent.</p>')
    .setTitle('Văn phòng agent · Inbox');
}

function out(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
