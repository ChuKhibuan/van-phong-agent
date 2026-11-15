# Soạn tin nhắc khách

Khi nào dùng: chủ bảo "nhắc khách …", hoặc Routine thấy việc tồn (khách chưa chốt quá 3 ngày, đơn đã giao chưa thanh toán).
Cần có: khách nào, đang ở bước nào (từ tab `Nhap_tin` / Board / lời chủ). Không rõ khách hoặc số tiền → hỏi chủ, không đoán.
Phòng: chưa chốt → `sales`; đã giao chưa thanh toán → `giao-hang` · Subagent: không.
Đọc: `tri-thuc/kien-thuc/sales.md` hoặc `tri-thuc/kien-thuc/giao-hang.md` (giọng văn, mẫu tin). Không đọc thêm.
Các bước:
1. Board phòng đó `working | Soạn tin nhắc <khách viết tắt> | 0`.
2. Soạn 1 tin ngắn, lịch sự, đúng giọng thương hiệu; không ghi giá / số tiền nếu chưa có nguồn.
3. Ghi vào tab `Nhap_tin` trạng thái `cho_duyet`, ghi nơi gửi dự kiến.
4. Board phòng đó `done | handoff_to qa`; Board `qa | waiting | Chờ chủ duyệt tin nhắc <khách> | 100`.
Kết quả: `Tra_loi` nói đã soạn, nằm ở `Nhap_tin` dòng nào, chờ chủ duyệt ở QA.
Không được: tự gửi cho khách; ghi số điện thoại, số tài khoản khách vào Sheet / repo.
Nguồn: brain/ROUTINE.md bước 4 (quy định sẵn của văn phòng).
