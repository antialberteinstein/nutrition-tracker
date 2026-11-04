# ADR — Architecture Decision Records

> Mọi quyết định kỹ thuật quan trọng của dự án nằm trong **một file này**. Đây là lựa chọn của chủ dự án, thay cho thư mục `docs/decisions/` mặc định của scaffold.
>
> **Quy tắc:**
> - Agent đề xuất, chủ dự án quyết định.
> - ADR đã "Chấp nhận" thì không sửa nội dung. Muốn đổi thì thêm ADR mới với trạng thái "Thay thế ADR-NNN", và đổi trạng thái của ADR cũ thành "Bị thay thế bởi ADR-MMM".
> - Phương án bị loại cũng được ghi lại, để không ai đề xuất lại.
> - Hành vi sản phẩm nằm ở `docs/RequirementsOutline.md`; file này chỉ nói **cách làm**.

## Mục lục

| # | Quyết định | Trạng thái | Ngày |
|---|---|---|---|
| ADR-001 | Client: React Native + Expo + TypeScript strict + Expo Router | Chấp nhận | 2026-11-04 |
| ADR-002 | Backend và Auth: Supabase, một nguồn danh tính | Chấp nhận | 2026-11-04 |
| ADR-003 | Phân quyền dữ liệu: RLS + FK ghép + service role chỉ ở Edge Function | Chấp nhận | 2026-11-04 |
| ADR-004 | Logic nghiệp vụ: module domain thuần + ràng buộc DB + RPC cho ghi nhiều bước | Chấp nhận | 2026-11-04 |
| ADR-005 | Ngày và giờ: ngày địa phương dạng `date`, phút trong ngày | Chấp nhận | 2026-11-04 |
| ADR-006 | Thông báo: lên lịch cục bộ bằng `expo-notifications`, cửa sổ cuộn | Chấp nhận | 2026-11-04 |
| ADR-007 | Firebase Cloud Messaging: hoãn | Bị loại (hoãn) | 2026-11-04 |
| ADR-008 | Workout: bitmask thứ trong tuần, chặn trùng O(1) mỗi cặp, không có lặp hằng tháng | Chấp nhận | 2026-11-04 |
| ADR-009 | Biểu đồ: `victory-native` (Skia) | Chấp nhận | 2026-11-04 |
| ADR-010 | State và form: TanStack Query, react-hook-form + zod | Chấp nhận | 2026-11-04 |
| ADR-011 | Môi trường và migration: Supabase local + 1 cloud, `supabase db push` thủ công | Chấp nhận | 2026-11-04 |
| ADR-012 | Kiểm thử: Jest, pgTAP, Appium (Python/uv) trên thiết bị thật | Chấp nhận; phần vị trí script bị thay thế bởi ADR-014 | 2026-11-04 |
| ADR-013 | Phát hành: EAS Build APK, GitHub Release + SHA-256, không OTA | Chấp nhận | 2026-11-04 |
| ADR-014 | Script E2E nằm trong `e2e/mobile-appium/scripts/` (thay một phần ADR-012) | Chấp nhận | 2026-11-05 |

---

## ADR-001. Client: React Native + Expo + TypeScript strict + Expo Router

- Trạng thái: **Chấp nhận** · Ngày: 2026-11-04 · Người quyết định: chủ dự án

**Bối cảnh.** Có một người phát triển. Đích là Android (phát hành) và iOS (chạy được). Cần push cục bộ, deep link, bàn phím số.

**Quyết định.**
- Expo (managed workflow, có dev build khi cần native module), React Native, **TypeScript `strict: true`**.
- Điều hướng bằng Expo Router (file-based, tab dưới).
- Lint bằng ESLint (`eslint-config-expo`), định dạng bằng Prettier.
- Deep link scheme: `nutritiontracker://`.

**Phương án bị loại.**
- JavaScript thuần: mất kiểm tra kiểu giữa schema DB (type do Supabase sinh) và client.
- Flutter, native: chủ dự án đã chọn React Native + Expo.

**Hệ quả.** Có type sinh từ DB (`supabase gen types typescript`), chạy được trên cả hai nền tảng. Rule "plain JS / CommonJS" trong cấu hình agent toàn cục **không áp dụng** cho repo này. **Xem lại khi** cần native module mà Expo không hỗ trợ.

---

## ADR-002. Backend và Auth: Supabase, một nguồn danh tính

- Trạng thái: **Chấp nhận** · Ngày: 2026-11-04

