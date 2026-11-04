# Changelog

Mọi thay đổi đáng chú ý của Nutrition Tracker được ghi tại đây. Định dạng theo [Keep a Changelog](https://keepachangelog.com/vi/1.1.0/), phiên bản theo [Semantic Versioning](https://semver.org/lang/vi/).

<!-- Nhóm dùng trong mỗi phiên bản: ### Thêm · ### Thay đổi · ### Sửa · ### Gỡ bỏ · ### Bảo mật · ### Bảo trì · ### Ghi chú nâng cấp (migration, cần build lại, cấu hình mới) -->

## [Unreleased]

### Thêm
- Mục tiêu: màn tóm tắt BMI, BMR, TDEE và mục tiêu gợi ý ở cuối Onboarding; Cài đặt › Mục tiêu để sửa mức điều chỉnh calo và tự đặt mục tiêu calo, đạm, natri, đường, có nhãn "Tự đặt · gợi ý" và nút "Dùng gợi ý"; cảnh báo W1–W6 màu vàng ngay dưới trường, không chặn lưu ([#14](https://github.com/antialberteinstein/nutrition-tracker/issues/14)).
- Hồ sơ: màn nhập hồ sơ lần đầu (cân nặng, chiều cao, giới tính, năm sinh, mức vận động, mong muốn) và Cài đặt › Hồ sơ; kiểm tra giá trị ngay dưới từng trường, nhận dấu phẩy thập phân, hỏi trước khi thoát app hoặc bỏ thay đổi chưa lưu ([#13](https://github.com/antialberteinstein/nutrition-tracker/issues/13)).
- Tài khoản: đăng ký, xác nhận email qua deep link, đăng nhập, quên và đặt lại mật khẩu, đăng xuất; màn hình chuyển theo trạng thái phiên và hồ sơ ([#12](https://github.com/antialberteinstein/nutrition-tracker/issues/12)).
- Giao diện "Vở ô ly" trên Material 3: bảng màu sáng/tối riêng (tắt Dynamic Color), màu cố định cho từng chất, thang chữ, cột lề đỏ, icon tab Hôm nay · Biểu đồ · Cài đặt ([#11](https://github.com/antialberteinstein/nutrition-tracker/issues/11)).

- Dữ liệu ghi món: lưu món đã ăn và món đã lưu trong một giao dịch, gửi lại không ghi trùng; gợi ý món không phân biệt dấu ("bun nam" khớp "Bún nạm"), tối đa 5 gợi ý ([#15](https://github.com/antialberteinstein/nutrition-tracker/issues/15)).
- Dữ liệu hồ sơ, mục tiêu và cài đặt nhắc nhở trên Supabase; mỗi tài khoản chỉ đọc/ghi được dữ liệu của mình ([#9](https://github.com/antialberteinstein/nutrition-tracker/issues/9)).
- Tính toán dinh dưỡng: BMI (chuẩn châu Á – Thái Bình Dương), BMR Mifflin-St Jeor, TDEE, mục tiêu và ngưỡng cho calo, đạm, natri, đường, cảnh báo W1–W6 ([#10](https://github.com/antialberteinstein/nutrition-tracker/issues/10)).
- Nền app: client Supabase với phiên được mã hoá (khoá trong SecureStore), TanStack Query (mutation không tự retry) ([#8](https://github.com/antialberteinstein/nutrition-tracker/issues/8)).

### Bảo trì
- Khung repo: Expo SDK 58 (TypeScript, Expo Router, 3 tab Hôm nay · Biểu đồ · Cài đặt chưa có tính năng), Supabase local với test RLS, Jest, ESLint/Prettier, E2E Appium (Python/uv) cùng các script build APK, Metro và chạy test, CI, Dependabot.

[Unreleased]: https://github.com/antialberteinstein/nutrition-tracker/commits/main
