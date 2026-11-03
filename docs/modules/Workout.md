# Workout — Module breakdown

> Trạng thái: **Đã duyệt 2026-11-04**. Milestone **0.2.0**. Đặc tả cuối cùng vẫn là `docs/RequirementsOutline.md` §3.6. Thuật toán và cấu trúc dữ liệu chặn trùng lịch được **chốt trong `docs/ADR.md`**; file này chỉ định nghĩa hành vi.

## 1. Khả năng cần đạt
- Người dùng bật hoặc tắt Workout trong Cài đặt. Khi tắt, mọi thứ liên quan bị ẩn và không được tính vào calo.
- Người dùng tạo, sửa, xoá activity (ví dụ Gym, Chạy bộ) và sub-activity (ví dụ Tập ngực, Tập lưng).
- Mỗi mục lá có một lịch: giờ bắt đầu, thời lượng, kiểu lặp (hằng ngày / hằng tuần theo các thứ), và ước lượng calo mỗi buổi. **Không có lặp hằng tháng** (đã bỏ ngày 2026-11-04, xem ADR-008).
- App không cho lưu một lịch đè giờ lên lịch khác.
- Người dùng xem lịch tuần, tô màu theo activity, ngay trên danh sách activity.
- Người dùng đánh dấu "Đã tập" cho buổi của hôm nay hoặc một ngày trước đó. Chỉ buổi đã đánh dấu mới được tính calo tiêu hao.
- Người dùng nhận thông báo tóm tắt lịch tập trong ngày, và nhắc trước mỗi buổi 30 phút.

## 2. Người dùng và màn hình
- **Cài đặt › Workout:** công tắc "Bật Workout". Khi bật, Cài đặt › Nhắc nhở có thêm "Giờ tóm tắt lịch tập" (mặc định 06:00).
- **Tab Workout** (chỉ hiện khi bật), theo thứ tự từ trên xuống:
  - **Lịch tuần (T2–CN):** lưới theo giờ. Mỗi buổi là một khối tô màu của activity cha, ghi tên mục lá. Vuốt ngang để đổi tuần; có nút "Tuần này".
    - Khối có "Đã tập" hiện dấu ✓.
    - Khối ở ngày tương lai hiện nhạt hơn.
  - **"Hôm nay":** danh sách các buổi hôm nay. Mỗi buổi có nút "Đã tập", hoặc "Bỏ đánh dấu" nếu đã đánh dấu.
  - **Danh sách activity:** mỗi thẻ có chấm màu, tên, và một dòng tóm tắt:
    - activity có sub: "N sub-activity";
    - mục lá: lịch rút gọn, ví dụ "T2 T4 T6 · 06:00 · 60 phút · 300 kcal", hoặc "Chưa có lịch".
  - **Nút "+ Activity".**
- **Màn hình Activity:**
  - tên và màu (sửa được);
  - nếu là mục lá: khung **Lịch**;
  - nếu có sub: danh sách sub kèm lịch rút gọn và kcal của từng sub, chỉ để xem. Khung Lịch và kcal của chính activity bị ẩn;
  - nút "+ Sub-activity";
  - nút "Xoá activity".
- **Màn hình Sub-activity:** tên, khung **Lịch**, nút "Xoá".
- **Khung Lịch:**
  - giờ bắt đầu (`HH:mm`, bước 5 phút);
  - thời lượng (phút);
  - kiểu lặp: Hằng ngày / Hằng tuần, với hàng 7 nút T2 T3 T4 T5 T6 T7 CN chọn được nhiều;
  - ngày bắt đầu áp dụng (mặc định hôm nay);
  - ước lượng kcal mỗi buổi;
  - nút "Lưu lịch" và "Xoá lịch".
- **Trạng thái:**
  - chưa có activity: "Thêm hoạt động đầu tiên";
  - lỗi trùng lịch: thông báo ngay trong khung Lịch (xem §4);
  - đang lưu;
  - lỗi mạng.

## 3. Luồng và trạng thái
### 3.1. Bật và tắt
- **Bật:** hiện tab Workout, lên lịch các thông báo workout, bắt đầu tính calo tiêu hao vào tab Hôm nay và tab Biểu đồ.
- **Tắt:** ẩn tab, hủy thông báo workout, ngừng tính calo tiêu hao. **Dữ liệu được giữ nguyên.** Bật lại thì mọi thứ trở lại như cũ.

