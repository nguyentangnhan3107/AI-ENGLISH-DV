# AI English Coach — kiểm định vòng 2

## Các thay đổi đã thực hiện

1. Đổi model hội thoại và một số lời gọi AI đang dùng `gemini-3.8-flash` sang `gemini-2.5-flash` để tránh gọi tên model không hợp lệ trong cấu hình hiện tại.
2. Thêm giới hạn chờ 12 giây cho yêu cầu hội thoại; khi yêu cầu AI lỗi/chậm, hàm hội thoại chuyển sang phương án dự phòng hiện có thay vì chờ vô hạn.
3. Làm rõ chỉ dẫn cho Alex: trả lời trực tiếp nội dung tin nhắn mới nhất, bám chủ đề, không bỏ qua câu hỏi và tránh câu trả lời chung chung.
4. Sửa lỗi dùng `||` để mặc định số kim cương. Khi số dư đúng bằng 0, ứng dụng không còn tự thay nó bằng 100/150 rồi cộng thưởng.
5. Sửa việc phần hội thoại cộng thưởng lần nữa khi bấm kết thúc phiên: bỏ callback cộng XP/kim cương lần hai ở route `/practice`.
6. Chuỗi ngày học chỉ được cập nhật khi hoàn thành lượt hội thoại; cùng ngày không tăng nhiều lần, ngày liền sau tăng một, bỏ lỡ ngày thì bắt đầu lại từ 1. Hiển thị đúng số 0 thay vì ép chuỗi thành 3.
7. Người dùng mới bắt đầu ở 0 XP, 0 kim cương, 0 ngày liên tiếp; dữ liệu đã lưu của người dùng cũ được giữ lại.
8. Loại `pages/Practice-incomplete.tsx` khỏi TypeScript build vì đây là tệp nháp có cú pháp không hoàn chỉnh, không phải trang đang được import trong ứng dụng.
9. Loại `.env`, `.git`, `node_modules` và `dist` khỏi bản ZIP để tránh chia sẻ khóa bí mật, lịch sử Git hoặc thư mục phụ thuộc cồng kềnh.

## Kiểm tra đã chạy

- Kiểm tra cú pháp TypeScript/TSX của các tệp đã chỉnh bằng TypeScript `transpileModule`: đạt, không phát hiện lỗi cú pháp trong các tệp đó.
- Kiểm tra JSON của `tsconfig.json`: đạt.
- Chạy `tsc --noEmit` toàn dự án: chưa thể hoàn tất vì thiếu/cài đặt không đầy đủ các dependency và tệp `@types` trong môi trường kiểm thử.
- Chạy `npm ci`: bị hết thời gian chờ khi tải dependency.
- Vì vậy chưa xác nhận `npm run build`, chưa kiểm thử tương tác trên trình duyệt và chưa xác minh API Gemini thực tế.

## Còn phải làm trước khi thi

- Khóa Gemini cũ từng có trong `.env` phải được thu hồi và thay mới. Không chia sẻ khóa mới trong ZIP, ảnh chụp hoặc mã frontend.
- `vite.config.ts` hiện vẫn nhúng API key vào bundle frontend. Đây là rủi ro bảo mật khi triển khai công khai; cần chuyển gọi Gemini qua backend/serverless function trước khi phát hành công khai.
- Cần cài dependency trong môi trường có mạng, chạy `npm ci`, `npm run build`, sau đó kiểm thử thực tế các ca: phản hồi AI đúng chủ đề, AI chậm/mất mạng, gửi liên tiếp, XP không cộng trùng, số dư kim cương bằng 0, mua hàng, tải lại trang, chuyển ngày và chuỗi học.
- Bản này là bản sửa lỗi vòng 2, chưa được chứng nhận sẵn sàng dự thi hoặc không thể xảy ra sự cố.
