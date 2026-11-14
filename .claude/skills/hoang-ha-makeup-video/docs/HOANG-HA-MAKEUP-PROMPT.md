# Prompt dựng video Hoàng Hà Makeup

Dán prompt dưới đây (sửa phần trong `< >`) khi giao việc cho Claude hoặc người dựng.

---

Dựng video dọc 1080×1920 theo phong cách Hoàng Hà Makeup (xem `styles/hoang-ha.md`).

**Chủ đề / cô dâu:** <tên cô dâu, vấn đề: mắt lệch, da ngăm, sợ trôi nền, test makeup…>
**Footage:** <thư mục clip hậu trường, ảnh tin nhắn, ảnh mẫu, clip thành phẩm>
**Voice:** <file voice hoặc lời dẫn đã viết>
**Độ dài mong muốn:** <50–60 s hoặc ~2 phút>

Yêu cầu:
1. **Hook lưới 2×2** dài 3,5–5 s: chọn 4 clip chuyển động (ưu tiên cặp tương phản trước/sau, ảnh mẫu/thực tế, tin nhắn/thành phẩm). Tiêu đề 2 dòng UTM Avo Bold Italic in hoa:
   - Dòng 1 trắng: <bối cảnh, ≤5 chữ>
   - Dòng 2 đỏ viền trắng trên dải trắng: <câu hỏi/ý đắt, ≤5 chữ, kết bằng ? hoặc !>
   Pop khi dòng 2 bật, whoosh khi tiêu đề rút. **Giữ lưới thêm 0,5–0,8 s không chữ rồi mới vào thân.**
2. **Thân**: cắt theo voice, xen rộng – cận thao tác – phản ứng – thành phẩm; không để khoảng lặng.
3. **Phụ đề**: 1FTV VIP Lilita One, trắng, bóng nhẹ, chữ thường, chạy theo cụm lời, đặt ~76% chiều cao.
4. **Chữ nhấn**: 1FTV VIP Lilita One in hoa nghiêng, trắng, không viền dày, bóng đen (opacity 49%, blur 21%, khoảng cách 8, góc −45°), đặt 1/4 trên khung, bật 0,3–0,5 s + pop + rung nhẹ 4–6 px tắt dần trong 0,3–0,4 s. Chỉ 1–3 cụm đỏ `#E31B23` (cùng kiểu bóng) cho ý thật đắt: <liệt kê nếu có>.
5. **SFX**: pop ở chữ bật (mốc −25 dB), whoosh khi chuyển ý/chuyển hình, ding khi lộ thành phẩm.
6. **Kết**: chậm lại 2–4 s ở cảnh thành phẩm/cô dâu ngày cưới, câu chốt thương hiệu.

Trả về: file .mp4, danh sách chữ nhấn + mốc thời gian, và ảnh khung hình kiểm tra.

---

## Mẫu tiêu đề hook đã dùng

| Dòng 1 (trắng) | Dòng 2 (đỏ) |
|---|---|
| CHỌN ĐƯỢC ẢNH RỒI | CẦN TEST NỮA KHÔNG? |
| LƯU NHIỀU ẢNH QUÁ | CHỌN SAO ĐÂY |
| GỬI ĐÚNG HÌNH | MÀ MAKE LẠI KHÁC? |
| SAU BUỔI PRE-WEDDING | SỢ MẮT TO MẮT NHỎ? |
| 1 CÁI THƠM | BAY CẢ NỀN! |

Công thức: **[tình huống cô dâu đã gặp] + [nỗi lo / nghịch lý dạng câu hỏi]**.