### 3.2. Activity và sub-activity
- **Tạo activity:** mặc định là mục lá chưa có lịch, màu được gán là màu đầu tiên chưa dùng trong bảng 8 màu.
- **Thêm sub-activity đầu tiên vào activity đang có lịch hoặc có lịch sử "Đã tập":**
  - Hộp thoại thông báo: "Lịch, ước lượng calo và lịch sử 'Đã tập' của «Chạy bộ» sẽ chuyển sang sub-activity mới."
  - Người dùng đặt tên cho sub → xác nhận → mọi thứ chuyển sang sub đó.
  - Bấm hủy thì không thay đổi gì.
- **Xoá sub-activity cuối cùng:** activity cha trở thành mục lá chưa có lịch.
- **Xoá activity hoặc sub-activity:** hộp thoại xác nhận nêu số sub và lịch sẽ bị xoá. Lịch sử "Đã tập" **được giữ** (kèm tên lúc đó) để calo của các ngày cũ không đổi.

### 3.3. Sửa lịch
1. Nhập các trường → "Lưu lịch".
2. App kiểm tra trùng với mọi lịch khác của người dùng, ở cả client lẫn server.
3. Có trùng → không lưu; hiện lỗi; dữ liệu đang nhập được giữ.
4. Không trùng → lưu, cập nhật lịch tuần và lên lịch lại các thông báo.

- Sửa lịch hoặc kcal không làm đổi các buổi đã đánh dấu "Đã tập" trước đó.

### 3.4. Đánh dấu "Đã tập"
- Từ phần "Hôm nay", hoặc bấm vào một khối trên lịch tuần của ngày ≤ hôm nay → "Đã tập". Calo lưu theo kcal ước lượng tại thời điểm đánh dấu.
- "Bỏ đánh dấu" xoá bản ghi đó.
- Buổi ở ngày tương lai: nút bị vô hiệu.

### 3.5. Quay lại và hủy
- Rời khung Lịch hoặc màn hình sửa tên khi có thay đổi chưa lưu → hỏi "Bỏ thay đổi?".
- Back khi bàn phím mở chỉ ẩn bàn phím.

## 4. Quy tắc nghiệp vụ cố định
- **Cấu trúc:** tối đa 2 cấp (activity → sub-activity). Mục lá = sub-activity, hoặc activity không có sub. Chỉ mục lá có lịch; mỗi mục lá có **tối đa một** lịch. Tối đa 50 mục lá mỗi người dùng.
- **Tên:** 1–50 ký tự sau khi trim.
  - Tên activity không trùng nhau trong cùng tài khoản.
  - Tên sub không trùng nhau trong cùng activity.
  - So sánh trùng dùng tên chuẩn hoá như ở `MealLog.md`.
- **Màu:** thuộc bảng 8 màu cố định (định nghĩa trong DESIGN.md). Sub-activity dùng màu của activity cha.
- **Lịch:**
  - giờ bắt đầu: phút là bội số của 5;
  - thời lượng: số nguyên 5–480 phút;
  - **giờ bắt đầu + thời lượng ≤ 24:00**, tức không kéo qua nửa đêm;
  - kcal ước lượng: số nguyên 1–3000;
  - hằng tuần: chọn ít nhất 1 thứ; chọn đủ 7 thứ thì app tự chuyển thành "Hằng ngày";
  - **chỉ có hai kiểu lặp: hằng ngày và hằng tuần**, không có hằng tháng;
  - ngày bắt đầu áp dụng: không có buổi nào trước ngày này.
