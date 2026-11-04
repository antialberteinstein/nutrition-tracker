# Changelog

Mọi thay đổi đáng chú ý của Nutrition Tracker được ghi tại đây. Định dạng theo [Keep a Changelog](https://keepachangelog.com/vi/1.1.0/), phiên bản theo [Semantic Versioning](https://semver.org/lang/vi/).

<!-- Nhóm dùng trong mỗi phiên bản: ### Thêm · ### Thay đổi · ### Sửa · ### Gỡ bỏ · ### Bảo mật · ### Bảo trì · ### Ghi chú nâng cấp (migration, cần build lại, cấu hình mới) -->

## [Unreleased]

### Thêm
- Tính toán dinh dưỡng: BMI (chuẩn châu Á – Thái Bình Dương), BMR Mifflin-St Jeor, TDEE, mục tiêu và ngưỡng cho calo, đạm, natri, đường, cảnh báo W1–W6 ([#10](https://github.com/antialberteinstein/nutrition-tracker/issues/10)).
- Nền app: client Supabase với phiên được mã hoá (khoá trong SecureStore), TanStack Query (mutation không tự retry), seed hai tài khoản E2E cho Supabase local ([#8](https://github.com/antialberteinstein/nutrition-tracker/issues/8)).

### Bảo trì
- Khung repo: Expo SDK 58 (TypeScript, Expo Router, 3 tab Hôm nay · Biểu đồ · Cài đặt chưa có tính năng), Supabase local với test RLS, Jest, ESLint/Prettier, E2E Appium (Python/uv) cùng các script build APK, Metro và chạy test, CI, Dependabot.

[Unreleased]: https://github.com/antialberteinstein/nutrition-tracker/commits/main
