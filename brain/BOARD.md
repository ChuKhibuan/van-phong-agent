# Định dạng Google Sheet

Một file Google Sheet, các tab sau (tên tab viết đúng như dưới). Mẫu tiêu đề cột có sẵn trong `sheet-mau/`.

## Board — trang web đọc tab này
Chỉ **thêm dòng**, không sửa dòng cũ (lịch sử chính là khung chat của từng phòng).

| Cột | Ví dụ | Ghi chú |
|---|---|---|
| timestamp | `2026-11-14T09:05:00+07:00` | ISO 8601, lấy bằng `TZ=Asia/Ho_Chi_Minh date -Iseconds` (không đoán giờ). Cột để dạng *Văn bản thuần*. |
| agent | `kich-ban` | id phòng trong `config.js` (hoặc tên phòng). |
| status | `idle` / `working` / `done` / `waiting` | `waiting` = Chờ duyệt. |
| task | `Đơn #A12: viết kịch bản 45s` | Ngắn, tiếng Việt. |
| progress | `0`–`100` | |
| handoff_to | `dung` hoặc `sales,qa` | Khi `done`: phòng nhận việc/kiến thức. Trang web vẽ người cầm tài liệu đi sang. |

## Inbox — trang web ghi vào (qua Apps Script), Routine đọc

| timestamp | from | to | type | text | status | note |
|---|---|---|---|---|---|---|
| ISO | `ban` / id phòng | id phòng | `message` / `teach` / `handoff` / `approve` | nội dung | `new` → `processing` → `done` / `error` | lý do lỗi |

## Don_hang
`ma_don | ngay | khach | kenh_lien_he | goi | gia | han_giao | brief | ctv | trang_thai`

## Nhap_tin — tin nhắn agent soạn, chờ người duyệt và tự gửi
`timestamp | phong | khach | kenh | noi_dung | trang_thai (cho_duyet / da_duyet / da_gui)`

## Lich_dang
`ngay_gio | kenh | noi_dung | file | trang_thai | luot_xem | tin_nhan_khach`

## CTV
`ky | ctv | khach | ma_don | doanh_thu | ti_le | hoa_hong | trang_thai (de_xuat / da_duyet / da_tra)`
`da_tra` chỉ do người ghi sau khi tự chuyển khoản.

## Lấy link CSV cho trang web
Chia sẻ Sheet "Bất kỳ ai có đường liên kết — Người xem", rồi dùng:
`https://docs.google.com/spreadsheets/d/<ID>/gviz/tq?tqx=out:csv&sheet=Board`
(Hoặc *Tệp → Chia sẻ → Xuất bản lên web → tab Board → CSV*, nhưng link xuất bản có thể trễ vài phút.)
