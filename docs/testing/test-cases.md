# Test cases — Nutrition Tracker

> Cập nhật: 2026-11-04. Kế hoạch và cách chạy: `docs/testing/test-plan.md`. AC gốc: `docs/modules/*.md`. Mã test case chỉ tăng tiếp, không đánh lại. Test case bị bỏ thì gạch đi và giữ nguyên mã.
>
> **Dữ liệu chuẩn:**
> - Tài khoản `e2e-a@test.local` và `e2e-b@test.local` (seed trên Supabase local, đã xác nhận email).
> - Hồ sơ ví dụ thứ nhất trong `Goals.md`: Nam, 70 kg, 175 cm, 30 tuổi, `moderate`, `lose`.

## 1. E2E mobile tự động (Appium, `e2e/mobile-appium/tests/`)

### 0.1.0
| Mã | AC | Tiền điều kiện | Bước chính | Kết quả mong đợi |
|---|---|---|---|---|
| TC-E2E-00 | — (smoke) | APK debug đã cài, Metro đang chạy | Mở app | Thấy tab Hôm nay (`testID` `screen-today`). Có từ khung repo; kiểm tra cấu hình E2E chứ không kiểm tra tính năng |
| TC-E2E-01 | ACC-01 | Chưa đăng nhập | Đăng ký bằng email mới, mật khẩu hợp lệ | Màn hình "Kiểm tra email"; không vào được tab nào |
| TC-E2E-02 | ACC-02 | Chưa đăng nhập | Đăng ký với email đã tồn tại / mật khẩu 7 ký tự / hai ô mật khẩu khác nhau | Lỗi hiện dưới đúng trường; dữ liệu đã nhập được giữ |
| TC-E2E-03 | ACC-03 | Có tài khoản A | Đăng nhập sai mật khẩu | "Email hoặc mật khẩu không đúng" |
| TC-E2E-04 | ACC-04, ACC-05 | A chưa có hồ sơ | Đăng nhập; nhập lần lượt cân nặng 19.9 và 300.1, chiều cao 99, tuổi 12 và 101, bỏ trống một trường | Vào thẳng Onboarding; nút "Tiếp tục" bị khoá; lỗi đúng trường |
| TC-E2E-05 | ACC-06, GOAL-01, GOAL-02 | A chưa có hồ sơ | Nhập hồ sơ ví dụ 1 → Tiếp tục → kiểm tra màn tóm tắt → Bắt đầu → đóng app hẳn → mở lại | Tóm tắt: BMR 1649, TDEE 2556, mục tiêu 2056, đạm 56/112/154, đường 0/26/51; không có nhãn "Tự đặt"; mở lại vào thẳng Hôm nay |
| TC-E2E-06 | GOAL-03, GOAL-04, GOAL-06, GOAL-10 | A có hồ sơ ví dụ 1 | Cài đặt › Mục tiêu: điều chỉnh +1 → lưu; đổi mong muốn sang `gain`, điều chỉnh −1; đặt mục tiêu calo 1500; bấm "Dùng gợi ý" | Hiện W1, rồi W2, rồi W3; lưu được; "Dùng gợi ý" xoá giá trị tự đặt |
| TC-E2E-07 | ACC-09 | Chưa đăng nhập | Quên mật khẩu với email không tồn tại, rồi với email của A | Hai lần hiện cùng một thông báo |
| TC-E2E-08 | ACC-07, ACC-08 | A có hồ sơ | Cài đặt › Hồ sơ: đổi cân nặng → Back → chọn "Ở lại" → Lưu | Dữ liệu đang sửa còn nguyên; sau khi lưu, mục tiêu gợi ý đổi theo |
| TC-E2E-09 | MEAL-01 | A có hồ sơ, chưa có món | Mở Hôm nay | Ngày là hôm nay; trạng thái trống; tổng 0 / mục tiêu |
| TC-E2E-10 | MEAL-02, MEAL-09 | Như trên | Bấm "‹" về hôm qua → thêm "Bún nạm" 450 / 25 / 1800 / 6 → về hôm nay | Món nằm ở hôm qua, không có ở hôm nay; tổng của hôm qua đúng |
| TC-E2E-11 | MEAL-03, MEAL-04, MEAL-05, MEAL-06 | Có món ở TC-E2E-10 | Hôm nay gõ "bun" → chọn gợi ý → đổi calo thành 500 → lưu; gõ "nạm"; thêm "bún  NẠM " | Gợi ý điền 450/25/1800/6; lần sau điền 500; "nạm" khớp; không sinh món đã lưu thứ hai; món hôm qua vẫn 450 |
| TC-E2E-12 | MEAL-07 | — | Mở lịch chọn ngày; kiểm tra nút "›" khi đang ở hôm nay | Ngày tương lai bị vô hiệu; "›" bị khoá |
| TC-E2E-13 | MEAL-10 | — | Form món: tên rỗng / 101 ký tự; calo −1, 5001, 12.5; đạm 1.25; để trống một ô | Không lưu; lỗi đúng trường; dữ liệu đã nhập được giữ |
| TC-E2E-14 | MEAL-11 | — | Thêm 3 món → đóng app hẳn → mở lại → sửa món đầu tiên | Thứ tự giữ nguyên |
| TC-E2E-15 | MEAL-12, MEAL-13 | Có món | Xoá món → hủy; xoá → xác nhận; Cài đặt › Món đã lưu: xoá "Bún nạm" → gõ "bun" | Hủy: món còn. Xác nhận: món mất, món đã lưu còn. Sau khi xoá món đã lưu: không còn gợi ý |
| TC-E2E-16 | MEAL-18, MEAL-19, ACC-16 | — | Form món: nhập dở → Back khi bàn phím mở → Back khi danh sách gợi ý mở → Back → "Ở lại" | Bàn phím số; Back lần 1 đóng bàn phím, lần 2 đóng gợi ý, lần 3 hỏi "Bỏ món này?"; "Ở lại" giữ dữ liệu |
| TC-E2E-17 | CHART-01, CHART-02, CHART-03, CHART-06, CHART-07, CHART-08 | A có món ở 3 trong 7 ngày | Mở Biểu đồ; đổi 7/30 ngày và đường/cột; đóng app mở lại; bấm một ngày → "Mở ngày này"; thêm món → quay lại Biểu đồ | 3 điểm, 4 khoảng trống; giá trị khớp tab Hôm nay; lựa chọn được nhớ; mở đúng ngày; số liệu cập nhật |
| TC-E2E-18 | REM-01, REM-04, REM-07 | A vừa xong Onboarding | Chọn "Để sau"; vào Cài đặt › Nhắc nhở → bật → **từ chối** quyền; đổi giờ (khi đã có quyền) → đóng app hẳn → mở lại | Lúc đầu vẫn tắt; từ chối quyền thì công tắc tắt và hiện "Bị chặn"; giờ đã đổi được giữ |
| TC-E2E-19 | ACC-10 | A đã đăng nhập | Đăng xuất → Back | Về Đăng nhập; Back không quay lại được màn hình có dữ liệu |
| TC-E2E-20 | ACC-11, ACC-12 | Tài khoản tạm | Xoá tài khoản → hủy; nhập sai mật khẩu; nhập đúng → đăng nhập lại | Hủy và sai mật khẩu: không xoá gì. Đúng: đăng nhập lại báo sai thông tin; fixture kiểm DB (service role, **chỉ trên local**) không còn bản ghi nào |

