# Chart — Module breakdown

> Trạng thái: **Đã duyệt 2026-11-04**. Milestone 0.1.0 (phần workout bổ sung ở 0.2.0). Đặc tả cuối cùng vẫn là `docs/RequirementsOutline.md` §3.4.

## 1. Khả năng cần đạt
- Người dùng xem được tổng calo, đạm, natri, đường theo từng ngày trong 7 hoặc 30 ngày gần nhất.
- Người dùng chuyển được giữa dạng đường và dạng cột.
- Mỗi chỉ số có các đường ngưỡng: ngưỡng dưới, mục tiêu, ngưỡng trên. Calo có thêm đường BMR và đường an toàn.
- Khi bật Workout, biểu đồ calo có thêm đường calo tiêu hao và calo ròng.
- Bấm vào một ngày thì xem được số liệu ngày đó và mở được ngày đó ở tab Hôm nay.

## 2. Người dùng và màn hình
- **Tab Biểu đồ**, theo thứ tự từ trên xuống:
  - **Chọn chỉ số:** Calo · Đạm · Natri · Đường.
  - **Chọn khoảng:** 7 ngày · 30 ngày. Khoảng luôn kết thúc ở hôm nay.
  - **Chọn dạng:** Đường · Cột.
  - **Biểu đồ:** trục X là ngày (`dd/MM`), trục Y là đơn vị của chỉ số. Các đường ngưỡng là đường ngang nét đứt, có nhãn ở mép phải.
  - **Chú thích (legend):** gồm các series và các đường ngưỡng.
  - **Thẻ chi tiết** của ngày đang chọn: các giá trị của ngày đó và nút "Mở ngày này".
- Màu của các đường ngưỡng cố định cho mọi chỉ số:
  - ngưỡng trên: đỏ;
  - mục tiêu: xanh lá;
  - ngưỡng dưới, BMR, an toàn: xám, kèm các kiểu nét khác nhau.

  Màu chính thức sẽ định nghĩa trong DESIGN.md.
- **Trạng thái:**
  - không có món nào trong khoảng đã chọn: hiện "Chưa có dữ liệu trong khoảng này", các đường ngưỡng vẫn hiện;
  - đang tải;
  - lỗi tải, kèm nút "Thử lại".
- **Trợ năng:** có chế độ đọc dạng bảng, liệt kê ngày và giá trị.

## 3. Luồng và trạng thái
1. Mở tab → mặc định chỉ số Calo, 7 ngày, dạng cột. Lựa chọn lần trước được nhớ trên máy.
2. Đổi chỉ số, khoảng hoặc dạng → vẽ lại ngay. Dữ liệu thô được tải một lần cho cả khoảng.
3. Bấm vào một ngày → hiện thẻ chi tiết. Bấm "Mở ngày này" → tab Hôm nay mở ở ngày đó.
4. Quay lại tab sau khi đã thêm hoặc sửa món → số liệu được làm mới.

## 4. Quy tắc nghiệp vụ cố định
- Giá trị một ngày = tổng các món có `eaten_on` bằng ngày đó.
- **Ngày không có món nào:** hiện là khoảng trống, không vẽ điểm 0. Dạng đường bị ngắt; dạng cột không có cột. Thẻ chi tiết ghi "Chưa ghi".
- **Đường ngưỡng** dùng hồ sơ và mục tiêu **hiện tại** cho mọi ngày (theo `Goals.md` §4):

  | Chỉ số | Các đường |
  |---|---|
  | Calo | BMR · an toàn (BMR + 300) · mục tiêu · trên (4000) |
  | Đạm | dưới (0.8×kg) · mục tiêu · trên (2.2×kg) |
  | Natri | dưới (500) · mục tiêu (1500) · trên (2000) |
  | Đường | mục tiêu (5%) · trên (10%). Ngưỡng dưới bằng 0 nên không vẽ. |

