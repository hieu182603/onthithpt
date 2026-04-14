# Tài liệu Tổng hợp Thiết kế Hệ thống (System Requirements Specification - SRS)
Dự án **onthiTHPT**. Tài liệu này được biên soạn từ toàn bộ các giai đoạn nghiên cứu, thiết kế module, quy tắc nghiệp vụ và hạ tầng kỹ thuật đã thống nhất.

## 1. Tổng quan Dự án
**onthiTHPT** là nền tảng ôn thi trực tuyến cá nhân hóa dành cho học sinh THPT. Hệ thống tập trung vào việc tạo ngân hàng câu hỏi, tổ chức kỳ thi thử, và sử dụng dữ liệu để tự động đề xuất lộ trình ôn tập dựa trên các lỗ hổng kiến thức.

## 2. Kiến trúc Module & Use Cases

| Module | Use Case chính | Mô tả |
| :--- | :--- | :--- |
| **Identity** | Register Student | Đăng ký tài khoản học sinh, mã hóa mật khẩu, phân quyền. |
| | Manage Users | Quản lý người dùng, phân quyền (Admin), khóa/mở tài khoản. |
| **Catalog** | Manage Content | Quản lý hệ thống môn học, chuyên đề, bài giảng. |
| **Assessment** | Create Question | Giáo viên tạo câu hỏi, đáp án, giải thích. |
| | Take Quiz | Học sinh tham gia bài thi, đếm ngược thời gian, chấm điểm. |
| **Learning** | View Performance | Bảng điều khiển (Dashboard) theo dõi tiến độ, xem điểm. |
| | Generate Smart Quiz | Tự động tạo bài tập từ các chủ đề yếu (accuracy < 50%). |

**Các Actor**: Học sinh (Student), Giáo viên (Teacher), Quản trị viên (Admin), Khách (Guest).

## 3. Quy tắc Nghiệp vụ (Business Rules)

### Hệ thống & Tài khoản:
- Tên đăng nhập phải duy nhất.
- Email phải duy nhất trong hệ thống.
- Mật khẩu tối thiểu 8 ký tự.
- Admin chỉ được quản lý vai trò và trạng thái tài khoản.
- Mọi thay đổi quyền người dùng hoặc tạm khóa tài khoản phải được lưu log.

### Nội dung & Câu hỏi:
- Mỗi câu hỏi phải có nội dung và ít nhất 1 đáp án đúng.
- Tối thiểu 5 câu hỏi để tạo một bài kiểm tra hoặc bài ôn tập.

### Học tập & Kiểm tra:
- Bộ đếm thời gian bắt đầu ngay khi bài thi được khởi chạy.
- Chủ đề "yếu" được xác định khi học sinh có tỉ lệ chính xác < 50%.
- Bài ôn tập thông minh chỉ được bao gồm các chủ đề có tỉ lệ chính xác < 50%.

## 4. Thiết kế Cơ sở dữ liệu (Prisma Schema)

```prisma
// --- Identity ---
model User {
  id           String   @id @default(uuid())
  email        String   @unique
  username     String   @unique
  passwordHash String
  roleId       String
  role         Role     @relation(fields: [roleId], references: [id])
  attempts     Attempt[]
}

model Role {
  id    String @id @default(uuid())
  name  String @unique // STUDENT, TEACHER, ADMIN
  users User[]
}

// --- Catalog ---
model Subject {
  id     String  @id @default(uuid())
  name   String  @unique
  topics Topic[]
}

model Topic {
  id        String     @id @default(uuid())
  name      String
  subject   Subject    @relation(fields: [subjectId], references: [id])
  subjectId String
  questions Question[]
}

// --- Assessment ---
model Question {
  id           String   @id @default(uuid())
  content      String
  difficulty   Int      // 1 đến 5
  explanation  String
  topic        Topic    @relation(fields: [topicId], references: [id])
  topicId      String
  options      Option[]
  answers      Answer[]
}

model Option {
  id         String   @id @default(uuid())
  content    String
  isCorrect  Boolean
  question   Question @relation(fields: [questionId], references: [id])
  questionId String
}

// --- Learning & Logging ---
model Attempt {
  id          String    @id @default(uuid())
  userId      String
  user        User      @relation(fields: [userId], references: [id])
  startedAt   DateTime  @default(now())
  completedAt DateTime?
  score       Float?
  answers     Answer[]
}

model Answer {
  id               String   @id @default(uuid())
  attemptId        String
  attempt          Attempt  @relation(fields: [attemptId], references: [id])
  questionId       String
  question         Question @relation(fields: [questionId], references: [id])
  selectedOptionId String
  isCorrect        Boolean
}
```

## 5. Tech Stack

| Thành phần | Công nghệ lựa chọn |
| :--- | :--- |
| **Frontend** | Next.js (App Router), TypeScript, TailwindCSS, shadcn/ui, TanStack Query |
| **Backend** | NestJS, TypeScript, Prisma ORM, JWT, Passport.js |
| **Database** | PostgreSQL |
| **Testing/Ops**| Jest, Playwright, Docker, GitHub Actions |

## 6. Kiến trúc UI/UX (Next.js)
- **Dashboard**: Hiển thị Streak, Biểu đồ kỹ năng (Accuracy Chart), Danh sách chủ đề cần ôn (Weak Topics).
- **Assessment**: Giao diện tập trung (Focus Mode), Bộ đếm thời gian (Timer), Phản hồi ngay lập tức (Immediate Feedback).