**Quyết định.**
- Supabase: Postgres, Auth (email + mật khẩu, bắt buộc xác nhận email), RPC (hàm `plpgsql`), Edge Functions (Deno/TS) cho thao tác cần quyền quản trị.
- **Supabase Auth là nguồn danh tính duy nhất.** Không dùng Firebase Auth.
- Phiên được lưu trên máy theo hướng dẫn chính thức của Supabase cho Expo, theo hướng mã hoá: khoá nằm trong `expo-secure-store`.

**Phương án bị loại.**
- Firebase Auth + Firestore: hai nguồn danh tính nếu kết hợp với Supabase; truy vấn tổng hợp theo ngày khó hơn.
- Backend riêng (NestJS/FastAPI): không có logic server nào đủ lớn để cần.

**Hệ quả.** Dùng gói miễn phí. Project miễn phí bị tạm dừng sau một thời gian không hoạt động, nên chấp nhận được cho app cá nhân. **Xem lại khi** có logic server nặng hoặc cần thanh toán.

---

## ADR-003. Phân quyền dữ liệu

- Trạng thái: **Chấp nhận** · Ngày: 2026-11-04

**Quyết định.**
1. Mọi bảng dữ liệu người dùng có cột `user_id uuid not null references auth.users on delete cascade`, **bật RLS**. Policy cho select, insert, update, delete đều là `user_id = auth.uid()`; insert và update có thêm `with check` cùng điều kiện.
2. **Chặn tham chiếu chéo tài khoản bằng FK ghép.** Ví dụ `activities (user_id, parent_id) → activities (user_id, id)`; tương tự cho `schedules` và `workout_completions`. Tham chiếu tới bản ghi của người khác sẽ vi phạm FK.
3. RPC chạy `security invoker` (mặc định), nên RLS vẫn áp dụng bên trong hàm. Hàm nào cần `security definer` phải có lý do ghi trong comment SQL và có test riêng.
4. **Service role key chỉ nằm trong Edge Function** (biến môi trường do Supabase quản lý). Không bao giờ đặt trong client, repo hay CI log. Edge Function `delete-account`:
   - xác thực JWT của người gọi;
   - xác thực lại mật khẩu;
   - xoá đúng `auth.uid()` đó; mọi bảng tự xoá theo cascade.
5. Client chỉ có `EXPO_PUBLIC_SUPABASE_URL` và `EXPO_PUBLIC_SUPABASE_ANON_KEY`. Hai giá trị này là public theo thiết kế; dữ liệu được bảo vệ bằng RLS.

**Hệ quả.** Mỗi bảng phải có test pgTAP với hai tài khoản (ADR-012). Thêm bảng mà quên bật RLS thì CI phải bắt được: có test kiểm tra mọi bảng trong schema `public` đều bật RLS.

---

## ADR-004. Nơi đặt logic nghiệp vụ và validation

- Trạng thái: **Chấp nhận** · Ngày: 2026-11-04

**Quyết định.**
- **Module domain thuần** `src/domain/`, không có I/O và không import React hay Supabase:
  - `nutrition.ts`: BMI, BMR, TDEE, mục tiêu, ngưỡng, cảnh báo W1–W6;
  - `foodName.ts`: chuẩn hoá tên món;
  - `recurrence.ts`: sinh buổi, kiểm trùng lịch (ADR-008).

  Mọi module có unit test, gồm các ví dụ trong `docs/modules/Goals.md`.
- **Validation phía client:** schema zod trong `src/schemas/`, khớp với constraint của DB.
- **DB là nơi giữ toàn vẹn:** check constraint, unique, FK ghép, trigger (chỉ mục lá mới có lịch; tối đa 2 cấp). Dữ liệu sai gửi thẳng qua API vẫn bị chặn.
- **Ghi nhiều bước phải qua RPC chạy trong một giao dịch:**
  - `log_meal`: ghi món và upsert món đã lưu;
  - `save_schedule`: kiểm trùng và ghi lịch;
  - `add_first_subactivity`: chuyển lịch và lịch sử sang sub đầu tiên;
  - `toggle_completion`.
- **Idempotency:** client sinh `id` (uuid, dùng `expo-crypto`) cho `meal_entries` và `workout_completions`; insert dùng `on conflict (id) do nothing`.
- Giá trị gợi ý (mục tiêu, ngưỡng) **không lưu**, mà tính ở client từ `profiles`, `goals` và `user_settings`.
- Làm tròn: chỉ ở bước cuối, dùng `Math.round` (làm tròn nửa lên). Test khoá các giá trị biên, ví dụ 1978.5 → 1979.

