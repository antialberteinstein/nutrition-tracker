# Quy trình làm việc — Nutrition Tracker

## Nhánh và commit
- Nhánh mặc định `main` (được bảo vệ: cần PR + CI xanh).
- Nhánh theo issue: `feat/<N>-slug`, `fix/<N>-slug`; khác: `docs/…`, `ci/…`, `chore/…`.
- Conventional commits: `feat(scope): …`, `fix(scope): …`, `docs: …`, `ci: …`, `chore(deps): …`, `test: …`.

## Issue → PR
1. Mỗi việc có một issue (form Bug/Feature). Issue đủ nhỏ cho một PR.
2. Tạo nhánh, làm, chạy kiểm tra local, cập nhật CHANGELOG `[Unreleased]` nếu người dùng thấy thay đổi.
3. PR theo template. `Closes #N` chỉ khi đã xác minh; nếu còn phần cần môi trường thật → `Refs #N`.
4. CI xanh → merge (merge commit) → xoá nhánh.

## CI
- Workflow `CI`: chạy khi push `main`, PR, chạy tay, và được workflow release gọi lại.
- Gồm: `typecheck` → `lint` → `format:check` → `test:coverage` (Jest) → `build` (expo export android) trong job `quality`; job `database` chạy Supabase local (Docker) + `supabase db reset` + `supabase test db` (pgTAP).
- E2E Appium **không** chạy trong CI vì cần thiết bị thật (ADR-012). Kết quả E2E ghi vào PR: test case nào đạt, model máy, phiên bản Android.
- CI dùng cấu hình giả, không cần secret thật. Audit dependency ở chế độ cảnh báo.

## Phát hành
1. PR phiên bản: cập nhật `version` trong `package.json` (nơi duy nhất; `app.config.ts` đọc từ đó), đổi `[Unreleased]` → `[X.Y.Z] - YYYY-MM-DD`, cập nhật link so sánh và badge.
2. Sau merge: `git tag -a vX.Y.Z -m "…" && git push origin vX.Y.Z` trên `main`.
3. `gh release create vX.Y.Z --verify-tag [--prerelease] --notes-file notes.md` (ghi chú lấy từ CHANGELOG).
4. Build APK bằng EAS (profile `preview`), đính kèm APK và `SHA256SUMS` vào GitHub Release (ADR-013). Hỏi người dùng trước khi tạo tag và release.
- Không di chuyển/dùng lại tag. Phát hành sai → bản patch mới. Build number (`android.versionCode`) do EAS quản lý (`appVersionSource: remote`).
- Migration: áp dụng lên Supabase cloud bằng `npx supabase db push --remote` (CLI 3 mặc định trỏ vào stack local; chạy `--dry-run` trước) sau khi PR đã merge, có hỏi người dùng (ADR-011).
