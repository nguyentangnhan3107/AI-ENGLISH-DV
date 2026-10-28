# Accessibility upgrade – Eng AI For Learn

Bản này giữ nguyên UI/gamification hiện có và bổ sung một lớp trợ năng dành cho người khiếm thị.

## Phím tắt
- `Alt + V`: bật/tắt chế độ trợ năng.
- `Tab`: di chuyển qua các nút/liên kết/trường nhập.
- `Enter`: kích hoạt điều khiển đang được chọn.
- `Esc`: dừng giọng đọc ngay lập tức.
- `Alt + R`: đọc lại nội dung vừa được phát.

## Chức năng mới
- Tự đọc tên/nội dung của điều khiển khi người dùng chuyển focus bằng bàn phím.
- Thông báo chuyển trang bằng giọng nói.
- Nút `Đọc trang` để đọc các tiêu đề, nội dung và điều khiển chính của trang.
- `Đọc lại` và `Dừng đọc`.
- Chọn tốc độ đọc Chậm / Chuẩn / Nhanh và lưu lại giữa các phiên.
- Vùng `aria-live` hỗ trợ thêm cho screen reader.
- Skip link “Bỏ qua điều hướng, đến nội dung chính”.
- Focus keyboard được làm nổi bật rõ ràng khi bật trợ năng.
- Không cho hai luồng TTS phát chồng lên nhau.
- Loại emoji/ký hiệu trang trí khỏi nội dung được đọc.
- Không đọc URL; liên kết chỉ đọc nhãn hiển thị và không thêm tiền tố “Liên kết”.
- Tách các cụm tiếng Việt/tiếng Anh trong câu trộn ngôn ngữ để chọn giọng phù hợp.

## Lưu ý kiểm tra
Bộ xử lý TTS đã được kiểm tra TypeScript độc lập và thử với các câu tiếng Việt, tiếng Anh, câu trộn ngôn ngữ, URL và emoji. Chưa xác nhận được full `npm run build` cho toàn dự án trong môi trường hiện tại vì chưa có `node_modules` của dự án ở đây. Chất lượng phát âm cũng phụ thuộc vào giọng tiếng Việt và tiếng Anh có sẵn trong Chrome/Windows trên máy chạy app.
