# Văn phòng agent

Một văn phòng 3D isometric chạy trên trình duyệt. Mỗi phòng là một AI agent (Claude), làm việc theo lịch trên cloud.
Ở giữa là **Bộ não**: bạn dạy trực tiếp cho nó, nó tóm tắt thành **skill** và chia kiến thức, chia việc cho các phòng.
Khi giao việc, bạn thấy một nhân viên cầm tài liệu đi theo hành lang hoặc cầu thang sang phòng nhận.

```
                 Khu Sản xuất
       Kịch bản & phụ đề ─ Dựng ─ Thiết kế
               │           │          │
Khu      Bán hàng ──── BỘ NÃO ──── QA · Kiểm duyệt
Kinh doanh     │           │          │
         Đăng bài ──── Tiếp nhận ─ Giao hàng & CSKH
                           │
                      Quản lý CTV        Khu Vận hành
```

## Cấu trúc

| Thư mục / file | Vai trò |
|---|---|
| `config.js` | **File cấu hình duy nhất**: các phòng, khu, lối đi, quy trình, nguồn dữ liệu. |
| `index.html`, `css/`, `js/` | Trang web tĩnh (Three.js qua CDN, không cần build). |
| `js/data.js` | Lớp dữ liệu: Google Sheet CSV, dữ liệu mẫu, khung WebSocket. Đổi nguồn không phải sửa giao diện. |
| `.claude/skills/bo-nao/` | **Bộ não dạng skill**: `SKILL.md` + `kien-thuc/` (kiến thức chung và từng phòng). Routine tự cập nhật sau mỗi bài dạy. |
| `.claude/agents/` | 10 subagent, mỗi phòng một file (vai trò, quy tắc, cổng duyệt). |
| `brain/ROUTINE.md` | Prompt dán vào Claude Code Routine. |
| `brain/BOARD.md` | Định dạng các tab Google Sheet. |
| `apps-script/Code.gs` | Hộp thư nhận tin từ trang web vào tab Inbox (tuỳ chọn). |
| `sheet-mau/` | Tiêu đề cột mẫu cho từng tab. |
| `chay-thu.ps1` | Chạy thử tại máy Windows, không cài gì. |

## 1. Xem thử ngay (dữ liệu mẫu)

Chuột phải `chay-thu.ps1` → **Run with PowerShell**, rồi mở http://localhost:8080.
Chưa có link Sheet thì trang tự chạy **dữ liệu mẫu**: các quy trình trong `config.flows` chạy vòng lặp,
Bán hàng và Quản lý CTV dừng ở **Chờ duyệt** (demo tự duyệt sau 25 giây, hoặc bấm "Duyệt việc này").

Thao tác: kéo để xoay (trong góc giới hạn), cuộn / chụm hai ngón để phóng to, chuột phải kéo để dời.
Bấm phòng hoặc nhân viên → khung chat: trạng thái, tiến độ, lịch sử, lệnh gợi ý, **Giao việc sang…**.
Ở phòng Bộ não có thêm chế độ **Dạy kiến thức**.

Góc trên phải: về góc nhìn ban đầu · sáng/tối/tự động · giảm chuyển động · chất lượng (tắt bóng đổ cho máy yếu) · cài đặt nguồn dữ liệu.

## 2. Đưa lên mạng (miễn phí)

- **GitHub Pages**: đẩy thư mục này lên một repo → Settings → Pages → Deploy from branch `main`, thư mục `/`.
- **Netlify**: kéo thả thư mục vào app.netlify.com/drop.

## 3. Nối Google Sheet (bảng trạng thái)

1. Tạo Google Sheet, các tab `Board`, `Inbox`, `Don_hang`, `Nhap_tin`, `Lich_dang`, `CTV` (tiêu đề cột trong `sheet-mau/`).
   Cột `timestamp` của Board đặt định dạng *Văn bản thuần*.
2. Chia sẻ "Bất kỳ ai có đường liên kết — Người xem".
3. Dán vào `config.js` → `data.csvUrl`:
   `https://docs.google.com/spreadsheets/d/<ID>/gviz/tq?tqx=out:csv&sheet=Board`
   (hoặc dán trong nút Cài đặt trên trang — chỉ lưu ở trình duyệt đó).
