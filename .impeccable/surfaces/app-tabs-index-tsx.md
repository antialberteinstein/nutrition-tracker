---
version: 1
slug: "app-tabs-index-tsx"
primary_target: "app/(tabs)/index.tsx"
related_targets: ["components/AddMealSheet.tsx"]
---

# Surface brief: Tab Hôm nay + bottom sheet ghi món

Xác nhận: 2026-11-04 (impeccable shape). Mode: **Operate**. Nền tảng: Android, Material 3. Spec: `docs/modules/MealLog.md`, `Goals.md`, `Chart.md` §4 (calo ròng).

## Người dùng và việc cần làm
- Người dùng mở app sau bữa ăn hoặc cuối ngày; liếc một lần phải biết còn bao nhiêu calo và chất nào đã vượt.
- Món quen phải ghi xong trong ≤ 3 chạm: gõ, chọn gợi ý, Lưu.
- Việc chính: FAB "+" mở bottom sheet ghi món.

## Hướng đã chọn: Vở ô ly
Lượt bốc thăm chỉ định "Hoá đơn quán"; chủ dự án chọn thẻ IMPECCABLE'S PICK. Seed: `seed:93215395558046e0`.

Thế giới hình ảnh chỉ góp 4 thứ; bố cục, điều hướng và control theo Material 3:
- **Bảng màu:**
  - giấy vở `#FBFBFE` (nền);
  - mực tím `#4B2E83` (màu chính, số calo);
  - tím ô ly `#B9B3E6` (đường kẻ, viền);
  - lề đỏ `#D9473F` (chỉ cho trạng thái vượt);
  - mực chữ `#1F1A2E`.

  **Dynamic Color tắt.** Giao diện tối thiết kế riêng ("trang vở dưới đèn bàn"), không đảo màu tự động.
- **Chữ:** Roboto theo thang chữ M3, chữ số đều bề ngang; không dùng font viết tay.
- **Mật độ:** đơn vị 8 dp, giữa các khối 32 dp, dòng danh sách ≥ 48 dp.
- **Dấu ấn riêng: cột lề đỏ.** Cột lề 40 dp bên trái, vạch đỏ mảnh để mờ; nội dung căn theo lề. Dấu trạng thái ("!" vượt ngưỡng, cảnh báo) chỉ nằm trong lề.
- **Nguyên tắc giữ lại từ các hướng bị loại:**
  - vạch dung lượng calo dài cố định, không dùng vòng tròn (từ cassette j-card);
  - mỗi chất một màu cố định, dùng giống nhau ở mọi nơi (từ sổ tay có tab);
  - thang cỡ cố định: Calo cỡ Display, chất cỡ Title, dòng món cỡ Body (từ bản đồ sao).
- **Cấm:** lưới ô ly làm nền, font viết tay, vòng tiến độ, streak, huy hiệu, emoji, nền giấy kem, lời khen hay lời trách.

## Bố cục và tương tác
- **Top app bar:** nút "‹", ngày, nút "›" (khoá khi đang ở hôm nay). Bấm vào ngày mở date picker M3, ngày tương lai bị vô hiệu. Có chip "Hôm nay" khi xem ngày khác.
- **Thứ tự, căn theo lề:**
  1. tiêu đề ngày;
  2. khối Calo: số lớn / mục tiêu, vạch dung lượng, dòng "Còn X kcal" hoặc "Vượt X kcal";
  3. 3 hàng chất: nhãn, giá trị / mục tiêu kèm đơn vị, vạch mảnh;
  4. danh sách món: tên, kcal căn phải, dòng phụ có đạm, natri, đường kèm đơn vị.
- **Vượt ngưỡng:** giá trị chuyển đỏ, "!" trong lề, chữ "Vượt 350 mg". Màu không phải kênh duy nhất.
- **Bật Workout:** khối calo hiện 3 dòng Nạp / Tiêu hao / Ròng; Ròng có thể âm.
- **Bottom sheet ghi món:**
  - ô tên được focus sẵn, bàn phím mở ngay;
  - tối đa 5 gợi ý ngay dưới ô (tên + kcal); chọn gợi ý thì 4 ô số tự điền;
  - chip ngày; nút Lưu (filled);
  - sheet nằm trên bàn phím (IME insets);
  - Back lần lượt: đóng bàn phím → đóng gợi ý → hỏi "Bỏ món này?".
- **Sửa và xoá:** bấm vào dòng món mở sheet ở chế độ sửa; xoá có dialog xác nhận. **Không có Hoàn tác sau khi lưu** (chủ dự án chốt).
- **Chuyển động:** theo chuẩn M3; số không chạy đếm; tôn trọng cài đặt tắt hiệu ứng. Edge-to-edge; vùng chạm ≥ 48 dp.

## Trạng thái và khoảng dữ liệu
- Chưa có món: "Chưa có món nào cho ngày này" + "Thêm món"; tổng hiện 0 / mục tiêu.
- 3–6 món mỗi ngày, tối đa khoảng 15. Tên tối đa 100 ký tự, xuống 2 dòng. Tổng tối đa 5 chữ số ("12.345").
- Đang tải: skeleton. Lỗi tải: thông báo + "Thử lại".
- Đang lưu, hoặc mất mạng khi lưu: sheet vẫn mở, giữ dữ liệu, không báo thành công giả.

## Quyết định còn mở (chốt lúc build)
- Màu cụ thể của đạm, natri, đường, và bảng màu tối, trong phạm vi bảng màu vở.

## Kiểm tra
- Ảnh chụp từ `scripts/run-test.sh` (`reports/`), hoặc ảnh chủ dự án gửi. Agent không tự chạy `adb` hay máy ảo.
- Direction contract ghi vào brief này lúc bắt đầu build. DESIGN.md viết sau build, dựa trên giao diện đã làm thật.