- **Khi bật Workout** (chỉ áp dụng cho chỉ số Calo):
  - Có 3 series: Nạp, Tiêu hao, Ròng.
  - Tiêu hao = tổng calo của các buổi "Đã tập" có ngày bằng ngày đó.
  - Ròng = Nạp − Tiêu hao. Có thể âm; khi âm, trục Y kéo xuống dưới 0.
  - Các đường ngưỡng được so với series Ròng. Dạng cột hiển thị Ròng là cột chính; Nạp và Tiêu hao hiện trong thẻ chi tiết.
  - Ngày có buổi "Đã tập" nhưng không có món nào: Nạp = 0 và vẫn vẽ.
- **Khi tắt Workout:** chỉ có series Nạp; dữ liệu tiêu hao bị bỏ qua hoàn toàn, nhưng vẫn còn trong DB.
- Trục Y bắt đầu từ 0 (hoặc từ giá trị âm nhỏ nhất khi có Ròng âm) và đủ cao để chứa ngưỡng trên.

## 5. Hợp đồng dữ liệu
- Không thêm bảng. Chỉ đọc `meal_entries`. Từ 0.2.0, đọc thêm `workout_completions` (xem `Workout.md`).
- Nên có một truy vấn hoặc RPC tổng hợp theo ngày, chạy trên server cho khoảng [hôm nay − 29, hôm nay], để không phải tải từng món. RLS vẫn áp dụng.
- Lựa chọn chỉ số, khoảng và dạng được lưu cục bộ trên máy, không lưu lên server.

## 6. Nâng cấp và giới hạn
- Chưa có khoảng tuỳ chọn hay xem theo tháng hoặc năm.
- Ngưỡng của ngày cũ không phản ánh hồ sơ tại thời điểm đó.

## 7. Tiêu chí nghiệm thu
| Mã | Tình huống | Kết quả |
|---|---|---|
| CHART-01 | Tài khoản mới mở tab Biểu đồ | Hiện trạng thái trống; vẫn hiện các đường ngưỡng của Calo |
| CHART-02 | Có món ở 3 trong 7 ngày gần nhất | 3 điểm hoặc cột; 4 ngày còn lại là khoảng trống, không phải 0 |
| CHART-03 | Giá trị của một ngày | Bằng tổng các món của ngày đó ở tab Hôm nay |
| CHART-04 | Các đường ngưỡng với hồ sơ ví dụ thứ nhất ở `Goals.md` | Calo: 1649 / 1949 / 2056 / 4000. Đạm: 56 / 112 / 154. Natri: 500 / 1500 / 2000. Đường: 26 / 51 |
| CHART-05 | Tự đặt mục tiêu calo 1800 | Đường mục tiêu ở 1800; ngưỡng trên của đường = 45 |
| CHART-06 | Đổi giữa 7 / 30 ngày và đường / cột; tắt app mở lại | Vẽ đúng; lựa chọn được nhớ |
| CHART-07 | Bấm vào một ngày, chọn "Mở ngày này" | Tab Hôm nay mở đúng ngày đó |
| CHART-08 | Thêm món ở tab Hôm nay rồi quay lại tab Biểu đồ | Số liệu đã cập nhật |
| CHART-09 | (0.2.0) Bật Workout; một ngày nạp 2000, có buổi "Đã tập" 400 kcal | Nạp 2000 · Tiêu hao 400 · Ròng 1600; ngưỡng so với 1600 |
| CHART-10 | (0.2.0) Cùng dữ liệu nhưng tắt Workout | Chỉ có Nạp 2000; không hiện tiêu hao |
| CHART-11 | (0.2.0) Một ngày chỉ có buổi tập, không có món nào | Nạp 0, Ròng âm, trục Y có phần âm |
| CHART-12 | Tài khoản B gọi RPC tổng hợp | Chỉ nhận dữ liệu của B |
| CHART-13 | Mất mạng khi mở tab | Báo lỗi kèm "Thử lại"; không hiện dữ liệu cũ như thể là số liệu mới |
| CHART-14 | Bật trình đọc màn hình hoặc chế độ bảng (cần thiết bị) | Đọc được ngày và giá trị của từng ngày |

## 8. Bàn giao
- RPC tổng hợp kèm test RLS; unit test cho hàm dựng series (gồm khoảng trống và Ròng âm); test thành phần biểu đồ với dữ liệu mẫu.