**Phương án bị loại.** Đặt toàn bộ logic trong Edge Function: phải gọi mạng cho mọi phép tính, và khó chạy khi app đang hiển thị.

---

## ADR-005. Ngày và giờ

- Trạng thái: **Chấp nhận** · Ngày: 2026-11-04

**Quyết định.**
- Ngày ghi chép (`eaten_on`, `done_on`, `starts_on`) lưu kiểu `date`. Client gửi chuỗi `YYYY-MM-DD` tính theo **múi giờ của máy**; không chuyển qua UTC.
- Server chặn ngày tương lai với dung sai: `date <= (now() at time zone 'utc')::date + 1`. Client chặn chính xác theo giờ máy.
- Giờ trong lịch lưu là **phút tính từ 00:00** (`smallint`), không lưu `time` hay timestamp. Nhờ vậy không có vấn đề múi giờ hay DST trong kiểm trùng.
- `created_at`, `updated_at` kiểu `timestamptz`, do server gán.
- Thư viện: `date-fns`. Hiển thị `dd/MM/yyyy` và `HH:mm`. Tuần bắt đầu từ thứ Hai.

**Hệ quả.** Người dùng đổi múi giờ thì "hôm nay" đổi theo máy; dữ liệu cũ giữ nguyên ngày đã ghi.

---

## ADR-006. Thông báo: lên lịch cục bộ bằng `expo-notifications`

- Trạng thái: **Chấp nhận** (sửa theo chủ dự án ngày 2026-11-04, trước commit đầu tiên: không cam kết đúng giờ) · Ngày: 2026-11-04

**Bối cảnh.** Có ba loại thông báo: nhắc ghi chép hằng ngày, tóm tắt lịch tập, nhắc trước buổi tập 30 phút. Cả ba đều theo giờ cố định và **không phụ thuộc dữ liệu chỉ có trên server**. Spec đã chốt "nhắc kể cả khi đã ghi món".

**Phương án.**

| Phương án | Ưu | Nhược |
|---|---|---|
| **A. Lên lịch cục bộ** (chọn) | Không cần server hay secret; mất mạng vẫn nhắc đúng giờ; dễ test | Chỉ trên máy đã đăng nhập; lịch tập phải được lên lại định kỳ |
| B. Đẩy từ server qua FCM (pg_cron + Edge Function) | Tập trung một chỗ; làm được nhắc dựa trên dữ liệu | Cần lưu token và múi giờ, giữ secret service account; lệch tới 5 phút; khó test |
| C. Lai (cục bộ + cài sẵn FCM) | Sẵn hạ tầng cho sau này | Thêm cấu hình chưa dùng tới |

**Quyết định: A.**
- **Nhắc ghi chép:** một trigger lặp hằng ngày (`DAILY`, giờ và phút theo cài đặt).
- **Workout:** một module `notificationScheduler` hủy mọi thông báo workout do app tạo, rồi lên lại thông báo một lần (trigger `DATE`) cho **7 ngày tới**: tóm tắt cho những ngày có buổi, và nhắc trước 30 phút cho mỗi buổi. Danh sách buổi lấy từ `recurrence.ts`.
- **Tổng số thông báo đang chờ ≤ 60:** iOS giới hạn 64 thông báo cục bộ; Android dùng cùng mức để hành vi giống nhau. Vượt mức thì giữ các thông báo gần nhất.
- **Lên lịch lại khi:** mở app hoặc app trở lại foreground; sau khi lưu lịch, xoá mục, đánh dấu, đổi cài đặt; sau khi đăng nhập. **Hủy toàn bộ** khi đăng xuất hoặc tắt Workout (chỉ hủy phần workout).
- **Android:** tạo notification channel riêng ("Nhắc ghi chép", "Workout"); xin quyền `POST_NOTIFICATIONS` (Android 13+).
- **Không cam kết đúng giờ** khi chưa dùng Firebase FCM (chủ dự án chốt ngày 2026-11-04). Dùng trigger thường (inexact), **không** xin quyền exact alarm (`SCHEDULE_EXACT_ALARM` / `USE_EXACT_ALARM`). Hệ điều hành có thể gửi trễ (Doze, tiết kiệm pin); việc này được chấp nhận. Yêu cầu đến đúng giờ (trễ tối đa 5 phút) chỉ áp dụng khi dùng FCM (ADR-007).

