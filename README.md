# 🚀 Nền tảng Ôn thi trực tuyến (onthiTHPT)

Đây là hệ thống **onthiTHPT** - Nền tảng ôn thi cá nhân hóa dành cho học sinh THPT. Hệ thống tập trung vào việc tạo ngân hàng câu hỏi, tổ chức kỳ thi thử, và sử dụng dữ liệu để tự động đề xuất lộ trình ôn tập dựa trên các lỗ hổng kiến thức của học sinh.

## ⚡ Hướng dẫn Chạy dự án (Development Mode)

### Chạy hệ thống Backend (API - NestJS)
```bash
cd backend
yarn install
# Yêu cầu bổ sung DATABASE_URL (PostgreSQL) trong .env, sau đó chạy:
# npx prisma db push (hoặc npx prisma migrate dev)
yarn start:dev
```

### Chạy hệ thống Frontend (Web App - Next.js)
```bash
cd frontend
yarn install
yarn dev
```
