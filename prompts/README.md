# Prompt giao việc — Nutrition Tracker

Thư mục này lưu prompt đã dựng nên dự án:
- [`LOG.md`](LOG.md) — nhật ký **mọi** yêu cầu của người dùng dẫn tới thay đổi trong repo (theo quy tắc trong CLAUDE.md).
- `NN-slug.txt` — prompt giao việc cho từng giai đoạn lớn, mô tả bên dưới.

Mỗi file `NN-slug.txt` là một giai đoạn xây dựng có thể giao cho coding agent: VAI TRÒ VÀ BỐI CẢNH · MỤC TIÊU · PHẠM VI · NGOÀI PHẠM VI · ĐẦU RA · TIÊU CHÍ HOÀN THÀNH. Chạy theo thứ tự; prompt sau bổ sung lên kết quả trước. `docs/RequirementsOutline.md` là đặc tả cuối cùng và thắng khi mâu thuẫn.

| File | Mục đích | Issue/PR |
|---|---|---|
| [01-foundation.txt](01-foundation.txt) | Nền tảng 0.1.0: client Supabase, schema hồ sơ/mục tiêu/cài đặt, logic dinh dưỡng, theme "Vở ô ly", tài khoản, Onboarding, Mục tiêu | #8–#14 |
| [02-meal-log.txt](02-meal-log.txt) | Ghi món có gợi ý, Hôm nay, bottom sheet + DESIGN.md, Món đã lưu, Biểu đồ, Nhắc ghi chép, Xoá tài khoản | #15–#21 |

## Quy tắc biên tập
- Giữ ý định sản phẩm; bỏ hội thoại; gộp các lời phê duyệt vào prompt.
- Không tạo prompt chỉ để sửa lỗi — lỗi là issue.
- Không chứa URL dự án thật, mật khẩu, key, token, dữ liệu tài khoản.
- Mỗi prompt kết thúc bằng tiêu chí hoàn thành quan sát được và câu "không tuyên bố đã xác minh môi trường thật khi chưa có bằng chứng".
