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

## Việc thường trực mỗi ngày: 30 bài nhóm (chủ giao 18/11/2026)
Chạy tự động bằng lịch `dang-nhom-hang-ngay` (8:00 và 15:00, máy phải bật, app Claude và Chrome mở). Mỗi khung **15 bài = 15 nhóm khác nhau**. Đây là việc chủ đã giao rõ, nên không cần hỏi lại số nhóm.
- **Mỗi nhóm tối đa 1 bài/ngày.** Khung chiều không đăng lại nhóm khung sáng đã đăng. Muốn biết sáng đã đăng nhóm nào thì xem Board hôm nay hoặc mục "Nhật ký ngày" cuối sổ `nhom-facebook.md`.
- **Nguồn nhóm: đọc `tri-thuc/danh-ba-nhom.md` (danh bạ 395 nhóm đã quét 18/11, chia theo nội dung, cờ ✅/⚠️/⏳/⛔); KHÔNG mở /about nữa.** Chọn nhóm theo chủ đề bài, ưu tiên ✅ đông và nhiều bài/ngày, rồi ⚠️; ⏳ chỉ khi kiểm my_pending_content thấy đã duyệt. Thứ tự cũ:
  1. Nhóm "đăng được" trong sổ.
  2. Nhóm "chờ duyệt lâu": chỉ kiểm `my_pending_content`, hết bài chờ thì đăng được.
  3. Nhóm mới trong `/groups/joins/`, có tên liên quan marketing, kinh doanh, doanh nghiệp, freelancer, AI, video, thiết kế, giáo viên/slide. Kiểm `/about` nhanh rồi ghi vào sổ.
  
  Không đủ 15 nhóm hợp lệ thì đăng bằng số nhóm có được, rồi báo số thiếu. Không đăng bừa vào nhóm cấm quảng bá.
- **Nội dung linh động**, chọn hợp với chủ đề từng nhóm:
  - (a) Chiến dịch đang chạy trên Page Vít media: xem 3–5 bài mới nhất của Page.
  - (b) Giới thiệu dịch vụ hợp với nhóm (edit video, video AI, thiết kế poster, slide), theo mẫu trong `.claude/skills/vit-media/dang-bai-facebook.md`. Viết lại câu chữ cho khác nhau giữa các nhóm, không dán y hệt 15 lần.
  - (c) Chia sẻ lại bài đã đăng trên Page vào nhóm.
  - (d) Dùng lại ảnh đã thiết kế và đã đăng Page, trong `C:\AI-Tổng\thiet-ke-bai-dang\*.png`.
  
  Bài có ảnh hay không đều được. Mọi bài phải có lời kêu gọi liên hệ: inbox Page hoặc ZAL 0945 115 516. Không bịa giá, số liệu, tên khách. Không đăng bài ngành cưới hay Hoàng Hà.
- **Mục tiêu:** khách liên hệ. Nhóm nào có người hỏi hoặc bình luận thì ghi vào sổ là "hiệu quả" để ưu tiên lần sau.
- **Xong mỗi khung:**
  - Board: `dang-bai | done | Đăng nhóm <sáng/chiều> dd/mm: X lên thẳng, Y chờ duyệt, Z bỏ | 100`.
  - Thêm dòng vào "Nhật ký ngày" của sổ nhóm, ghi tên các nhóm đã đăng.
  - Commit + push `tri-thuc/`.
- **Dừng ngay và báo chủ** (Board `waiting | Hỏi chủ: …`) khi gặp một trong các trường hợp sau:
  - CAPTCHA;
  - Facebook cảnh báo spam, hoặc chặn tính năng đăng;
  - đăng nhập bị đăng xuất;
  - quá 3 nhóm liên tiếp báo lỗi.
- **Mở máy trễ (chị dặn 18/11/2026):** lịch lỡ giờ sẽ tự chạy ngay khi mở app. Trước 15h: đăng bù phần sáng còn thiếu. Từ 15h: đăng đủ 30 bài trừ số đã đăng hôm nay, mỗi đợt tối đa 15 bài, hai đợt cách nhau ~30 phút. Sau 21h không đăng, để sáng mai. Mỗi bài cách nhau ít nhất 1 phút. Không đăng lại nhóm đã đăng trong 3 ngày gần nhất, trừ khi đã hết nhóm.
- **Đo hiệu quả (chị chốt 18/11/2026):** có lịch `theo-doi-hieu-qua-nhom` chạy 20h mỗi tối, chỉ đọc. Nhóm có khách hỏi thì đánh ⭐ trong danh bạ để ưu tiên lần sau. Bài bị gỡ thì đổi cờ thành ⛔. Khách hỏi thì giao Sales trả lời qua Board.
- **Bài chờ duyệt quá 7 ngày (chị chốt 18/11/2026):** được rút bài cũ ở các nhóm ⏳ để đăng bài mới, nhưng **hỏi chị trước mỗi lần xoá** (liệt kê nhóm, ngày đăng). Chị đồng ý mới xoá. Không tự xoá trong lịch tự chạy.
- **Đo bằng lượt xem (chị chốt 18/11/2026):** Facebook không hiện lượt xem của bài nhóm, chỉ admin nhóm thấy "Đã xem". Vì vậy mỗi khung có **ít nhất 5/15 bài là CHIA SẺ bài Page Vít media** (bài Page đăng trong 7 ngày gần nhất, hợp chủ đề nhóm). Cách làm: mở bài trên Page → "Chia sẻ" → "Chia sẻ lên nhóm" → chọn nhóm → viết 1–2 câu riêng cho nhóm, có lời mời inbox → "Đăng". Lượt xem từ nhóm được cộng vào số liệu bài Page, nên lịch 20h đọc được trong Business Suite (Nội dung → bài → lượt xem/người tiếp cận). Ghi nhật ký bài nào được chia sẻ vào nhóm nào. Lần chạy đầu: ghi đúng tên các nút vào "Bài học từ việc thật".
