BẢN CẬP NHẬT SỔ TAY — HỖ TRỢ NGƯỜI THỊ LỰC KÉM

Cách cài:
1. Sao lưu file hiện có: pages/Vocabulary.tsx.
2. Giải nén ZIP này vào thư mục dự án có package.json.
3. Cho phép Replace pages/Vocabulary.tsx nếu Windows hỏi.
4. Không thay đổi .env, Practice.tsx hoặc services/geminiService.ts.
5. Khởi động lại Vite nếu app đang chạy: Ctrl+C, rồi npm run dev.

Tính năng:
- Điều chỉnh cỡ chữ 100%, 115%, 130%, 150%, lưu tùy chọn trên thiết bị.
- Chế độ tương phản cao nền đen/chữ sáng.
- Viền focus rõ khi dùng bàn phím, vùng bấm tối thiểu 44px.
- Đọc tối đa 20 từ đang hiển thị; từ tiếng Anh dùng giọng en-US, nghĩa dùng vi-VN.
- Nút nghe riêng cho từ + nghĩa + ví dụ; nút dừng đọc.
- Hộp thoại Luyện tập gồm nghe từ, thử phát âm, đặt câu và phản hồi AI.
- Thông báo dễ hiểu khi trình duyệt không hỗ trợ/không cấp quyền micro.
- Nhãn form, aria-label, aria-live, đóng hộp thoại bằng Escape.

Lưu ý kiểm thử:
Đã kiểm tra cú pháp TypeScript/TSX bằng trình phân tích cú pháp TypeScript. Chưa chạy build toàn ứng dụng do thư viện phụ thuộc không được cài trong môi trường tạo bản vá.