- **Tập thứ của lịch:** hằng ngày = cả 7 thứ (T2–CN); hằng tuần = các thứ đã chọn.
- **Buổi:** một mục lá có buổi vào ngày `d` khi và chỉ khi `d` ≥ ngày bắt đầu áp dụng **và** thứ của `d` nằm trong tập thứ của lịch.
- **Trùng lịch:** hai lịch A và B trùng nhau khi **đồng thời**:
  - khoảng giờ `[bắt đầu, bắt đầu + thời lượng)` của A và B giao nhau. Hai buổi nối tiếp (A kết thúc 07:00, B bắt đầu 07:00) **không** tính là trùng;
  - tập thứ của A và tập thứ của B có ít nhất một thứ chung.

  Hệ quả:
  - Cặp có ít nhất một lịch **hằng ngày** (ngày–ngày, ngày–tuần): **chỉ cần xét giờ**, vì lịch hằng ngày phủ mọi thứ.
  - Cặp **tuần–tuần:** trùng khi có thứ chung **và** giờ giao nhau.
  - Ngày bắt đầu áp dụng **không** ảnh hưởng việc có trùng hay không, vì hai lịch cùng lặp vô hạn theo tuần nên chắc chắn gặp nhau. Ngày bắt đầu chỉ dùng để tính **ngày trùng đầu tiên** = ngày đầu tiên ≥ max(ngày bắt đầu của A, của B) rơi vào một thứ chung (luôn nằm trong 7 ngày).

  Lỗi trùng phải nêu: tên mục bị trùng, khoảng giờ của nó, và **ngày trùng đầu tiên**, ví dụ "Trùng với «Tập ngực» (06:00–07:00), lần đầu vào 10/11/2026". Kiểm tra trên server phải không bị lọt khi hai máy cùng lưu một lúc (chi tiết ở ADR).
- **Đã tập:**
  - mỗi mục lá có tối đa một bản ghi cho mỗi ngày;
  - ngày ≤ hôm nay, và mục lá phải có buổi vào ngày đó theo lịch hiện tại;
  - calo = kcal ước lượng lúc đánh dấu, lưu bản sao, không đổi sau đó.
- **Calo tiêu hao của ngày** = tổng calo của các bản ghi "Đã tập" có ngày đó. Chỉ được tính và hiển thị khi Workout đang bật. Calo ròng xem `Chart.md` §4.
- **Thông báo** (cách gửi theo ADR, chỉ khi Workout bật và có quyền). **Không cam kết đúng giờ** khi chưa dùng Firebase FCM: hệ điều hành có thể gửi trễ, kể cả nhắc trước 30 phút (ADR-006).
  - **Tóm tắt:** vào "Giờ tóm tắt" của những ngày có ít nhất một buổi. Ví dụ: "Hôm nay: Tập ngực 06:00, Chạy bộ 18:00". Ngày không có buổi nào thì không gửi.
  - **Nhắc trước:** 30 phút trước giờ bắt đầu mỗi buổi, ví dụ "Tập ngực lúc 06:00 (còn 30 phút)". Lúc lên lịch mà thời điểm nhắc đã qua thì bỏ qua.
  - Bấm vào thông báo → tab Workout.

## 5. Hợp đồng dữ liệu
| Thực thể.trường | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `activities.id` | uuid | khoá chính | |
| `activities.user_id` | uuid | bắt buộc, cascade | RLS chủ sở hữu |
| `activities.parent_id` | uuid null | FK `activities`, cascade; cha phải cùng `user_id` và có `parent_id` null | chặn cấp 3 và chặn tham chiếu chéo tài khoản |
| `activities.name` | text | 1–50; unique theo (`user_id`, `parent_id`, tên chuẩn hoá) | |
| `activities.color` | text | thuộc bảng 8 màu; chỉ cấp 1 | |
| `activities.created_at` | timestamptz | server gán | thứ tự hiển thị |
| `schedules.activity_id` | uuid | khoá chính, FK `activities` cascade; chỉ mục lá | trigger chặn khi activity có sub |
| `schedules.user_id` | uuid | bắt buộc | RLS chủ sở hữu |
| `schedules.start_minute` | smallint | 0–1435, bội số của 5 | phút tính từ 00:00 |
| `schedules.duration_min` | smallint | 5–480; `start_minute + duration_min ≤ 1440` | |
| `schedules.repeat_type` | text | `daily` \| `weekly` | để hiển thị; logic kiểm trùng chỉ dùng `weekdays` |
| `schedules.weekdays` | smallint **not null** | bitmask 1–127 (bit 0 = T2 … bit 6 = CN); `daily` ⇔ `weekdays = 127`; `weekly` ⇔ 1–126 | check constraint |
| `schedules.starts_on` | date | | |
| `schedules.kcal_estimate` | smallint | 1–3000 | |
| `workout_completions.id` | uuid | khoá chính; client sinh | chống ghi trùng khi gửi lại |
| `workout_completions.user_id` | uuid | bắt buộc, cascade theo user | RLS chủ sở hữu |
| `workout_completions.activity_id` | uuid null | FK `activities` **on delete set null** | giữ lịch sử khi xoá activity |
| `workout_completions.activity_name` | text | bản sao tên lúc đánh dấu | |
| `workout_completions.done_on` | date | ≤ hôm nay (server dung sai +1 ngày như `MealLog.md`) | unique (`activity_id`, `done_on`) khi `activity_id` khác null |
| `workout_completions.kcal` | smallint | 1–3000, bản sao | |

