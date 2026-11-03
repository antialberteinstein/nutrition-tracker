# Prompt giao việc — Nutrition Tracker

Thư mục này lưu prompt đã dựng nên dự án:
- [`LOG.md`](LOG.md) — nhật ký **mọi** yêu cầu của người dùng dẫn tới thay đổi trong repo (theo quy tắc trong CLAUDE.md).
- `NN-slug.txt` — prompt giao việc cho từng giai đoạn lớn, mô tả bên dưới.

Mỗi file `NN-slug.txt` là một giai đoạn xây dựng có thể giao cho coding agent: VAI TRÒ VÀ BỐI CẢNH · MỤC TIÊU · PHẠM VI · NGOÀI PHẠM VI · ĐẦU RA · TIÊU CHÍ HOÀN THÀNH. Chạy theo thứ tự; prompt sau bổ sung lên kết quả trước. `docs/RequirementsOutline.md` là đặc tả cuối cùng và thắng khi mâu thuẫn.

| File | Mục đích | Issue/PR |
|---|---|---|
| _(chưa có)_ | Prompt giai đoạn sẽ được tạo khi lên kế hoạch milestone 0.1.0 (`/kessie-skills:proj plan`) | |

## Quy tắc biên tập
- Giữ ý định sản phẩm; bỏ hội thoại; gộp các lời phê duyệt vào prompt.
- Không tạo prompt chỉ để sửa lỗi — lỗi là issue.
- Không chứa URL dự án thật, mật khẩu, key, token, dữ liệu tài khoản.
- Mỗi prompt kết thúc bằng tiêu chí hoàn thành quan sát được và câu "không tuyên bố đã xác minh môi trường thật khi chưa có bằng chứng".
