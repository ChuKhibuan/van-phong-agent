# Tổng kết khách tuần: bao nhiêu khách nhắn, bao nhiêu khách chốt, vì sao chưa chốt

Khi nào dùng: lịch `tong-ket-khach-tuan` chạy 17:00 Chủ nhật hằng tuần, hoặc khi chị bảo "tổng kết khách tuần", "tỉ lệ chốt". Chị giao ngày 20/11/2026.
Phòng: `sales` (chịu trách nhiệm chính về khách mới và khách chốt), phối hợp Giao hàng & CSKH · Subagent: không.
Đọc: file này, mục VÍT MEDIA trong `tri-thuc/kien-thuc/sales.md` và `tri-thuc/kien-thuc/giao-hang.md` (bảng doanh thu, nhãn Zalo).
Tuần tính từ thứ Hai 00:00 đến Chủ nhật 17:00 (giờ VN).

## Nguồn số liệu (chỉ đọc, không sửa)
- **Khách nhắn (khách mới liên hệ):** tab `Nhap_tin` của Sheet văn phòng, dòng `giao-hang` có "Zalo người lạ" trong tuần. Đếm theo **tên khách**, mỗi khách 1 lần. Cộng thêm khách mới trong các dòng Board `giao-hang | waiting | Cần chị: …`. Bỏ spam, quảng cáo, CTV, khách cũ quay lại (ghi riêng).
- **Khách chốt:** khách **đã cọc** (cọc 50%; không cọc thì chưa tính). Lấy từ tab `Khách lẻ` của bảng doanh thu tháng ("DS video -t<tháng>", tìm trên Drive): cột G có "cọc …" hoặc cột D DONE, tên khách mới trong tuần. Đối chiếu tên với danh sách khách nhắn. Khách chốt mà không thấy trong danh sách nhắn thì ghi "nguồn khác".
- **Khách từ bình luận dạo:** đếm số bình luận trong tab `Cmt_dao` trong tuần (dạo / "[bài mình]"). Khách nào CSKH ghi là đến từ bài hoặc bình luận thì ghi kèm.
- Thiếu số liệu hoặc không chắc: ghi Board `sales | waiting | Hỏi CSKH: <thiếu gì>` (handoff `giao-hang`), báo cáo vẫn viết với phần đã có và ghi rõ "chưa đủ số liệu". Không đoán số.

## Phân tích
1. **Tỉ lệ chốt** = khách chốt / khách nhắn. Ví dụ chị đưa: 30 khách nhắn, 3 khách chốt (10%) là thấp, rất cần xem lại toàn bộ quy trình.
   - Từ 20% trở lên: ổn, ghi điểm làm tốt.
   - Dưới 20%: **báo động**. Xem lại quy trình từ nội dung đến báo giá, và nghi vấn chất lượng sản phẩm.
2. **Khách rơi ở bước nào:** với từng khách chưa chốt, đọc các tin trong `Nhap_tin` và xếp vào một bước:
   - (a) chỉ chào hoặc hỏi rồi im: nội dung, kênh kéo sai khách, hoặc trả lời chậm;
   - (b) im sau khi được hỏi brief: hỏi nhiều quá, hoặc khách chưa có nhu cầu thật;
   - (c) im sau báo giá, hoặc chê đắt: giá hoặc cách báo giá;
   - (d) hỏi mẫu, xem mẫu rồi thôi: **nghi vấn chất lượng hoặc portfolio**;
   - (e) đã chờ chị báo giá quá lâu: khâu báo giá nội bộ chậm;
   - (f) không rõ.
   Đếm mỗi nhóm bao nhiêu khách. Nhóm lớn nhất là nguyên nhân chính.
3. **Gợi ý sửa**, mỗi nguyên nhân 1–2 việc cụ thể, giao đúng phòng:
   - (a) → Kịch bản, Đăng bài, Bán hàng (cmt dạo)
   - (b) → Giao hàng & CSKH (kịch bản trả lời)
   - (c), (e) → Báo giá và chị
   - (d) → Dựng, Thiết kế, QA
   Không bịa số liệu. Không kết luận chất lượng kém nếu chưa có khách nào nói vậy: chỉ ghi "nghi vấn, cần chị xem".

## Gửi kết quả
1. Viết `tri-thuc/tong-ket/khach-tuan-<yyyy-mm-dd>.md` (ngày Chủ nhật), gồm:
   - Số khách nhắn, số khách chốt, tỉ lệ chốt.
   - So với tuần trước (nếu đã có file tuần trước).
   - Bảng khách chưa chốt và bước rơi. Chỉ ghi tên Zalo, **không ghi SĐT/STK**.
   - Nguyên nhân chính và việc giao từng phòng.
2. **Vào skill:** mỗi phòng được giao việc, thêm 1 dòng vào mục `## Bài học từ việc thật` của `tri-thuc/kien-thuc/<phòng>.md`. Mẫu dòng: `- (dd/mm/yyyy · tổng kết khách tuần) <bài học/việc cần đổi>`.
3. **Báo Bộ não:** append `Inbox!A1`: `[timestamp, "sales", "bo-nao", "message", "Tổng kết khách tuần dd/mm: X nhắn, Y chốt (Z%). Nguyên nhân chính: … Việc giao: … File: tri-thuc/tong-ket/khach-tuan-<ngày>.md", "new", ""]`. Bộ não chia việc cho các đội liên quan.
4. **Báo chị:** append Board:
   - Tỉ lệ dưới 20%: `sales | waiting | Cần chị: tỉ lệ chốt tuần Z% (Y/X), đề xuất xem lại … | 100 | qa`.
   - Không thì: `sales | done | Tổng kết khách tuần dd/mm: Y/X chốt (Z%) | 100`.
5. Commit các file trong `tri-thuc/` (message `sales: tổng kết khách tuần dd/mm`, kết thúc bằng dòng `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`), `git pull --no-rebase`, `git push origin HEAD:main`.

Không được: nhắn khách, sửa bảng doanh thu, ghi SĐT/STK/địa chỉ khách vào repo, tự hạ giá hay hứa khuyến mãi.
Nguồn: 20/11/2026 · chị giao trực tiếp cho phòng Bán hàng.