**Hệ quả.**
- Không mở app quá 7 ngày thì nhắc workout dừng; nhắc ghi chép vẫn chạy.
- Đổi múi giờ thì phải mở app để lên lịch lại.
- Thông báo có thể đến trễ. Khi kiểm trên thiết bị thật, ghi lại độ trễ quan sát được vào PR **để tham khảo**; độ trễ không phải tiêu chí đạt hay không đạt. Tiêu chí là thông báo **có đến**, đúng nội dung, đúng ngày, và không đến khi đã tắt hoặc đã đổi giờ.

**Xem lại khi:** cần thông báo **đúng giờ**; cần nhắc dựa trên dữ liệu server (ví dụ bỏ nhắc khi đã ghi món, trên mọi thiết bị); cần nhắc không phụ thuộc việc mở app. Khi đó xem ADR-007.

---

## ADR-007. Firebase Cloud Messaging: hoãn

- Trạng thái: **Bị loại (hoãn)** cho 0.1.0–0.2.0 · Ngày: 2026-11-04

**Bối cảnh.** Ý tưởng ban đầu muốn dùng Firebase cho push notification. Phân tích ở ADR-006 cho thấy không hành vi nào trong spec cần push từ server.

**Quyết định.** Chưa tích hợp Firebase: không có `google-services.json`, không lưu token thiết bị, không có bảng `device_tokens`.

**Khi bật lại** (bằng một ADR mới thay thế):
- dùng FCM HTTP v1 từ Edge Function;
- secret service account để trong Supabase secrets;
- thêm bảng `device_tokens (user_id, token, platform, timezone)` có RLS;
- pg_cron gọi Edge Function;
- chỉ dùng Firebase cho việc gửi tin, **không** dùng Firebase Auth (giữ ADR-002).
- **yêu cầu đúng giờ:** thông báo đến **trễ tối đa 5 phút** so với giờ hẹn. Cron chạy mỗi 1 phút; tin FCM gửi với priority `high`. Có AC đo độ trễ trên thiết bị thật.

---

## ADR-008. Workout: cấu trúc dữ liệu lịch và thuật toán chặn trùng lịch

- Trạng thái: **Chấp nhận** (sửa theo góp ý của chủ dự án ngày 2026-11-04) · Ngày: 2026-11-04 · Spec: `docs/modules/Workout.md` §4

**Bối cảnh.** Mỗi người dùng có tối đa 50 mục lá, mỗi mục lá có tối đa một lịch lặp vô hạn, kèm ngày bắt đầu áp dụng. App phải chặn trùng giờ, báo **ngày trùng đầu tiên**, và không lọt khi hai máy cùng ghi một lúc. Chủ dự án quyết định:
- cặp có lịch hằng ngày chỉ xét giờ;
- cặp tuần–tuần xét thứ chung và giờ;
- **không cho lặp hằng tháng**;
- dùng bitmask.

### Quyết định 1: chỉ có hai kiểu lặp, bỏ lặp hằng tháng

| | Có lặp hằng tháng (bản nháp trước) | **Không có lặp hằng tháng** (chọn) |
|---|---|---|
| Chu kỳ của lịch | 7 ngày, hoặc theo lịch Gregory (400 năm = 4800 tháng) | **Luôn 7 ngày** |
| Kiểm trùng một cặp | Có thể phải duyệt tới 4800 tháng | **1 phép AND + 2 phép so sánh, O(1)** |
| Ca biên | Ngày 29–31, tháng thiếu ngày, năm nhuận, ngày bắt đầu ảnh hưởng kết quả | Không có; ngày bắt đầu chỉ ảnh hưởng ngày trùng đầu tiên |
| Kiểm trùng trên server | Phải port vòng lặp sang `plpgsql` | **Một câu `WHERE`** |
| Sinh buổi cho lịch tuần và thông báo | Phải xét theo tháng | Chỉ xét theo thứ |
| Khối lượng test | Lớn (ma trận 3 × 3 kiểu lặp, ngày 29–31, năm nhuận) | Nhỏ (ngày–ngày, ngày–tuần, tuần–tuần) |

**Đánh đổi (chấp nhận mất):**
- Không biểu diễn được lịch theo ngày trong tháng, ví dụ "đo thể lực ngày 1 hằng tháng", "leo núi ngày 15".
- Người dùng phải dùng lịch tuần gần đúng, hoặc không lên lịch cho những hoạt động đó.
- Spec đã bỏ WO-07, WO-08, WO-09.

