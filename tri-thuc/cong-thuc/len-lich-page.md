# Lên lịch / đăng bài Page (Meta Business Suite)

Khi nào dùng: bài Page VÍT MEDIA đã được **QA duyệt** (Notion `Đã duyệt`, Board `qa | done | QA duyệt: … | dang-bai`). **Đăng ngay, không hỏi chủ** (chủ chốt 18/11/2026). Bài chưa qua QA thì không đăng: giao QA trước (quy trình `kho/quy-trinh.md` mục "Quy trình đăng bài Page"). Chỉ máy trực làm được (cần Chrome của chủ).
Cần có: ảnh / video đã QA duyệt (link Canva / Drive hoặc đường dẫn trong thư mục được phép, xem `%LOCALAPPDATA%\van-phong-agent\thu-muc.txt`), caption nguyên văn trong Notion. Giờ đăng: chủ có hẹn giờ thì lên lịch đúng giờ đó; không hẹn thì **đăng ngay** khi QA duyệt.
Phòng: `dang-bai` (Kịch bản viết nội dung nếu cần) · Subagent: không.
Đọc: chân bài cố định trong `viet-bai-page-theo-anh.md`; mục "Bài học từ việc thật" của `tri-thuc/kien-thuc/dang-bai.md`.

Các bước:
1. Notion `Lịch đăng`: tìm dòng bài; chưa có thì tạo (Kênh `Page Vít media`, Nội dung nguyên văn, Ngày đăng, Trạng thái `Đã duyệt`, Ghi chú "chủ giao <ngày>").
2. Chrome (`tabs_context_mcp` createIfEmpty) → tab mới `https://business.facebook.com/latest/composer` (hoặc Lịch nội dung → "Tạo bài viết"). Kiểm tra đang chọn đúng Page **Vít media** (không phải Hoàng Hà).
3. Nhập nội dung nguyên văn: `find` ô "Hãy viết vào ô hộp thoại…" → `computer left_click` bằng ref → `computer type` cả bài (xuống dòng bằng Enter). **Không dùng** `execCommand insertText` bằng JS (ô soạn lỗi, đảo / trùng dòng, lại còn treo hộp "Rời khỏi trang?" không đóng được tab). Đọc lại bằng JS `document.querySelector('[contenteditable=true]').innerText` cho khớp từng dòng. Làm bước 3 trước hay sau bước 4 đều được, nhưng sau khi đính ảnh trang cuộn: chụp màn hình rồi mới click theo toạ độ.
4. Đính ảnh (đã chạy đúng 15/11/2026). Nút "Thêm ảnh/video" **không** phải ô file; trang chỉ tạo `input[type=file]` lúc bấm nút rồi mở hộp chọn file của Windows (agent không thấy được). Làm đúng thứ tự:
   a. `javascript_tool` chạy đoạn chặn hộp chọn file (giữ input lại trong trang):
      `window.__fi=[];const oc=HTMLInputElement.prototype.click;HTMLInputElement.prototype.click=function(){if(this.type==='file'){window.__fi.push(this);if(!this.isConnected){this.style.display='none';document.body.appendChild(this)}return}return oc.call(this)};'ok'`
   b. `find` "Thêm ảnh/video" → bấm nút đó (bằng ref). Hộp chọn file KHÔNG mở.
   c. `find` "file input" → lấy ref `file-input (hidden)` → `file_upload` với `paths` = đường dẫn ảnh trên máy (ví dụ `D:\2.Vid media\Bài đăng\1.png`; phải nằm trong thư mục được phép).
   d. Chờ ~3 giây, kiểm tra mục "File phương tiện" hiện kích thước ảnh (ví dụ `1254 x 1254`) và bản xem trước có ảnh.
   Muốn bỏ bài thử: "Gỡ ảnh" → "Hủy" → hộp "Rời khỏi trang?" bấm "Bỏ thay đổi". Tránh bấm "Đăng" khi chưa chắc.
5. Lên lịch: trong trình soạn có mục **"Lên lịch · Đặt ngày và giờ"** (cuộn xuống dưới "Chi tiết bài viết"); bật nó, chọn ngày trên lịch nhỏ; ô giờ (mặc định giờ hiện tại) không nhận gõ số: bấm vào phần giờ, phím `Up`/`Down` đổi giờ, `Right` sang phút (giờ Việt Nam) → nút cuối đổi thành "Lên lịch" → bấm. Không bật "Quảng bá", không bật "Tạo bài viết quảng cáo". Kiểm tra bài xuất hiện đúng ngày giờ trong Lịch nội dung.
6. Notion: Trạng thái `Đã lên lịch` (đăng ngay thì `Đã đăng`), ghi giờ vào Ngày đăng, link nếu đọc được. Board `dang-bai | done | Đã lên lịch Page: <tên bài> · <dd/mm hh:mm> | 100` (đây là nguồn cho báo cáo QA cuối ngày). Đóng tab mình mở.
7. `Tra_loi`: một câu ngắn "Đã lên lịch <tên bài> lúc <giờ> trên Page Vít media" + link Notion. Không hỏi duyệt.
Gặp lỗi (không thấy nút, Facebook đổi giao diện, ảnh không lên): thử lại tối đa 2 lần, đọc trang bằng chữ; vẫn lỗi thì để Notion `Đã duyệt` + Ghi chú lỗi, Board `dang-bai | waiting | Hỏi chủ: <lỗi>`, báo trong `Tra_loi`.
Sau lần chạy đúng đầu tiên: ghi đúng tên nút / thứ tự bấm đã chạy vào mục "Bài học từ việc thật" của `dang-bai.md` để lần sau nhanh hơn.

Không được: đăng lên Page Hoàng Hà Makeup khi chủ chưa giao rõ; tự nghĩ bài mới để đăng khi chủ không giao; ghi giá / số liệu / thông tin khách chưa xác nhận; xoá hay sửa bài cũ trên Page; bấm quảng cáo, "Đẩy bài", thanh toán.
Nguồn: 15/11/2026 · chủ: "Đăng bài lần sau không phải hỏi lại, chỉ cần thông báo lại bên QA vào cuối ngày hoặc khi tôi hỏi".
