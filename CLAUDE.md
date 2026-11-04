# CLAUDE.md

Nutrition Tracker: app Android (React Native + Expo) theo dõi calo, đạm, natri, đường mỗi ngày so với mục tiêu tính từ hồ sơ; từ 0.2.0 có thêm Workout. Giao diện và tài liệu: **tiếng Việt**. Loại dự án: **A, app có dữ liệu người dùng** (mỗi tài khoản chỉ thấy dữ liệu của mình).

**File này được ưu tiên hơn cấu hình agent toàn cục** (`~/.claude/rules/*`, plugin). Các khác biệt cụ thể:
- **Ngôn ngữ:** TypeScript strict, import ES. Không áp dụng rule "plain JS / CommonJS"; ngoại lệ là các file `*.config.js` ở gốc, dùng CommonJS theo Expo.
- **Tên file:** kebab-case theo Expo, không dùng camelCase.
- **Test:** Jest, pgTAP, Appium/pytest. Không có `node tests/run-all.js`.
- **Commit:** không thêm dòng `Co-Authored-By`.

## Kiến trúc (đã quyết định, không mở lại khi chưa hỏi người dùng)

Mọi quyết định kỹ thuật nằm trong **`docs/ADR.md`**, một file duy nhất (không dùng `docs/decisions/`).
- **ADR-001:** Expo SDK 58 + React Native, TypeScript strict, Expo Router (route trong `src/app/`).
- **ADR-002, ADR-003:** Supabase Auth email + mật khẩu là nguồn danh tính duy nhất; Postgres có RLS theo `user_id`, FK ghép chặn tham chiếu chéo tài khoản; service role chỉ nằm trong Edge Function.
- **ADR-004:**
  - logic tính toán đặt trong `src/domain/` (thuần, có unit test);
  - DB giữ toàn vẹn dữ liệu;
  - ghi nhiều bước đi qua RPC trong một giao dịch;
  - client sinh uuid để gửi lại không tạo bản ghi trùng.
- **ADR-005:** ngày lưu kiểu `date` theo ngày địa phương; giờ trong lịch lưu là phút tính từ 00:00.
- **ADR-006, ADR-007:** thông báo lên lịch cục bộ bằng `expo-notifications`, **không cam kết đúng giờ**. Firebase FCM hoãn lại.
- **ADR-008:** chặn trùng lịch Workout bằng bitmask thứ trong tuần, O(1) mỗi cặp; **không có lặp hằng tháng**.
- **ADR-009 đến 013:**
  - `victory-native` cho biểu đồ;
  - TanStack Query (mutation không tự retry), react-hook-form + zod;
  - Supabase local + một project cloud;
  - Jest, pgTAP, Appium;
  - phát hành APK qua EAS, không OTA.
- **Bị loại, không đề xuất lại:** Firebase Auth/Firestore, backend riêng, offline sync, Maestro/Detox, lặp hằng tháng, exclusion constraint cho lịch, OTA update, Dynamic Color.

### Cách dùng `docs/ADR.md`
- Đọc `docs/ADR.md` trước khi đề xuất thư viện, cấu trúc dữ liệu, dịch vụ hay quy trình mới. Nếu đã có ADR liên quan thì làm theo.
- **Quyết định mới cần ADR** khi nó ảnh hưởng nhiều module, khó đảo ngược, hoặc thêm dịch vụ hay phụ thuộc lớn. Khi đó:
  - viết ADR mới ở trạng thái **Đề xuất** (bối cảnh, phương án, quyết định, hệ quả, điều kiện xem lại);
  - thêm vào mục lục;
  - chờ người dùng duyệt **trước khi code**.
- ADR đã "Chấp nhận" thì không sửa nội dung. Muốn đổi, viết ADR mới "Thay thế ADR-NNN" và đổi trạng thái ADR cũ.
- Cập nhật phần tóm tắt ở trên trong cùng PR.

## Bố cục

