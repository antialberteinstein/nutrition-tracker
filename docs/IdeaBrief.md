# Idea brief — Nutrition Tracker

**Ngày:** 2026-11-04 · **Người quyết định:** chủ dự án (antialberteinstein) · **Trạng thái:** đã duyệt 2026-11-04

**Loại dự án:** A — App mobile có dữ liệu người dùng (mỗi tài khoản sở hữu dữ liệu riêng).

## Vấn đề

Người muốn tăng cân, giảm cân hoặc giữ cân cần biết mỗi ngày mình ăn bao nhiêu calo, đạm, natri, đường so với mức phù hợp với cơ thể mình. Ghi chép bằng giấy hoặc bảng tính thì tốn công nhập lại các món ăn lặp lại, và không thấy được xu hướng theo ngày.

## Người dùng đích

- Một người tự theo dõi dinh dưỡng hằng ngày trên điện thoại, thường ăn lặp lại một số món quen.
- Mỗi tài khoản chỉ thấy và sửa được dữ liệu của chính mình; không chia sẻ dữ liệu giữa các tài khoản.

## Phạm vi v1

**0.1.0 — Dinh dưỡng**

1. **Tài khoản và hồ sơ:** đăng ký, đăng nhập bằng email và mật khẩu, quên mật khẩu, xoá tài khoản kèm toàn bộ dữ liệu. Lần đầu mở app phải nhập cân nặng, chiều cao, giới tính, năm sinh, mức vận động (5 mức) và mong muốn (tăng cân / giảm cân / giữ cân).
2. **Mục tiêu ngày:** app tính BMI (để hiển thị), BMR (Mifflin-St Jeor), rồi gợi ý mục tiêu calo, đạm, natri, đường. Người dùng có thể tự đặt lại từng mục tiêu. Mức điều chỉnh calo mặc định: giảm cân −500 kcal, tăng cân +300 kcal, giữ cân 0; người dùng sửa được. App **cảnh báo** (không chặn) khi mức điều chỉnh ngược với mong muốn: chọn giảm cân mà đặt ≥ +1 kcal, hoặc chọn tăng cân mà đặt ≤ −1 kcal.
3. **Ghi bữa ăn có gợi ý:** thêm món kèm calo, đạm (g), natri (mg), đường (g). Ngày ghi mặc định là hôm nay, có thể chọn ngày trước đó nhưng không được chọn ngày tương lai. Khi gõ tên món, app gợi ý các món người dùng đã nhập trước đây; chọn một gợi ý thì tự điền dinh dưỡng của lần nhập gần nhất.
4. **Biểu đồ theo ngày** (dạng đường hoặc cột), cho calo và từng chất, có các đường ngưỡng (xem Ràng buộc).
5. **Nhắc ghi chép hằng ngày:** đặt giờ nhắc trong Cài đặt.

**0.2.0 — Workout** (bật hoặc tắt trong Cài đặt; khi tắt thì ẩn hoàn toàn và không được tính vào calo)

6. Quản lý activity và sub-activity. Activity đã có sub-activity thì không sửa được lịch hay calo của chính nó; app chỉ hiển thị tổng hợp từ các sub-activity.
7. Lịch cho mỗi mục: giờ bắt đầu; lặp hằng ngày hoặc hằng tuần (chọn nhiều ngày Mon–Sun); ~~hằng tháng~~ (bỏ ngày 2026-11-04, xem ADR-008); ước lượng calo tiêu hao. Màn hình Workout có lịch tô màu theo activity, và chặn hai mục trùng giờ nhau (thuật toán ghi trong `docs/ADR.md`).
8. Calo tiêu hao chỉ được trừ vào cân bằng calo trong ngày khi người dùng đánh dấu **"Đã tập"**. Có nhắc buổi tập trong ngày và nhắc trước giờ tập 30 phút.

## Ngoài phạm vi (cả 0.1.0 và 0.2.0)

- Cơ sở dữ liệu món ăn có sẵn hoặc tra cứu món từ nguồn ngoài.
- Role admin và màn hình quản trị.
- Đồng bộ Apple Health / Google Fit.
- Đa ngôn ngữ.
- Ghi chép khi mất mạng (offline sync). Mất mạng thì báo lỗi rõ ràng, không báo thành công giả.
- Đăng nhập Google / Apple.

## Ràng buộc

- **Nền tảng:** iOS và Android, React Native + Expo. **Backend:** Supabase (Auth, Postgres với RLS theo `user_id`). **Push notification:** Firebase (cách tích hợp chốt ở ADR).
- **Dữ liệu nhạy cảm:** có. Đây là dữ liệu sức khoẻ (cân nặng, chế độ ăn), nên mọi bảng phải bật RLS và có test chứng minh tài khoản khác bị từ chối khi đọc và ghi.
- **Offline / đa thiết bị:** cần mạng; dữ liệu nằm trên server nên đăng nhập máy khác vẫn thấy.
- **Ngôn ngữ và định dạng:** chỉ tiếng Việt, ngày `dd/MM/yyyy`, "hôm nay" tính theo múi giờ của máy.
- **Ngưỡng dinh dưỡng** (giá trị mặc định, người dùng sửa được mục tiêu):
  - Calo: đường BMR · đường an toàn = BMR + 300 · đường mục tiêu = BMR × hệ số vận động ± điều chỉnh theo mong muốn · giới hạn trên = 4000 kcal.
  - Đường: dưới = 0 · mục tiêu = 5% calo mục tiêu ÷ 4 (25 g ở mức 2000 kcal) · trên = 10% calo mục tiêu ÷ 4 (50 g ở mức 2000 kcal).
  - Natri: dưới = 500 mg · mục tiêu = 1500 mg · trên = 2000 mg.
  - Đạm: dưới = 0.8 g/kg · mục tiêu = 1.6 g/kg · trên = 2.2 g/kg (người 60 kg: 48 / 96 / 132 g).
- **Ngân sách:** dùng gói miễn phí của Supabase, Firebase và Expo EAS.

## Thước đo thành công

- Chủ dự án tự dùng hằng ngày trong 2 tuần. Ghi một món đã từng nhập chỉ mất ≤ 3 thao tác: gõ, chọn gợi ý, lưu.
- Test RLS chứng minh tài khoản B không đọc hay ghi được dữ liệu của tài khoản A.

## Câu hỏi còn mở

1. ~~Điều chỉnh calo theo mong muốn~~ → đã chốt ngày 2026-11-04 (xem Phạm vi, mục 2).
2. ~~Mục tiêu natri~~ → đã chốt: mục tiêu 1500 mg (sửa được).
3. ~~Lặp hằng tháng ngày 29–31~~ → đã chốt: tháng không có ngày đó thì bỏ qua. *Sau đó bỏ hẳn lặp hằng tháng (2026-11-04, ADR-008).*
4. Push: nhắc theo giờ cố định có thể lên lịch ngay trên máy (`expo-notifications`, không cần server). Gửi từ server qua Firebase FCM thì cần thêm job hẹn giờ (Supabase cron + Edge Function). Sẽ chốt ở ADR, giai đoạn 2.
5. ~~Kênh phát hành~~ → đã chốt: 0.1.0 chỉ phát hành Android APK (build bằng EAS, kèm checksum). iOS chưa phát hành.