**Xem lại khi:** người dùng thật sự cần lịch theo tháng. Khi đó viết ADR mới thay thế. Hướng đã xét ở bản nháp trước: nếu có lịch tháng thì duyệt tối đa 4800 tháng kể từ `start`. Cách này luôn dừng và vét cạn, vì lịch Gregory lặp lại sau 400 năm = 146097 ngày = 20871 tuần.

### Quyết định 2: cấu trúc dữ liệu là bitmask thứ trong tuần
- Mỗi lịch quy về `(mask, s, e, starts_on)`:
  - `mask`: số nguyên 7 bit, bit 0 = T2 … bit 6 = CN. **Hằng ngày = `0b1111111` = 127.** Hằng tuần = 1–126;
  - `[s, e)`: khoảng phút trong ngày, `e = s + duration`, `e ≤ 1440`.
- DB lưu `weekdays smallint not null` có check constraint: `daily ⇔ 127`, `weekly ⇔ 1–126`. `repeat_type` chỉ để hiển thị.
- Lưu quy tắc, **không lưu từng buổi**. Buổi để hiển thị lịch tuần và để lên lịch thông báo được sinh khi cần: ngày `d` có buổi ⇔ `d ≥ starts_on` và `mask & (1 << weekday(d)) ≠ 0`.

### Quyết định 3: thuật toán kiểm trùng
```
conflict(A, B) =
    (A.mask & B.mask) != 0          // có thứ chung
 && A.s < B.e && B.s < A.e          // giờ giao nhau; nối tiếp (A.e == B.s) không tính
```
- **Cặp có lịch hằng ngày** (ngày–ngày, ngày–tuần): `127 & m = m ≠ 0`, nên vế đầu luôn đúng. **Chỉ còn so giờ.** Cài đặt đi nhánh tắt `if (A.mask == 127 || B.mask == 127) return timeOverlap(A, B)` cho rõ ý.
- **Cặp tuần–tuần:** có thứ chung **và** giờ giao nhau.
- `starts_on` **không** tham gia vào việc có trùng hay không: hai lịch lặp tuần vô hạn, có thứ chung, thì chắc chắn gặp nhau trong tương lai.
- **Ngày trùng đầu tiên** (để báo lỗi):
  - `start = max(A.starts_on, B.starts_on)`, `common = A.mask & B.mask`, `w = weekday(start)`;
  - `rot = ((common >> w) | (common << (7 - w))) & 127`;
  - `k = ctz(rot)` (số bit 0 ở cuối);
  - ngày trùng đầu tiên = `start + k` ngày. Luôn có `0 ≤ k ≤ 6`. Không cần vòng lặp.
- **Lưu lịch S:** duyệt n ≤ 49 lịch còn lại, O(n) với mỗi cặp O(1). Lỗi báo lịch có ngày trùng đầu tiên sớm nhất, kèm tên và khoảng giờ của lịch đó.

### Quyết định 4: kiểm trên client và server, chống ghi đồng thời
- **Client** (`src/domain/recurrence.ts`): kiểm tra trước khi gửi để báo lỗi ngay.
- **Server:** RPC `save_schedule` chạy trong một giao dịch:
  1. `pg_advisory_xact_lock(hashtextextended(auth.uid()::text, 0))`, khoá theo người dùng;
  2. một câu truy vấn:
     ```sql
     select … from schedules e
     where e.user_id = auth.uid() and e.activity_id <> p_activity_id
       and (e.weekdays & p_weekdays) <> 0
       and e.start_minute < p_start + p_duration
       and p_start < e.start_minute + e.duration_min
     ```
     Ngày trùng đầu tiên tính bằng `generate_series(0, 6)` trên tối đa 7 ngày;
  3. có dòng → `raise exception` với mã lỗi riêng và chi tiết (tên, khoảng giờ, ngày); không có → upsert.

  Hai máy ghi cùng lúc thì bị xếp hàng, nên máy sau sẽ thấy lịch của máy trước (WO-23).
- **Hai bản cài đặt (TS và SQL) phải cho cùng kết quả:** file test vector dùng chung `supabase/tests/fixtures/schedule-conflicts.json` (cặp lịch → ngày trùng đầu tiên hoặc `null`).
  - Jest đọc trực tiếp file này.
  - Một script sinh test pgTAP từ file đó; CI kiểm tra file sinh ra luôn khớp với file JSON.
  - Bộ vector phải phủ: ngày–ngày, ngày–tuần, tuần–tuần có và không có thứ chung, nối tiếp, giờ biên 00:00 và 24:00, ngày bắt đầu khác nhau, và mọi giá trị `w` từ 0 đến 6 của phép xoay.

