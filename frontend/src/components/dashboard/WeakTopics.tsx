"use client";

import { useEffect, useState } from "react";
import { AlertCircle, TrendingUp, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { smartReview } from "@/lib/api";
import type { WeakTopic } from "@/lib/types/api";

function SkeletonRow() {
  return (
    <div className="p-5 rounded-xl border-2 border-foreground bg-muted animate-pulse">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="h-5 bg-background rounded w-20" />
          <div className="h-5 bg-background rounded w-40" />
          <div className="h-4 bg-background rounded w-48" />
        </div>
        <div className="h-11 w-36 bg-background rounded-xl border-2 border-foreground" />
      </div>
    </div>
  );
}

export function WeakTopics() {
  const router = useRouter();
  const [topics, setTopics] = useState<WeakTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    smartReview
      .getWeakTopics()
      .then(setTopics)
      .catch(() => setError("Không thể tải dữ liệu. Vui lòng thử lại."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-card rounded-xl p-6 md:p-8 border-2 border-foreground">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-rose-500 rounded-lg border-2 border-foreground">
              <AlertCircle size={20} className="text-white" />
            </div>
            <h3
              className="text-2xl font-bold text-foreground tracking-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Chủ đề cần ôn tập
            </h3>
          </div>
          <p className="text-base text-muted-foreground font-medium">
            Tập trung vào các phần này để cải thiện điểm số
          </p>
        </div>
      </div>

      {loading && (
        <div className="space-y-4">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      )}

      {!loading && error && (
        <div className="p-5 rounded-xl border-2 border-rose-200 bg-rose-50 text-rose-700 font-bold text-center">
          {error}
        </div>
      )}

      {!loading && !error && topics.length === 0 && (
        <div className="p-8 rounded-xl border-2 border-foreground bg-muted text-center">
          <p className="text-lg font-bold text-foreground mb-2">Tuyệt vời!</p>
          <p className="text-muted-foreground font-medium">
            Bạn chưa có chủ đề nào dưới 50% độ chính xác. Hãy tiếp tục làm bài để nhận gợi ý.
          </p>
        </div>
      )}

      {!loading && !error && topics.length > 0 && (
        <div className="space-y-4">
          {topics.map((topic) => {
            const accuracyPct = Math.round(topic.accuracy * 100);
            return (
              <div
                key={topic.topicId}
                className="p-5 rounded-xl border-2 border-foreground bg-muted hover:bg-white cursor-pointer transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-3 py-1 rounded-lg bg-blue-500 text-white text-xs font-bold uppercase tracking-wider border-2 border-foreground">
                        {topic.subjectName}
                      </span>
                    </div>
                    <h4 className="font-bold text-lg text-foreground mb-3">
                      {topic.topicName}
                    </h4>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-32 h-4 bg-background border-2 border-foreground rounded-full overflow-hidden">
                          <div
                            className="h-full border-r-2 border-foreground"
                            style={{
                              width: `${accuracyPct}%`,
                              backgroundColor:
                                accuracyPct < 40
                                  ? "#EF4444"
                                  : accuracyPct < 50
                                  ? "#F59E0B"
                                  : "#10B981",
                            }}
                          />
                        </div>
                        <span
                          className="font-extrabold text-foreground"
                          style={{ fontFamily: "var(--font-display)" }}
                        >
                          {accuracyPct}%
                        </span>
                      </div>
                      <span className="text-sm font-bold text-muted-foreground">
                        {topic.totalQuestions} câu hỏi
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push("/student/smart-quiz")}
                    className="px-5 py-3 rounded-xl bg-amber-500 text-foreground border-2 border-foreground hover:bg-amber-400 font-bold flex items-center gap-2 whitespace-nowrap self-start md:self-auto transition-colors"
                  >
                    <TrendingUp size={20} />
                    Luyện tập ngay
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 p-5 rounded-xl bg-blue-100 border-2 border-foreground">
        <p className="text-sm text-blue-900 font-bold leading-relaxed">
          <span className="text-lg mr-2">💡</span>
          Mẹo học tập: Luyện tập thường xuyên các chủ đề yếu có thể cải thiện điểm số lên đến 20%
          trong một tháng!
        </p>
      </div>
    </div>
  );
}
