# Test plan — Nutrition Tracker

> Cập nhật: 2026-11-04. Quyết định kỹ thuật: `docs/ADR.md` (ADR-012). Test case: `docs/testing/test-cases.md`. AC gốc: `docs/modules/*.md`.

## 1. Mục tiêu
- Mỗi AC trong `docs/modules/` được kiểm bởi ít nhất một test tự động, hoặc một mục kiểm thủ công trên thiết bị thật.
- Không phát hành nếu còn test đỏ, hoặc còn AC "cần thiết bị" chưa được kiểm.
- Báo cáo luôn tách rõ phần **đã chạy và quan sát được** với phần **chưa xác minh**.

## 2. Các lớp kiểm thử
| Lớp | Công cụ | Vị trí | Chạy khi | Ghi mã AC ở đâu |
|---|---|---|---|---|
| Unit | Jest (`jest-expo`) | `src/**/__tests__/` | CI, mỗi PR | Tên test, ví dụ `GOAL-01: …` |
| Component | React Native Testing Library | `src/**/__tests__/` | CI, mỗi PR | Tên test |
| DB / RLS / RPC | pgTAP (`supabase test db`) | `supabase/tests/` | CI, mỗi PR | Mô tả test |
| E2E mobile | Appium (UiAutomator2) + Python + pytest, quản lý bằng `uv` | `e2e/mobile-appium/` | Trước khi merge PR có đổi UI hoặc luồng; trước mỗi release | Docstring: `TC-E2E-NN · ACC-01, …` |
| Thủ công trên thiết bị | Checklist `TC-DEV-*` | `docs/testing/test-cases.md` | Trước mỗi release | Cột AC |

## 3. Môi trường E2E mobile
- **Thiết bị:** Android thật, bật *USB debugging*, đã mở khoá màn hình, đã chấp nhận máy tính. Ghi lại model và phiên bản Android trong mỗi báo cáo.
- **Máy tính cần có:**
  - Node LTS;
  - JDK 17 và Android SDK (để build APK);
  - Appium 2 cùng driver `uiautomator2`;
  - `uv`.

  Không cần Docker cho E2E (ADR-015).
- **Backend:** project Supabase cloud, với một tài khoản test do chủ dự án tạo trên dashboard (Authentication → Add user, tự xác nhận email). App debug đọc URL và anon key của project cloud từ `.env.e2e`.
  - Mỗi tài khoản chỉ đi qua Onboarding được một lần (không có policy xoá hồ sơ). Sau một lượt đạt, tạo tài khoản mới (ví dụ `testuser002@…`) và sửa `testEmail` trong `config.json`.
  - E2E chỉ kiểm được schema đã `db push` lên cloud.
  - TC-E2E-01 và TC-E2E-07 gửi email thật; nếu lỗi vì giới hạn email của Supabase thì ghi rõ trong báo cáo.
- **Cấu hình máy test:** `e2e/mobile-appium/config.json` (**không commit**; có trong `.gitignore`). Mẫu nằm ở `config.example.json`:
  ```json
  {
    "udid": "<UDID máy test>",
    "appiumServer": "http://127.0.0.1:4723",
    "apkPath": "build/app-debug.apk",
    "appPackage": "<package Android>",
    "testEmail": "<email tài khoản test trên cloud>",
    "testPassword": "<mật khẩu tài khoản test>"
  }
  ```
- **Kết nối Metro:** máy test cắm USB. `run-metro.sh` chạy Metro ở cổng 8081; `run-test.sh` tự làm `adb reverse tcp:8081 tcp:8081` để APK debug tải được JS bundle. Lệnh `adb` chỉ nằm **trong script**.

## 4. Cách chạy
```bash
scripts/build-debug-apk.sh               # 1. build APK debug → build/app-debug.apk
e2e/mobile-appium/scripts/run-metro.sh   # 2. chạy Metro (để chạy riêng ở một terminal)
e2e/mobile-appium/scripts/run-test.sh    # 3. chạy toàn bộ E2E; có thể truyền tham số của pytest, ví dụ -k meal
```

Không build được ở máy (thiếu JDK 17 hoặc ổ đĩa) thì thay bước 1 bằng build trên cloud: `eas build -p android --profile e2e` cho ra cùng APK debug (`assembleDebug`, tải JS từ Metro, chỉ kiến trúc `arm64-v8a`); tải file `.apk` về và đặt tại `build/app-debug.apk`.

Mã thoát của `run-test.sh`:

| Mã | Ý nghĩa | Việc tiếp theo |
|---|---|---|
| 0 | Mọi test đạt | — |
| 1 | Có test lỗi | Đọc `reports/` (mục 5) |
| 2 | Thiếu `config.json`, `uv`, Appium hoặc APK | Làm theo hướng dẫn in ra |
| 3 | **Không thấy thiết bị** có UDID trong config | Cắm hoặc mở khoá máy, bật USB debugging, rồi chạy lại. Script **không** khởi động máy ảo |

## 5. Báo cáo: `reports/`
`reports/` **không commit** (có trong `.gitignore`). Mỗi lần chạy, script xoá sạch rồi ghi lại, nên thư mục chỉ chứa kết quả của lần chạy gần nhất:

```
reports/
  report.html          # pytest-html
  junit.xml
  appium.log
  screenshots/<test>.png     # chụp tự động khi test lỗi
  page-source/<test>.xml     # cây UI lúc lỗi
```

Khi gửi ảnh chụp vào issue hoặc PR, kiểm tra trước để không lộ email hay dữ liệu thật. Dữ liệu test chỉ là tài khoản giả.

## 6. Quy tắc cho agent
- Không tự chạy máy ảo hay lệnh `adb`. Agent chỉ chạy `e2e/mobile-appium/scripts/run-test.sh`, và chỉ khi người dùng yêu cầu.
- Gặp mã thoát `3`: báo người dùng rằng thiết bị chưa kết nối, rồi dừng.
- Test lỗi: đọc theo thứ tự `reports/junit.xml` → `screenshots/` và `page-source/` của test lỗi → `appium.log`. Sửa code hoặc selector, rồi chạy lại.
- Không sửa test cho "xanh" bằng cách nới điều kiện, trừ khi AC trong spec đã đổi.

## 7. Tiêu chí vào và ra cho mỗi release
- **Vào:** CI xanh trên `main`; APK debug build được; Supabase local đã seed.
- **Ra:**
  - mọi `TC-E2E` của milestone đạt trên ít nhất một thiết bị thật;
  - mọi `TC-DEV` của milestone đã kiểm và ghi kết quả;
  - mọi AC của milestone có test tương ứng (xem bảng truy vết trong `test-cases.md`);
  - báo cáo ghi model máy, phiên bản Android, commit, và phần chưa xác minh.

## 8. Thông báo và thời gian
Khi chưa dùng Firebase FCM (ADR-006), thông báo **không bắt buộc đúng giờ**. Tiêu chí đạt là: thông báo có đến, không sớm hơn giờ hẹn, đúng nội dung, và không đến sau khi đã tắt hoặc đã đổi giờ. Độ trễ ghi lại để tham khảo. Khi chuyển sang FCM (ADR-007), tiêu chí đổi thành **trễ ≤ 5 phút**.
