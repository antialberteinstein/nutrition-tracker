# Nhật ký prompt — Nutrition Tracker

Mọi yêu cầu của người dùng đã dựng nên dự án này, theo thứ tự thời gian. Mỗi yêu cầu dẫn tới thay đổi trong repo có một mục, được ghi trong cùng PR với thay đổi đó. Chỉ thêm mục mới, không sửa hay xoá mục cũ (yêu cầu sau thay đổi yêu cầu trước thì ghi mục mới và trỏ về mục cũ).

Quy tắc:
- **Yêu cầu:** rút gọn, giữ ý định sản phẩm và các ràng buộc người dùng nêu; bỏ phần trao đổi qua lại.
- **Quyết định:** những gì người dùng đã chốt khi agent hỏi lại (phương án được chọn, phần bị loại).
- Không ghi secret, token, mật khẩu, URL môi trường thật, email hay dữ liệu cá nhân.
- Prompt giao việc cho một giai đoạn lớn vẫn nằm ở `prompts/NN-slug.txt`; mục nhật ký chỉ trỏ tới file đó.

Mẫu một mục:

```markdown
## YYYY-MM-DD · <lệnh hoặc ngữ cảnh, ví dụ `/kessie-skills:proj build #12`>
- **Yêu cầu:** <ý định của người dùng, 1–3 câu>
- **Quyết định:** <đã chốt gì; "—" nếu không có>
- **Kết quả:** <issue/PR, file prompt giai đoạn nếu có>
```

---

## 2026-11-04 · `/kessie-skills:proj kickoff <ý tưởng>`
- **Yêu cầu:** App mobile theo dõi dinh dưỡng hằng ngày, dùng React Native + Expo và Supabase.
  - Ghi món ăn kèm calo, đạm, natri, đường; ngày ghi mặc định là hôm nay, chỉ được chọn ngày quá khứ.
  - Gợi ý lại món đã nhập (ví dụ "bún nạm") và tự điền dinh dưỡng của lần nhập trước.
  - Lần đầu nhập cân nặng, chiều cao; mục tiêu ngày gợi ý theo BMI, giới tính và mong muốn (tăng, giảm, giữ cân), người dùng tự đặt lại được.
  - Tài khoản role user, mỗi user có dữ liệu riêng. Push nhắc ghi chép (Firebase), giờ nhắc chỉnh trong Cài đặt.
  - Biểu đồ đường hoặc cột có đường BMR, an toàn (BMR + 300), mục tiêu, trần 4000; đường, natri, đạm có ngưỡng theo WHO.
  - Workout bật/tắt trong Cài đặt: activity, sub-activity, lịch lặp, chặn trùng lịch (ghi trong `docs/ADR.md`, kèm hướng dẫn trong CLAUDE.md), nhắc trước 30 phút, calo tính vào biểu đồ.

  Remote: `antialberteinstein/nutrition-tracker`.
- **Quyết định:**
  - **Phạm vi:** Workout tách sang 0.2.0.
  - **Hồ sơ và mục tiêu:**
    - Onboarding hỏi thêm năm sinh và mức vận động; BMR theo Mifflin-St Jeor;
    - điều chỉnh calo −500 / 0 / +300, kèm cảnh báo khi ngược mong muốn;
    - khi bật Workout, TDEE dùng hệ số 1.2.
  - **Ngưỡng:**
    - đạm 0.8 / 1.6 / 2.2 g/kg;
    - natri nhập theo mg: 500 / 1500 / 2000;
    - đường 5% / 10% calo;
    - phân loại BMI theo chuẩn châu Á – Thái Bình Dương.
  - **Workout:** calo chỉ tính khi đánh dấu "Đã tập"; lịch gồm giờ bắt đầu + thời lượng; thêm sub đầu tiên thì chuyển lịch sang sub đó.
  - **Tài khoản và phát hành:** chỉ email + mật khẩu; cần mạng; 0.1.0 chỉ phát hành Android APK.
  - **Ngoài phạm vi:** cơ sở dữ liệu món ăn, admin, Apple Health / Google Fit, đa ngôn ngữ.
  - **Loại dự án:** A.
- **Kết quả:** `docs/IdeaBrief.md`, `docs/RequirementsOutline.md`, `docs/modules/*` (đã duyệt), `docs/ADR.md` (13 ADR) — commit `docs: kickoff phases 0–2`.

## 2026-11-04 · Góp ý ADR-008 (chặn trùng lịch)
- **Yêu cầu:** Cặp có lịch hằng ngày chỉ chặn theo giờ; cặp tuần–tuần xét thứ trùng và giờ trùng; không cho lặp hằng tháng (ghi rõ đánh đổi); dùng bitmask để kiểm nhanh.
- **Quyết định:** Bỏ lặp hằng tháng. Điều kiện trùng là `(maskA & maskB) != 0` và giờ giao nhau; ngày trùng đầu tiên tính bằng phép xoay bit. Bỏ WO-07, WO-08, WO-09; thêm WO-30 đến WO-35.
- **Kết quả:** `docs/ADR.md` (ADR-008), `docs/modules/Workout.md`, `docs/RequirementsOutline.md`.

## 2026-11-04 · Góp ý ADR-012 và ADR-006, duyệt các ADR còn lại
- **Yêu cầu:**
  - E2E bằng Appium + Python (uv) trong `e2e/mobile-appium`, UDID máy test lưu ở `config.json` (gitignore).
  - Thêm `scripts/build-debug-apk.sh`, `run-metro.sh`, `run-test.sh`.
  - Chụp màn hình khi lỗi vào `reports/` (gitignore, mỗi lần chạy ghi đè).
  - Tài liệu `docs/testing/test-plan.md` và `test-cases.md`.
  - CLAUDE.md: sửa dựa trên `reports/`; báo người dùng khi thiết bị chưa kết nối; không tự chạy máy ảo hay `adb`.
  - Thông báo không cần đúng giờ khi chưa dùng FCM; khi dùng FCM thì trễ tối đa 5 phút.
- **Quyết định:** Appium thay cho Maestro; `run-test.sh` thoát mã 3 khi chưa có thiết bị; nới các AC về thời gian thông báo (REM-02, REM-05, WO-26, WO-28). Cả 13 ADR đã chốt.
- **Kết quả:** `docs/ADR.md`, `docs/testing/*`, spec cập nhật.

## 2026-11-04 · `/impeccable:impeccable init` và `shape today-screen`
- **Yêu cầu:** Ghi bối cảnh sản phẩm, rồi dựng brief thiết kế cho tab Hôm nay.
- **Quyết định:**
  - Nền tảng: Android, Material 3. Tên "Nutrition Tracker"; giọng văn trung tính, xưng "bạn".
  - Bố cục: tiêu điểm là calo, 3 chất gọn bên dưới; form ghi món dạng bottom sheet; vượt ngưỡng hiện bằng màu + icon + chữ.
  - Hướng hình ảnh "Vở ô ly" (chọn thay cho lượt bốc thăm "Hoá đơn quán"). Dynamic Color tắt; không có Hoàn tác sau khi lưu.
- **Kết quả:** `PRODUCT.md`, `.impeccable/surfaces/` (brief tab Hôm nay).

## 2026-11-04 · `/kessie-skills:proj kickoff` (giai đoạn 3: nền repo)
- **Yêu cầu:** Dựng nền repo theo kế hoạch đã duyệt: git, Expo, scaffold, Supabase, lint/test, E2E Appium, CI. Dừng trước khi push.
- **Quyết định:**
  - License MIT.
  - Expo SDK 58 (route trong `src/app/`), package `io.github.antialberteinstein.nutritiontracker`.
  - `eslint.config.js` do `expo lint` sinh; Prettier dùng cấu hình mặc định (hook config-protection chặn tạo file cấu hình riêng).
  - Supabase CLI là devDependency (`npx supabase`).
- **Kết quả:** commit `chore: scaffold repository foundation`.

## 2026-11-04 · `/kessie-skills:proj plan`
- **Yêu cầu:** Lên kế hoạch milestone 0.1.0 từ các AC đã duyệt.
- **Quyết định:** Duyệt 17 issue theo thứ tự nền → lõi → giao diện → tích hợp → kiểm tra trên thiết bị → phát hành. Luồng mỏng đi trước: tài khoản → onboarding → ghi món → Hôm nay. Viết 2 prompt giai đoạn. Milestone 0.2.0 (Workout) để plan sau.
- **Kết quả:** milestone `0.1.0`, issue #7–#23; `prompts/01-foundation.txt`, `prompts/02-meal-log.txt`.
## 2026-11-04 · Xác nhận sau giai đoạn 3
- **Yêu cầu:** Push 2 commit đầu lên GitHub; bật bảo vệ `main` khi CI xanh; thêm plugin chính chủ của Expo vào bảng "Skill bổ trợ".
- **Quyết định:** Thêm `expo@claude-plugins-official` vào bảng (chỉ gợi ý lệnh cài, không tự cài). Bảo vệ `main`: bắt buộc PR và hai check CI, cấm force-push, không bắt buộc reviewer.
- **Kết quả:** PR `docs/claude-expo-skill`.

## 2026-11-04 · Quy tắc review và merge PR tự động
- **Yêu cầu:** Thêm vào CLAUDE.md:
  - mỗi khi mở PR mới, tạo sub-agent gọi skill `kessie-skills:pr-review` để review;
  - sau đó tự merge hoặc tự giải quyết xung đột, không cần hỏi;
  - luôn pull lại `main` ở local sau khi merge;
  - nếu không gọi được skill thì báo người dùng.
- **Quyết định:**
  - Chỉ merge khi không còn phát hiện chặn và CI bắt buộc xanh; không dùng `--admin`.
  - Không gọi được skill thì báo người dùng và không merge.
  - Xung đột đụng spec hoặc ADR đã duyệt thì hỏi.
  - Tag, release, deploy, migration lên cloud vẫn phải hỏi.
  - Không áp dụng cho PR của Dependabot.
  - Push lên nhánh PR (không phải `main`) không cần hỏi, vì cần cho việc sửa và giải quyết xung đột. Check CI còn chạy thì chờ; đỏ thì sửa hoặc chạy lại một lần, vẫn đỏ thì báo người dùng.
- **Kết quả:** PR `docs/claude-pr-review-automerge`.

## 2026-11-04 · Không cần hỏi với PR
- **Yêu cầu:** Trong dự án này, PR không cần hỏi ý kiến chủ dự án. PR #6 và #24 đã được chủ dự án tự merge. Quy tắc review và merge tự động áp dụng cho các PR từ nay về sau.
- **Quyết định:**
  - Không thêm bước hỏi riêng cho PR đụng spec, ADR hay CLAUDE.md (gợi ý của reviewer bị từ chối).
  - Bỏ "mở PR" khỏi danh sách phải hỏi.
  - Xung đột trên spec đã duyệt hoặc ADR "Chấp nhận" mà không gộp được bằng cách giữ cả hai phía thì vẫn dừng lại hỏi (bước 5, mục "Review và merge PR" trong CLAUDE.md).
- **Kết quả:** PR `docs/claude-pr-no-ask`.

## 2026-11-04 · `/kessie-skills:proj build #7 -> #15` — #7 Dependabot
- **Yêu cầu:** Làm lần lượt các issue từ #7 tới #15. Issue #7: chặn Dependabot nâng lệch phiên bản mà Expo SDK ghim, và xử lý các PR #1–#5.
- **Quyết định:**
  - Đã merge #1 và #2 (actions v7, CI xanh).
  - Đóng #3, vì `npx expo install --check` báo bộ phiên bản hiện tại đã đúng SDK 58.
  - Đóng #4 (ESLint 10) và #5 (TypeScript 7), vì làm đỏ CI và SDK chưa hỗ trợ.
  - Dependabot: bỏ qua mọi bản nâng của React/React Native do SDK ghim; với `expo*` chỉ nhận bản patch; TypeScript và ESLint bỏ qua bản major.
- **Kết quả:** PR #27.

## 2026-11-04 · `/kessie-skills:proj build #7 -> #15` — #8 Nền app
- **Yêu cầu:** Issue #8: Supabase client, biến môi trường, TanStack Query, lưu phiên an toàn, seed tài khoản E2E.
- **Quyết định:**
  - Lưu phiên bằng `LargeSecureStore` theo hướng dẫn Expo của Supabase: khoá AES-256 trong SecureStore, phiên đã mã hoá trong AsyncStorage.
  - Auto-refresh token chỉ chạy khi app ở foreground.
  - CI thêm bước `supabase db reset` để nạp seed; có test pgTAP kiểm tra seed.
- **Kết quả:** PR `feat/8-app-foundation`.

## 2026-11-04 · `/kessie-skills:proj build #7 -> #15` — #10 Logic dinh dưỡng
- **Yêu cầu:** Issue #10: module thuần tính BMI, BMR, TDEE, mục tiêu, ngưỡng và cảnh báo W1–W6, kèm unit test theo các ví dụ trong spec.
- **Quyết định:**
  - BMI làm tròn 1 chữ số và phân loại trên chính giá trị đã làm tròn (để khớp với số người dùng thấy).
  - Đường an toàn = round(BMR chưa làm tròn + 300).
  - W3 so mục tiêu với BMR đã làm tròn.
  - Ngưỡng đường tính theo mục tiêu calo đang dùng.
- **Kết quả:** PR `feat/10-nutrition-domain`.
