"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertTriangle,
  Bookmark,
  BookmarkCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  LogOut,
  Maximize,
} from "lucide-react";
import { attempts, quizzes } from "@/lib/api";
import type {
  AttemptResult,
  StudentQuizQuestion,
  StudentQuizView,
  SubmitAnswerInput,
} from "@/lib/types/api";
import { ExamResultView } from "@/components/exam/ExamResultView";
import { MathText } from "@/components/ui/MathText";

type Phase = "loading" | "error" | "intro" | "exam" | "submitting" | "result";

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

// ─────────────────────────────────────────────────────
// Type-specific answer renderers
// ─────────────────────────────────────────────────────

type QuestionData = StudentQuizQuestion["question"];

function SingleChoiceOptions({
  q,
  selected,
  onSelect,
}: Readonly<{ q: QuestionData; selected: string | undefined; onSelect: (id: string) => void }>) {
  const sorted = [...q.options].sort((a, b) => a.order - b.order);
  return (
    <div className="mt-5 space-y-3.5">
      {sorted.map((option, idx) => {
        const isSelected = selected === option.id;
        return (
          <button
            key={option.id}
            className={
              isSelected
                ? "w-full rounded-xl border-2 border-foreground bg-primary p-4 text-left font-semibold text-primary-foreground shadow-[2px_2px_0px_0px_rgba(17,24,39,1)]"
                : "w-full rounded-xl border-2 border-border bg-card p-4 text-left text-foreground transition-colors hover:bg-muted"
            }
            onClick={() => onSelect(option.id)}
            type="button"
          >
            <span className="flex items-start gap-3">
              <span
                className={
                  isSelected
                    ? "mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-sm font-bold text-primary"
                    : "mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-bold text-foreground"
                }
              >
                {String.fromCodePoint(65 + idx)}
              </span>
              <span className="flex-1 pt-0.5 leading-relaxed"><MathText content={option.content} /></span>
              {isSelected && <Check className="size-5 shrink-0" />}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function TrueFalseOptions({
  q,
  chosen,
  onToggle,
}: Readonly<{
  q: QuestionData;
  chosen: Record<string, boolean>;
  onToggle: (optionId: string, value: boolean) => void;
}>) {
  const sorted = [...q.options].sort((a, b) => a.order - b.order);
  return (
    <div className="mt-5 space-y-3">
      {sorted.map((option, idx) => {
        const userChoice = chosen[option.id];
        const label = option.label?.toUpperCase() ?? String.fromCodePoint(97 + idx).toUpperCase();
        return (
          <div
            key={option.id}
            className="flex items-start gap-3 rounded-xl border-2 border-border bg-card p-4"
          >
            <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-bold text-foreground">
              {label}
            </span>
            <span className="flex-1 leading-relaxed text-foreground">
              <MathText content={option.subContent ?? option.content} />
            </span>
            <div className="flex shrink-0 gap-2">
              <button
                className={
                  userChoice === true
                    ? "rounded-lg border-2 border-emerald-600 bg-emerald-500 px-3 py-1 text-sm font-semibold text-white"
                    : "rounded-lg border-2 border-border bg-muted px-3 py-1 text-sm font-semibold text-foreground hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                }
                onClick={() => onToggle(option.id, true)}
                type="button"
              >
                Đúng
              </button>
              <button
                className={
                  userChoice === false
                    ? "rounded-lg border-2 border-rose-600 bg-rose-500 px-3 py-1 text-sm font-semibold text-white"
                    : "rounded-lg border-2 border-border bg-muted px-3 py-1 text-sm font-semibold text-foreground hover:border-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950"
                }
                onClick={() => onToggle(option.id, false)}
                type="button"
              >
                Sai
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ShortAnswerInput({
  value,
  onChange,
}: Readonly<{ value: string; onChange: (text: string) => void }>) {
  return (
    <div className="mt-5">
      <input
        type="text"
        className="w-full rounded-xl border-2 border-border bg-card p-4 text-lg font-medium text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        placeholder="Nhập đáp án của bạn..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <p className="mt-2 text-xs text-muted-foreground">
        Nhập chính xác đáp án số hoặc biểu thức.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────

export default function ExamPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  const [phase, setPhase] = useState<Phase>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [quiz, setQuiz] = useState<StudentQuizView | null>(null);
  const [attemptId, setAttemptId] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  // Per-type answer states
  const [singleAnswers, setSingleAnswers] = useState<Record<string, string>>({});
  const [trueFalseAnswers, setTrueFalseAnswers] = useState<Record<string, Record<string, boolean>>>({});
  const [shortAnswers, setShortAnswers] = useState<Record<string, string>>({});

  const [bookmarked, setBookmarked] = useState<Record<number, boolean>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showViolationWarning, setShowViolationWarning] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [result, setResult] = useState<AttemptResult | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const [quizData, attemptData] = await Promise.all([
          quizzes.getForStudent(id),
          attempts.start(id),
        ]);
        setQuiz(quizData);
        setAttemptId(attemptData.attempt.id);
        setTimeLeft((quizData.timeLimit ?? 45) * 60);
        setPhase("intro");
      } catch {
        setErrorMsg("Không thể tải đề thi. Đề thi có thể không tồn tại hoặc đã bị xóa.");
        setPhase("error");
      }
    };
    init();
  }, [id]);

  useEffect(() => {
    if (phase !== "exam") return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  const handleSubmit = useCallback(async () => {
    if (!quiz || !attemptId || phase === "submitting" || phase === "result") return;
    setPhase("submitting");

    const submitAnswers: SubmitAnswerInput[] = quiz.questions.map((q) => {
      const qId = q.question.id;
      const type = q.question.type;

      if (type === "true_false") {
        const tf = trueFalseAnswers[qId] ?? {};
        return {
          questionId: qId,
          selectedOptionIds: Object.entries(tf)
            .filter(([, v]) => v)
            .map(([k]) => k),
        };
      }

      if (type === "short_answer") {
        return { questionId: qId, textAnswer: shortAnswers[qId] };
      }

      return { questionId: qId, selectedOptionId: singleAnswers[qId] };
    });

    try {
      await attempts.submit(attemptId, submitAnswers);
      const resultData = await attempts.getResult(attemptId);
      setResult(resultData);
      setPhase("result");
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    } catch {
      router.push("/student/exams");
    }
  }, [quiz, attemptId, phase, singleAnswers, trueFalseAnswers, shortAnswers, router]);

  const handleSubmitRef = useRef(handleSubmit);
  handleSubmitRef.current = handleSubmit;

  useEffect(() => {
    if (phase === "exam" && timeLeft === 0) {
      handleSubmitRef.current();
    }
  }, [timeLeft, phase]);

  useEffect(() => {
    if (phase !== "exam") return;
    const onVisibility = () => {
      if (document.hidden) {
        setTabSwitchCount((prev) => prev + 1);
        setShowViolationWarning(true);
        setTimeout(() => setShowViolationWarning(false), 3000);
      }
    };
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [phase]);

  const startExam = async () => {
    setPhase("exam");
    if (containerRef.current?.requestFullscreen) {
      try {
        await containerRef.current.requestFullscreen();
      } catch {
        /* blocked by browser */
      }
    }
  };

  // ── Phase gates ──────────────────────────────────

  if (phase === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 size={48} className="text-primary animate-spin" />
      </main>
    );
  }

  if (phase === "error") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6">
        <section className="w-full max-w-md rounded-2xl border-2 border-foreground bg-card p-8 text-center">
          <p className="text-lg font-bold text-foreground mb-6">{errorMsg}</p>
          <button
            onClick={() => router.push("/student/exams")}
            className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold border-2 border-foreground"
            type="button"
          >
            Quay về danh sách đề
          </button>
        </section>
      </main>
    );
  }

  if (phase === "submitting") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background flex-col gap-4">
        <Loader2 size={48} className="text-primary animate-spin" />
        <p className="text-lg font-bold text-foreground">Đang nộp bài...</p>
      </main>
    );
  }

  if (phase === "result" && result) {
    return <ExamResultView result={result} />;
  }

  if (phase === "intro" && quiz) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6">
        <section className="w-full max-w-3xl rounded-2xl border-2 border-foreground bg-card p-8 md:p-10">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-foreground bg-blue-500 text-white">
              <Maximize size={32} strokeWidth={2.5} />
            </div>
            <h1 className="text-3xl font-extrabold text-foreground md:text-4xl">{quiz.title}</h1>
            <p className="mt-2 text-base font-medium text-muted-foreground">
              {quiz.subject?.name} · Chế độ làm bài toàn màn hình
            </p>
          </div>

          <div className="mb-6 space-y-3 rounded-xl border-2 border-foreground bg-muted/50 p-5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground">Thời gian làm bài</span>
              <span className="font-extrabold text-primary">{quiz.timeLimit ?? 45} phút</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground">Số câu hỏi</span>
              <span className="font-extrabold text-primary">{quiz.totalQuestions} câu</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground">Môn học</span>
              <span className="font-extrabold text-primary">{quiz.subject?.name}</span>
            </div>
          </div>

          <div className="rounded-xl border-2 border-foreground bg-amber-500 p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle size={20} className="mt-0.5 text-amber-800" />
              <ul className="space-y-1 text-sm font-medium text-amber-900">
                <li>• Không chuyển tab hoặc rời khỏi bài thi trong quá trình làm bài.</li>
                <li>• Hệ thống sẽ ghi nhận vi phạm và hiển thị cảnh báo tức thì.</li>
                <li>• Bài thi tự động nộp khi hết thời gian.</li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-foreground bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-700"
              onClick={startExam}
              type="button"
            >
              <Maximize className="size-4" />
              Bắt đầu làm bài
            </button>
            <button
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-foreground bg-muted px-5 py-3 font-bold text-foreground hover:bg-muted/80"
              onClick={() => router.push("/student/exams")}
              type="button"
            >
              Quay lại danh sách đề
            </button>
          </div>
        </section>
      </main>
    );
  }

  if (!quiz) return null;

  // ── Exam phase ────────────────────────────────────

  const questions = quiz.questions;
  const currentQ = questions[currentIndex]?.question;

  const isQuestionAnswered = (q: StudentQuizQuestion) => {
    const qId = q.question.id;
    if (q.question.type === "true_false") {
      return !!trueFalseAnswers[qId] && Object.keys(trueFalseAnswers[qId]).length > 0;
    }
    if (q.question.type === "short_answer") {
      return !!(shortAnswers[qId]?.trim());
    }
    return !!singleAnswers[qId];
  };

  const answeredCount = questions.filter(isQuestionAnswered).length;
  const progress = questions.length === 0 ? 0 : Math.round((answeredCount / questions.length) * 100);

  return (
    <main className="fixed inset-0 flex flex-col bg-background" ref={containerRef}>
      {showViolationWarning && (
        <div className="border-b-2 border-foreground bg-rose-600 px-4 py-2 text-sm font-semibold text-white">
          <span className="inline-flex items-center gap-2">
            <AlertTriangle className="size-4" />
            Cảnh báo: hệ thống phát hiện bạn chuyển tab ({tabSwitchCount} lần).
          </span>
        </div>
      )}

      {showExitConfirm && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border-2 border-foreground bg-card p-6">
            <h3 className="text-xl font-extrabold text-foreground">Thoát khỏi bài thi?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Bài làm hiện tại sẽ không được lưu nếu bạn thoát.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                className="flex-1 rounded-xl border-2 border-foreground bg-background px-4 py-2.5 font-semibold text-foreground hover:bg-muted"
                onClick={() => setShowExitConfirm(false)}
                type="button"
              >
                Tiếp tục thi
              </button>
              <button
                className="flex-1 rounded-xl border-2 border-foreground bg-rose-600 px-4 py-2.5 font-semibold text-white hover:bg-rose-700"
                onClick={() => router.push("/student/exams")}
                type="button"
              >
                Thoát
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="flex items-center justify-between border-b border-border bg-card px-5 py-3">
        <div>
          <p className="text-sm font-semibold text-muted-foreground">{quiz.subject?.name}</p>
          <p className="font-semibold text-foreground">{quiz.title}</p>
        </div>
        <div className="inline-flex items-center gap-2.5">
          <span
            className={`inline-flex items-center gap-1 rounded-lg px-3 py-1 text-sm font-semibold ${
              timeLeft < 300 ? "bg-rose-100 text-rose-700" : "bg-blue-100 text-blue-700"
            }`}
          >
            <Clock className="size-4" />
            Còn lại {formatTime(timeLeft)}
          </span>
          <button
            className="rounded-lg border-2 border-foreground bg-blue-600 px-3.5 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
            onClick={handleSubmit}
            type="button"
          >
            Nộp bài
          </button>
          <button
            className="rounded-lg border-2 border-border bg-muted p-2 text-foreground hover:bg-muted/80"
            onClick={() => setShowExitConfirm(true)}
            type="button"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </header>

      {/* Body */}
      <section className="grid min-h-0 flex-1 grid-cols-1 xl:grid-cols-5">
        {/* Question area */}
        <article className="min-h-0 overflow-y-auto p-6 xl:col-span-4 xl:p-8">
          <div className="mx-auto max-w-4xl">
            <p className="mb-2 text-sm font-semibold text-muted-foreground">
              Câu {currentIndex + 1}/{questions.length}
            </p>

            {/* Question type badge */}
            <div className="mb-5 inline-flex items-center gap-2 rounded-xl border-2 border-foreground bg-primary px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-primary-foreground">
              Câu hỏi {currentIndex + 1}
              {currentQ?.type === "true_false" && (
                <span className="rounded bg-white/20 px-1.5 py-0.5">Đúng / Sai</span>
              )}
              {currentQ?.type === "short_answer" && (
                <span className="rounded bg-white/20 px-1.5 py-0.5">Trả lời ngắn</span>
              )}
            </div>

            {/* Question stem */}
            <h2 className="rounded-2xl border-2 border-foreground bg-card p-5 text-lg font-medium leading-relaxed text-foreground md:p-6">
              {currentQ && <MathText content={currentQ.content} />}
            </h2>

            {/* Answer options — rendered per question type */}
            {currentQ?.type === "true_false" ? (
              <TrueFalseOptions
                q={currentQ}
                chosen={trueFalseAnswers[currentQ.id] ?? {}}
                onToggle={(optId, val) =>
                  setTrueFalseAnswers((prev) => ({
                    ...prev,
                    [currentQ.id]: { ...prev[currentQ.id], [optId]: val },
                  }))
                }
              />
            ) : currentQ?.type === "short_answer" ? (
              <ShortAnswerInput
                value={shortAnswers[currentQ.id] ?? ""}
                onChange={(text) =>
                  setShortAnswers((prev) => ({ ...prev, [currentQ.id]: text }))
                }
              />
            ) : currentQ ? (
              <SingleChoiceOptions
                q={currentQ}
                selected={singleAnswers[currentQ.id]}
                onSelect={(optId) =>
                  setSingleAnswers((prev) => ({ ...prev, [currentQ.id]: optId }))
                }
              />
            ) : null}
          </div>
        </article>

        {/* Navigator sidebar */}
        <aside className="min-h-0 overflow-y-auto border-t border-border bg-card p-4 xl:col-span-1 xl:border-l xl:border-t-0 xl:p-5">
          <div className="mb-4 rounded-xl bg-muted/50 p-4">
            <p className="text-sm font-semibold text-muted-foreground">Tiến độ: {progress}%</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Đã trả lời {answeredCount}/{questions.length} câu
            </p>
            <div className="mt-2 h-2 rounded bg-muted">
              <div
                className="h-2 rounded bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="mt-2 grid grid-cols-5 gap-2.5">
            {questions.map((q, index) => {
              const isCurrent = index === currentIndex;
              const isAnswered = isQuestionAnswered(q);
              const isMarked = bookmarked[index];
              let cls =
                "aspect-square rounded-lg border border-border bg-background text-foreground text-sm font-bold";
              if (isCurrent)
                cls =
                  "aspect-square rounded-lg border border-primary bg-primary text-primary-foreground text-sm font-bold";
              else if (isAnswered)
                cls =
                  "aspect-square rounded-lg border border-emerald-600 bg-emerald-100 text-emerald-700 text-sm font-bold";
              else if (isMarked)
                cls =
                  "aspect-square rounded-lg border border-amber-500 bg-amber-100 text-amber-700 text-sm font-bold";
              return (
                <button
                  key={q.question.id}
                  className={cls}
                  onClick={() => setCurrentIndex(index)}
                  type="button"
                >
                  {index + 1}
                </button>
              );
            })}
          </div>

          <div className="mt-4 rounded-2xl bg-muted/50 p-3">
            <p className="text-xs font-bold uppercase tracking-wider text-foreground">Chú thích</p>
            <div className="mt-2 space-y-1.5 text-xs">
              <div className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded bg-primary" />
                <span className="text-muted-foreground">Đang làm</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded bg-emerald-500" />
                <span className="text-muted-foreground">Đã trả lời</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded bg-amber-500" />
                <span className="text-muted-foreground">Đã đánh dấu</span>
              </div>
            </div>
          </div>

          <button
            className={
              bookmarked[currentIndex]
                ? "mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 font-semibold text-white hover:bg-amber-600"
                : "mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-muted px-4 py-2.5 font-semibold text-foreground hover:bg-muted/80"
            }
            onClick={() =>
              setBookmarked((prev) => ({ ...prev, [currentIndex]: !prev[currentIndex] }))
            }
            type="button"
          >
            {bookmarked[currentIndex] ? (
              <BookmarkCheck className="size-4" />
            ) : (
              <Bookmark className="size-4" />
            )}
            {bookmarked[currentIndex] ? "Đã đánh dấu" : "Đánh dấu xem lại"}
          </button>
        </aside>
      </section>

      {/* Footer navigation */}
      <footer className="border-t border-border bg-card px-4 py-3">
        <div className="mx-auto flex w-full max-w-[1800px] items-center justify-between">
          <button
            className="inline-flex items-center gap-1 rounded-lg border-2 border-border bg-muted px-3 py-2 text-sm font-semibold text-foreground disabled:opacity-50"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((prev) => prev - 1)}
            type="button"
          >
            <ChevronLeft className="size-4" />
            Câu trước
          </button>
          <button
            className={
              bookmarked[currentIndex]
                ? "inline-flex items-center gap-1 rounded-lg border-2 border-foreground bg-amber-500 px-3 py-2 text-sm font-semibold text-white"
                : "inline-flex items-center gap-1 rounded-lg border-2 border-border bg-muted px-3 py-2 text-sm font-semibold text-foreground"
            }
            onClick={() =>
              setBookmarked((prev) => ({ ...prev, [currentIndex]: !prev[currentIndex] }))
            }
            type="button"
          >
            <Bookmark className="size-4" />
            Đánh dấu
          </button>
          <button
            className="inline-flex items-center gap-1 rounded-lg border-2 border-foreground bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            disabled={currentIndex === questions.length - 1}
            onClick={() => setCurrentIndex((prev) => prev + 1)}
            type="button"
          >
            Câu tiếp
            <ChevronRight className="size-4" />
          </button>
        </div>
      </footer>
    </main>
  );
}
