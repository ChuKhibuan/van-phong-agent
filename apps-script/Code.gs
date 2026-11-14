/**
 * Hộp thư (Inbox) cho Văn phòng agent.
 * Trang web gửi tin nhắn / bài dạy / giao việc / duyệt → ghi một dòng vào tab "Inbox".
 * File gửi kèm được lưu vào thư mục Drive "Văn phòng agent · Tệp gửi" (chỉ bạn xem được),
 * link file ghi vào cột `files`; đường dẫn trên máy ghi vào cột `paths`.
 *
 * Cài đặt: tạo dự án Apps Script → dán file này → Triển khai → Ứng dụng web
 *   (Thực thi với tư cách: Tôi · Người có quyền truy cập: Bất kỳ ai) → chép URL /exec vào config.js.
 * KEY nằm trong mã trang web nên chỉ chống spam ngẫu nhiên, không phải bảo mật thật.
 * Script chỉ GHI THÊM dòng vào tab Inbox và tạo file mới trong thư mục trên; không đọc hay sửa dữ liệu khác.
 */
const SHEET_ID = '1oiuUuNbyVBbLuhJmtOhiCTnqZyTxu1c0OexZSOs1EWw';
const KEY = 'vpa-74af1392b6a72d086f';
const TYPES = ['message', 'teach', 'handoff', 'approve'];
const FOLDER_NAME = 'Văn phòng agent · Tệp gửi';
const HEAD = ['timestamp', 'from', 'to', 'type', 'text', 'status', 'note', 'files', 'paths'];
const MAX_FILES = 10;
const MAX_BYTES = 25 * 1024 * 1024;

// Chạy hàm này một lần trong trình sửa để cấp quyền Drive và tạo thư mục nhận file.
function capQuyenDrive() { Logger.log(getFolder_().getUrl()); }

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents || '{}');
    if (KEY && data.key !== KEY) return out({ ok: false, error: 'sai key' });
    const type = TYPES.indexOf(data.type) >= 0 ? data.type : 'message';
    const clip = (s, n) => String(s == null ? '' : s).slice(0, n);

    // file đính kèm → Drive. Lỗi lưu file không được làm mất tin nhắn.
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
    return out({ ok: !note, files: links.length, error: note || undefined });
  } catch (err) {
    return out({ ok: false, error: String(err) });
  }
}

function getFolder_() {
  const it = DriveApp.getFoldersByName(FOLDER_NAME);
  return it.hasNext() ? it.next() : DriveApp.createFolder(FOLDER_NAME);
}

function doGet() { return out({ ok: true, hint: 'Dùng POST' }); }

function out(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