### Phương án bị loại
| Phương án | Lý do loại |
|---|---|
| Giữ lặp hằng tháng, duyệt tối đa 4800 tháng | Phức tạp hơn nhiều so với giá trị mang lại (xem bảng đánh đổi ở trên) |
| Bitmap chiếm chỗ 7 × 288 ô 5 phút (2016 bit) cho mỗi người dùng | Kiểm O(1) với hợp của mọi lịch, nhưng phải dựng lại sau mỗi lần sửa, và vẫn phải duyệt từng lịch để biết trùng với mục nào. Với n ≤ 50, bitmask thứ + so giờ đã chỉ tốn micro giây |
| Bảng con một dòng cho mỗi (lịch, thứ) + `EXCLUDE USING gist (user_id =, weekday =, int4range &&)` | Chặn được hoàn toàn ở tầng DB và không cần advisory lock, nhưng cần extension `btree_gist`, thêm bảng con 1–7 dòng mỗi lịch, và lỗi trả về từ constraint không cho biết ngày trùng đầu tiên. Chủ dự án chọn bitmask |
| Sinh trước từng buổi vào bảng, chặn bằng exclusion constraint theo `tstzrange` | Lịch vô hạn nên cần job sinh thêm; số dòng lớn; dính múi giờ và DST |
| Interval tree hoặc segment tree | Không cần với n ≤ 50 |
| Chỉ kiểm tra ở client | Lọt khi gọi API trực tiếp hoặc khi hai máy ghi cùng lúc (WO-23) |

**Xem lại khi:** cho phép nhiều lịch cho một mục lá, lịch kéo qua nửa đêm, cần lịch theo tháng, hoặc vượt 50 mục lá.

---

## ADR-009. Biểu đồ: `victory-native` (Skia)

- Trạng thái: **Chấp nhận** · Ngày: 2026-11-04

**Quyết định.**
- `victory-native` (bản dựng trên `@shopify/react-native-skia` và Reanimated): có biểu đồ đường và cột.
- Các đường ngưỡng nét đứt được vẽ tự do trên canvas: Calo có 4 đường, cộng thêm series âm khi có calo ròng.
- Dữ liệu được dựng bởi một hàm thuần `buildSeries()` (có unit test, gồm ngày trống và giá trị âm). Thành phần biểu đồ chỉ vẽ.
- Có chế độ bảng cho trợ năng (CHART-14).

**Phương án bị loại.**
- `react-native-gifted-charts` (SVG): dùng nhanh, nhưng việc vẽ nhiều đường ngưỡng tuỳ ý và series âm kèm khoảng trống khó kiểm soát hơn.
- Tự vẽ bằng `react-native-svg`: phải tự viết trục, nhãn, chạm.

**Hệ quả.** Thêm các phụ thuộc native: Skia, Reanimated, Gesture Handler. Cả ba đều được Expo hỗ trợ. Phiên bản chọn lúc scaffold, theo SDK của Expo.

---

## ADR-010. State và form

- Trạng thái: **Chấp nhận** · Ngày: 2026-11-04

**Quyết định.**
- **TanStack Query** cho dữ liệu server:
  - query key theo ngày hoặc khoảng ngày;
  - mutation **không tự retry**, để tránh thành công giả hoặc ghi trùng. Gửi lại chỉ khi người dùng bấm, kèm `id` cũ;
  - sau khi mutation thành công thì invalidate các query liên quan (Hôm nay, Biểu đồ, Món đã lưu).
- **react-hook-form + zod** cho mọi form.
- Lựa chọn hiển thị chỉ cần nhớ trên máy (chỉ số, khoảng, dạng biểu đồ) lưu bằng AsyncStorage.
- Không dùng Redux hay Zustand cho tới khi có state toàn cục thật sự cần.

**Phương án bị loại.** Lưu cache offline (persist query) hoặc offline-first (WatermelonDB, PowerSync): ngoài phạm vi, vì spec yêu cầu có mạng.

---

## ADR-011. Môi trường và migration

- Trạng thái: **Chấp nhận** · Ngày: 2026-11-04

**Quyết định.**
- **Local:** Supabase CLI + Docker (`supabase start`) cho dev, test và CI.
- **Cloud:** một project Supabase miễn phí chứa dữ liệu thật.
- **Cách duy nhất để đổi schema** là file trong `supabase/migrations/` (tạo bằng `supabase migration new`) đi qua PR.
  - Áp dụng lên cloud bằng `supabase db push`, **sau khi PR đã merge**, do chủ dự án chạy, hoặc agent chạy **sau khi hỏi**.
  - **Cấm** sửa schema, policy hay function trên dashboard.
