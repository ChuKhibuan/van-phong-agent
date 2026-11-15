# Quy trình liên phòng

Các phòng nối với nhau theo chuỗi dưới đây (cũng có trong `config.js` → `flows`). Mỗi phòng làm xong thì ghi Board `done` với `handoff_to` = phòng kế tiếp; phòng kế tiếp chỉ bắt đầu khi đã nhận việc.

Chủ chỉ làm việc trực tiếp với **Bộ não** (ra lệnh, dạy) và **QA · Kiểm duyệt** (duyệt, sửa kho). Việc nào cần chủ duyệt đều dồn về QA trước.

| Quy trình | Chuỗi phòng |
|---|---|
| Đơn dựng video | Báo giá → Bộ não → Kịch bản & phụ đề → Dựng → Thiết kế → QA → Giao hàng & CSKH → Lưu trữ → QA |
| Khách hỏi giá | Bộ não → Báo giá → QA (chờ chủ duyệt) → Bán hàng theo dõi khách |
| Đăng video mẫu | Bộ não → Kịch bản & phụ đề → Thiết kế → Đăng bài → QA |
| Bài đăng ảnh | Bộ não → Kịch bản | Bài đăng ảnh | Bộ não → Kịch bản & phụ đề (ý, chữ trên ảnh, caption) → Thiết kế (ảnh) → QA → Đăng bài | phụ đề (ý, chữ trên ảnh, caption) → Thiết kế (ảnh) → Đăng bài (bài chủ giao: tự đăng / lên lịch, QA báo cáo cuối ngày; bài agent tự đề xuất: qua QA chờ duyệt) |
| Video ngắn / video AI | Bộ não → Kịch bản & phụ đề (kịch bản, phụ đề) → Dựng (video) → Thiết kế (ảnh bìa, chữ tiêu đề) → QA → Đăng bài |
| Tính hoa hồng CTV | Báo giá → Quản lý CTV → QA (chờ chủ duyệt) |
| Học kiến thức mới | Bộ não → Lưu trữ → QA |

## Trả lại và sửa

- QA thấy lỗi: ghi `done` với `handoff_to` = phòng cần sửa, task bắt đầu bằng `Trả lại:`.
- Phòng nhận sửa xong thì giao lại cho QA.
- Một việc bị trả lại quá 2 lần: QA ghi `waiting` với task `Hỏi chủ: …`.

## Chạy nối tiếp và phiếu bàn giao

Các phòng trong một chuỗi **chuyền tay nhau ngay trong cùng một lượt**: phòng trước xong thì Bộ não giao luôn cho phòng sau, không chờ chủ nhắn lại, không chờ lượt Routine sau. Chuỗi chỉ dừng khi tới QA (chờ chủ duyệt) hoặc khi thật sự thiếu thứ từ chủ.
Ví dụ: chủ nhắn "làm bài đăng giới thiệu dịch vụ edit video" → Kịch bản viết ý chính, chữ trên ảnh, caption → Thiết kế dựng ảnh trên Canva theo đúng chữ đó → QA soát → chờ chủ duyệt → Đăng bài.

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
