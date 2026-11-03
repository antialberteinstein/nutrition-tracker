# Goals — Module breakdown

> Trạng thái: **Đã duyệt 2026-11-04**. Milestone 0.1.0. Đặc tả cuối cùng vẫn là `docs/RequirementsOutline.md` §3.2.

## 1. Khả năng cần đạt
- Người dùng thấy BMI, BMR, TDEE và mục tiêu gợi ý cho calo, đạm, natri, đường, tính từ hồ sơ.
- Người dùng có thể sửa mức điều chỉnh calo và tự đặt mục tiêu cho từng chỉ số.
- Người dùng có thể quay về giá trị gợi ý cho từng chỉ số.
- App cảnh báo (không chặn) khi giá trị đặt có vẻ ngược với mong muốn hoặc không an toàn.

## 2. Người dùng và màn hình
- **Tóm tắt cuối Onboarding** và **Cài đặt › Mục tiêu** dùng chung một khối:
  - **Chỉ số cơ thể:** BMI (kèm phân loại), BMR, TDEE. Khi Workout bật, cạnh TDEE có dòng "Đang dùng hệ số 1.2 vì Workout bật; calo tập được tính riêng".
  - **Calo:** mức điều chỉnh (ô số có dấu ±), mục tiêu calo (gợi ý hoặc tự đặt).
  - **Đạm, Natri, Đường:** mỗi chỉ số có một dòng hiện ngưỡng dưới, mục tiêu và ngưỡng trên. Mục tiêu bấm vào để sửa.
- Mục tiêu đang dùng giá trị tự đặt thì có nhãn "Tự đặt · gợi ý: X" và nút "Dùng gợi ý".
- Cảnh báo hiện ngay dưới trường liên quan, màu vàng, có icon. Không phải hộp thoại chặn.

## 3. Luồng và trạng thái
### 3.1. Sửa mục tiêu
1. Bấm vào mục tiêu → nhập số → "Lưu".
2. Giá trị có cảnh báo vẫn lưu được; cảnh báo vẫn hiện sau khi lưu.
3. Bấm "Dùng gợi ý" → xoá giá trị tự đặt → hiện lại giá trị gợi ý.

### 3.2. Hồ sơ thay đổi
- Mục tiêu gợi ý được tính lại ngay. Mục tiêu tự đặt giữ nguyên, nhãn "gợi ý: X" cập nhật giá trị mới.
- Đổi mong muốn khi mức điều chỉnh đang ở mặc định thì mức điều chỉnh đổi theo mặc định của mong muốn mới. Mức điều chỉnh đã tự đặt thì giữ nguyên, và áp dụng lại quy tắc cảnh báo.

## 4. Quy tắc nghiệp vụ cố định
Công thức áp dụng cho cả hiển thị lẫn biểu đồ. Chỉ làm tròn ở **bước cuối**; mọi giá trị hiển thị là số nguyên, riêng BMI có 1 chữ số thập phân.

| Đại lượng | Công thức |
|---|---|
| Tuổi | năm hiện tại − năm sinh |
| BMI | cân nặng ÷ (chiều cao/100)² |
| BMR (Mifflin-St Jeor) | Nam: 10×kg + 6.25×cm − 5×tuổi + 5 · Nữ: 10×kg + 6.25×cm − 5×tuổi − 161 |
| TDEE | BMR × hệ số vận động (bảng trong `Account.md` §4). **Khi Workout bật: hệ số luôn là 1.2**, vì việc tập đã được tính qua calo ròng. Tắt Workout thì quay lại mức vận động đã chọn. |
| Mức điều chỉnh mặc định | `lose` −500 · `maintain` 0 · `gain` +300 (kcal) |
| Mục tiêu calo gợi ý | round(TDEE) + mức điều chỉnh |
| Calo: ngưỡng | BMR · an toàn = BMR + 300 · mục tiêu · trên = 4000 |
| Đạm (g) | dưới = 0.8×kg · mục tiêu gợi ý = 1.6×kg · trên = 2.2×kg |
| Natri (mg) | dưới = 500 · mục tiêu gợi ý = 1500 · trên = 2000 |
| Đường (g) | dưới = 0 · mục tiêu gợi ý = 5% × mục tiêu calo ÷ 4 · trên = 10% × mục tiêu calo ÷ 4 |

- "Mục tiêu calo" dùng để tính đường là mục tiêu **đang dùng**, tức giá trị tự đặt nếu có.
- **Phân loại BMI (chuẩn châu Á – Thái Bình Dương, Bộ Y tế Việt Nam đang dùng):**
  - < 18.5: thiếu cân;
  - 18.5–22.9: bình thường;
  - 23.0–24.9: thừa cân;
  - ≥ 25: béo phì.
- **Giới hạn nhập:**
  - mức điều chỉnh: −1500 đến +1500 kcal;
  - mục tiêu calo: 800–6000 kcal;
  - mục tiêu đạm: 10–400 g;
  - mục tiêu natri: 0–6000 mg;
  - mục tiêu đường: 0–300 g.

  Ngoài khoảng thì không lưu được và báo lỗi.
