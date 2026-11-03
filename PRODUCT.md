# Product

<!-- impeccable:product-schema 1 -->

## Platform

android

## Stack

React Native + Expo (TypeScript strict, Expo Router), backend Supabase. Đã chốt trong `docs/ADR.md` (ADR-001, ADR-002). Thiết kế theo Material 3 của Android; iOS chạy cùng giao diện đó qua dev build và chưa phát hành.

## Users

Một người tự theo dõi dinh dưỡng hằng ngày trên điện thoại Android. Người này muốn tăng cân, giảm cân hoặc giữ cân, thường ăn lặp lại một số món quen, và ghi chép sau bữa ăn hoặc cuối ngày. Mỗi tài khoản chỉ thấy dữ liệu của chính mình; không có vai trò quản trị.

## Product Purpose

Cho người dùng biết mỗi ngày đã nạp bao nhiêu calo, đạm, natri, đường, so với mục tiêu tính riêng cho cơ thể họ (BMR Mifflin-St Jeor, mức vận động, mong muốn), mà không phải nhập lại các món quen.

Thành công là khi chủ dự án tự dùng hằng ngày trong 2 tuần, và ghi một món đã từng nhập chỉ mất tối đa 3 thao tác: gõ, chọn gợi ý, lưu.

## Positioning

Không có cơ sở dữ liệu món ăn có sẵn. Gợi ý món chỉ lấy từ chính những gì người dùng đã nhập, so khớp không phân biệt dấu ("bun nam" khớp "Bún nạm"), và tự điền dinh dưỡng của lần nhập gần nhất. Mục tiêu và ngưỡng (BMR, an toàn, mục tiêu, trần; WHO cho đường và natri; g/kg cho đạm) được tính từ hồ sơ, và người dùng tự sửa được, kèm cảnh báo khi giá trị đặt ngược với mong muốn.

Từ 0.2.0, Workout (bật hoặc tắt được) tính calo ròng từ những buổi người dùng đánh dấu "Đã tập", không tính theo lịch.

## Operating Context

- Ghi món ngay sau bữa ăn hoặc ghi bù cho ngày trước; ngày ghi không được ở tương lai.
- Mở tab Hôm nay để xem tổng của ngày so với mục tiêu; mở Biểu đồ để xem 7 hoặc 30 ngày.
- Nhận thông báo nhắc ghi chép vào giờ đã chọn. Thông báo được lên lịch ngay trên máy, không cam kết đúng giờ.
- Cần có mạng; mất mạng thì báo lỗi rõ ràng, không báo thành công giả.

## Capabilities and Constraints

- Hành vi đã chốt nằm ở `docs/RequirementsOutline.md` và `docs/modules/*.md` (có bảng AC); quyết định kỹ thuật ở `docs/ADR.md`; kiểm thử ở `docs/testing/`.
- **0.1.0:**
  - tài khoản email + mật khẩu;
  - Onboarding bắt buộc: cân nặng, chiều cao, giới tính, năm sinh, mức vận động, mong muốn;
  - mục tiêu và cảnh báo W1–W6;
  - ghi món kèm gợi ý;
  - biểu đồ đường hoặc cột có đường ngưỡng;
  - nhắc ghi chép hằng ngày.
- **0.2.0:**
  - Workout: activity → sub-activity;
  - lịch lặp hằng ngày hoặc hằng tuần, không có hằng tháng;
  - chặn trùng giờ;
  - lịch tuần tô màu theo activity, tối đa 8 màu;
  - "Đã tập";
  - nhắc tóm tắt và nhắc trước 30 phút.
- **Đơn vị:** kcal (số nguyên), đạm và đường tính bằng g (1 chữ số thập phân), natri tính bằng mg. Ngày hiển thị `dd/MM/yyyy`, giờ 24h, tuần bắt đầu từ thứ Hai.
- **Ngoài phạm vi:** cơ sở dữ liệu món ăn, admin, Apple Health / Google Fit, đa ngôn ngữ, offline, đăng nhập mạng xã hội, phát hành iOS.
- **Thuật ngữ** cố định trong `docs/RequirementsOutline.md` §8: mục tiêu, ngưỡng, món đã lưu, mục lá, buổi, calo ròng.

## Brand Commitments

- Tên hiển thị: **Nutrition Tracker**.
- Giao diện **chỉ tiếng Việt**.
- **Giọng văn:** trung tính, xưng "bạn"; ngắn, thẳng, không phán xét chuyện ăn uống. Cảnh báo nêu số liệu và hệ quả, không doạ dẫm. Ví dụ: "Bạn đã ghi những gì mình ăn hôm nay chưa?", "Mục tiêu thấp hơn BMR, không khuyến nghị nếu không có hướng dẫn chuyên môn."

## Evidence on Hand

Chưa có logo, ảnh, nội dung tiếp thị, lời chứng thực hay số liệu người dùng. Không được bịa ra những thứ này. Ngưỡng dinh dưỡng có nguồn đã ghi: WHO (đường, natri), AHA (natri 1500 mg), chuẩn BMI châu Á – Thái Bình Dương.

## Product Principles

1. **Ghi nhanh hơn nhớ:** món quen phải ghi xong trong 3 thao tác. Gợi ý quan trọng hơn mọi tính năng phụ.
2. **Số liệu trung thực:** không có thành công giả, không vẽ 0 cho ngày chưa ghi, không tính calo cho buổi tập chưa đánh dấu.
3. **Người dùng quyết định, app nhắc nhở:** mục tiêu nào cũng sửa được; app chỉ cảnh báo, không chặn.
4. **Dữ liệu sức khoẻ là riêng tư:** mỗi tài khoản chỉ thấy dữ liệu của mình (RLS); xoá tài khoản là xoá hết.

## Accessibility & Inclusion

Mọi nút có nhãn trợ năng; biểu đồ có chế độ bảng cho TalkBack (CHART-14). Không tràn ngang trên màn hình rộng 360 dp. Có giao diện sáng và tối theo hệ thống. Màu không phải kênh duy nhất để báo vượt ngưỡng.
