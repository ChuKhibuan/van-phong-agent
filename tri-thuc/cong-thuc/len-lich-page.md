# Lên lịch / đăng bài Page (Meta Business Suite)

Khi nào dùng: chủ giao một bài cho Page VÍT MEDIA (ảnh trong `D:\2.Vid media\...` hoặc link, kèm giờ đăng; hoặc nội dung Kịch bản đã viết). **Không hỏi lại chủ**: chủ đã cho phép thường trực (15/11/2026). Chỉ máy trực làm được (cần Chrome của chủ).
Cần có: ảnh (đường dẫn trong thư mục được phép, xem `%LOCALAPPDATA%\van-phong-agent\thu-muc.txt`), nội dung bài, ngày giờ đăng. Thiếu giờ → mặc định 9:00 sáng ngày làm việc kế tiếp chưa có bài Page (xem Notion). Thiếu nội dung → Kịch bản viết theo `viet-bai-page-theo-anh.md` rồi làm tiếp, không dừng hỏi. Chỉ hỏi chủ khi thiếu ảnh mà chủ nói có ảnh.
Phòng: `dang-bai` (Kịch bản viết nội dung nếu cần) · Subagent: không.
Đọc: chân bài cố định trong `viet-bai-page-theo-anh.md`; mục "Bài học từ việc thật" của `tri-thuc/kien-thuc/dang-bai.md`.

Các bước:
1. Notion `Lịch đăng`: tìm dòng bài; chưa có thì tạo (Kênh `Page Vít media`, Nội dung nguyên văn, Ngày đăng, Trạng thái `Đã duyệt`, Ghi chú "chủ giao <ngày>").
2. Chrome (`tabs_context_mcp` createIfEmpty) → tab mới `https://business.facebook.com/latest/composer` (hoặc Lịch nội dung → "Tạo bài viết"). Kiểm tra đang chọn đúng Page **Vít media** (không phải Hoàng Hà).
3. Dán nội dung nguyên văn vào ô bài viết, đọc lại bằng `get_page_text` / `find` cho khớp.
4. Đính ảnh (đã chạy đúng 15/11/2026). Nút "Thêm ảnh/video" **không** phải ô file; trang chỉ tạo `input[type=file]` lúc bấm nút rồi mở hộp chọn file của Windows (agent không thấy được). Làm đúng thứ tự:
   a. `javascript_tool` chạy đoạn chặn hộp chọn file (giữ input lại trong trang):
      `window.__fi=[];const oc=HTMLInputElement.prototype.click;HTMLInputElement.prototype.click=function(){if(this.type==='file'){window.__fi.push(this);if(!this.isConnected){this.style.display='none';document.body.appendChild(this)}return}return oc.call(this)};'ok'`
   b. `find` "Thêm ảnh/video" → bấm nút đó (bằng ref). Hộp chọn file KHÔNG mở.
   c. `find` "file input" → lấy ref `file-input (hidden)` → `file_upload` với `paths` = đường dẫn ảnh trên máy (ví dụ `D:\2.Vid media\Bài đăng\1.png`; phải nằm trong thư mục được phép).
   d. Chờ ~3 giây, kiểm tra mục "File phương tiện" hiện kích thước ảnh (ví dụ `1254 x 1254`) và bản xem trước có ảnh.
   Muốn bỏ bài thử: "Gỡ ảnh" → "Hủy" → hộp "Rời khỏi trang?" bấm "Bỏ thay đổi". Tránh bấm "Đăng" khi chưa chắc.
5. Lên lịch: trong trình soạn có mục **"Lên lịch · Đặt ngày và giờ"** (cuộn xuống dưới "Chi tiết bài viết"); bật nó, đặt ngày giờ (giờ Việt Nam) → nút cuối đổi thành "Lên lịch" → bấm. Không bật "Quảng bá", không bật "Tạo bài viết quảng cáo". Kiểm tra bài xuất hiện đúng ngày giờ trong Lịch nội dung.
6. Notion: Trạng thái `Đã lên lịch` (đăng ngay thì `Đã đăng`), ghi giờ vào Ngày đăng, link nếu đọc được. Board `dang-bai | done | Đã lên lịch Page: <tên bài> · <dd/mm hh:mm> | 100` (đây là nguồn cho báo cáo QA cuối ngày). Đóng tab mình mở.
7. `Tra_loi`: một câu ngắn "Đã lên lịch <tên bài> lúc <giờ> trên Page Vít media" + link Notion. Không hỏi duyệt.
Gặp lỗi (không thấy nút, Facebook đổi giao diện, ảnh không lên): thử lại tối đa 2 lần, đọc trang bằng chữ; vẫn lỗi thì để Notion `Đã duyệt` + Ghi chú lỗi, Board `dang-bai | waiting | Hỏi chủ: <lỗi>`, báo trong `Tra_loi`.
Sau lần chạy đúng đầu tiên: ghi đúng tên nút / thứ tự bấm đã chạy vào mục "Bài học từ việc thật" của `dang-bai.md` để lần sau nhanh hơn.

Không được: đăng lên Page Hoàng Hà Makeup khi chủ chưa giao rõ; tự nghĩ bài mới để đăng khi chủ không giao; ghi giá / số liệu / thông tin khách chưa xác nhận; xoá hay sửa bài cũ trên Page; bấm quảng cáo, "Đẩy bài", thanh toán.
Nguồn: 15/11/2026 · chủ: "Đăng bài lần sau không phải hỏi lại, chỉ cần thông báo lại bên QA vào cuối ngày hoặc khi tôi hỏi".
