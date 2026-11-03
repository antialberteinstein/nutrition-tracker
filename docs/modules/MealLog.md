# MealLog — Module breakdown

> Trạng thái: **Đã duyệt 2026-11-04**. Milestone 0.1.0. Đặc tả cuối cùng vẫn là `docs/RequirementsOutline.md` §3.3.

## 1. Khả năng cần đạt
- Người dùng có thể thêm món đã ăn với tên, calo, đạm, natri, đường. Ngày mặc định là hôm nay, có thể đổi sang một ngày trước đó.
- Người dùng có thể xem các món và tổng 4 chỉ số của một ngày, so với mục tiêu.
- Người dùng có thể sửa và xoá món đã ghi.
- Khi gõ tên món, app gợi ý các món đã từng nhập; chọn một gợi ý thì tự điền dinh dưỡng của lần nhập gần nhất.
- Người dùng có thể xem và xoá danh sách món đã lưu.

## 2. Người dùng và màn hình
- **Tab Hôm nay**, theo thứ tự từ trên xuống:
  - **Thanh chọn ngày:** nút "‹" (ngày trước), ngày hiện tại dạng `dd/MM/yyyy` (bấm vào mở lịch), nút "›" (ngày sau). Nút "›" bị khoá khi đang ở hôm nay. Có nút "Hôm nay" khi đang xem ngày khác.
  - **Thẻ tổng:** mỗi chỉ số có giá trị đã nạp / mục tiêu, kèm thanh tiến độ. Thanh đổi màu khi vượt ngưỡng trên (calo dùng mốc 4000).
    - Khi bật Workout, thẻ calo hiện 3 dòng: nạp, tiêu hao, ròng.
  - **Danh sách món của ngày:** mỗi dòng có tên món, kcal, và một dòng phụ "Đạm X g · Natri Y mg · Đường Z g".
  - **Nút nổi "+":** mở form Thêm món, với ngày bằng ngày đang xem.
- **Form Thêm / Sửa món:**
  - ô tên món, kèm danh sách gợi ý ngay dưới ô;
  - 4 ô số: calo, đạm, natri, đường;
  - ô ngày;
  - nút "Lưu";
  - nút "Xoá" (chỉ khi sửa).
- **Cài đặt › Món đã lưu:** danh sách món, có ô tìm kiếm. Vuốt hoặc bấm giữ để xoá.
- **Trạng thái:**
  - ngày chưa có món: hiện "Chưa có món nào cho ngày này" kèm nút "Thêm món";
  - đang tải: khung xương (skeleton);
  - lỗi tải: thông báo kèm nút "Thử lại".

## 3. Luồng và trạng thái
### 3.1. Thêm món có gợi ý
1. Gõ từ 1 ký tự trở lên → hiện tối đa 5 gợi ý.
2. Chọn một gợi ý → tên và 4 chỉ số được điền theo giá trị lần nhập gần nhất. Người dùng vẫn sửa được.
3. Bấm "Lưu" → món được thêm vào ngày đã chọn → đóng form → danh sách và thẻ tổng cập nhật.
4. Món đã lưu được tạo mới hoặc cập nhật theo các giá trị vừa lưu (xem §4).

### 3.2. Sửa, xoá, quay lại
- Sửa món có thể đổi cả ngày; ngày mới vẫn phải là hôm nay hoặc trước đó.
- Xoá có hộp thoại xác nhận; bấm hủy thì không mất gì. Xoá món đã ghi **không** xoá món đã lưu.
- Đóng form khi có dữ liệu chưa lưu → hỏi "Bỏ món này?".
- Back khi bàn phím mở chỉ ẩn bàn phím. Back khi danh sách gợi ý đang mở thì đóng danh sách.

