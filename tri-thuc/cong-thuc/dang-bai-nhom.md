# Đăng bài lên nhóm Facebook (Page Vít media)

Khi nào dùng: chủ nhắn rõ "đăng N nhóm" / "đăng bài lên nhóm …" cho VÍT MEDIA. Chỉ chạy trên máy trực (cần Chrome của chủ).
Cần có: số nhóm (chủ giao rõ). Thiếu số nhóm → không đăng, hỏi trong `can_chu`. Nội dung bài: mẫu bài ngắn (<300 ký tự) trong `.claude/skills/vit-media/dang-bai-facebook.md`, hoặc bài chủ gửi.
Phòng: `dang-bai` · Subagent: không (tự làm theo công thức này).
Đọc: `tri-thuc/nhom-facebook.md` (sổ nhóm: đăng được / chờ duyệt / bỏ hẳn, đã kiểm thì không kiểm lại) và `tri-thuc/kien-thuc/dang-bai.md` mục "Bài học từ việc thật" (cách đăng chắc ăn). Không đọc thêm file khác.
Các bước:
1. Board `dang-bai | working | Đăng N nhóm | 0`.
2. Chọn nhóm: ưu tiên nhóm "đăng được" trong sổ `nhom-facebook.md`; bỏ nhóm "bỏ hẳn"; nhóm đã có kết luận thì KHÔNG kiểm lại. Chỉ với nhóm mới / "kiểm lại" mới làm tiếp, với mỗi nhóm: `/groups/<id>/about` (cấm quảng bá, cấm SĐT → bỏ) và `my_posted_content` + `my_pending_content` (đã đăng hôm nay / còn bài chờ cùng chủ đề → bỏ).
3. Đăng: bấm "Bạn viết gì đi..." → focus textbox trong hộp thoại → `computer type` → kiểm tra bằng JS chỉ trả true/false (nội dung khớp, hộp thoại có "Vít media") → bấm "Đăng". Không tìm thấy ô đăng thì dừng nhóm đó, không gõ. Đọc trang bằng `get_page_text` / `find`, hạn chế chụp màn hình.
4. Mỗi bài một nhóm, một lần/ngày. Không đăng lên Page (chủ chưa dạy cách đăng Page).
5. Cập nhật dòng bài trên Notion theo `lich-dang.md` (`Đã đăng`, nơi đăng, ghi chú). Xong: Board `dang-bai | done | Đăng N nhóm: <lên thẳng / chờ duyệt> | 100`, rồi `idle`. Ghi nhóm mới bị bỏ / lên thẳng / chờ duyệt vào sổ `tri-thuc/nhom-facebook.md` (một dòng một nhóm: tên/id, kết luận, lý do, ngày).
Kết quả: `Tra_loi` liệt kê theo tên nhóm: lên thẳng / chờ admin duyệt / bỏ (lý do). Facebook không cho đọc link bài nên báo theo tên nhóm.
Không được: đăng khi chủ chưa giao rõ; đăng lại cùng nhóm trong ngày; bình luận / nhắn tin cho ai.
Nguồn: 15/11/2026 · chủ cho phép đăng nhóm trực tiếp, cách đăng đã chạy đúng.
