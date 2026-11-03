# Reminders — Module breakdown

> Trạng thái: **Đã duyệt 2026-11-04**. Milestone 0.1.0. Đặc tả cuối cùng vẫn là `docs/RequirementsOutline.md` §3.5 và §4. Cách gửi (lên lịch ngay trên máy hay đẩy qua Firebase FCM từ server) **chốt ở ADR**; module này chỉ mô tả hành vi người dùng thấy được. Nhắc lịch tập nằm ở `Workout.md`.

## 1. Khả năng cần đạt
- Người dùng nhận một thông báo mỗi ngày, vào giờ đã chọn, nhắc ghi bữa ăn.
- Người dùng bật/tắt và đổi giờ nhắc trong Cài đặt.
- Bấm vào thông báo thì app mở tab Hôm nay, ở ngày hôm nay.
- Người dùng biết khi app không có quyền gửi thông báo, và biết cách cấp quyền.

## 2. Người dùng và màn hình
- **Sau Onboarding:** hộp thoại "Nhắc bạn ghi bữa ăn lúc 20:00 mỗi ngày?" với hai nút "Bật" và "Để sau". Chọn "Bật" thì app xin quyền thông báo của hệ điều hành.
- **Cài đặt › Nhắc nhở:**
  - công tắc "Nhắc ghi bữa ăn";
  - ô giờ (`HH:mm`, bước 5 phút);
  - dòng trạng thái quyền: "Đã cho phép" hoặc "Bị chặn trong cài đặt hệ thống", kèm nút "Mở cài đặt".
- **Nội dung thông báo:** tiêu đề "Ghi bữa ăn hôm nay", nội dung "Bạn đã ghi những gì mình ăn hôm nay chưa?".

## 3. Luồng và trạng thái
1. Bật công tắc → nếu chưa có quyền thì xin quyền.
   - Được cấp → lưu cài đặt và lên lịch.
   - Bị từ chối → công tắc quay về tắt; hiện trạng thái "Bị chặn" kèm nút "Mở cài đặt".
2. Đổi giờ → hủy lịch cũ, lên lịch mới. Giờ mới có hiệu lực ngay trong hôm nay nếu chưa qua.
3. Tắt công tắc → hủy mọi thông báo nhắc ghi chép trên máy.
4. Đăng nhập trên máy mới → đọc cài đặt từ server; lên lịch lại nếu cài đặt đang bật và máy đã có quyền.
5. Đăng xuất → hủy thông báo trên máy đó.
6. Thu hồi quyền trong hệ điều hành → lần sau mở Cài đặt › Nhắc nhở thì hiện "Bị chặn".

## 4. Quy tắc nghiệp vụ cố định
- Mặc định của tài khoản mới: **tắt**, giờ 20:00. Chỉ bật khi người dùng đồng ý.
- Mỗi ngày gửi tối đa một thông báo nhắc ghi chép, hẹn theo giờ của máy. **Không cam kết đúng giờ:** hệ điều hành có thể gửi trễ, và việc này được chấp nhận khi chưa dùng Firebase FCM (ADR-006). Đổi múi giờ thì giờ hẹn theo múi giờ mới sau lần mở app kế tiếp.
- Nhắc mỗi ngày, kể cả khi hôm đó đã ghi món (đã chốt 2026-11-04).
- Bấm vào thông báo → tab Hôm nay, ngày hôm nay. App đang đóng thì mở app trước.

## 5. Hợp đồng dữ liệu
| Thực thể.trường | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `user_settings.user_id` | uuid | khoá chính, cascade | RLS chủ sở hữu |
| `user_settings.log_reminder_enabled` | boolean | mặc định `false` | |
| `user_settings.log_reminder_time` | time | mặc định `20:00`; phút là bội số của 5 | giờ địa phương |
| `user_settings.workout_enabled` | boolean | mặc định `false` | dùng từ 0.2.0 |
| `user_settings.workout_digest_time` | time | mặc định `06:00` | dùng từ 0.2.0 |
| `user_settings.updated_at` | timestamptz | server gán | |

- Nếu ADR chọn đẩy từ server qua FCM, sẽ cần thêm bảng `device_tokens` (`user_id`, `token`, `platform`, `timezone`) và một job hẹn giờ. Việc này được ghi ở ADR, không ở đây.

## 6. Nâng cấp và giới hạn
- Thông báo chỉ hoạt động trên máy đã đăng nhập và đã cấp quyền.
- Trên một số máy Android, chế độ tiết kiệm pin có thể làm thông báo đến trễ. Cần ghi lại kết quả kiểm tra trên thiết bị thật.

## 7. Tiêu chí nghiệm thu
| Mã | Tình huống | Kết quả |
|---|---|---|
| REM-01 | Tài khoản mới hoàn tất Onboarding, chọn "Để sau" | Nhắc nhở vẫn tắt; không xin quyền |
| REM-02 | Bật nhắc, cấp quyền, đặt giờ hiện tại + 2 phút (cần thiết bị) | Nhận **một** thông báo, không sớm hơn giờ hẹn. Được phép trễ; ghi lại độ trễ để tham khảo |
| REM-03 | Bấm vào thông báo khi app đang đóng (cần thiết bị) | App mở ở tab Hôm nay, ngày hôm nay |
| REM-04 | Từ chối quyền khi bật | Công tắc tắt; hiện "Bị chặn" và nút "Mở cài đặt" |
| REM-05 | Đổi giờ từ 20:00 sang 21:00 (cần thiết bị) | Không nhận thông báo theo giờ hẹn 20:00; nhận một thông báo từ 21:00 trở đi |
| REM-06 | Tắt nhắc nhở (cần thiết bị) | Không nhận thông báo nào nữa |
| REM-07 | Đổi cài đặt, tắt app mở lại; đăng nhập trên máy thứ hai | Cài đặt giữ nguyên; máy thứ hai có cùng cài đặt |
| REM-08 | Đăng xuất (cần thiết bị) | Máy đó không nhận thông báo nhắc nữa |
| REM-09 | Giờ có phút không chia hết cho 5, hoặc sai định dạng, gửi qua API | Server từ chối |
| REM-10 | Tài khoản B đọc hoặc sửa `user_settings` của A | RLS từ chối |
| REM-11 | Mất mạng khi lưu cài đặt | Báo lỗi; công tắc và giờ quay về giá trị đã lưu; lịch thông báo trên máy không đổi |

## 8. Bàn giao
- Migration `user_settings` kèm RLS; lớp lên lịch thông báo (theo ADR) kèm unit test tính thời điểm kế tiếp; kết quả kiểm tra trên thiết bị Android thật cho REM-02, REM-03, REM-05, REM-06, REM-08, kèm ghi chú về chế độ tiết kiệm pin.