- Edge Function deploy bằng `supabase functions deploy <tên>`, cùng quy tắc trên.
- `.env` không commit; `.env.example` liệt kê đủ biến.

**Phương án bị loại.**
- Hai project cloud (staging và prod): phải quản lý thêm một môi trường mà chưa cần.
- GitHub Action tự push khi merge: phải lưu access token và mật khẩu DB trong GitHub secrets.

**Xem lại khi:** có người dùng khác ngoài chủ dự án, hoặc cần một môi trường staging để thử APK.

---

## ADR-012. Kiểm thử

- Trạng thái: **Chấp nhận** (có bổ sung của chủ dự án: E2E bằng Appium + Python/uv); **phần vị trí `run-metro.sh` và `run-test.sh` bị thay thế bởi ADR-014** · Ngày: 2026-11-04

| Lớp | Công cụ | Chạy ở đâu | Phủ |
|---|---|---|---|
| Unit | Jest (`jest-expo`) | CI | `src/domain/*`, schema zod, `buildSeries`, `notificationScheduler` (tính thời điểm) |
| Component | React Native Testing Library | CI | Form (lỗi đúng trường, giữ dữ liệu), trạng thái trống, tải, lỗi |
| DB / RLS / RPC | pgTAP qua `supabase test db` trên Supabase local | CI (Docker trên runner Ubuntu) | RLS với hai tài khoản cho mọi bảng; mọi bảng `public` đều bật RLS; constraint; RPC; vector chặn trùng lịch |
| **E2E mobile** | **Appium (UiAutomator2) + Python, quản lý bằng `uv`, chạy bằng pytest** — `e2e/mobile-appium/` | Thiết bị Android thật do chủ dự án cắm, không chạy trong CI | Các test case trong `docs/testing/test-cases.md` |
| Thiết bị thật (thủ công) | Checklist | Trước khi phát hành | Các AC "cần thiết bị" mà Appium không tự động được (thông báo, deep link từ email) |

### E2E mobile: cấu trúc và quy tắc
```
e2e/mobile-appium/
  pyproject.toml, uv.lock     # uv quản lý: Appium-Python-Client, pytest, pytest-html
  config.example.json         # commit: mẫu cấu hình
  config.json                 # KHÔNG commit (.gitignore): UDID của máy test
  conftest.py                 # đọc config, tạo driver, hook chụp màn hình khi lỗi
  pages/                      # page object theo màn hình
  tests/test_*.py             # mỗi test ghi mã TC và mã AC trong docstring
scripts/
  build-debug-apk.sh          # build APK debug (expo prebuild + gradle assembleDebug), in đường dẫn APK
  run-metro.sh                # chạy Metro của Expo cho bản debug
  run-test.sh                 # chạy E2E: kiểm tra config và thiết bị → xoá reports/ cũ → pytest
reports/                      # KHÔNG commit (.gitignore); mỗi lần chạy GHI ĐÈ toàn bộ
  report.html, junit.xml, appium.log
  screenshots/<test>.png      # chụp khi test lỗi
  page-source/<test>.xml      # cây UI lúc lỗi, để sửa selector
```
- `config.json` có dạng (giá trị mẫu): `{ "udid": "<UDID máy test>", "appiumServer": "http://127.0.0.1:4723", "apkPath": "build/app-debug.apk", "appPackage": "<package Android>" }`.
- `scripts/run-test.sh` trả mã thoát:
  - `0` khi đạt;
  - `1` khi có test lỗi;
  - `2` khi thiếu `config.json` hoặc thiếu công cụ (uv, appium);
  - **`3` khi không thấy thiết bị có UDID trong config.**

  Gặp mã `3` thì script in hướng dẫn và dừng; script **không** khởi động máy ảo.
- Selector ưu tiên `testID` (accessibility id) đặt sẵn trong code React Native. Không dùng XPath theo vị trí.
- Dữ liệu test: mỗi lần chạy dùng tài khoản test riêng trên Supabase local (hoặc project được chỉ định trong `.env.e2e`). Không chạy trên dữ liệu thật.