- `src/app/`: route (Expo Router). `src/components/`: UI. `src/constants/`: theme. Sẽ có `src/domain/` (logic thuần) và `src/schemas/` (zod).
- `supabase/`: `config.toml`, `migrations/`, `tests/` (pgTAP).
- `e2e/mobile-appium/`: Appium + pytest (uv). `scripts/`: build APK, Metro, chạy E2E.
- `docs/`: spec (`RequirementsOutline.md`, `modules/`), `ADR.md`, `testing/`. Thiết kế: `PRODUCT.md`, `.impeccable/surfaces/`. Nhật ký prompt: `prompts/LOG.md`.

## Lệnh

```bash
npm run typecheck && npm run lint && npm run format:check
npm test                 # Jest; npm run test:coverage để có coverage
npx supabase start && npm run test:db   # pgTAP trên Supabase local (cần Docker)
npm run build            # expo export android: kiểm tra JS bundle được
npm run build:apk        # scripts/build-debug-apk.sh → build/app-debug.apk
npm run test:e2e         # scripts/run-test.sh — CHỈ chạy khi người dùng yêu cầu
npx expo install <pkg>   # luôn dùng thay cho npm install để có phiên bản hợp với SDK
```

## Quy ước

- Tên file kebab-case, component PascalCase, alias `@/` trỏ tới `src/`.
- **Prettier** dùng cấu hình mặc định (không có file cấu hình riêng). **ESLint** dùng `eslint.config.js` do `expo lint` sinh. Hook config-protection chặn sửa hai cấu hình này; muốn đổi thì hỏi người dùng.
- **Chữ hiển thị** tiếng Việt, giọng trung tính xưng "bạn", không phán xét (PRODUCT.md). Số dùng dấu chấm phân nghìn ("2.350"); ngày `dd/MM/yyyy`; giờ 24h.
- Element mà E2E cần tìm phải có `testID` (Appium tìm theo resource-id).
- Logic mới phải có test. Công thức dinh dưỡng phải có test với các ví dụ trong `docs/modules/Goals.md`.
- **Giao diện** theo DESIGN.md (khi có), `PRODUCT.md` và brief trong `.impeccable/surfaces/`. Hướng đã chọn là "Vở ô ly": Material 3, Dynamic Color tắt.

## Dữ liệu và bảo mật

- **Migration chỉ thêm, không sửa**, nằm trong `supabase/migrations/` (tạo bằng `npx supabase migration new <tên>`).
  - Không sửa migration đã áp dụng. Không sửa schema trên dashboard.
  - Áp dụng lên cloud bằng `npx supabase db push`, chỉ sau khi PR đã merge và đã hỏi người dùng.
- **Mọi bảng `public` bật RLS** với `user_id = auth.uid()`. Test `supabase/tests/database/000_rls_enabled.test.sql` bắt bảng nào quên bật.
- **Biến public** chỉ gồm `EXPO_PUBLIC_SUPABASE_URL` và `EXPO_PUBLIC_SUPABASE_ANON_KEY`. Service role key không bao giờ vào client hay git.
- Dữ liệu sức khoẻ: không log cân nặng, món ăn hay email.

## Kiểm thử mobile (Appium)

- **Không tự ý chạy máy ảo (`emulator`) hay lệnh `adb`.** Chỉ chạy `scripts/run-test.sh`, và chỉ khi người dùng yêu cầu. `adb` chỉ nằm bên trong script.
- `run-test.sh` thoát với mã **3** → **báo người dùng** rằng thiết bị chưa kết nối (cắm, mở khoá, bật USB debugging), rồi dừng.
- **Test mobile lỗi thì sửa dựa trên `reports/`:**
  1. đọc `junit.xml` hoặc `report.html` để biết test nào lỗi;
  2. xem `screenshots/` và `page-source/` của test đó;
  3. xem `appium.log`.

  Sửa xong thì chạy lại. Không nới điều kiện test khi AC chưa đổi.
