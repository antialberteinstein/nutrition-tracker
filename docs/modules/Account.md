# Account — Module breakdown

> Trạng thái: **Đã duyệt 2026-11-04**. Milestone 0.1.0. Đặc tả cuối cùng vẫn là `docs/RequirementsOutline.md` §3.1 và §4.

## 1. Khả năng cần đạt
- Người dùng có thể đăng ký bằng email và mật khẩu, xác nhận email, rồi đăng nhập.
- Người dùng có thể đặt lại mật khẩu qua email khi quên.
- Người dùng mới bắt buộc nhập hồ sơ (Onboarding) trước khi dùng app.
- Người dùng có thể sửa hồ sơ trong Cài đặt.
- Người dùng có thể đăng xuất, và xoá tài khoản kèm toàn bộ dữ liệu.

## 2. Người dùng và màn hình
- **Đăng nhập:** ô email, ô mật khẩu (có nút hiện/ẩn), nút "Đăng nhập", link "Quên mật khẩu", link "Tạo tài khoản".
- **Đăng ký:** email, mật khẩu, nhập lại mật khẩu. Đăng ký xong hiện màn hình "Kiểm tra email để xác nhận".
- **Onboarding:** một form cuộn. Các trường:
  - cân nặng (kg);
  - chiều cao (cm);
  - giới tính (Nam / Nữ);
  - năm sinh;
  - mức vận động: 5 lựa chọn, mỗi lựa chọn có mô tả;
  - mong muốn (Giảm cân / Giữ cân / Tăng cân).

  Nút "Tiếp tục" mở màn hình tóm tắt BMI, BMR và mục tiêu gợi ý (xem `Goals.md`), rồi nút "Bắt đầu" vào tab Hôm nay.
- **Cài đặt › Hồ sơ:** cùng các trường như Onboarding, có nút "Lưu".
- **Cài đặt › Tài khoản:** hiện email, nút "Đăng xuất", nút "Xoá tài khoản" (màu cảnh báo).
- **Trạng thái:** đang gửi (nút bị khoá và có spinner); lỗi (thông báo dưới form, giữ nguyên dữ liệu đã nhập).

## 3. Luồng và trạng thái

### 3.1. Mở app
1. Có phiên hợp lệ nhưng chưa có hồ sơ → Onboarding.
2. Có phiên hợp lệ và đã có hồ sơ → tab Hôm nay.
3. Không có phiên → Đăng nhập.

### 3.2. Đăng ký và xác nhận
1. Gửi đăng ký → Supabase gửi email xác nhận.
2. Bấm link trong email → deep link mở app → đăng nhập tự động → Onboarding.
3. Đăng nhập khi chưa xác nhận email → báo "Email chưa được xác nhận", có nút "Gửi lại email".

### 3.3. Quên mật khẩu
Nhập email → gửi link → link mở app ở màn hình "Đặt mật khẩu mới" → lưu → vào app. Email không tồn tại vẫn hiện cùng một thông báo "Nếu email tồn tại, bạn sẽ nhận được link", để không lộ email nào đã đăng ký.

### 3.4. Xoá tài khoản
Hộp thoại nêu rõ "Toàn bộ dữ liệu sẽ bị xoá vĩnh viễn" và yêu cầu nhập lại mật khẩu. Xác nhận → server xoá user cùng mọi bản ghi → app đăng xuất, về màn hình Đăng nhập. Bấm hủy thì không thay đổi gì.

### 3.5. Quay lại và hủy
- Back trên Onboarding không quay về màn hình trước. Hộp thoại hỏi "Thoát app?"; chọn thoát thì hồ sơ chưa được lưu.
- Rời Cài đặt › Hồ sơ khi đang có thay đổi chưa lưu → hỏi "Bỏ thay đổi?".
- Back khi bàn phím đang mở chỉ ẩn bàn phím.

## 4. Quy tắc nghiệp vụ cố định
- Email đúng định dạng và được trim. Mật khẩu dài từ 8 ký tự trở lên.
- Cân nặng: 20.0–300.0 kg, tối đa 1 chữ số thập phân.
- Chiều cao: số nguyên 100–250 cm.
- Năm sinh: tuổi = năm hiện tại − năm sinh, phải nằm trong khoảng 13–100.
- Giới tính: `male` hoặc `female`. Chỉ có hai giá trị vì công thức Mifflin-St Jeor cần một trong hai.
- Mức vận động và hệ số:
  - `sedentary` 1.2: ít vận động;
  - `light` 1.375: tập 1–3 buổi/tuần;
  - `moderate` 1.55: tập 3–5 buổi/tuần;
  - `active` 1.725: tập 6–7 buổi/tuần;
  - `very_active` 1.9: lao động nặng hoặc tập 2 lần/ngày.
