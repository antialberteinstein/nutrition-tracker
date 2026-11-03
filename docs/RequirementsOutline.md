# Nutrition Tracker — Requirements Outline

> Trạng thái: **Đã duyệt 2026-11-04**. Đây là nguồn sự thật về hành vi sản phẩm. Agent đề xuất, người dùng duyệt. Khi tài liệu khác (prompt, module breakdown, issue) mâu thuẫn, file này thắng. Cập nhật lần cuối: 2026-11-04. Brief gốc: `docs/IdeaBrief.md`.

## 1. Mục tiêu và phạm vi

- **Người dùng:** một người tự theo dõi dinh dưỡng hằng ngày trên điện thoại, mỗi tài khoản có dữ liệu riêng.
- **Vấn đề:** cần biết mỗi ngày đã nạp bao nhiêu calo, đạm, natri, đường so với mức phù hợp với cơ thể mình, mà không phải nhập lại các món quen.
- **Nền tảng:** Android (phát hành 0.1.0) và iOS (chạy được nhưng chưa phát hành). Dùng React Native + Expo, Supabase, Firebase.
- **Loại dự án:** A, app mobile có dữ liệu người dùng.

| Milestone | Module | File |
|---|---|---|
| 0.1.0 | Tài khoản và hồ sơ | `docs/modules/Account.md` |
| 0.1.0 | Mục tiêu dinh dưỡng | `docs/modules/Goals.md` |
| 0.1.0 | Ghi bữa ăn và gợi ý món | `docs/modules/MealLog.md` |
| 0.1.0 | Biểu đồ | `docs/modules/Chart.md` |
| 0.1.0 | Nhắc ghi chép | `docs/modules/Reminders.md` |
| 0.2.0 | Workout | `docs/modules/Workout.md` |

**Ngoài phạm vi (cả 0.1.0 và 0.2.0):**
- cơ sở dữ liệu món ăn có sẵn;
- role admin;
- Apple Health / Google Fit;
- đa ngôn ngữ;
- ghi khi mất mạng;
- đăng nhập Google / Apple;
- phát hành iOS.

Mã AC có tiền tố theo module: `ACC-`, `GOAL-`, `MEAL-`, `CHART-`, `REM-`, `WO-`. Số AC chỉ tăng tiếp, không đánh lại.

## 2. Điều hướng và giao diện

- **Lần đầu mở app:** chưa đăng nhập thì vào Đăng nhập / Đăng ký. Đã đăng nhập nhưng chưa có hồ sơ thì vào Onboarding (bắt buộc, không bỏ qua được).
- **Thanh tab dưới:** **Hôm nay** · **Biểu đồ** · **Workout** (chỉ hiện khi bật Workout) · **Cài đặt**.
- **Cài đặt gồm:**
  - Hồ sơ
  - Mục tiêu
  - Nhắc nhở
  - Món đã lưu
  - Workout (công tắc bật/tắt)
  - Tài khoản: đăng xuất, xoá tài khoản
- **Nguyên tắc chung:**
  - giao diện chỉ có tiếng Việt;
  - ngày hiển thị `dd/MM/yyyy`, giờ 24h `HH:mm`;
  - "hôm nay" tính theo múi giờ của máy;
  - có giao diện sáng và tối theo hệ thống;
  - không tràn ngang trên màn hình rộng 360 dp;
  - mọi nút có nhãn trợ năng.

## 3. Module (tóm tắt; chi tiết và AC trong `docs/modules/`)

### 3.1. Tài khoản và hồ sơ (0.1.0)
- Đăng ký, đăng nhập bằng email và mật khẩu, xác nhận email, quên mật khẩu, đăng xuất. Xoá tài khoản sẽ xoá cứng toàn bộ dữ liệu.
- Hồ sơ gồm cân nặng, chiều cao, giới tính, năm sinh, mức vận động (5 mức), mong muốn (tăng cân / giảm cân / giữ cân). Nhập lần đầu ở Onboarding, sửa được trong Cài đặt.

### 3.2. Mục tiêu dinh dưỡng (0.1.0)
- App tính BMI (để hiển thị và cảnh báo), BMR (Mifflin-St Jeor), TDEE, rồi gợi ý mục tiêu calo, đạm, natri, đường kèm ngưỡng dưới và ngưỡng trên.
- Người dùng tự đặt được mục tiêu và mức điều chỉnh calo. App cảnh báo nhưng không chặn khi giá trị đặt ngược với mong muốn hoặc thấp hơn BMR.

