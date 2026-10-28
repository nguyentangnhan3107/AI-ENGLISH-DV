# Fix luyện phát âm

Trang `Luyện phát âm` không còn phụ thuộc vào `SpeechRecognition` của trình duyệt (dịch vụ có thể báo lỗi `network`). Trang hiện ghi âm PCM qua Web Audio API, tạo WAV mono 16 kHz và gửi tới hàm `transcribeAudioWithGemini` dùng chung của ứng dụng.

## Chạy thử
1. Tạo file `.env` ở thư mục chứa `package.json` nếu chưa có.
2. Thêm `GEMINI_API_KEY=...` bằng API key của bạn. Không chia sẻ file `.env` hoặc đưa key vào ảnh chụp.
3. Dừng Vite bằng `Ctrl+C`, sau đó chạy `npm install` (nếu cần) và `npm run dev`.
4. Mở app qua `http://localhost:3000` hoặc HTTPS, cấp quyền microphone.
5. Trong Luyện phát âm, nhấn **Bấm để đọc câu**, đọc câu trong vài giây rồi nhấn **Dừng ghi âm và chấm câu**. Chờ Gemini chuyển âm thanh thành chữ.

Nếu phần chat AI hoạt động nhưng nhận diện phát âm báo lỗi API key, hãy kiểm tra `.env` và khởi động lại Vite. Nhận diện này cần Internet và quyền truy cập Gemini; đây là so khớp văn bản ước lượng, không phải chấm điểm âm vị chuyên sâu.
