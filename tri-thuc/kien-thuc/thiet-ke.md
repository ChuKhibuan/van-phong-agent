# Thiết kế

Bảng màu, font, mẫu thumbnail/ảnh bìa, logo.

<!-- Bộ não tự ghi vào đây. Mỗi dòng: - (dd/mm/yyyy) nội dung -->
- (14/11/2026) Chữ trên video cô dâu: UTM Avo Bold Italic cho hook; 1FTV VIP Lilita One cho phụ đề và chữ nhấn; đỏ nhấn #E31B23 (xem skill hoang-ha-makeup-video).
- (14/11/2026) Hoàng Hà V2 (mục 4, 6, 7): lưới 2×2, chữ nhấn 1FTV VIP Lilita One (không Montserrat), bóng 49% · 21% · 8 · −45° là thông số CapCut (không tự đổi blur 21% thành 21 px), chữ nhấn đặt theo từng cảnh, không che mặt. Thiếu font thì báo rõ, không âm thầm thay.
- (15/11/2026) Nhận phiếu bàn giao từ Kịch bản (ý tưởng/kịch bản cho Page VÍT MEDIA) thì làm ảnh/video theo nhận diện VÍT MEDIA, chuyển QA chờ chủ duyệt. VÍT MEDIA là công ty chính; Hoàng Hà chỉ là một khách hàng.
- (14/11/2026) VÍT MEDIA: logo V xanh + play cam + wordmark navy + tagline VIDEO · AI · DESIGN; màu #0C2F8F #1593FF #FF8A00 #F6F9FF; font Montserrat ExtraBold / Be Vietnam Pro / SVN-Gilroy (xem `vit-media`).
- (14/11/2026) Tư duy poster, ẩn dụ thị giác, bản sắc Việt: skill `so-tay-thiet-ke` (93 bài học, tìm theo từ khoá trong `so-tay-day-du.md`).
- (15/11/2026) Bảng giá VÍT MEDIA (quy chuẩn v1.0): nền trắng/xanh rất nhạt #F6F9FF, tiêu đề navy #0C2F8F in hoa Montserrat/Be Vietnam Pro ExtraBold, giá nổi nhất (ExtraBold, dạng 10.000.000đ), gói Standard dùng xanh sáng #1593FF để nổi, cam #FF8A00 tiết chế. Logo góc trên trái, đúng tỷ lệ; thiếu file logo chuẩn thì để chỗ trống, không vẽ lại. Tránh nhiều icon, 3D, neon, chữ nhỏ, nhồi quyền lợi.
- (15/11/2026) Bố cục bảng giá VÍT MEDIA đầy đủ ở `vit-media/dinh-gia.md` mục VII: ngang ~16:9, 4 khu (header, 3 cột, thông tin thực hiện, lưu ý); 3 cột cao bằng nhau; Standard viền xanh sáng, ô giá nền xanh chữ trắng, nhãn "GÓI ĐỀ XUẤT" hoặc "PHÙ HỢP NHẤT" (không ghi "được chọn nhiều nhất"); mỗi cột 4–6 quyền lợi cụ thể; chỉ dùng dấu check tròn xanh nhỏ; xuất PNG chất lượng cao.

## Bài học từ việc thật
- (18/11/2026 · chủ sửa) Mỗi bài Page phải có **ý tưởng hình mới khớp kịch bản / caption** của bài đó. KHÔNG dùng lại ảnh / HTML bài trước rồi chỉ thay chữ (bài tổng kết 21/11 đã bị lỗi này: dùng lại bố cục bài Video AI). Chỉ **bộ nhận diện thương hiệu** (logo, 4 màu, font, chân Zalo) và **phong cách** Vít Media (sạch, công nghệ, kính / gradient xanh) là quy chuẩn; **không có mẫu bố cục cố định**: hình chính, ẩn dụ, bố cục, khổ ảnh thiết kế mới theo chủ đề từng bài (tra `so-tay-thiet-ke`). Ghi "Ý tưởng hình: …" vào phiếu bàn giao trước khi làm; xong so với 3 ảnh Page gần nhất, giống bố cục thì làm lại.
<!-- Vòng nâng cấp cuối ngày ghi vào đây. Mới nhất ở trên. Mỗi dòng: - (dd/mm/yyyy · nguồn) bài học -->
- (15/11/2026 · deck VinFast HRM) Canva MCP rất tốn ngữ cảnh: mỗi edit-design trả về cả trang (15–25k token). Gộp mọi thao tác của 1 trang vào 1 lần gọi; chỉ đọc design_content khi cần và lọc từ file kết quả bằng PowerShell (máy không có Python).
- (15/11/2026 · deck VinFast HRM) Deck nhập từ ảnh (thẻ là ảnh cắt rời) thì không đổi màu/chữ được, chỉ thay nền, khung, dải trang trí. Báo trước cho chủ biết làm được tới đâu rồi mới làm.
- (15/11/2026 · deck VinFast HRM) Chèn ảnh vào Canva: ảnh dán trong chat không thành file trên máy → nhờ chủ tải lên Canva, rồi list-folder-items "uploads" → update_fill/insert_fill. Ảnh lớn bị crop mất chủ thể thì chỉnh bằng crop_media.
- (15/11/2026 · deck VinFast HRM) Text box co giãn tự nhiên bị co lại sau format_text, chữ không xuống dòng → resize_element lại width ngay.
- (15/11/2026 · deck VinFast HRM) Phong cách "tạp chí xanh" chủ thích: nền trắng/xanh rất nhạt #F5F8FF, mảng xanh chéo #2A4FD8 + dải mờ #A9BEFF (opacity 0.6), gạch dưới tiêu đề, nhãn chương xanh, slide kết nền xanh chữ trắng. Luôn sửa trên bản sao, giữ nguyên bản gốc.

## Nhận từ phòng khác
<!-- Điều phòng trước trong chuỗi đã học mà phòng này cần. Mỗi dòng: - (dd/mm/yyyy · từ <phòng>) nội dung -->
- (15/11/2026 · chủ dặn) Kịch bản làm xong thì chuyển thẳng sang phòng này kèm phiếu bàn giao (`kho/quy-trinh.md`); chữ Kịch bản đã chốt (hook, tiêu đề, chữ trên ảnh, caption) dùng nguyên văn.
- (18/11/2026 · bài đăng video AI) Bài đăng tĩnh làm bằng code (HTML → PNG qua Chrome headless) rẻ token, đúng logo/màu; phong cách kính trong + mảng xanh chéo + thanh liên hệ kính. Sổ tay đầy đủ: `C:\AI-Tổng\thiet-ke-bai-dang\SO-TAY-thiet-ke-bai-dang-bang-code.md`, mẫu `video-ai.html`.
- (18/11/2026 · làm lại ảnh tổng kết 20/11) Thay ảnh bài đã lên lịch trong Business Suite: Đã lên lịch → "..." → Quản lý bài viết (bấm mũi tên) → Chỉnh sửa bài viết → xoá ảnh cũ → "Thêm ảnh/video" → file_upload cần ô input ẩn: chèn JS ghi đè `HTMLInputElement.prototype.click` để gắn input file vào body, rồi `find` lấy ref → upload → "Lên lịch" (giữ nguyên caption, giờ). Ảnh mới 4:5 1080x1350 được chấp nhận.
