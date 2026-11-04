# Nutrition Tracker

App Android theo dõi dinh dưỡng hằng ngày cho người muốn tăng cân, giảm cân hoặc giữ cân. App ghi món ăn kèm calo, đạm, natri, đường; gợi ý lại các món đã nhập; so với mục tiêu tính từ hồ sơ (BMR Mifflin-St Jeor, mức vận động, mong muốn).

![version](https://img.shields.io/badge/version-0.0.0_chưa_phát_hành-lightgrey)

> Trạng thái: **khung repo**, chưa có tính năng. Milestone 0.1.0 (dinh dưỡng) đang được lên kế hoạch.

## Tài liệu

| Tài liệu | Nội dung |
|---|---|
| [docs/IdeaBrief.md](docs/IdeaBrief.md) | Idea brief đã duyệt: phạm vi v1 và phần ngoài phạm vi |
| [docs/RequirementsOutline.md](docs/RequirementsOutline.md) | Đặc tả sản phẩm (nguồn sự thật) |
| [docs/modules/](docs/modules/) | Phân rã từng module, có bảng tiêu chí nghiệm thu (AC) |
| [docs/ADR.md](docs/ADR.md) | Quyết định kiến trúc (ADR) |
| [docs/testing/](docs/testing/) | Kế hoạch test và test case |
| [PRODUCT.md](PRODUCT.md) | Bối cảnh sản phẩm cho thiết kế |
| [docs/WORKFLOW.md](docs/WORKFLOW.md) | Nhánh, PR, CI, phát hành |
| [docs/SECURITY.md](docs/SECURITY.md) | Biện pháp bảo mật, giới hạn, audit dependency |
| [CLAUDE.md](CLAUDE.md) | Hướng dẫn cho coding agent |
| [prompts/](prompts/) | Nhật ký prompt và prompt giao việc |
| [CHANGELOG.md](CHANGELOG.md) | Lịch sử thay đổi |

## Chạy local

Cần: Node LTS, npm, Docker (cho Supabase local). Để build APK cần thêm JDK 17 và Android SDK.

```bash
npm install
cp .env.example .env          # điền URL và anon key của Supabase local (xem bên dưới)
npx supabase start            # Supabase local trong Docker
npx supabase status           # lấy API URL và anon key cho .env
npm start                     # Metro / Expo dev server
```

## Cấu hình dịch vụ

- **Supabase** (Auth, Postgres + RLS, Edge Functions):
  - dev và test dùng bản local (`npx supabase start`); dữ liệu thật nằm trên một project cloud (ADR-011);
  - biến public trong client: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`;
  - service role key **chỉ** nằm trong biến môi trường của Edge Function.
- **Migration:** chỉ qua file trong `supabase/migrations/`, áp dụng lên cloud bằng `npx supabase db push --remote` sau khi PR đã merge. Không sửa schema trên dashboard.
- **Thông báo:** lên lịch cục bộ bằng `expo-notifications`, chưa dùng Firebase (ADR-006, ADR-007).

## Kiểm tra

```bash
npm run typecheck            # TypeScript strict
npm run lint                 # ESLint (eslint-config-expo)
npm run format:check         # Prettier
npm run test:coverage        # Jest + React Native Testing Library
npm run test:db              # pgTAP trên Supabase local (cần `npx supabase start`)
npm run build                # expo export android: JS bundle được
scripts/build-debug-apk.sh               # APK debug → build/app-debug.apk
e2e/mobile-appium/scripts/run-metro.sh   # Metro cho APK debug (terminal riêng)
e2e/mobile-appium/scripts/run-test.sh    # E2E Appium trên thiết bị Android thật
```

| Lớp | Chứng minh | **Không** chứng minh |
|---|---|---|
| Jest / RNTL | Logic thuần, component render và phản hồi đúng | Hành vi native, mạng, backend thật |
| pgTAP | RLS, constraint, RPC trên Postgres thật (local) | Cấu hình project cloud, SMTP |
| `build` | JS bundle được cho Android | APK chạy được trên máy |
| E2E Appium | Luồng chính chạy trên một thiết bị thật cụ thể | Mọi model máy, thông báo đúng giờ, chế độ tiết kiệm pin |

E2E chạy trên Supabase cloud với một tài khoản test đã xác nhận email (ADR-015), không cần Docker. Chép `.env.example` thành `.env.e2e` (đã gitignore) và điền URL cùng anon key của project cloud; `e2e/mobile-appium/scripts/run-metro.sh` sẽ nạp file này. Email và mật khẩu tài khoản test đặt trong `e2e/mobile-appium/config.json` (`testEmail`, `testPassword`).

E2E cần `e2e/mobile-appium/config.json`: chép từ `config.example.json` và điền UDID của máy test và tài khoản test (file này không commit). Báo cáo nằm trong `reports/`, mỗi lần chạy ghi đè lần trước. Chi tiết ở [docs/testing/test-plan.md](docs/testing/test-plan.md).

## Cấu trúc

```
src/app/            route (Expo Router): Hôm nay · Biểu đồ · Cài đặt
src/components/     UI dùng chung
src/constants/      theme
supabase/           config.toml, migrations/, tests/ (pgTAP)
e2e/mobile-appium/  Appium + pytest (uv); scripts/ chạy Metro và E2E
scripts/            build APK
docs/               spec, ADR, testing
```

## License

[MIT](LICENSE)
