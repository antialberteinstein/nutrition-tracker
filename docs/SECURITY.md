# Security notes — Nutrition Tracker

## Biện pháp đã triển khai
- Xác thực: Supabase Auth (email + mật khẩu, bắt buộc xác nhận email). Phiên lưu trên máy theo hướng dẫn chính thức của Supabase cho Expo, khoá đặt trong `expo-secure-store` (ADR-002). *Chưa triển khai: sẽ có ở milestone 0.1.0.*
- Phân quyền: Postgres RLS `user_id = auth.uid()` cho mọi bảng `public`, FK ghép `(user_id, id)` chặn tham chiếu chéo; service role chỉ nằm trong Edge Function `delete-account` (ADR-003). Test `supabase/tests/database/000_rls_enabled.test.sql` bắt bảng nào quên bật RLS. Mọi dữ liệu người dùng bị giới hạn theo chủ sở hữu; tham chiếu chéo tài khoản bị chặn ở tầng dữ liệu.
- Kiểm tra đầu vào: schema zod ở client + check constraint, unique, trigger ở DB (ADR-004).
- Lỗi: chỉ hiển thị thông báo đã map theo mã; không hiển thị/log payload server, token, credentials.
- Secret: chỉ biến public trong client; secret nằm ở server/vault/CI secrets.
- Log: không log dữ liệu cá nhân hoặc tài chính.

## Dependency audit
- Lệnh: `npm audit --omit=dev` (CI chạy ở chế độ cảnh báo). Ngày chạy gần nhất: chưa chạy ở mức có bản ghi; sẽ ghi khi phát hành 0.1.0.
- Cảnh báo đã biết: các cảnh báo của dependency do Expo SDK 58 ghim phiên bản; chỉ nâng cùng SDK (`npx expo install --fix`). Không dùng "fix --force" làm hạ cấp framework.

## Giới hạn vận hành
- Chưa xác minh: SMTP và giới hạn gửi email của Supabase Auth trên gói miễn phí; rate limit; cấu hình project cloud (chưa tạo); thông báo trên thiết bị thật; dữ liệu sức khoẻ chưa có chính sách quyền riêng tư vì app chưa lên store.
