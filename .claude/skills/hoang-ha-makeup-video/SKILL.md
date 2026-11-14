---
name: hoang-ha-makeup-video
description: Dựng video dọc 1080x1920 theo phong cách Hoàng Hà Makeup — kể chuyện cô dâu bằng lời dẫn tự nhiên và hình hậu trường thật, hook lưới 2x2 với tiêu đề trắng/đỏ UTM Avo Bold Italic, giữ lưới một nhịp ngắn rồi mới vào thân, phụ đề và chữ nhấn 1FTV VIP Lilita One, pop/whoosh/ding đúng nhịp. Dùng khi người dùng nhắc "Hoàng Hà", "video cô dâu", "hook 2x2", "lưới 4 clip", "tiêu đề trắng đỏ", hoặc gửi clip hậu trường makeup cô dâu cần dựng — kể cả khi không nói chữ "skill".
---

# Video Hoàng Hà Makeup

> **Khi chạy trên cloud (Routine):** không có footage, ffmpeg, font hay `assets/sfx/`. Khi đó KHÔNG dựng file video; hãy giao **bản hướng dẫn dựng**: tiêu đề hook (2–3 phương án), 4 clip đề xuất cho lưới, bảng cảnh theo từng câu, danh sách chữ nhấn + mốc thời gian + SFX, ghi chú outro. Việc xuất video làm trên máy chủ (CapCut hoặc script trong `scripts/`).

> **Chuẩn mới nhất: `kien-thuc-HH-MAKEUP-V2.md` (14/11/2026).** Khi file đó khác với hướng dẫn dưới đây hoặc `styles/`, làm theo V2. Thứ tự ưu tiên: chỉ dẫn riêng chủ chốt cho đơn hiện tại > V2 > ví dụ và script cũ. Các con số kỹ thuật trong ví dụ cũ (voice ×1.7, atempo 1.1, giảm nhạc 28–32 dB, mẫu cắt beat) chỉ là điểm thử, phải nghe và đo lại.

Đọc trước: `kien-thuc-HH-MAKEUP-V2.md`, `styles/hoang-ha.md` (quy chuẩn hình, chữ, âm) và `docs/HOANG-HA-MAKEUP-PROMPT.md` (mẫu đề bài + công thức tiêu đề). Tiết kiệm token: không xem lại video mẫu, chỉ trích khung hình khi cần kiểm tra.

## Quy trình

1. **Nắm đề**: cô dâu là ai, vấn đề gì (mắt lệch, da ngăm, sợ trôi nền, chọn ảnh mẫu…), footage ở đâu, có voice/lời dẫn chưa. **Kiểm tra có bài nhạc outro riêng cho clip này chưa — mỗi clip một bài khác; nếu người dùng quên gửi thì hỏi lại trước khi dựng.** Nhạc nền và SFX dùng bộ chuẩn (xem `styles/hoang-ha.md`, `assets/sfx/`).

2. **Viết tiêu đề hook** theo công thức `[tình huống] + [nỗi lo dạng câu hỏi]`, mỗi dòng ≤ 5 chữ. Đưa 2–3 phương án nếu người dùng chưa chốt.

3. **Chọn 4 clip cho lưới**: chuyển động, ưu tiên cặp tương phản (mộc ↔ thành phẩm, ảnh mẫu ↔ thực tế, tin nhắn ↔ cô dâu). Xem nhanh bằng 1 ảnh ghép:
   ```powershell
   & $ff -v error -y -i "<clip>" -vf "fps=1/2,scale=180:320,tile=8x2" -frames:v 1 "<sheet.jpg>"
   ```
   (`$ff` = ffmpeg trên PATH hoặc `%LOCALAPPDATA%\CapCut\Apps\<bản mới nhất>\ffmpeg.exe`.)

4. **Dựng hook**:
   ```powershell
   & "<thư mục skill>\scripts\hook_grid.ps1" -Clips a.mp4,b.mp4,c.mp4,d.mp4 -Starts 0,2.5,1,4 `
     -Line1 "Sau buổi pre-wedding" -Line2 "Sợ mắt to mắt nhỏ?" -Duration 4.5 -Gap 0.6 -AudioFrom 1 `
     -Pop "<pop.wav>" -Whoosh "<whoosh.wav>" -Out "<hook.mp4>"
   ```
   - Thứ tự ô: trên-trái, trên-phải, dưới-trái, dưới-phải.
   - `-Gap` là khoảng giữ lưới không chữ trước khi vào thân (0,5–0,8 s) — **luôn giữ**.
   - Font tự lấy `UTM AvoBold_Italic.ttf` trong Fonts người dùng; đổi bằng `-FontFile`.
   - SFX mặc định −25 dB (`-SfxDb`). Không có file pop/whoosh thì bỏ qua, ghép trong CapCut.
   - Đọc ảnh ở dòng `CHECK` để kiểm tra chữ không bị cắt, dòng 2 nằm trên dải trắng.