- `e2e/mobile-appium/config.json` (UDID) và `reports/` không commit. Chi tiết: `docs/testing/test-plan.md`.

## Điểm dễ hỏng

- **Expo đổi API mỗi SDK.** Trước khi dùng API của Expo hoặc RN, đọc tài liệu đúng phiên bản (`https://docs.expo.dev/versions/v58.0.0/`, `https://docs.expo.dev/llms.txt`), đừng dựa vào trí nhớ.
- Testing Library v14: `render` là async, phải viết `await render(...)`.
- `android/` và `ios/` do `expo prebuild` sinh ra (đã gitignore). Không sửa tay; cấu hình native nằm trong `app.config.ts`.
- **Các hành vi cố ý, không phải lỗi:**
  - thông báo đến trễ (ADR-006);
  - server chặn ngày tương lai với dung sai +1 ngày (ADR-005);
  - biểu đồ để trống, không vẽ 0, cho ngày chưa ghi.
- Supabase CLI chạy qua `npx supabase` (devDependency), không cài global.
- Build Android thường cần JDK 17; máy dev có thể đang dùng JDK khác.
- Icon tab hiện là placeholder của template Expo.

## Phiên bản và phát hành

- Version chỉ nằm ở `package.json`; `app.config.ts` đọc từ đó. `versionCode` do EAS quản lý. CHANGELOG theo Keep a Changelog, thay đổi người dùng thấy được ghi vào `[Unreleased]`.
- Quy trình: `docs/WORKFLOW.md`.

## Quy trình với AI agent

- Quy trình chi tiết nằm trong lệnh `/kessie-skills:proj <chế độ>`. Người dùng tự gõ lệnh; agent không tự gọi, chỉ gợi ý chế độ phù hợp. Gõ `/kessie-skills:proj` không kèm chế độ để xem bước tiếp theo.
- **Spec là của người dùng:** `docs/RequirementsOutline.md`, `docs/modules/`, ý tưởng thô ở `docs/spec-inbox.md`. Agent đề xuất, người dùng duyệt; không tự sửa spec đã duyệt.
- Mọi thay đổi đi qua issue → nhánh → PR → CI. Chỉ ghi `Closes #N` khi đã xác minh; còn phần chưa xác minh thì dùng `Refs #N`.
- **Lưu prompt dựng dự án vào `prompts/LOG.md`.** Mỗi yêu cầu của người dùng dẫn tới thay đổi trong repo (spec, thiết kế, kiến trúc, code, sửa lỗi, phát hành) được ghi một mục: ngày · lệnh hoặc ngữ cảnh · yêu cầu (rút gọn, giữ ý định) · quyết định đã chốt · issue/PR. Ghi trong cùng PR với thay đổi; chỉ thêm mục mới, không sửa mục cũ. Không ghi secret, token, URL môi trường thật hay dữ liệu cá nhân.
- Hỏi người dùng trước khi push lên `main`, mở PR, gắn tag, release, deploy, publish, tạo issue, hoặc chạy lệnh lên môi trường thật (kể cả `npx supabase db push` và deploy Edge Function). **Merge PR do agent mở thì không cần hỏi**, theo mục "Review và merge PR" bên dưới.
- Luôn áp dụng các skill trong mục "Skill bổ trợ". Việc lớn hoặc nhiều file thì trình kế hoạch trước.

### Review và merge PR (chủ dự án uỷ quyền ngày 2026-11-04)

Áp dụng cho **mọi PR do agent mở**. PR của Dependabot xử lý theo `/kessie-skills:proj deps`.
1. **Review bằng sub-agent:** ngay sau khi mở PR, tạo một sub-agent (tool Agent) và yêu cầu nó gọi skill **`kessie-skills:pr-review`** ở chế độ Code Review cho PR đó. Sub-agent trả về: có hay không có phát hiện chặn, kèm danh sách phát hiện. Sub-agent chỉ review, không sửa code.
2. **Skill không gọi được** thì **báo người dùng** và không merge PR đó cho tới khi người dùng chỉ đạo. Các trường hợp này gồm:
   - skill không có trong danh sách skill khả dụng;
   - sub-agent không có tool Skill;
   - skill lỗi.
