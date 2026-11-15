# Sổ hỏi đáp · câu chủ hay hỏi

Đường nhanh (Haiku) đọc file này **trước tiên** để trả lời ngay, khỏi lục lại cả kho.
Vòng nâng cấp cuối ngày (`brain/NANG-CAP.md`) tự thêm vào đây: câu hỏi chủ hỏi từ 2 lần trở lên, kèm câu trả lời đã đúng.
Giữ dưới ~60 mục. Câu trả lời chỉ ghi điều có nguồn (file trong repo, Board, chủ đã nói); thông tin hay đổi (tình trạng phòng, việc đang chờ) thì ghi **chỗ xem**, không ghi số cố định.

Mỗi mục:
```
### <câu hỏi, cách chủ hay nói>
<câu trả lời ngắn hoặc chỗ lấy câu trả lời> · nguồn: <file / ngày>
```

### Tình hình văn phòng / các phòng đang làm gì?
Đọc phần "Tình trạng các phòng" máy trực gửi kèm: liệt kê phòng đang `working` (việc gì, bao nhiêu %), phòng `waiting` (đang chờ chủ gì), còn lại Rảnh. · nguồn: tab Board

### Có việc gì đang chờ tôi duyệt không?
Các phòng `waiting` trong phần tình trạng kèm theo, cộng việc ở `qa`. Nêu từng việc và chủ cần làm gì. · nguồn: tab Board

### Phòng X làm được gì?
Tóm tắt từ dòng `description` trong `.claude/agents/<id>.md` và mục đầu của `tri-thuc/kien-thuc/<id>.md`. · nguồn: repo

### Agent có dùng được máy tính (computer use) không?
Máy trực có Chrome của chủ, Canva, Google Sheets/Drive/Docs, file trên máy. Không điều khiển được app desktop (CapCut, Zalo…): việc đó cần mở phòng trong app Claude. · nguồn: brain/TRA-LOI-NGAY.md

### Lịch đăng ở đâu? Tuần này đăng gì? Bài nào chờ duyệt?
Lịch nội dung ở Notion "Lịch đăng · Văn phòng agent" (nút 📅 Lịch đăng trên trang, hoặc https://www.notion.so/4195833762e181a5b828cfd174f61193): xem theo Lịch, Theo trạng thái, Ảnh & nội dung. Bài Page đã đặt giờ xem ở nút 📘 Lịch Page (Meta Business Suite). Đường nhanh không đọc được Notion: muốn liệt kê chi tiết thì ghi note `chuyen_lon`. · nguồn: tri-thuc/cong-thuc/lich-dang.md

### Hôm nay Đăng bài đã đăng / lên lịch gì? Báo cáo đăng bài?
Đọc phần "Việc các phòng hôm nay" máy trực gửi kèm (dòng `dang-bai`): liệt kê từng bài, kênh, đã đăng hay lên lịch mấy giờ. Đủ nội dung, ảnh: nút 📅 Lịch đăng (Notion). QA tự gửi báo cáo lúc 22:00 mỗi ngày có đăng bài. · nguồn: brain/BAO-CAO-CUOI-NGAY.md