### 3.3. Ghi bữa ăn và gợi ý món (0.1.0)
- Thêm, sửa, xoá món ăn theo ngày. Ngày ghi mặc định là hôm nay, chỉ được chọn hôm nay hoặc trước đó.
- Mỗi món có calo, đạm, natri, đường. Tên món đã nhập được lưu để gợi ý lần sau; chọn một gợi ý thì tự điền dinh dưỡng của lần nhập gần nhất.

### 3.4. Biểu đồ (0.1.0)
- Biểu đồ theo ngày (dạng đường hoặc cột) trong 7 hoặc 30 ngày, cho 4 chỉ số: calo, đạm, natri, đường. Mỗi chỉ số có các đường ngưỡng riêng.
- Khi bật Workout: biểu đồ calo thêm đường calo tiêu hao và calo ròng (= nạp − tiêu hao). Các đường ngưỡng calo được so với calo ròng.

### 3.5. Nhắc ghi chép (0.1.0)
- Nhắc ghi bữa ăn mỗi ngày vào giờ người dùng chọn (mặc định 20:00), có thể bật hoặc tắt.

### 3.6. Workout (0.2.0)
- Activity và sub-activity. "Mục lá" là sub-activity, hoặc activity không có sub-activity; chỉ mục lá mới có lịch: giờ bắt đầu, thời lượng, kiểu lặp (hằng ngày / hằng tuần theo các thứ; **không có hằng tháng**), và ước lượng calo tiêu hao.
- Không cho hai buổi đè giờ nhau. Màn hình Workout có lịch tuần tô màu theo activity.
- Calo chỉ được tính khi người dùng đánh dấu "Đã tập". Có nhắc lịch tập trong ngày và nhắc trước mỗi buổi 30 phút.

## 4. Tài khoản, cài đặt, thông báo

- **Đăng nhập:** email và mật khẩu (Supabase Auth). Phiên được giữ khi tắt và mở lại app, cho tới khi đăng xuất hoặc phiên hết hạn.
- **Cài đặt** được lưu trên server theo tài khoản, nên đăng nhập máy khác vẫn giữ nguyên.
- **Thông báo:** cần quyền thông báo của hệ điều hành. Bị từ chối thì Cài đặt hiện trạng thái kèm nút mở cài đặt hệ thống. Cách gửi (lên lịch ngay trên máy hay đẩy qua Firebase FCM) chốt ở ADR.

## 5. Dữ liệu và quyền

- Mỗi bản ghi thuộc đúng một người dùng (`user_id`). Mọi bảng bật Row Level Security; backend từ chối đọc và ghi chéo tài khoản.
- **Xoá:** xoá cứng. Xoá tài khoản thì xoá toàn bộ dữ liệu của tài khoản đó.
- **Tài khoản mới:** không có dữ liệu mẫu.
- **Đơn vị lưu:** calo là số nguyên kcal; đạm và đường tính bằng gam, 1 chữ số thập phân; natri là số nguyên mg. Ngày ghi chép lưu kiểu `date` theo ngày địa phương của người dùng, không lưu dạng timestamp.

## 6. Chất lượng và nghiệm thu

- Unit test cho mọi công thức (BMI, BMR, mục tiêu, ngưỡng) và cho thuật toán chặn trùng lịch.
- Test RLS chạy với hai tài khoản trên Supabase cục bộ, cho mọi bảng.
- E2E mobile (Appium + Python/uv, `e2e/mobile-appium/`) trên thiết bị Android thật, cho luồng chính: đăng ký → onboarding → ghi món → chọn gợi ý → xem biểu đồ. Kế hoạch và test case: `docs/testing/test-plan.md`, `docs/testing/test-cases.md`.
- Trước khi phát hành phải kiểm tra trên thiết bị Android thật: thông báo, nút Back, bàn phím, quyền.
- Nghiệm thu từng module theo bảng AC trong `docs/modules/`.

## 7. Giới hạn hiện tại (ứng viên roadmap)

- Không ghi được khi mất mạng.
- Không có lịch sử cân nặng. Ngưỡng trên biểu đồ của mọi ngày dùng hồ sơ và mục tiêu **hiện tại**.
- Mỗi mục lá chỉ có một lịch. Không ghi được buổi tập ngoài lịch.
- Chưa phát hành iOS. Chưa có đăng nhập Google / Apple.
- Không có cơ sở dữ liệu món ăn; không nhập theo khẩu phần hay gram.

## 8. Thuật ngữ