- Lưu lịch đi qua một RPC: kiểm trùng và ghi trong cùng một giao dịch, có khoá theo người dùng. Thao tác "thêm sub đầu tiên" cũng là một RPC chạy trong một giao dịch.
- Thuật toán kiểm trùng là một hàm thuần, dùng chung logic cho client và server (hoặc hai bản cài đặt cùng chạy một bộ test). Chi tiết ở `docs/ADR.md`.

## 6. Nâng cấp và giới hạn
- Mỗi mục lá chỉ có một lịch; không có buổi ngoài lịch; không có lịch một lần; **không có lặp hằng tháng** (đánh đổi ở ADR-008).
- Không kéo qua nửa đêm.
- Tối đa 50 mục lá. Các giới hạn số lượng thông báo đang chờ của hệ điều hành xử lý theo ADR.

## 7. Tiêu chí nghiệm thu
| Mã | Tình huống | Kết quả |
|---|---|---|
| WO-01 | Tài khoản mới | Workout tắt; không có tab Workout; biểu đồ và thẻ tổng không có tiêu hao |
| WO-02 | Bật Workout lần đầu | Hiện tab Workout với trạng thái trống |
| WO-03 | Tạo "Gym" | Mục lá "Chưa có lịch"; có màu đầu tiên chưa dùng |
| WO-04 | Lịch "Chạy bộ": hằng tuần T2 T4 T6, 06:00, 60 phút, 300 kcal | Lưu được; lịch tuần có 3 khối đúng màu và đúng giờ |
| WO-05 | Thêm lịch T4 06:30, 30 phút cho mục khác | Bị chặn; lỗi nêu «Chạy bộ» (06:00–07:00) và ngày thứ Tư đầu tiên kể từ max(ngày bắt đầu) |
| WO-06 | Thêm lịch T4 07:00, 30 phút | Lưu được (nối tiếp, không trùng) |
| ~~WO-07~~ | ~~Hằng tháng ngày 31 so với hằng tuần T3~~ | **Bỏ 2026-11-04**: không còn lặp hằng tháng |
| ~~WO-08~~ | ~~Hằng tháng ngày 31 so với hằng tháng ngày 30~~ | **Bỏ 2026-11-04** |
| ~~WO-09~~ | ~~Hằng tháng ngày 31, xem lịch tháng 11 và 12~~ | **Bỏ 2026-11-04** |
| WO-10 | A hằng ngày 06:00 bắt đầu 01/11; B hằng tuần T2 06:00 bắt đầu 01/03 năm sau | Bị chặn; ngày trùng đầu tiên là thứ Hai đầu tiên kể từ 01/03 (không phải từ 01/11) |
| WO-11 | Thời lượng 4 / 481; 23:30 + 60 phút; hằng tuần không chọn thứ; kcal 0 | Không lưu; báo lỗi đúng trường |
| WO-12 | "Chạy bộ" đã có lịch và 2 lần "Đã tập"; thêm sub đầu tiên "Chạy sáng" | Có hộp thoại; xác nhận thì lịch và 2 lần "Đã tập" thuộc về «Chạy sáng»; "Chạy bộ" không còn khung Lịch; calo các ngày cũ không đổi |
| WO-13 | Cùng tình huống, bấm hủy | Không thay đổi gì |
| WO-14 | Activity có sub | Không có khung Lịch hay kcal của chính nó; hiện lịch và kcal của từng sub |
| WO-15 | Gọi API tạo lịch cho activity đang có sub; tạo sub của một sub (cấp 3) | Server từ chối |
| WO-16 | Đánh dấu "Đã tập" buổi hôm nay 300 kcal | Thẻ tổng Hôm nay: tiêu hao 300; biểu đồ: Ròng = Nạp − 300 |
| WO-17 | Bỏ đánh dấu | Tiêu hao về 0 |
| WO-18 | Đánh dấu buổi ở ngày mai; đánh dấu ngày không có buổi (qua API) | Nút bị vô hiệu; server từ chối |
| WO-19 | Đánh dấu hai lần cùng buổi (hai máy hoặc gửi lại sau timeout) | Chỉ có một bản ghi |
| WO-20 | Đổi kcal ước lượng từ 300 thành 400 sau khi đã đánh dấu | Buổi cũ vẫn 300; buổi đánh dấu sau đó là 400 |
| WO-21 | Xoá activity có lịch sử "Đã tập" | Activity và lịch mất; calo của các ngày cũ không đổi |
| WO-22 | Tắt Workout | Tab ẩn; tiêu hao không hiện; không nhận thông báo workout; bật lại thì dữ liệu còn nguyên |
| WO-23 | Hai máy cùng lưu hai lịch trùng nhau gần như cùng lúc | Chỉ một lịch được lưu; máy kia nhận lỗi trùng |
| WO-24 | Tài khoản B đọc hoặc ghi `activities`, `schedules`, `workout_completions` của A; B tạo sub với `parent_id` của A | RLS hoặc constraint từ chối |
| WO-25 | Mất mạng khi lưu lịch hoặc đánh dấu | Báo lỗi; không hiện như đã lưu; dữ liệu đang nhập được giữ |
| WO-26 | Có buổi 18:00 hôm nay, giờ tóm tắt 06:00 (cần thiết bị) | Nhận một tóm tắt, không sớm hơn 06:00; nhận một nhắc trước, không sớm hơn 17:30. Được phép trễ; ghi lại độ trễ |
| WO-27 | Ngày không có buổi nào (cần thiết bị) | Không nhận tóm tắt |
| WO-28 | Sửa giờ buổi từ 18:00 sang 19:00 (cần thiết bị) | Không còn nhắc theo giờ hẹn 17:30; nhận nhắc từ 18:30 trở đi |
| WO-29 | Vuốt lịch tuần; bàn phím khi nhập; Back khi bàn phím mở (cần thiết bị) | Đổi tuần đúng; Back chỉ ẩn bàn phím |
| WO-30 | A hằng ngày 06:00–07:00; thêm B hằng tuần CN 06:45, 30 phút | Bị chặn (cặp có lịch hằng ngày chỉ xét giờ); ngày trùng đầu tiên là Chủ nhật đầu tiên ≥ max(ngày bắt đầu) |
| WO-31 | A hằng ngày 06:00–07:00; thêm B hằng ngày 07:00–08:00 | Lưu được (nối tiếp) |
| WO-32 | A hằng tuần T2 T4 06:00–07:00; thêm B hằng tuần T3 T5 06:00–07:00 | Lưu được (không có thứ chung) |
| WO-33 | A hằng tuần T2 T4 06:00–07:00; thêm B hằng tuần T4 T6 06:30–07:30 | Bị chặn; lỗi nêu «A» và thứ Tư đầu tiên ≥ max(ngày bắt đầu) |
| WO-34 | Chọn hằng tuần và bấm đủ 7 thứ | Kiểu lặp tự chuyển thành "Hằng ngày"; lưu với `weekdays = 127` |
| WO-35 | Gọi API lưu lịch có `repeat_type = 'monthly'`, hoặc `daily` với `weekdays ≠ 127` | Server từ chối |

## 8. Bàn giao
- Migration ba bảng kèm RLS, trigger và constraint; RPC lưu lịch có kiểm trùng; RPC "thêm sub đầu tiên".
- Hàm thuần sinh buổi và kiểm trùng, kèm unit test bao phủ mọi cặp kiểu lặp (ngày–ngày, ngày–tuần, tuần–tuần có và không có thứ chung), các trường hợp nối tiếp, giờ biên 00:00 và 24:00, và ngày bắt đầu khác nhau.
- Test RLS; test chạy song song cho WO-23; kết quả kiểm tra thông báo trên thiết bị Android thật.