## 4. Quy tắc nghiệp vụ cố định
- **Tên món:** trim, gộp nhiều khoảng trắng thành một, dài 1–100 ký tự.
- **Calo:** số nguyên 0–5000. **Đạm:** 0–500 g, tối đa 1 chữ số thập phân. **Natri:** số nguyên 0–20000 mg. **Đường:** 0–500 g, tối đa 1 chữ số thập phân. Cả 4 trường đều bắt buộc; được nhập 0.
- **Ngày ghi:** ≤ hôm nay theo múi giờ của máy; ngày tương lai bị chặn cả ở client lẫn server. Không giới hạn ngày cũ nhất.
- **Thứ tự trong ngày:** theo thời điểm tạo tăng dần (do server gán). Sửa món không đổi thứ tự.
- **Món đã lưu:** mỗi người dùng có tối đa một món cho mỗi **tên chuẩn hoá** (chữ thường, bỏ dấu tiếng Việt, đ→d, gộp khoảng trắng).
  - Mỗi lần lưu một món đã ghi (thêm hoặc sửa), món đã lưu cùng tên chuẩn hoá được cập nhật: tên hiển thị, 4 chỉ số, `last_used_at`; `use_count` tăng thêm 1.
- **Gợi ý:**
  - So khớp tên chuẩn hoá của chuỗi đang gõ với tên chuẩn hoá của món đã lưu. Gõ "bun nam" khớp với "Bún nạm".
  - Thứ tự: món **bắt đầu bằng** chuỗi gõ đứng trước, rồi tới món **chứa** chuỗi gõ. Trong mỗi nhóm, `last_used_at` giảm dần. Tối đa 5 gợi ý.
- **Bản sao giá trị:** món đã ghi lưu bản sao của tên và 4 chỉ số. Sửa hoặc xoá món đã lưu không làm đổi các món đã ghi trước đó.
- **Tổng của ngày:** tổng các món có `eaten_on` bằng ngày đó.

## 5. Hợp đồng dữ liệu
| Thực thể.trường | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `meal_entries.id` | uuid | khoá chính | |
| `meal_entries.user_id` | uuid | bắt buộc, FK `auth.users` cascade | RLS chủ sở hữu (select, insert, update, delete) |
| `meal_entries.eaten_on` | date | ≤ ngày hiện tại của client, kiểm thêm ở server với dung sai +1 ngày (*) | index (`user_id`, `eaten_on`) |
| `meal_entries.name` | text | 1–100 ký tự | |
| `meal_entries.calories_kcal` | smallint | 0–5000 | |
| `meal_entries.protein_g` | numeric(4,1) | 0–500 | |
| `meal_entries.sodium_mg` | integer | 0–20000 | |
| `meal_entries.sugar_g` | numeric(4,1) | 0–500 | |
| `meal_entries.created_at` | timestamptz | server gán, không đổi khi sửa | khoá sắp xếp |
| `foods.id` | uuid | khoá chính | |
| `foods.user_id` | uuid | bắt buộc, cascade | RLS chủ sở hữu |
| `foods.name` | text | tên hiển thị gần nhất | |
| `foods.name_normalized` | text | unique (`user_id`, `name_normalized`) | dùng cho so khớp |
| `foods.calories_kcal` … `sugar_g` | như trên | | giá trị lần nhập gần nhất |
| `foods.last_used_at` | timestamptz | server gán | |
| `foods.use_count` | integer | ≥ 1 | |

(*) Server không biết múi giờ của máy, nên chỉ chặn `eaten_on` > ngày UTC hiện tại + 1. Client chặn chính xác theo múi giờ của máy.

- **Ghi đồng thời:** việc ghi món đã ghi và upsert món đã lưu chạy trong một giao dịch, thông qua một hàm RPC, để không xảy ra trường hợp chỉ một bên được ghi.
- **Chống ghi trùng:** client sinh `id` (uuid) ở phía mình, nên gửi lại sau lỗi mạng không tạo bản ghi thứ hai.

## 6. Nâng cấp và giới hạn
- Không nhập theo khẩu phần hay gram, không có cơ sở dữ liệu món ăn có sẵn.
- Danh sách gợi ý chỉ lấy từ món đã lưu của chính người dùng.

