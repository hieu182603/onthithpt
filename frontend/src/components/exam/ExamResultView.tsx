import Link from "next/link";
import {
  ArrowRight,
  Award,
  Brain,
  CheckCircle2,
  Clock3,
  MinusCircle,
  RotateCcw,
  TrendingDown,
  Trophy,
  XCircle,
} from "lucide-react";
import type { AttemptResult } from "@/lib/types/api";

const StatCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="rounded-2xl border border-border bg-card p-4">
    <div className="mb-2">{icon}</div>
    <p className="text-sm text-muted-foreground">{label}</p>
    <p className="mt-1 text-2xl font-bold">{value}</p>
  </div>
);

type ExamResultViewProps = {
  result: AttemptResult;
};

export function ExamResultView({ result }: Readonly<ExamResultViewProps>) {
  const { attempt, quiz, details } = result;

  const score = attempt.score ?? 0;
  const correct = attempt.totalCorrect;
  const total = attempt.totalQuestions;
  const answered = details.filter((d) => d.selectedOptionId).length;
  const skipped = total - answered;
  const wrong = answered - correct;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  let rank = "Cần cố gắng";
  if (score >= 8) rank = "Xuất sắc";
  else if (score >= 6.5) rank = "Tiến bộ tốt";

  const quizId = quiz.id;

  return (
    <main className="min-h-screen bg-background px-4 py-6 md:px-6 md:py-8">
      <div className="mx-auto w-full max-w-6xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 md:flex-row md:items-center md:justify-between md:p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Báo cáo chi tiết</p>
            <h1 className="mt-2 text-2xl font-bold md:text-3xl">Kết quả bài làm</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {quiz.title} · {quiz.subject?.name}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-muted px-3 py-2 text-sm">
              <Clock3 size={16} className="text-primary" />
              <span>{attempt.durationMinutes} phút</span>
            </div>
          </div>
        </div>

        {/* Score + accuracy */}
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-6 md:col-span-2">
            <div className="flex items-center gap-2 text-primary">
              <Award size={18} />
              <span className="text-sm font-medium">Xếp loại: {rank}</span>
            </div>
            <div className="mt-4 flex items-end gap-2">
              <p className="text-5xl font-bold leading-none md:text-6xl">{score.toFixed(1)}</p>
              <p className="pb-1 text-xl text-muted-foreground">/ 10</p>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Bạn đã trả lời đúng {correct}/{total} câu hỏi.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">Độ chính xác</p>
            <p className="mt-2 text-4xl font-bold text-primary">{accuracy}%</p>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${accuracy}%` }} />
            </div>
          </div>
        </div>

        {/* Stat cards */}
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard icon={<CheckCircle2 size={18} className="text-emerald-500" />} label="Câu đúng" value={`${correct}`} />
          <StatCard icon={<XCircle size={18} className="text-rose-500" />} label="Câu sai" value={`${wrong}`} />
          <StatCard icon={<MinusCircle size={18} className="text-amber-500" />} label="Bỏ trống" value={`${skipped}`} />
          <StatCard icon={<Trophy size={18} className="text-primary" />} label="Đã hoàn thành" value={`${answered}/${total}`} />
        </div>

        {/* Details + suggestion */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Wrong answers with explanations */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-4 inline-flex items-center gap-2 text-lg font-semibold">
              <TrendingDown size={18} className="text-amber-500" />
              Câu sai &amp; giải thích
            </h2>
            {details.filter((d) => !d.isCorrect).length === 0 ? (
              <p className="text-sm text-muted-foreground">Tuyệt vời! Bạn trả lời đúng tất cả câu hỏi.</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {details
                  .filter((d) => !d.isCorrect)
                  .map((d) => (
                    <div key={d.questionId} className="rounded-xl border border-border bg-muted/40 p-4">
                      <p className="font-medium text-sm leading-relaxed line-clamp-2">{d.questionContent}</p>
                      {d.selectedContent && (
                        <p className="mt-1.5 text-xs text-rose-600 font-medium">
                          Bạn chọn: {d.selectedContent}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-emerald-600 font-medium">
                        Đáp án đúng: {d.correctContent}
                      </p>
                      {d.explanation && (
                        <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                          {d.explanation}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Smart review suggestion */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-4 inline-flex items-center gap-2 text-lg font-semibold">
              <Brain size={18} className="text-primary" />
              Hệ thống đề xuất
            </h2>
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <h3 className="font-semibold">Bài luyện cá nhân hóa</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                AI đã phân tích kết quả của bạn. Chúng tôi đề xuất bộ câu hỏi tập trung vào các chủ đề yếu để cải thiện điểm số nhanh nhất.
              </p>
              <Link
                href="/student/smart-quiz"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                Tạo bài ôn tập thông minh
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={`/exam/${quizId}`}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:bg-muted"
          >
            <RotateCcw size={16} />
            Làm lại bài
          </Link>
          <Link
            href="/student/exams"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Quay về danh sách đề
          </Link>
          <Link
            href="/student/history"
            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:bg-muted"
          >
            Lịch sử làm bài
          </Link>
        </div>
      </div>
    </main>
  );
}