### 0.2.0 (Workout)
| Mã | AC | Tiền điều kiện | Bước chính | Kết quả mong đợi |
|---|---|---|---|---|
| TC-E2E-30 | WO-01, WO-02 | A có hồ sơ | Kiểm tra thanh tab → Cài đặt › Workout bật | Lúc đầu không có tab Workout; sau khi bật thì có, kèm trạng thái trống |
| TC-E2E-31 | WO-03, WO-04 | Workout bật | Tạo "Chạy bộ" → lịch hằng tuần T2 T4 T6, 06:00, 60 phút, 300 kcal | Có màu đầu tiên chưa dùng; lịch tuần có 3 khối đúng giờ |
| TC-E2E-32 | WO-05, WO-06, WO-33 | Có "Chạy bộ" | Tạo "Gym": lịch T4 06:30, 30 phút → lỗi; đổi sang T4 07:00, 30 phút | Lỗi nêu «Chạy bộ» (06:00–07:00) và thứ Tư đầu tiên; sau khi đổi thì lưu được |
| TC-E2E-33 | WO-30, WO-31, WO-32, WO-34 | Workout bật, chưa có lịch | Lịch A hằng ngày 06:00–07:00; B hằng tuần CN 06:45, 30 phút → lỗi; B hằng ngày 07:00–08:00 → lưu; C hằng tuần T2 T4 08:00 và D T3 T5 08:00 → lưu; chọn đủ 7 thứ | Đúng như AC; đủ 7 thứ thì tự chuyển "Hằng ngày" |
| TC-E2E-34 | WO-12, WO-13, WO-14 | "Chạy bộ" có lịch và 2 lần "Đã tập" | Thêm sub → hủy; thêm sub "Chạy sáng" → xác nhận | Hủy: không đổi. Xác nhận: lịch và lịch sử chuyển sang «Chạy sáng»; "Chạy bộ" chỉ còn hiển thị các sub; calo các ngày cũ không đổi |
| TC-E2E-35 | WO-16, WO-17, CHART-09 | Có buổi hôm nay 300 kcal; đã nạp 2000 | "Đã tập" → xem Hôm nay và Biểu đồ → "Bỏ đánh dấu" | Tiêu hao 300, ròng 1600; bỏ đánh dấu thì tiêu hao về 0 |
| TC-E2E-36 | WO-22, CHART-10 | Như trên, đã đánh dấu | Tắt Workout → xem tab, Hôm nay, Biểu đồ → bật lại | Tab ẩn, không hiện tiêu hao; bật lại thì dữ liệu còn nguyên |
| TC-E2E-37 | WO-21 | Activity có lịch sử "Đã tập" | Xoá activity → xem Biểu đồ ngày cũ | Calo ngày cũ không đổi |
| TC-E2E-38 | WO-29 | Có lịch | Vuốt lịch tuần trái và phải → "Tuần này" | Đổi tuần đúng, khối đúng ngày |