3. **Có phát hiện chặn:** sửa trên cùng nhánh, push, review lại bằng sub-agent mới.
4. **Merge tự động, không cần hỏi** khi không còn phát hiện chặn **và** mọi check CI bắt buộc đều xanh:
   - lệnh `gh pr merge <N> --merge --delete-branch`;
   - **không** dùng `--admin` để vượt bảo vệ nhánh.
   - Check còn đang chạy thì chờ bằng `gh pr checks <N> --watch --required`.
   - Check đỏ thì đọc log (`gh run view --log-failed`), sửa trên nhánh rồi chờ lại. Lỗi hạ tầng không do thay đổi gây ra thì chạy lại một lần (`gh run rerun --failed`); nếu vẫn đỏ thì báo người dùng.
5. **Xung đột với `main`: tự giải quyết, không cần hỏi.**
   - Gộp `main` mới nhất vào nhánh PR rồi giải quyết xung đột.
   - Với file chỉ thêm (`prompts/LOG.md`, CHANGELOG) thì giữ cả hai phía, theo thứ tự thời gian.
   - Chạy lại kiểm tra, push, chờ CI xanh, rồi merge.
   - Xung đột đụng tới spec đã duyệt hoặc ADR "Chấp nhận" mà không gộp được bằng cách giữ cả hai thì dừng lại và hỏi người dùng.
6. **Sau mỗi lần merge, luôn cập nhật `main` ở local:** `git switch main && git pull --ff-only origin main`.
7. Ghi kết quả review và merge (số PR, có/không phát hiện chặn) vào báo cáo cho người dùng.

## Skill bổ trợ

| Skill | Vai trò | Lệnh cài (Claude Code) |
|---|---|---|
| `karpathy-guidelines` ([multica-ai/andrej-karpathy-skills](https://github.com/multica-ai/andrej-karpathy-skills)) | Nghĩ trước khi code · đơn giản trước · sửa đúng chỗ · định nghĩa "xong" bằng tiêu chí kiểm chứng được. Luôn áp dụng | `/plugin install andrej-karpathy-skills --marketplace multica-ai/andrej-karpathy-skills` |
| `expo` (plugin chính chủ, marketplace `claude-plugins-official`) | Hướng dẫn agent dùng đúng API theo phiên bản Expo SDK (SDK 58), EAS, Expo Router. Áp dụng mọi khi đụng tới API của Expo hoặc React Native | `/plugin install expo@claude-plugins-official` |

- **Đầu mỗi phiên**, kiểm tra từng skill trong bảng có nằm trong danh sách skill khả dụng của agent không. Thiếu skill nào thì **gợi ý** người dùng lệnh cài ở cột cuối, một lần mỗi phiên. **Không tự cài**, không sửa settings của người dùng.
- Khi skill chưa được cài, vẫn làm theo nguyên tắc ở cột "Vai trò".

## Git và PR

- Conventional commits; nhánh `feat/<issue>-…`, `fix/<issue>-…`, `docs/…`, `ci/…`, `chore/…`.
- **Không ghi attribution của AI:** không thêm dòng `Co-Authored-By` vào commit; không thêm "Generated with Claude Code" (hay dòng tương tự) vào issue, mô tả PR và bình luận PR. Quy tắc này được ưu tiên hơn mặc định của agent.
- PR theo `.github/PULL_REQUEST_TEMPLATE.md`. Chỉ ghi `Closes #N` khi đã xác minh; nếu không thì dùng `Refs #N` và nêu phần chưa xác minh.
- Chạy kiểm tra trước khi push; CI phải xanh trước khi merge.
