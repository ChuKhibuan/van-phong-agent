# Lịch đăng (Notion)

Khi nào dùng: mọi bài sẽ đăng (nhóm, Page, TikTok): soạn mới, lên lịch, đăng xong; chủ hỏi "lịch đăng tuần này", "bài nào chờ duyệt".
Nơi lưu: Notion database **Lịch đăng · Văn phòng agent** (riêng tư của chủ). Data source `collection://41958337-62e1-81f7-b386-000b0d5d2cda`; trang `https://www.notion.so/4195833762e181a5b828cfd174f61193`. Trang web văn phòng có nút "📅 Lịch đăng" mở thẳng trang này.
Công cụ: Notion (`mcp__claude_ai_Notion__*`, tìm bằng ToolSearch "notion create-pages query-data-sources update-page"). Chỉ máy trực có Notion; Routine trên cloud không có thì ghi vào `Nhap_tin` như cũ và để `cho_may`.
Phòng: Kịch bản, Thiết kế, Dựng, Đăng bài, QA cùng ghi vào **một dòng** cho mỗi bài · Subagent: không cần riêng.

Cột: `Bài` (tên ngắn) · `Ngày đăng` (giờ VN) · `Trạng thái` · `Kênh` (Nhóm Facebook / Page Vít media / Page Hoàng Hà Makeup / TikTok) · `Thương hiệu` · `Nơi đăng` (tên nhóm/Page) · `Nội dung` (caption **nguyên văn**) · `Ảnh` / `Link ảnh / thiết kế` (Canva, Drive) · `Link bài đã đăng` · `Phòng làm` · `Ghi chú`.

Trạng thái đi theo chuỗi:
1. `Ý tưởng` / `Nháp` — Kịch bản tạo dòng: tên bài, kênh, nội dung nguyên văn, ngày dự kiến.
2. Thiết kế / Dựng thêm `Link ảnh / thiết kế` vào **đúng dòng đó** (không tạo dòng mới).
3. `Chờ duyệt` — QA soát xong; chủ duyệt bằng cách đổi sang `Đã duyệt` trên Notion hoặc nhắn duyệt ở phòng QA.
4. `Đã lên lịch` — bài Page đã đặt giờ trong Meta Business Suite (khi chủ đã dạy cách đăng Page).
5. `Đã đăng` — điền `Link bài đã đăng` (nhóm không đọc được link thì ghi tên nhóm vào `Nơi đăng`, "chờ admin duyệt" vào `Ghi chú`). `Bỏ` — kèm lý do.

Quy tắc:
- Một bài = một dòng; đăng cùng nội dung vào nhiều nhóm vẫn một dòng, liệt kê nhóm trong `Nơi đăng`.
- Trước khi tạo dòng: tìm theo tên bài (query data source) để khỏi trùng.
- Chỉ đăng bài `Đã duyệt` (hoặc chủ nhắn giao đăng rõ ràng). Không tự đổi sang `Đã duyệt`.
- Trả lời chủ trong `Tra_loi`: kèm link Notion của dòng vừa tạo/sửa.
- Không ghi số điện thoại, thông tin khách vào Notion (số Zalo của VÍT MEDIA trong bài là của doanh nghiệp, được phép).
Nguồn: 15/11/2026 · chủ yêu cầu ô kết nối Notion + lịch Page trên trang web.
