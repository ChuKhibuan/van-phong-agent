# Quy trình liên phòng

Các phòng nối với nhau theo chuỗi dưới đây (cũng có trong `config.js` → `flows`). Mỗi phòng làm xong thì ghi Board `done` với `handoff_to` = phòng kế tiếp; phòng kế tiếp chỉ bắt đầu khi đã nhận việc.

Chủ chỉ làm việc trực tiếp với **Bộ não** (ra lệnh, dạy) và **QA · Kiểm duyệt** (duyệt, sửa kho). Việc nào cần chủ duyệt đều dồn về QA trước.

| Quy trình | Chuỗi phòng |
|---|---|
| Đơn dựng video | Báo giá → Bộ não → Kịch bản & phụ đề → Dựng → Thiết kế → QA → Giao hàng & CSKH → Lưu trữ → QA |
| Khách hỏi giá | Bộ não → Bán hàng → QA (chờ chủ duyệt) |
| Đăng video mẫu | Bộ não → Kịch bản & phụ đề → Thiết kế → Đăng bài → QA |
| Tính hoa hồng CTV | Báo giá → Quản lý CTV → QA (chờ chủ duyệt) |
| Học kiến thức mới | Bộ não → Lưu trữ → QA |

## Trả lại và sửa

- QA thấy lỗi: ghi `done` với `handoff_to` = phòng cần sửa, task bắt đầu bằng `Trả lại:`.
- Phòng nhận sửa xong thì giao lại cho QA.
- Một việc bị trả lại quá 2 lần: QA ghi `waiting` với task `Hỏi chủ: …`.
