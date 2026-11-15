# Kho tài liệu trên Google Drive

Tài liệu công việc (file thật: báo giá, kịch bản, thiết kế, hồ sơ đơn, bản tin skill…) lưu trong thư mục Drive của chủ tên **`1.1 AI bộ nhớ`**.
Repo `kho/` chỉ giữ mục lục, quy trình và skill dạng chữ; file và thông tin khách nằm trên Drive.

Tìm thư mục bằng công cụ Google Drive: `title = '1.1 AI bộ nhớ' and mimeType = 'application/vnd.google-apps.folder'`, rồi tìm thư mục con theo tên (`parentId = '<id>'`).
Không ghi ID thư mục hay link Drive vào repo (repo công khai).

## Cây thư mục

| Thư mục | Đựng gì | Ai đặt file vào |
|---|---|---|
| `00 · Chờ QA duyệt` | Mọi file mới, chưa duyệt | Lưu trữ (và các phòng khi giao sản phẩm) |
| `01 · Skill & kiến thức` | Bản chụp skill và kiến thức, mỗi thứ Bảy một thư mục `yyyy-mm-dd` | Bộ não (vòng nâng cấp) |
| `02 · Bản tin nâng cấp skill` | Bản tin mỗi ngày: hôm nay các phòng học được gì | Bộ não (vòng nâng cấp) |
| `03 · Quy trình & mẫu` | Quy trình, mẫu brief, mẫu tin nhắn, checklist | QA chuyển từ `00` |
| `04 · Hồ sơ công việc` | `yyyy-mm/<mã việc> – <tên ngắn>/`: brief, kịch bản, bản dựng, thiết kế, biên bản QA | QA chuyển từ `00` |
| `05 · Kinh doanh (báo giá, khách)` | `yyyy-mm/`: báo giá, tin nhắn khách đã duyệt | QA chuyển từ `00` |
| `06 · Vận hành (CTV, giao hàng)` | `yyyy-mm/`: bảng tính công CTV đã duyệt, biên bản giao, thanh toán | QA chuyển từ `00` |
| `07 · Tài liệu chủ gửi` | `yyyy-mm/`: file chủ gửi kèm lệnh, tài liệu dạy | Lưu trữ |
| `Danh mục tài liệu` (Google Sheet, tab `Danh_muc`) | Mỗi file một dòng | Ai đặt file thì thêm dòng; QA cập nhật trạng thái |

Thư mục con theo tháng (`2026-11`) hay theo mã việc chưa có thì tạo mới (mimeType `application/vnd.google-apps.folder`).

## Đặt tên file

`yyyy-mm-dd · <phòng> · <loại> · <tên ngắn>`, ví dụ `2026-11-15 · tiep-nhan · bao-gia · Đơn A21 video 30s`.
Loại: `brief`, `kich-ban`, `phu-de`, `dung`, `thiet-ke`, `qa`, `bao-gia`, `tin-nhan`, `ctv`, `giao-hang`, `ho-so`, `skill`, `ban-tin`, `tai-lieu`.

Nội dung chữ thì tạo Google Doc (`create_file` với `textContent` và `contentMimeType: text/markdown`, Drive tự chuyển thành Doc). Bảng số thì dùng `text/csv` (thành Google Sheet).

## Danh mục (`Danh_muc`)

Cột: `ngay | phong | loai | ten | link | thu_muc | ma_viec | trang_thai | ghi_chu`.
`trang_thai`: `cho_duyet` → `da_duyet`, hoặc `tra_lai`, `thay_the` (đã có bản đính chính), `luu_cu`.
Chỉ thêm dòng; QA được sửa cột `trang_thai`, `thu_muc`, `ghi_chu`.

## Quyền

- **Lưu trữ** và các phòng: chỉ tạo file mới trong `00 · Chờ QA duyệt` (và `07` cho file chủ gửi). Không sửa, không di chuyển, không xoá file đã có.
- **QA**: kiểm tra file ở `00`, đúng thì chuyển (`update_file` với `parentId`) vào đúng thư mục và đổi `trang_thai = da_duyet`; sai thì `tra_lai` kèm lý do ở `ghi_chu`.
- Đính chính: QA tạo bản mới tên thêm `(đính chính dd/mm)`, đánh dấu bản cũ `thay_the`, ghi một dòng vào `kho/dinh-chinh.md`. Không xoá bản cũ.
- Không agent nào xoá hay chuyển file vào thùng rác, không đổi quyền chia sẻ.

## Thông tin khách

- Repo: tuyệt đối không ghi số điện thoại, số tài khoản, giấy tờ, địa chỉ của khách.
- Drive: chủ đã chọn **giữ chia sẻ bằng link** cho thư mục `1.1 AI bộ nhớ` (15/11/2026), nên KHÔNG lưu số điện thoại, số tài khoản, giấy tờ, địa chỉ của khách vào bất kỳ file nào trên Drive. Chỉ ghi tên gọi ngắn hoặc mã đơn (`#A…`). Không hỏi lại chủ về việc chuyển chế độ chia sẻ.
- Cần thông tin liên hệ của khách thì ghi "xem trong Zalo/tin nhắn gốc" thay vì chép số.