4. (Tuỳ chọn) Để nút Gửi / Dạy / Giao việc / Duyệt ghi thẳng vào Sheet: cài `apps-script/Code.gs` theo hướng dẫn trong file,
   dán URL `/exec` vào `data.inboxUrl` và KEY vào `data.inboxKey`.
   Chưa cài thì trang chép lệnh vào clipboard để bạn tự dán vào tab Inbox.

> Lưu ý: ai có link Sheet sẽ đọc được Board. Đừng để thông tin nhạy cảm (số điện thoại khách, số tài khoản) trong tab Board.

## 4. Bật Bộ não trên cloud (Claude Code Routine)

1. Đẩy repo này lên GitHub (cần có `.claude/` để Routine thấy skill và subagent).
2. Tạo Routine tại claude.ai/code (hoặc gõ `/schedule` trong Claude Code), chọn repo, bật connector **Google Sheets**.
3. Dán nội dung `brain/ROUTINE.md`, điền ID Sheet. Lịch gợi ý: mỗi giờ trong giờ làm việc.
4. Để Bộ não **tự cập nhật skill**, Routine cần quyền push lên nhánh chính (mặc định Routine chỉ đẩy lên nhánh `claude/…`;
   bật tuỳ chọn cho phép push ở phần cài đặt repo của Routine, hoặc định kỳ merge nhánh đó).

Trang web chỉ đọc Board mỗi 5–10 giây, nên chấp nhận trễ: Routine chạy theo lịch, ghi Board, trang web tự vẽ hoạt ảnh.

## Dạy Bộ não

Mở phòng **Bộ não** → **Dạy kiến thức** → gõ, ví dụ:
"Gói dựng video cưới 60 giây giá 1.500.000đ, giao trong 3 ngày, sửa miễn phí 2 lần."

Lượt chạy kế tiếp, Bộ não:
1. Tóm tắt thành quy tắc ngắn, ghi vào `SKILL.md` (mục Kiến thức cốt lõi) và `kien-thuc/sales.md`, `tiep-nhan.md`, `giao-hang.md`.
2. Ghi nhật ký học, commit.
3. Ghi Board `bo-nao | done | Học: … | 100 | sales,tiep-nhan,giao-hang` → trên trang bạn thấy 3 nhân viên cầm tài liệu đi sang 3 phòng.

## Hai phòng có cổng duyệt

- **Bán hàng**: agent chỉ soạn báo giá và tin nhắn khách → trạng thái **Chờ duyệt**. Bạn đọc trong tab `Nhap_tin`, bấm **Duyệt** trên trang, rồi tự gửi cho khách.
- **Quản lý CTV**: agent tính hoa hồng và đề xuất → **Chờ duyệt**. Trả tiền và ký thoả thuận luôn do người làm.
- Giao hàng & CSKH cũng soạn sẵn tin nhắn để bạn duyệt ở giai đoạn đầu.

## Thêm phòng mới

Trong `config.js`:
1. Chép một khối trong `rooms`, đổi `id`, `name`, `zone`, `x`, `z`, `level`, màu, `staff`, `props`, `suggestions`.
2. Thêm dòng vào `links` nối với phòng kề bên, ví dụ `['qa', 'phong-moi', 'stairs']`.
3. (Cho bộ não) thêm `.claude/agents/<id>.md` và `.claude/skills/bo-nao/kien-thuc/<id>.md` — có thể chép từ phòng tương tự.

Gợi ý vị trí: các phòng cách nhau 11 m theo x hoặc z. Mỗi `level` cao 1,6 m; hai phòng khác tầng sẽ tự có cầu thang.

## Đổi nguồn dữ liệu sau này

Mọi nguồn chỉ cần trả về các dòng `{ timestamp, agent, status, task, progress, handoff }`.
`js/data.js` đã có `SheetSource`, `MockSource` và khung `WebSocketSource` (`source: 'ws'`, `wsUrl`).
Notion: viết thêm một lớp tương tự đọc database qua một proxy nhỏ, giao diện không phải sửa.

## Hiệu năng

Toàn bộ khối tĩnh gộp thành 1 mesh màu đỉnh; người, mèo, cây, màn hình dùng InstancedMesh → khoảng 20 draw call, ~27 nghìn tam giác.
Máy yếu: bấm nút chất lượng để tắt bóng đổ và giảm độ phân giải. Có nút giảm chuyển động (tự bật nếu hệ điều hành đang bật).