## 2. Kiểm thủ công trên thiết bị thật (`TC-DEV`)
Ghi kết quả vào PR release: Đạt / Không đạt / Bỏ qua kèm lý do, model máy, phiên bản Android, độ trễ thông báo quan sát được.

| Mã | AC | Bước | Kết quả mong đợi | Milestone |
|---|---|---|---|---|
| TC-DEV-01 | ACC-15 | Bấm link xác nhận email và link đặt lại mật khẩu trên điện thoại | Mở đúng app, đúng màn hình | 0.1.0 |
| TC-DEV-02 | REM-02, REM-03, REM-05, REM-06, REM-08 | Bật nhắc giờ hiện tại + 2 phút → chờ → bấm thông báo khi app đóng; đổi giờ; tắt; đăng xuất | Nhận đúng một thông báo, không sớm hơn giờ hẹn (được phép trễ, ghi độ trễ); mở Hôm nay; không còn nhận sau khi tắt hoặc đăng xuất | 0.1.0 |
| TC-DEV-03 | WO-26, WO-27, WO-28 | Có buổi trong ngày; đặt giờ tóm tắt gần hiện tại; sửa giờ buổi | Nhận tóm tắt và nhắc trước, không sớm hơn giờ hẹn; ngày không có buổi thì không có tóm tắt; sửa giờ thì giờ nhắc đổi theo | 0.2.0 |
| TC-DEV-04 | ACC-14, GOAL-14, MEAL-16, REM-11, CHART-13, WO-25 | Bật chế độ máy bay rồi lưu ở từng màn hình | Báo lỗi; không có "thành công giả"; dữ liệu đang nhập được giữ; có mạng lại thì lưu một lần | 0.1.0 / 0.2.0 |
| TC-DEV-05 | CHART-14 | Bật TalkBack, mở Biểu đồ và chế độ bảng | Đọc được ngày và giá trị | 0.1.0 |

## 3. Truy vết AC → test
Ký hiệu: **U** = unit hoặc component (Jest), **D** = pgTAP, **E** = TC-E2E, **M** = TC-DEV.

| Module | AC → lớp test |
|---|---|
| Account | 01 E01 · 02 E02 U · 03 E03 · 04 E04 · 05 E04 U · 06 E05 · 07 E08 U · 08 E08 · 09 E07 · 10 E19 · 11 E20 · 12 E20 · 13 D · 14 M04 · 15 M01 · 16 E16 |
| Goals | 01 U E05 · 02 E05 · 03 U E06 · 04 U E06 · 05 U · 06 U E06 · 07 U · 08 U · 09 U · 10 E06 · 11 U · 12 U · 13 D · 14 M04 · 15 U · 16 U |
| MealLog | 01 E09 · 02 E10 · 03–06 E11 D · 07 E12 · 08 D · 09 E10 · 10 E13 U · 11 E14 · 12–13 E15 · 14 U D · 15 D · 16 M04 · 17 D (idempotency) · 18–19 E16 |
| Chart | 01–03 E17 U · 04–05 U · 06–08 E17 · 09 U E35 · 10 U E36 · 11 U · 12 D · 13 M04 · 14 M05 |
| Reminders | 01 E18 · 02–03 M02 · 04 E18 · 05–06 M02 · 07 E18 D · 08 M02 · 09–10 D · 11 M04 |
| Workout | 01–02 E30 · 03–04 E31 · 05–06 U D E32 · ~~07–09~~ bỏ · 10–11 U D · 12–14 E34 D · 15 D · 16–17 E35 · 18 U D · 19 D · 20 U D · 21 E37 D · 22 E36 · 23 D (2 kết nối song song) · 24 D · 25 M04 · 26–28 M03 · 29 E38 · 30–34 U D E33 · 35 D |