| Thuật ngữ | Nghĩa |
|---|---|
| BMI | cân nặng (kg) ÷ chiều cao (m)², chỉ để hiển thị và cảnh báo |
| BMR | năng lượng chuyển hoá cơ bản, công thức Mifflin-St Jeor |
| TDEE | BMR × hệ số vận động; hệ số là 1.2 khi Workout bật |
| Mức điều chỉnh | số kcal cộng vào TDEE theo mong muốn (mặc định −500 / 0 / +300) |
| Mục tiêu | giá trị nên đạt mỗi ngày; có giá trị gợi ý và giá trị tự đặt |
| Ngưỡng dưới / trên | đường giới hạn trên biểu đồ, không sửa được ở v1 |
| Món đã lưu | tên món kèm dinh dưỡng lần nhập gần nhất, dùng để gợi ý |
| Activity / sub-activity | nhóm hoạt động / hoạt động con |
| Mục lá | sub-activity, hoặc activity không có sub-activity; là nơi có lịch |
| Buổi | một lần xuất hiện của lịch vào một ngày cụ thể |
| Calo ròng | calo nạp − calo của các buổi "Đã tập" trong ngày |

## Lịch sử quyết định

| Ngày | Quyết định | Lý do | Ảnh hưởng (AC, dữ liệu cũ) |
|---|---|---|---|
| 2026-11-04 | Khởi tạo đặc tả từ idea brief đã duyệt | Kickoff | — |
| 2026-11-04 | Workout tách sang 0.2.0 | Khối lượng gần bằng phần dinh dưỡng | — |
| 2026-11-04 | Onboarding hỏi thêm năm sinh và mức vận động; BMR theo Mifflin-St Jeor | BMR cần tuổi; BMI không đủ để tính mục tiêu | — |
| 2026-11-04 | Điều chỉnh calo −500 / 0 / +300, sửa được; cảnh báo khi ngược mong muốn | Người dùng chốt | GOAL-AC |
| 2026-11-04 | Đạm 0.8 / 1.6 / 2.2 g/kg; natri 500 / 1500 / 2000 mg; đường 0 / 5% / 10% calo | Người dùng chốt | GOAL-AC |
| 2026-11-04 | Calo workout chỉ tính khi "Đã tập"; biểu đồ dùng calo ròng | Bỏ buổi tập không làm sai số liệu | CHART-AC, WO-AC |
| 2026-11-04 | Lịch = giờ bắt đầu + thời lượng; lặp tháng vào ngày tháng không có thì bỏ qua | Cần thời lượng để chặn trùng | WO-AC |
| 2026-11-04 | Thêm sub đầu tiên thì chuyển lịch, calo và lịch sử "Đã tập" của activity sang sub đó | Không mất dữ liệu | WO-AC |
| 2026-11-04 | Natri nhập theo mg; chỉ email + mật khẩu; cần mạng; 0.1.0 chỉ Android APK | Người dùng chốt | — |
| 2026-11-04 | Khi Workout bật, TDEE dùng hệ số 1.2 | Tránh tính việc tập hai lần (hệ số vận động + calo "Đã tập") | GOAL-15 |
| 2026-11-04 | Phân loại BMI theo chuẩn châu Á – Thái Bình Dương; W6 khi BMI ≥ 25 và chọn tăng cân | Phù hợp với người dùng Việt Nam | GOAL-12, GOAL-16 |
| 2026-11-04 | Nhắc ghi chép mỗi ngày, kể cả khi đã ghi món | Đơn giản, không cần server | REM |
| 2026-11-04 | Duyệt đặc tả (6 module, 105 AC) | Cổng giai đoạn 1 | — |
| 2026-11-04 | Thông báo không cam kết đúng giờ khi chưa dùng FCM; khi dùng FCM thì trễ tối đa 5 phút | Chủ dự án chốt (ADR-006, ADR-007) | REM-02, REM-05, WO-26, WO-28 nới tiêu chí thời gian |
| 2026-11-04 | E2E mobile bằng Appium + Python/uv trên thiết bị thật; tài liệu test ở `docs/testing/` | Chủ dự án chốt (ADR-012) | — |
| 2026-11-04 | **Bỏ lặp hằng tháng** (thay cho quyết định "lặp tháng vào ngày tháng không có thì bỏ qua"). Trùng lịch = có thứ chung + giờ giao nhau; cặp có lịch hằng ngày chỉ xét giờ | Kiểm trùng đơn giản, O(1) mỗi cặp bằng bitmask (ADR-008) | Bỏ WO-07, WO-08, WO-09; thêm WO-30 → WO-35. Chưa có dữ liệu cũ |