### Quy tắc cho agent (đưa vào CLAUDE.md)
- **Không tự ý chạy máy ảo (`emulator`) hay lệnh `adb`.** Agent chỉ chạy `scripts/run-test.sh`, và chỉ khi người dùng yêu cầu. `adb` chỉ được dùng **bên trong** script hoặc Appium.
- `run-test.sh` thoát với mã `3` (chưa thấy thiết bị) → **báo người dùng cắm hoặc mở khoá thiết bị, bật USB debugging**, rồi dừng. Không thử cách khác.
- Test mobile lỗi → **sửa dựa trên `reports/`**:
  - đọc `junit.xml` hoặc `report.html` để biết test nào lỗi;
  - xem `screenshots/` và `page-source/` của test đó;
  - xem `appium.log`.

  Sửa xong thì chạy lại. Báo cáo trong PR nêu rõ test case nào đã đạt trên thiết bị thật, kèm model máy và phiên bản Android.

### CI
`.github/workflows/ci.yml`: `lint` → `typecheck` (`tsc --noEmit`) → `jest` → `supabase start` + `supabase db reset` + `supabase test db`. Chỉ cần một bước đỏ là chặn merge. E2E Appium **không** chạy trong CI vì cần thiết bị thật; kết quả E2E được ghi vào PR.

### Phương án bị loại
- **Maestro** (bản nháp trước): thay bằng Appium + Python theo lựa chọn của chủ dự án; không giữ hai công cụ E2E song song.
- **Detox:** cần sửa cấu hình build native nhiều hơn, và gắn chặt với JS test runner.
- **Chạy E2E trong CI bằng emulator:** tốn thời gian và không thay thế được thiết bị thật.

---

## ADR-013. Phát hành

- Trạng thái: **Chấp nhận** · Ngày: 2026-11-04

**Quyết định.**
- **EAS Build** profile `preview` → **APK** Android. Profile `development` dùng cho dev build.
- **Phiên bản:**
  - `version` trong `app.config.ts` theo semver, khớp với `CHANGELOG.md` và tag `vX.Y.Z`;
  - `android.versionCode` do EAS quản lý (`appVersionSource: "remote"`, `autoIncrement`).
- **Release:** GitHub Release đính kèm APK và file `SHA256SUMS`. Tạo tag và release đều **hỏi trước**.
- **Không dùng OTA** (`expo-updates`) ở 0.1.0–0.2.0, để bản cài luôn khớp với mã nguồn của tag.
- iOS: chưa phát hành, chỉ chạy dev build.

**Hệ quả.** Gói miễn phí của EAS giới hạn số lượt build mỗi tháng (kiểm tra con số hiện hành trước khi phát hành); có thể build local bằng `eas build --local` nếu hết lượt. **Xem lại khi** đưa lên Google Play hoặc phát hành iOS.

---

## ADR-014. Script E2E nằm trong `e2e/mobile-appium/scripts/`

- Trạng thái: **Chấp nhận** · Thay thế một phần ADR-012 (cây thư mục `scripts/` và đường dẫn `scripts/run-test.sh`) · Ngày: 2026-11-05 · Người quyết định: chủ dự án ([#37](https://github.com/antialberteinstein/nutrition-tracker/issues/37))

**Bối cảnh.** ADR-012 đặt cả ba script (`build-debug-apk.sh`, `run-metro.sh`, `run-test.sh`) ở `scripts/` tại gốc repo. Chủ dự án muốn gom những gì thuộc E2E mobile về một thư mục.

**Phương án.**
- Giữ nguyên như ADR-012.
- Chuyển cả ba script vào `e2e/mobile-appium/`.
- Chỉ chuyển hai script dành riêng cho E2E; `build-debug-apk.sh` ở lại vì `npm run build:apk` dùng chung, không riêng E2E.

**Quyết định.** Phương án thứ ba:
```
e2e/mobile-appium/scripts/
  run-metro.sh                # chạy Metro của Expo cho bản debug
  run-test.sh                 # chạy E2E: kiểm tra config và thiết bị → xoá reports/ cũ → pytest
scripts/
  build-debug-apk.sh          # build APK debug
```
- `npm run test:e2e` gọi `e2e/mobile-appium/scripts/run-test.sh`. Script vẫn chạy được từ bất kỳ thư mục nào, `reports/` vẫn nằm ở gốc repo.
- Mã thoát (0/1/2/3) và quy tắc cho agent của ADR-012 giữ nguyên; chỉ đổi đường dẫn: agent chỉ chạy `e2e/mobile-appium/scripts/run-test.sh`, và chỉ khi người dùng yêu cầu.

**Hệ quả.** Đường dẫn cũ trong `prompts/*.txt` và các mục cũ của `prompts/LOG.md` là lịch sử, không sửa. **Xem lại khi** có thêm bộ E2E thứ hai (ví dụ iOS) cần dùng chung script.
