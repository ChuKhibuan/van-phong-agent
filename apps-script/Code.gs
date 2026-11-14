/**
 * Hộp thư (Inbox) cho Văn phòng agent.
 * Trang web gửi tin nhắn / bài dạy / giao việc / duyệt → ghi một dòng vào tab "Inbox".
 *
 * Cài đặt:
 * 1. Mở Google Sheet → Tiện ích mở rộng → Apps Script → dán file này.
 * 2. Đổi KEY bên dưới thành một chuỗi bất kỳ, chép y hệt vào config.js (data.inboxKey).
 * 3. Triển khai → Triển khai mới → Loại: Ứng dụng web
 *      Thực thi với tư cách: Tôi      Ai có quyền truy cập: Bất kỳ ai
 * 4. Chép URL kết thúc bằng /exec vào config.js (data.inboxUrl) hoặc Cài đặt trên trang web.
 *
 * Lưu ý: KEY nằm trong mã trang web nên chỉ chống spam ngẫu nhiên, không phải bảo mật thật.
 * Script này chỉ GHI THÊM dòng vào tab Inbox, không đọc hay sửa dữ liệu khác.
 */
const SHEET_ID = '1oiuUuNbyVBbLuhJmtOhiCTnqZyTxu1c0OexZSOs1EWw';
const KEY = 'vpa-74af1392b6a72d086f';
const TYPES = ['message', 'teach', 'handoff', 'approve'];

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents || '{}');
    if (KEY && data.key !== KEY) return out({ ok: false, error: 'sai key' });
    const type = TYPES.indexOf(data.type) >= 0 ? data.type : 'message';
    const clip = (s, n) => String(s == null ? '' : s).slice(0, n);
    const ss = SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.openById(SHEET_ID);
    const sh = ss.getSheetByName('Inbox') || ss.insertSheet('Inbox');
    if (sh.getLastRow() === 0) sh.appendRow(['timestamp', 'from', 'to', 'type', 'text', 'status', 'note']);
    // dấu ' ở đầu để Sheet giữ nguyên chuỗi, không tự đổi định dạng
    sh.appendRow(["'" + new Date().toISOString(), clip(data.from, 40), clip(data.to, 40), type, clip(data.text, 4000), 'new', '']);
    return out({ ok: true });
  } catch (err) {
    return out({ ok: false, error: String(err) });
  }
}

function doGet() { return out({ ok: true, hint: 'Dùng POST' }); }

function out(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