- Mong muốn: `lose` (giảm cân), `maintain` (giữ cân), `gain` (tăng cân).
- Sửa hồ sơ thì tính lại mục tiêu **gợi ý**. Mục tiêu đã tự đặt không bị đổi (xem `Goals.md`).
- Mỗi người dùng có đúng một hồ sơ.

## 5. Hợp đồng dữ liệu
| Thực thể.trường | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `profiles.user_id` | uuid | khoá chính, FK `auth.users`, `on delete cascade` | RLS: `user_id = auth.uid()` cho select, insert, update |
| `profiles.weight_kg` | numeric(4,1) | 20.0–300.0 | check constraint |
| `profiles.height_cm` | smallint | 100–250 | |
| `profiles.sex` | text | `male` \| `female` | |
| `profiles.birth_year` | smallint | tuổi 13–100 | kiểm tra ở client và trong hàm server |
| `profiles.activity_level` | text | 5 giá trị ở §4 | |
| `profiles.goal_type` | text | `lose` \| `maintain` \| `gain` | |
| `profiles.created_at` / `updated_at` | timestamptz | server gán | |

- Migration: tạo bảng `profiles` kèm policy RLS. Xoá tài khoản chạy qua Edge Function dùng service role, chỉ xoá `auth.uid()` của chính người gọi. Validation phía client dùng chung một schema cho Onboarding và Cài đặt.

## 6. Nâng cấp và giới hạn
- Không có đăng nhập Google / Apple, không đổi được email.
- Không có lịch sử cân nặng: sửa cân nặng thì ghi đè giá trị cũ.

## 7. Tiêu chí nghiệm thu
| Mã | Tình huống | Kết quả |
|---|---|---|
| ACC-01 | Đăng ký email mới, mật khẩu hợp lệ | Hiện "Kiểm tra email"; chưa vào được app cho tới khi xác nhận |
| ACC-02 | Đăng ký email đã tồn tại / mật khẩu 7 ký tự / hai ô mật khẩu khác nhau | Không gửi; báo lỗi đúng trường; dữ liệu đã nhập được giữ |
| ACC-03 | Đăng nhập sai mật khẩu | Báo "Email hoặc mật khẩu không đúng"; không cho biết email có tồn tại hay không |
| ACC-04 | Đăng nhập lần đầu sau khi xác nhận | Vào Onboarding; không vào được tab nào khác |
| ACC-05 | Onboarding: cân nặng 19.9 / 300.1, chiều cao 99, tuổi 12 hoặc 101, bỏ trống một trường | Nút "Tiếp tục" bị khoá; lỗi hiện dưới đúng trường |
| ACC-06 | Hoàn tất Onboarding, tắt hẳn app rồi mở lại | Vào thẳng tab Hôm nay; hồ sơ còn nguyên |
| ACC-07 | Đổi cân nặng trong Cài đặt › Hồ sơ rồi lưu | Mục tiêu gợi ý được tính lại; mục tiêu tự đặt giữ nguyên |
| ACC-08 | Rời Cài đặt › Hồ sơ khi có thay đổi chưa lưu, chọn "Ở lại" | Dữ liệu đang sửa còn nguyên |
| ACC-09 | Quên mật khẩu với email không tồn tại | Hiện cùng thông báo như với email tồn tại |
| ACC-10 | Đăng xuất | Về Đăng nhập; Back không quay lại được màn hình có dữ liệu |
| ACC-11 | Xoá tài khoản, nhập đúng mật khẩu | Mọi bản ghi của user bị xoá (kiểm bằng truy vấn service role); đăng nhập lại báo sai thông tin |
| ACC-12 | Xoá tài khoản rồi bấm hủy, hoặc nhập sai mật khẩu | Không xoá gì |
| ACC-13 | Tài khoản B đọc, sửa hoặc xoá `profiles` của A qua API | RLS từ chối (0 dòng hoặc lỗi); dữ liệu của A không đổi |
| ACC-14 | Mất mạng khi lưu Onboarding hoặc hồ sơ | Báo lỗi mạng; không chuyển màn hình; dữ liệu đã nhập được giữ; bấm lại khi có mạng thì lưu một lần |
| ACC-15 | Link xác nhận và link đặt lại mật khẩu (cần thiết bị) | Mở đúng app, đúng màn hình |
| ACC-16 | Bàn phím số cho cân nặng và chiều cao; Back khi bàn phím mở (cần thiết bị) | Hiện bàn phím số; Back chỉ ẩn bàn phím |

## 8. Bàn giao
- Migration `profiles` kèm RLS; Edge Function xoá tài khoản; test RLS hai tài khoản; unit test validation; E2E từ đăng ký tới Onboarding.
- Ghi rõ phần chưa xác minh trên thiết bị thật: deep link, bàn phím.
