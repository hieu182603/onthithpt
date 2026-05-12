"use client";

import { useEffect, useState } from "react";
import { Calendar, CheckCircle2, Clock, Loader2, Search, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { attempts } from "@/lib/api";
import type { QuizAttempt } from "@/lib/types/api";

const getScoreStyle = (score: number) => {
  if (score >= 8) return { color: "text-emerald-600", bg: "bg-emerald-100 border-emerald-500" };
  if (score >= 6) return { color: "text-blue-600", bg: "bg-blue-100 border-blue-500" };
  if (score >= 5) return { color: "text-amber-600", bg: "bg-amber-100 border-amber-500" };
  return { color: "text-rose-600", bg: "bg-rose-100 border-rose-500" };
};

const formatDate = (iso: string) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const formatDuration = (startedAt: string, finishedAt?: string) => {
  if (!finishedAt) return "—";
  const diff = Math.round((new Date(finishedAt).getTime() - new Date(startedAt).getTime()) / 1000);
  const m = Math.floor(diff / 60);
  const s = diff % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

function HistorySkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-card p-6 rounded-xl border-2 border-foreground animate-pulse">
          <div className="flex justify-between items-start gap-6">
            <div className="flex-1 space-y-3">
              <div className="h-5 bg-muted rounded w-1/3" />
              <div className="h-6 bg-muted rounded w-2/3" />
              <div className="flex gap-4">
                <div className="h-4 bg-muted rounded w-20" />
                <div className="h-4 bg-muted rounded w-16" />
                <div className="h-4 bg-muted rounded w-16" />
              </div>
            </div>
            <div className="h-20 w-32 bg-muted rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function StudentHistoryPage() {
  const router = useRouter();
  const [historyList, setHistoryList] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [query, setQuery] = useState("");

  const loadHistory = async (pageNum: number, append = false) => {
    try {
      const res = await attempts.getHistory({ page: pageNum, limit: 10 });
      if (append) {
        setHistoryList((prev) => [...prev, ...res.data]);
      } else {
        setHistoryList(res.data);
      }
      setHasMore(pageNum < res.meta.totalPages);
    } catch {
      // stay empty
    }
  };

  useEffect(() => {
    loadHistory(1).finally(() => setLoading(false));
  }, []);

  const handleLoadMore = async () => {
    setLoadingMore(true);
    const nextPage = page + 1;
    await loadHistory(nextPage, true);
    setPage(nextPage);
    setLoadingMore(false);
  };

  const filtered = historyList.filter((item) => {
    if (!query) return true;
    const title = item.quiz?.title ?? "";
    const subject = item.quiz?.subject?.name ?? "";
    return (
      title.toLowerCase().includes(query.toLowerCase()) ||
      subject.toLowerCase().includes(query.toLowerCase())
    );
  });

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 md:space-y-8">
      <header className="mb-6 md:mb-8 border-b-2 border-foreground pb-6">
        <h1 className="text-4xl md:text-5xl font-extrabold text-foreground mb-2 tracking-tight">
          Lịch sử làm bài
        </h1>
        <p className="text-lg text-muted-foreground font-medium">
          Xem lại lịch sử các bài thi đã làm, điểm số và chi tiết từng bài thi.
        </p>
      </header>

      <div className="bg-card p-6 rounded-xl border-2 border-foreground mb-8">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm bài thi..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-foreground bg-muted font-bold text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all"
          />
        </div>
      </div>

      {loading ? (
        <HistorySkeleton />
      ) : filtered.length === 0 ? (
        <div className="p-16 rounded-xl border-2 border-foreground bg-muted text-center">
          <p className="text-xl font-bold text-foreground mb-2">
            {historyList.length === 0 ? "Chưa có lịch sử làm bài" : "Không tìm thấy bài thi"}
          </p>
          <p className="text-muted-foreground font-medium">
            {historyList.length === 0
              ? "Hoàn thành bài thi đầu tiên để bắt đầu theo dõi tiến độ."
              : "Thử từ khóa tìm kiếm khác."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((item) => {
            const score = item.score ?? 0;
            const scoreStyle = getScoreStyle(score);
            const wrong = item.totalQuestions - item.totalCorrect;

            return (
              <div
                key={item.id}
                onClick={() => {
                  if (item.quiz?.id) {
                    router.push(`/exam/${item.quiz.id}/result?attemptId=${item.id}`);
                  }
                }}
                className="bg-card p-6 rounded-xl border-2 border-foreground hover:border-blue-500 transition-colors cursor-pointer group"
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {item.quiz?.subject?.name && (
                        <span className="px-3 py-1 rounded-lg bg-blue-500 text-white text-xs font-bold uppercase tracking-wider border-2 border-foreground">
                          {item.quiz.subject.name}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-sm font-bold text-muted-foreground uppercase tracking-widest">
                        <Calendar size={14} />
                        {formatDate(item.finishedAt ?? item.createdAt)}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-blue-600 transition-colors">
                      {item.quiz?.title ?? "Bài thi"}
                    </h3>
                    <div className="flex items-center gap-4 text-sm font-medium text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock size={16} />
                        {formatDuration(item.startedAt, item.finishedAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle2 size={16} className="text-emerald-500" />
                        {item.totalCorrect} đúng
                      </span>
                      <span className="flex items-center gap-1">
                        <XCircle size={16} className="text-rose-500" />
                        {wrong} sai
                      </span>
                    </div>
                  </div>

                  <div
                    className={`shrink-0 flex flex-col items-center justify-center p-4 rounded-xl border-2 border-foreground ${scoreStyle.bg} w-32`}
                  >
                    <span
                      className={`text-3xl font-extrabold tracking-tight ${scoreStyle.color}`}
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {score.toFixed(1)}
                    </span>
                    <span className={`text-xs font-bold uppercase tracking-widest ${scoreStyle.color} opacity-80 mt-1`}>
                      / 10
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {hasMore && !loading && (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="px-8 py-4 rounded-xl bg-foreground text-background border-2 border-foreground hover:bg-muted-foreground font-bold text-lg transition-colors disabled:opacity-60 inline-flex items-center gap-2"
          >
            {loadingMore && <Loader2 size={20} className="animate-spin" />}
            {loadingMore ? "Đang tải..." : "Tải thêm lịch sử"}
          </button>
        </div>
      )}
    </div>
  );
}
