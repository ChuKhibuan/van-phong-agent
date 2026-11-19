# Giao hàng & CSKH

Cách gửi file, số lần chỉnh sửa miễn phí, mẫu tin nhắc thanh toán, xử lý phản hồi.

<!-- Bộ não tự ghi vào đây. Mỗi dòng: - (dd/mm/yyyy) nội dung -->
- (14/11/2026) Giao hàng & CSKH soạn sẵn mọi tin nhắn gửi khách (gửi file, nhắc thanh toán, hỏi phản hồi) để chủ duyệt rồi mới gửi. Soạn xong để status `waiting`.

- (15/11/2026) ĐÃ HỌC quy chuẩn CSKH VÍT MEDIA v1.0 (`tri-thuc/tu-van-khach-vit-media.md`, mục 6–9): khách chưa phản hồi báo giá thì chỉ một tin nhắc nhẹ sau 1–2 ngày làm việc; khách từ chối thì cảm ơn, không hỏi dồn; khách đồng ý thì xác nhận lại phạm vi + tiến độ; sửa theo số lượt trong gói, phát sinh thì báo chi phí trước; không nói đã gửi file / đã chuyển người khi chưa làm; không tự gửi số tài khoản, không nói đã nhận cọc khi chưa xác minh. Trạng thái khách: NEW → QUALIFYING → WAITING_ASSETS → READY_TO_QUOTE → QUOTED → NEGOTIATING → CONFIRMED → IN_PRODUCTION → DELIVERED → CLOSED. Vẫn soạn tin chờ chủ duyệt.
- (19/11/2026, sửa lại cùng ngày) Chị tự lo **khách cũ / khách quen**. Việc trước mắt của Giao hàng & CSKH: trả lời **"Tin nhắn từ người lạ"** trên Zalo VÍT MEDIA theo `tri-thuc/kich-ban-tra-loi-nguoi-la.md`. Có lịch tự động (scheduled task `zalo-check-nguoi-la`) mỗi 30 phút, 8:00–21:30, khi máy trực bật, từ 20/11/2026. **Ngoại lệ chị cho 19/11/2026:** với khách lạ trên Zalo được gửi thẳng (không chờ duyệt), nhắn liên tục, nhưng chỉ tới bước báo giá rồi báo chị; báo chị ngay khi khách muốn gọi điện, chi trên 1,5 triệu, khách cũ quay lại (giảm 15% do chị quyết) hoặc tình huống chưa có trong kịch bản. Cọc 50%, không cọc chưa tính là khách; STK/QR chị gửi. **STK của chị thay đổi liên tục**: không bao giờ dùng lại ảnh/số STK cũ, không lưu STK vào repo; cần thì hỏi chị STK hiện tại. Ngoài giờ để sáng hôm sau. Chi tiết ở `tri-thuc/kich-ban-tra-loi-nguoi-la.md`.
- (19/11/2026) Ngành cưới (phóng sự cưới) vẫn tính là khách **VÍT MEDIA** khi chị nói vậy (đơn Hoàng Phạm). Ảnh bill chuyển khoản chị gửi = khách đã cọc.
- (19/11/2026) Mẫu nhắc công nợ được chị duyệt: chào, nhắc "phần công nợ còn lại của đơn", xin bill để đối soát/báo kế toán, cảm ơn; không ghi số tài khoản.
- (19/11/2026) Zalo VÍT MEDIA: chủ gắn **nhãn đỏ "Khách hàng"** khi khách đã bắt đầu cọc (đôi khi quên gắn, nên vẫn đọc cả khách chưa có nhãn). Hội thoại có tên chứa **"CTV"** (kể cả biệt danh như "…_CTV") thì bỏ qua, không đọc.
- (19/11/2026) Đọc Zalo web: chỉ giữ tin từ khoảng 2 tuần trước (cũ hơn phải dùng Zalo PC); không đọc được ảnh bill, nên "đã thanh toán" chỉ suy ra từ lời nhắn ("em nhận được rồi", cảm ơn sau ảnh) và phải ghi rõ là suy đoán. Mở Zalo web ở tab mới làm tab Zalo của chủ ngừng hoạt động (chủ bấm "Kích hoạt" lại).
- (19/11/2026) Bảng doanh thu "DS video -t11", tab **Khách lẻ** (Sheet ID `1n9BrIQCk3eOhheCot6yCcRIQ55Or3YioSGP7fE_1ZNE`): cột C khách, D tiến độ (DONE / Đang làm / Chờ duyệt / Hủy), F giá, G "cọc X" (nghìn đồng). Thanh toán đủ → đổi D thành DONE. Chỉ xem khách gần nhất; chỗ nào không khớp thì báo chị, không tự sửa giá hay cọc.

## Bài học từ việc thật
<!-- Vòng nâng cấp cuối ngày ghi vào đây. Mới nhất ở trên. Mỗi dòng: - (dd/mm/yyyy · nguồn) bài học -->
- (19/11/2026 · chị sửa) Đọc Zalo bằng chữ (innerText) **không thấy ảnh** → bỏ sót bill chuyển khoản của Np Group. Trước khi kết luận hay soạn trả lời, luôn chụp màn hình đoạn cuối hội thoại để xem ảnh. Khách gửi bill thì trả lời "em nhận được bill rồi", không nói "đã nhận tiền" khi chưa kiểm tra tài khoản.
- (19/11/2026 · việc thật) Gõ tin vào Zalo web qua Chrome: **emoji làm phần chữ phía sau mất dấu cách**. Gõ tin không emoji, và đọc lại nội dung ô nhập trước khi bấm gửi. Chỉ gửi khi chị bảo gửi đúng câu đó.