- **Cảnh báo** (vẫn lưu được):

  | Mã | Điều kiện | Nội dung gợi ý |
  |---|---|---|
  | W1 | Mong muốn `lose` và mức điều chỉnh ≥ +1 | "Bạn muốn giảm cân nhưng đang đặt mục tiêu cao hơn mức tiêu hao." |
  | W2 | Mong muốn `gain` và mức điều chỉnh ≤ −1 | "Bạn muốn tăng cân nhưng đang đặt mục tiêu thấp hơn mức tiêu hao." |
  | W3 | Mục tiêu calo đang dùng < BMR | "Mục tiêu thấp hơn BMR, không khuyến nghị nếu không có hướng dẫn chuyên môn." |
  | W4 | Mục tiêu calo đang dùng > 4000 | "Mục tiêu vượt giới hạn trên 4000 kcal." |
  | W5 | Mục tiêu đạm, natri hoặc đường nằm ngoài [ngưỡng dưới, ngưỡng trên] | "Mục tiêu nằm ngoài khoảng khuyến nghị." |
  | W6 | BMI < 18.5 và `lose`, hoặc BMI ≥ 25 và `gain` | "Mong muốn hiện tại có thể không phù hợp với BMI." |

- **Ví dụ để làm unit test:**
  - Nam, 70 kg, 175 cm, 30 tuổi, `moderate`, `lose`: BMR 1649 · TDEE 2556 · mục tiêu 2056 · đạm 56/112/154 · đường 0/26/51.
  - Nữ, 55 kg, 160 cm, 25 tuổi, `sedentary`, `maintain`: BMR 1264 · TDEE 1517 · mục tiêu 1517 · đạm 44/88/121 · đường 0/19/38.

## 5. Hợp đồng dữ liệu
| Thực thể.trường | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `goals.user_id` | uuid | khoá chính, FK `auth.users`, cascade | RLS chủ sở hữu |
| `goals.calorie_adjustment` | smallint null | −1500..1500 | `null` = mặc định theo mong muốn |
| `goals.calorie_target` | smallint null | 800..6000 | `null` = dùng gợi ý |
| `goals.protein_target_g` | smallint null | 10..400 | `null` = dùng gợi ý |
| `goals.sodium_target_mg` | smallint null | 0..6000 | `null` = dùng gợi ý |
| `goals.sugar_target_g` | smallint null | 0..300 | `null` = dùng gợi ý |
| `goals.updated_at` | timestamptz | server gán | |

- Giá trị gợi ý **không lưu** mà tính từ `profiles` mỗi lần cần, nên không bị lệch khi hồ sơ đổi.
- Mọi công thức đặt trong một module thuần (không có I/O), có unit test.

## 6. Nâng cấp và giới hạn
- Ngưỡng dưới và ngưỡng trên không sửa được ở v1.
- Biểu đồ dùng mục tiêu **hiện tại** cho mọi ngày trong quá khứ.

## 7. Tiêu chí nghiệm thu
| Mã | Tình huống | Kết quả |
|---|---|---|
| GOAL-01 | Hồ sơ trong hai ví dụ ở §4 | Hiện đúng mọi con số trong ví dụ |
| GOAL-02 | Tài khoản mới chưa tự đặt gì | Mọi mục tiêu là gợi ý; không có nhãn "Tự đặt" |
| GOAL-03 | `lose`, sửa mức điều chỉnh thành +1 | Hiện W1; vẫn lưu được; mục tiêu = round(TDEE) + 1 |
| GOAL-04 | `gain`, sửa mức điều chỉnh thành −1 | Hiện W2; vẫn lưu được |
| GOAL-05 | `lose` với mức điều chỉnh 0, hoặc `gain` với mức điều chỉnh 0 | Không có W1 hay W2 |
| GOAL-06 | Tự đặt mục tiêu calo thấp hơn BMR / cao hơn 4000 | Hiện W3 / W4 |
| GOAL-07 | Tự đặt đạm ngoài khoảng 0.8–2.2 g/kg; natri > 2000; đường > ngưỡng trên | Hiện W5 cho đúng chỉ số |
| GOAL-08 | Nhập mục tiêu calo 799 hoặc 6001, mức điều chỉnh 1501, ô trống, chữ | Không lưu; báo lỗi dưới trường; giá trị cũ giữ nguyên |
| GOAL-09 | Tự đặt mục tiêu calo 1800 rồi đổi cân nặng | Mục tiêu calo vẫn 1800; nhãn gợi ý cập nhật; ngưỡng trên của đường tính theo 1800 |
| GOAL-10 | Bấm "Dùng gợi ý" | Giá trị tự đặt bị xoá; hiện giá trị gợi ý; mở lại app vẫn đúng |
| GOAL-11 | Đổi mong muốn từ `lose` sang `gain` khi mức điều chỉnh đang mặc định | Mức điều chỉnh thành +300 |
| GOAL-12 | BMI 17.0 và chọn `lose` | Hiện W6 |
| GOAL-13 | Tài khoản B đọc hoặc sửa `goals` của A | RLS từ chối |
| GOAL-14 | Mất mạng khi lưu mục tiêu | Báo lỗi; giá trị trên màn hình quay về giá trị đã lưu trên server, hoặc giữ ô nhập để thử lại; không hiện "đã lưu" |
| GOAL-15 | (0.2.0) Hồ sơ ví dụ thứ nhất (`moderate`, `lose`), bật Workout | TDEE = round(1648.75 × 1.2) = 1979; mục tiêu gợi ý 1479; tắt Workout thì quay về 2556 / 2056 |
| GOAL-16 | BMI 25.0 và chọn `gain`; BMI 24.9 và chọn `gain` | 25.0: hiện W6. 24.9: không hiện W6 |

## 8. Bàn giao
- Module tính toán thuần kèm unit test, gồm hai ví dụ ở §4 và các giá trị biên. Migration `goals` kèm RLS; test RLS.
