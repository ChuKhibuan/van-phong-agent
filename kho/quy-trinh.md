# Quy trình liên phòng

Các phòng nối với nhau theo chuỗi dưới đây (cũng có trong `config.js` → `flows`). Mỗi phòng làm xong thì ghi Board `done` với `handoff_to` = phòng kế tiếp; phòng kế tiếp chỉ bắt đầu khi đã nhận việc.

Chủ chỉ làm việc trực tiếp với **Bộ não** (ra lệnh, dạy) và **QA · Kiểm duyệt** (duyệt, sửa kho). Việc nào cần chủ duyệt đều dồn về QA trước.

| Quy trình | Chuỗi phòng |
|---|---|
| Đơn dựng video | Báo giá → Bộ não → Kịch bản & phụ đề → Dựng → Thiết kế → QA → Giao hàng & CSKH → Lưu trữ → QA |
| Khách hỏi giá | Bộ não → Báo giá → QA (chờ chủ duyệt) → Bán hàng theo dõi khách |
| Đăng video mẫu | Bộ não → Kịch bản & phụ đề → Thiết kế → Đăng bài → QA |
| **Đăng bài Page** (ảnh) | Chủ đưa nội dung → Bộ não / Kịch bản & phụ đề → Thiết kế → **QA duyệt** → Đăng bài **đăng luôn** (xem mục dưới) |
| **Đăng bài Page** (video) | Chủ đưa nội dung → Bộ não / Kịch bản & phụ đề → Dựng → **QA duyệt** → Đăng bài **đăng luôn** (xem mục dưới) |

## Quy trình đăng bài Page (chủ chốt 18/11/2026)

**QA là cửa duyệt cuối cùng.** QA duyệt xong thì Đăng bài đăng luôn, không chờ chủ duyệt thêm.

1. **Chủ đưa nội dung** cho Bộ não hoặc phòng Kịch bản & phụ đề (ý bài, ảnh / clip gốc, giờ đăng nếu có).
2. **Kịch bản & phụ đề** viết caption, chữ trên ảnh / phụ đề (theo `tri-thuc/cong-thuc/viet-bai-page-theo-anh.md`, chân bài cố định), tạo dòng Notion "Lịch đăng" (Trạng thái `Nháp`), gửi phiếu bàn giao.
3. **Thiết kế** (bài ảnh) hoặc **Dựng** (bài video) làm theo phiếu, gắn **link sản phẩm** (Canva / Drive / file xuất) vào đúng dòng Notion, đổi Trạng thái `Chờ duyệt`, giao QA (Board `done` → `qa`).
4. **QA soát**: caption + ảnh / video + chân bài + đúng Page + không giá / số liệu / thông tin khách chưa xác nhận + chính tả + **ảnh có ý tưởng hình mới, khớp kịch bản** (so với 3 ảnh Page gần nhất: cùng bố cục / cùng hình chính mà chỉ đổi chữ → trả lại Thiết kế).
   - **Không đạt** → Board `done` với `handoff_to` = `thiet-ke` hoặc `dung`, task `Trả lại: <lỗi cụ thể, sửa gì>`; Notion về `Nháp`, ghi lỗi vào `Ghi chú`. Thiết kế / Dựng **làm lại**, gắn **link mới / ảnh mới** vào Notion, đổi lại `Chờ duyệt`, gửi lại QA. Lặp tới khi đạt.
   - Trả lại quá 2 lần cùng một bài → QA ghi `waiting` `Hỏi chủ: <bài> – <vướng gì>` và dừng.
   - **Đạt** → Notion `Đã duyệt` (Ghi chú "QA duyệt <ngày>"), Board `qa | done | QA duyệt: <bài> | 100 | dang-bai`.
5. **Đăng bài** nhận bài `Đã duyệt` là **đăng ngay** lên Page Vít media (chủ có hẹn giờ thì lên lịch đúng giờ đó) theo `tri-thuc/cong-thuc/len-lich-page.md`; Notion `Đã đăng` / `Đã lên lịch` + link bài; Board `dang-bai | done`.
6. QA gửi chủ **báo cáo đăng bài lúc 22:00** (bài nào, lúc nào, bị trả lại mấy lần). Chủ hỏi lúc nào thì trả lời lúc đó.

