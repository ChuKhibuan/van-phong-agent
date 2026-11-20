# Công thức: Báo giá có thiết kế (chị dạy 20/11/2026)

Chuỗi: **Báo giá → Thiết kế → QA → Giao hàng & CSKH**. Mỗi phòng xong thì ghi Board `done`, `handoff_to` = phòng sau, và nhắn thẳng phòng sau kèm đường dẫn file.

## Tư liệu gốc (máy chủ)
- `D:\2.Vid media\Tư liệu thiết kế vít media\Thiết kế file báo giá\mẫu.jpg`: mẫu báo giá chuẩn, **làm y hệt bố cục này**.
- `...\Thiết kế file báo giá\logo.png`: logo VÍT MEDIA (chữ V xanh + tam giác cam). Thư mục cha có thêm `bảng màu.png`, `số đt.png`.

## Bố cục mẫu (khổ ngang ~4:3, nền trắng ánh xanh nhạt)
1. Góc trái: logo + "VÍT MEDIA / VIDEO · AI · DESIGN". Góc phải: nhãn bo tròn xanh nhạt ghi loại dịch vụ.
2. Tiêu đề lớn: "BÁO GIÁ" xanh đậm + tên dịch vụ xanh sáng; dòng mô tả ngắn; gạch xanh ngắn.
3. Ba cột gói: **BASIC** (tiết kiệm – nhanh gọn), **STANDARD** (nổi bật, nền xanh đậm cho ô giá, nhãn vương miện "ĐƯỢC LỰA CHỌN NHIỀU NHẤT"), **PREMIUM** (cao cấp – ấn tượng). Mỗi cột: giá to dạng 4.500.000đ + đơn giá quy đổi trong ngoặc, 4 dòng có dấu tích xanh, đáy "Số lần chỉnh sửa: 1 / 2 / 3 lần".
4. Dải 3 ô thông tin có icon (đầu vào, chất lượng xuất file, thời gian thực hiện).
5. Khung **LƯU Ý** 4 gạch đầu dòng: phạm vi giá áp dụng, khách cung cấp gì, chưa bao gồm gì, báo giá riêng khi nào.

## Từng phòng
- **Báo giá**: tính 3 gói theo `vit-media/dinh-gia.md` + `kien-thuc/tiep-nhan.md`; viết đủ chữ cho mọi ô của mẫu. Không ghi STK. Con số là đề xuất, chị duyệt.
- **Thiết kế**: dựng đúng bố cục mẫu, đúng logo, màu, Zalo 0945 115 516 nếu có chỗ; xuất PNG.
- **QA**: so với mẫu và `vit-media/dinh-gia.md` mục IX (đủ 3 gói, phép tính khớp, số lần sửa, chữ đọc được trên điện thoại); đạt thì ghi `waiting` chờ chị duyệt.
- **Giao hàng & CSKH**: soạn tin gửi khách kèm ảnh báo giá; chỉ gửi khi chị duyệt.
