"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle, Clock, Download, FileText, Loader2, Search, XCircle } from "lucide-react";
import { attempts } from "@/lib/api";
import type { QuizAttempt } from "@/lib/types/api";

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

function ResultsSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-card p-6 rounded-xl border-2 border-border animate-pulse">
          <div className="flex gap-6">
            <div className="flex-1 space-y-3">
              <div className="h-5 bg-muted rounded w-1/3" />
              <div className="h-4 bg-muted rounded w-2/3" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </div>
            <div className="h-16 w-20 bg-muted rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function TeacherResultsPage() {
  const [resultList, setResultList] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const loadResults = useCallback(async (p: number, append = false) => {
    try {
      const res = await attempts.getAll({ page: p, limit: 20 });
      if (append) {
        setResultList((prev) => [...prev, ...res.data]);
      } else {
        setResultList(res.data);
      }
      setHasMore(p < res.meta.totalPages);
    } catch {
      // stay empty
    }
  }, []);

  useEffect(() => {
    loadResults(1).finally(() => setLoading(false));
  }, [loadResults]);

  const handleLoadMore = async () => {
    setLoadingMore(true);
    const nextPage = page + 1;
    await loadResults(nextPage, true);
    setPage(nextPage);
    setLoadingMore(false);
  };

  const filtered = resultList.filter((item) => {
    if (!searchTerm) return true;
    const title = item.quiz?.title ?? "";
    const student = item.user?.fullName ?? "";
    return (
      title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 md:space-y-8">
      <div className="bg-card border-2 border-border rounded-xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h1 style={{ fontFamily: "var(--font-display)" }} className="text-3xl md:text-4xl font-extrabold text-foreground mb-2">
            Kết quả học tập
          </h1>
          <p className="text-muted-foreground font-medium text-lg">
            Quản lý và theo dõi điểm số, bài thi của học sinh
          </p>
        </div>
        <button type="button" className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white font-bold rounded-xl border-2 border-border hover:bg-blue-600 transition-colors">
          <Download size={20} strokeWidth={2.5} />
          Xuất báo cáo
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên học sinh, bài thi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-card border-2 border-border rounded-xl font-medium focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {loading ? (
        <ResultsSkeleton />
      ) : filtered.length === 0 ? (
        <div className="p-16 rounded-xl border-2 border-border bg-muted text-center">
          <p className="text-xl font-bold text-foreground mb-2">
            {resultList.length === 0 ? "Chưa có kết quả nào" : "Không tìm thấy kết quả"}
          </p>
          <p className="text-muted-foreground font-medium">
            {resultList.length === 0
              ? "Học sinh chưa hoàn thành bài thi nào."
              : "Thử thay đổi từ khóa tìm kiếm."}
          </p>
        </div>
      ) : (
        <div className="bg-card border-2 border-border rounded-xl overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-border bg-muted/50">
                <th className="p-4 font-bold text-foreground">Học sinh</th>
                <th className="p-4 font-bold text-foreground">Bài thi</th>
                <th className="p-4 font-bold text-foreground text-center">Điểm số</th>
                <th className="p-4 font-bold text-foreground text-center">Thời gian</th>
                <th className="p-4 font-bold text-foreground text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((result) => {
                const score = result.score ?? 0;
                const passed = score >= 5;
                return (
                  <tr key={result.id} className="border-b-2 border-border last:border-b-0 hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-foreground text-lg">{result.user?.fullName ?? "Học sinh"}</div>
                      <div className="text-sm font-medium text-muted-foreground">{result.user?.email ?? ""}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-blue-100 text-blue-600 border-2 border-border hidden sm:flex">
                          <FileText size={18} strokeWidth={2.5} />
                        </div>
                        <div>
                          <div className="font-bold text-foreground">{result.quiz?.title ?? "Bài thi"}</div>
                          <div className="text-sm font-medium text-muted-foreground">
                            {formatDate(result.finishedAt ?? result.createdAt)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="font-extrabold text-xl" style={{ color: passed ? "#10B981" : "#EF4444" }}>
                        {score.toFixed(1)}
                      </span>
                      <span className="text-muted-foreground font-bold">/10</span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 font-medium text-foreground">
                        <Clock size={16} className="text-muted-foreground" />
                        {formatDuration(result.startedAt, result.finishedAt)}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      {passed ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 border-2 border-border rounded-full font-bold text-sm">
                          <CheckCircle size={16} strokeWidth={3} />
                          Đạt
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 border-2 border-border rounded-full font-bold text-sm">
                          <XCircle size={16} strokeWidth={3} />
                          Chưa đạt
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
            {loadingMore ? "Đang tải..." : "Tải thêm kết quả"}
          </button>
        </div>
      )}
    </div>
  );
}