Không cần chủ duyệt từng bài. Chỉ dừng hỏi chủ khi: thiếu nội dung / ảnh gốc, QA trả lại quá 2 lần, hoặc bài nói về giá, khuyến mãi, cam kết chưa có trong kiến thức.
| Tính hoa hồng CTV | Báo giá → Quản lý CTV → QA (chờ chủ duyệt) |
| Học kiến thức mới | Bộ não → Lưu trữ → QA |

## Trả lại và sửa

- QA thấy lỗi: ghi `done` với `handoff_to` = phòng cần sửa, task bắt đầu bằng `Trả lại:`.
- Phòng nhận sửa xong thì giao lại cho QA, **kèm link / ảnh mới** (gắn vào Notion hoặc phiếu bàn giao), nói rõ đã sửa gì.
- Một việc bị trả lại quá 2 lần: QA ghi `waiting` với task `Hỏi chủ: …`.

## Chạy nối tiếp và phiếu bàn giao

Các phòng trong một chuỗi **chuyền tay nhau ngay trong cùng một lượt**: phòng trước xong thì Bộ não giao luôn cho phòng sau, không chờ chủ nhắn lại, không chờ lượt Routine sau. Chuỗi chỉ dừng khi tới QA (chờ chủ duyệt) hoặc khi thật sự thiếu thứ từ chủ.
Ví dụ: chủ nhắn "làm bài đăng giới thiệu dịch vụ edit video" → Kịch bản viết ý chính, chữ trên ảnh, caption → Thiết kế dựng ảnh trên Canva theo đúng chữ đó → QA soát (không đạt thì Thiết kế làm lại, gửi link mới) → QA duyệt → Đăng bài đăng luôn.

Mỗi phòng làm xong viết một **phiếu bàn giao** ngắn (đặt trong kết quả trả về Bộ não và ghi tóm tắt vào task Board). Phòng sau **chỉ cần đọc phiếu này** cộng kiến thức của chính mình, không đọc lại cả hội thoại hay việc của phòng trước (rẻ token, không lệch ý):

```
PHIẾU BÀN GIAO · <phòng trước> → <phòng sau> · <tên việc>
Thương hiệu / kênh: <Vít media | Hoàng Hà Makeup> · <nhóm FB, Page, TikTok…>
Sản phẩm bàn giao: <link Doc / Canva / Drive, đường dẫn trên máy>
Ý chính phải giữ: <hook, thông điệp, chữ đã chốt — nguyên văn nếu là chữ đưa lên ảnh/video>
Định dạng: <kích thước, thời lượng, số phương án>
Chủ đã chốt: <điều chủ dặn, cấm>
Cần ở phòng sau: <làm gì, xong giao ai>
Còn thiếu: <thứ chưa có; không có thì để trống>
```

Chữ đã chốt ở Kịch bản (hook, tiêu đề, caption) là **nguyên văn**: Thiết kế và Dựng dùng đúng chữ đó, không tự viết lại; thấy sai thì ghi vào "Còn thiếu" và trả lại Kịch bản.

## Kiến thức chảy xuôi theo chuỗi

Điều một phòng học được mà **phòng sau trong chuỗi cũng cần** (ví dụ Kịch bản học "hook ≤ 7 chữ" → Thiết kế, Dựng cần để đặt chữ) thì ghi thêm một dòng ngắn vào `tri-thuc/kien-thuc/<phòng sau>.md`, mục `## Nhận từ phòng khác`: `- (dd/mm/yyyy · từ <phòng>) <điều cần biết>`. Không chép nguyên file; chỉ phần phòng sau dùng tới. Trùng thì gộp.

| Phòng trước | Chảy sang | Loại kiến thức |
|---|---|---|
| Kịch bản & phụ đề | Thiết kế, Dựng, Đăng bài | hook, độ dài chữ, giọng văn, phụ đề, caption, hashtag |
| Dựng | Thiết kế, QA | tỉ lệ khung, thời lượng, vùng an toàn đặt chữ, xuất file |
| Thiết kế | Dựng, Đăng bài, QA | màu, font, mẫu ảnh bìa, kích thước theo kênh |
| Đăng bài | Kịch bản, Thiết kế | kiểu bài/nhóm nào ăn khách, quy tắc nhóm, giới hạn ký tự |
| QA | phòng bị trả lại + phòng sau nó | lỗi hay gặp, tiêu chí duyệt mới |
| Báo giá | Bán hàng, Giao hàng | gói, giá, điều kiện (đã chủ duyệt) |
