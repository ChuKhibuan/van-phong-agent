# QA · Kiểm duyệt

Checklist kiểm tra trước khi giao: đúng brief, chính tả phụ đề, âm thanh, định dạng, tên file.

<!-- Bộ não tự ghi vào đây. Mỗi dòng: - (dd/mm/yyyy) nội dung -->
- (14/11/2026) Checklist video cô dâu lấy theo styles/hoang-ha.md của skill hoang-ha-makeup-video.
- (14/11/2026) Hoàng Hà V2 (mục 11): checklist đầy đủ trong `kien-thuc-HH-MAKEUP-V2.md`. Chỉ kiểm tra ảnh tĩnh thì ghi rõ "đã kiểm tra hình tĩnh; chưa xác minh chuyển động và âm thanh". Trả đúng phòng sửa, không bắt dựng lại phần đã đạt.
- (14/11/2026) Ấn phẩm VÍT MEDIA: đúng logo gốc, đúng màu, đúng số Zalo 0945 115 516. Ấn phẩm văn hoá Việt: kiểm tra biểu tượng đúng dịp, đúng tên (sổ tay thiết kế).
- (14/11/2026) Bài đăng / bình luận VÍT MEDIA chờ duyệt: dưới 300 ký tự, đúng dịch vụ, không giá chưa xác nhận, không nhắm nhu cầu cưới, có ghi nơi đăng.
- (15/11/2026) Báo giá/bảng giá VÍT MEDIA: kiểm theo mục IX của `vit-media/dinh-gia.md` (đủ 3 gói, phép tính khớp, ghi số lần sửa, giới hạn tạo lại cảnh AI, đúng hình thức sản xuất, không hứa quá, chữ đọc được trên điện thoại).

## Bài học từ việc thật
<!-- Vòng nâng cấp cuối ngày ghi vào đây. Mới nhất ở trên. Mỗi dòng: - (dd/mm/yyyy · nguồn) bài học -->
- (18/11/2026 · chủ dạy) CHECKLIST 8 điểm cho bài đăng Page Vít media (Kịch bản viết theo, QA duyệt theo; không đạt điểm nào thì trả lại): (1) Đúng mục tiêu: nêu rõ bài nhằm tăng nhận diện / chia sẻ kiến thức / tạo thảo luận / giới thiệu năng lực / tìm khách; không rõ mục tiêu thì không duyệt. (2) Đúng đối tượng: viết cho một nhóm người xem cụ thể (chủ shop, SME, giáo viên, sinh viên, người làm marketing), không viết chung chung. (3) Tiêu đề thu hút: ngắn, có trọng tâm, đặt vấn đề đáng quan tâm; không giật tít, không hứa điều nội dung không chứng minh được. (4) Nội dung có giá trị thật: có góc nhìn, kiến thức, giải pháp hoặc bằng chứng cụ thể; không chỉ lặp "AI nhanh – tiết kiệm – chuyên nghiệp". (5) Đúng nhận diện VÍT MEDIA: tên, logo, hệ màu, font, tối giản; Hotline/Zalo cố định 0945 115 516 phải chính xác. (6) Thiết kế hỗ trợ thông điệp: một điểm nhấn chính, chữ dễ đọc trên điện thoại, bố cục cân đối, không thêm chi tiết chỉ để lấp chỗ trống. (7) Trung thực và an toàn: không bịa dự án, đánh giá khách, giá, số liệu, khả năng AI; kiểm tra quyền dùng ảnh, nhạc, tư liệu. (8) CTA hợp nội dung: bài bán hàng có chỉ dẫn liên hệ rõ; bài kiến thức / thảo luận có thể kết bằng câu hỏi, không ép nhắn tin.
- (15/11/2026 · việc thật) Khi chào chủ, đánh số danh sách việc chờ: chủ trả lời theo số (vd "1." kèm nội dung, hay chỉ "Đăng vào nhóm" cho câu hỏi đang mở) và QA tự hiểu là trả lời việc nào, không hỏi lại.
- (15/11/2026 · việc thật) Chủ dán phần tài liệu dạy còn thiếu ngay ở QA: QA ghép vào skill (vd `vit-media/dinh-gia.md`), cập nhật kiến thức các phòng dùng nó, ghi `kho/dinh-chinh.md` và "Mới cập nhật", push, rồi nhắn từng phòng liên quan đọc bản mới.
- (15/11/2026 · việc thật) Chủ duyệt nơi đăng chung chung ("đăng vào nhóm", không tên nhóm): đổi Nhap_tin `da_duyet`, ghi rõ cột kênh (hội nhóm đúng chủ đề, cho phép quảng bá, dưới tên Page Vít media), Board `done` cho Đăng bài; người đăng chọn nhóm theo `dang-bai-facebook.md`, không bắt chủ kể tên nhóm.
- (15/11/2026 · máy chủ) Máy chủ Windows không có Python/Node: sửa file bằng công cụ Edit, không dùng script. `TZ=Asia/Ho_Chi_Minh date` trong Git Bash trả giờ UTC; lấy giờ VN bằng `date -u -d '+7 hours' +%Y-%m-%dT%H:%M:%S+07:00`. Thư mục Drive `00 · Chờ QA duyệt` có thể trống; vẫn kiểm mỗi lượt.
- (14/11/2026 · việc thật) Bản nháp thiếu thông tin chủ phải chốt (nơi đăng, giá) thì ghi `waiting` kèm câu `Hỏi chủ:` cụ thể, đối chiếu mẫu skill (độ dài, số liên hệ, không giá/cam kết) trước khi chuyển chủ.

- (15/11/2026 · chủ chốt) Bài Page 9h 16/11 "Thiết kế thế nào mới là ĐẸP?": giữ bản đã lên lịch (chân trang cũ), không sửa; rút kinh nghiệm cho bài sau dùng chân trang mẫu mới. QA chỉ báo chủ kết quả lên lịch vào cuối phiên trong ngày, không chặn Đăng bài lên lịch sẵn bài chủ đã giao.