## 7. Tiêu chí nghiệm thu
| Mã | Tình huống | Kết quả |
|---|---|---|
| MEAL-01 | Tài khoản mới mở tab Hôm nay | Ngày là hôm nay; trạng thái trống; tổng bằng 0 / mục tiêu |
| MEAL-02 | Thêm "Bún nạm" 450 kcal, 25 g, 1800 mg, 6 g | Món xuất hiện trong danh sách; thẻ tổng cộng đúng |
| MEAL-03 | Hôm qua đã thêm "Bún nạm"; hôm nay gõ "bun" | Gợi ý "Bún nạm"; chọn thì điền đúng 450 / 25 / 1800 / 6 |
| MEAL-04 | Gõ "nạm" | "Bún nạm" xuất hiện trong nhóm "chứa" |
| MEAL-05 | Chọn gợi ý, sửa calo thành 500, lưu; lần sau gõ lại | Gợi ý điền 500; món ngày hôm qua vẫn là 450 |
| MEAL-06 | Thêm "bún  NẠM " (khoảng trắng thừa, chữ hoa) | Không tạo món đã lưu thứ hai; tên hiển thị cập nhật thành "bún NẠM" |
| MEAL-07 | Mở lịch chọn ngày | Ngày tương lai bị vô hiệu; nút "›" bị khoá khi đang ở hôm nay |
| MEAL-08 | Gọi API trực tiếp với `eaten_on` = hôm nay + 2 | Server từ chối |
| MEAL-09 | Thêm món cho ngày 01/11 khi đang xem ngày 04/11 | Món nằm ở ngày 01/11, không ở ngày 04/11 |
| MEAL-10 | Tên rỗng / 101 ký tự; calo −1, 5001, 12.5; đạm 1.25; để trống một ô | Không lưu; báo lỗi đúng trường; dữ liệu đã nhập được giữ |
| MEAL-11 | Thêm 3 món, tắt app mở lại, sửa món đầu tiên | Thứ tự giữ nguyên; món vừa sửa không bị đẩy xuống cuối |
| MEAL-12 | Xoá món, bấm hủy / bấm xác nhận | Hủy: món còn nguyên. Xác nhận: món mất, tổng cập nhật, món đã lưu vẫn còn |
| MEAL-13 | Xoá món đã lưu trong Cài đặt | Không còn trong gợi ý; các món đã ghi trước đó không đổi |
| MEAL-14 | Có 7 món đã lưu cùng khớp | Hiện tối đa 5; thứ tự đúng quy tắc ở §4 |
| MEAL-15 | Tài khoản B đọc, sửa hoặc xoá `meal_entries` hoặc `foods` của A; B thấy gợi ý từ món của A? | RLS từ chối; gợi ý của B không có món của A |
| MEAL-16 | Mất mạng khi bấm "Lưu" | Báo lỗi; form vẫn mở với dữ liệu đã nhập; không có món nào xuất hiện như đã lưu |
| MEAL-17 | Lưu bị timeout nhưng server đã ghi; bấm "Lưu" lại | Chỉ có một bản ghi (nhờ `id` do client sinh) |
| MEAL-18 | Đóng form có dữ liệu chưa lưu, chọn "Ở lại" | Dữ liệu còn nguyên |
| MEAL-19 | Bàn phím số cho 4 ô số; Back khi bàn phím hoặc danh sách gợi ý đang mở (cần thiết bị) | Hiện bàn phím số (có dấu thập phân cho đạm và đường); Back đóng bàn phím hoặc danh sách gợi ý trước |

## 8. Bàn giao
- Migration `meal_entries` và `foods` kèm RLS; RPC lưu món trong một giao dịch; hàm chuẩn hoá tên kèm unit test (gồm tiếng Việt có dấu và chữ đ); test RLS; E2E thêm món rồi chọn gợi ý.