5. **Thân**: cắt theo voice (CapCut hoặc ffmpeg), phụ đề 1FTV VIP Lilita One trắng nghiêng ở ~76% chiều cao, **không viền, cùng bóng đen 49% / 21% / 8 / −45° như chữ nhấn**, **chữ nhấn cũng 1FTV VIP Lilita One** in hoa nghiêng ở 1/4 trên, trắng hoặc đỏ `#E31B23` **viền trắng** (tối đa 1–3 cụm đỏ), **không viền dày, chỉ bóng đen: opacity 49%, blur 21%, khoảng cách 8, góc −45°**. Không dùng Montserrat Black cho chữ nhấn. **Chữ nhấn không được che đầu khi phía trên còn trống**: trích khung hình tại lúc chữ bật, đặt riêng y cho từng chữ (cột thứ 5 trong `$emph`) vào khoảng trống trên đỉnh tóc, cách mép trên ≥ 150 px; chỉ cảnh quá cận mới cho nằm trên tóc, không đè mắt/mặt. Khi bật, chữ nhấn **rung nhẹ** 4–6 px, tắt dần trong 0,3–0,4 s (kèm pop). Lập danh sách chữ nhấn + mốc thời gian + SFX cho người dùng nếu họ dựng trong CapCut.

6. **Kết**: 2–4 s cuối chậm lại ở thành phẩm.

7. **Báo lại**: đường dẫn file, độ dài, tiêu đề đã dùng, 4 clip trong lưới, và nói rõ chỉ kiểm tra qua ảnh khung hình.

## Dựng cả clip từ voice + source (ví dụ đầy đủ chỉ có trên máy chủ)

1. **Voice**: `silencedetect=noise=-35dB:d=0.25` → giữ đoạn có lời, mỗi khoảng nghỉ còn 0,22 s, rồi `atempo=1.1` (`prep.ps1`). File voice có thể có hình vô dụng — chỉ lấy tiếng.
2. **Phụ đề**: máy không có công cụ chép lời → lấy chữ từ kịch bản .docx cùng thư mục, căn vào các đoạn có lời theo số âm tiết (DP trong `prep.ps1`, ra `words.tsv`). Tự chọn chỗ ngắt cụm (≤7 từ, không tách "chữ T", "sản phẩm", "lỗ chân lông").
3. **Chọn cảnh**: ảnh ghép 1 fps của từng source, lập bảng cảnh theo từng câu: mộc/cận da khi nói về da, cảnh rộng team khi nói "nền", phóng to (crop 1,3–1,5) vào mắt khi nói đường nét, thành phẩm khi "và đây là…".
4. **Outro**: dò BPM bài nhạc (autocorrelation onset), cắt theo nhịp 4–2–2–2–2–4–2 beat, cảnh cuối chậm 0,6×, mờ dần.
5. **Âm**: voice ×1.7 + limiter; nhạc nền lặp, ducking theo voice (sidechaincompress) tới outro; outro nhạc to lại từ đầu bài. SFX lấy từ cache CapCut (tên tra trong `draft_content.json`): Swish = whoosh, Bell 02 = ding; pop tự tạo bằng `aevalsrc`.
6. `build.ps1`: render từng cảnh ra file nhỏ (nvenc) → ghép concat → phủ PNG chữ + trộn âm trong một lần.

## Font cần có (đã cài trên máy này)

| Dùng cho | File |
|---|---|
| Tiêu đề hook | `UTM AvoBold_Italic.ttf` |
| Phụ đề | `1FTV-VIP-Lilita-One.regular.ttf` |
| Chữ nhấn | `1FTV-VIP-Lilita-One.regular.ttf` (nghiêng giả bằng shear ~0,14) |

## Ghi chú kỹ thuật

- ffmpeg của CapCut không có `drawtext`, `libass`, `boxblur`: chữ được vẽ thành PNG bằng System.Drawing rồi overlay.
- Encoder thử lần lượt libx264 → nvenc → qsv → amf → mf.
- Trong PowerShell, tên biến không phân biệt hoa thường: đừng đặt biến trùng tên tham số có kiểu (`$Red` vs `$red`).
