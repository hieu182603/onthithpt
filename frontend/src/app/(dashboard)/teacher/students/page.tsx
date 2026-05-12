"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, User as UserIcon, Users } from "lucide-react";
import { users } from "@/lib/api";
import type { User } from "@/lib/types/api";

function StudentsSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <article key={i} className="rounded-2xl border border-border bg-card p-4 animate-pulse">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="h-3 w-20 rounded bg-muted" />
              <div className="h-5 w-40 rounded bg-muted" />
              <div className="h-4 w-32 rounded bg-muted" />
            </div>
            <div className="h-5 w-20 rounded bg-muted" />
          </div>
        </article>
      ))}
    </>
  );
}

export default function TeacherStudentsPage() {
  const [query, setQuery] = useState("");
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let isMounted = true;
    users.getStudents({ limit: 100 }).then((res) => {
      if (!isMounted) return;
      setStudents(res.data);
      setTotal(res.meta.total);
      setLoading(false);
    }).catch(() => {
      if (isMounted) {
        setError(true);
        setLoading(false);
      }
    });
    return () => { isMounted = false; };
  }, []);

  const filtered = useMemo(
    () => students.filter((item) => item.fullName.toLowerCase().includes(query.toLowerCase())),
    [query, students]
  );

  return (
    <div className="space-y-5">
      <header className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="bg-linear-to-r from-primary/20 via-primary/5 to-transparent p-6">
          <div className="mb-3 flex items-center gap-2">
            <Users className="size-5 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">Quản lý học sinh</h2>
            {!loading && !error && (
              <span className="ml-2 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                {total}
              </span>
            )}
          </div>
          <p className="mb-4 text-sm text-muted-foreground">Theo dõi kết quả học tập và tiến độ theo từng lớp.</p>
          <label className="flex h-10 max-w-md items-center gap-2 rounded-lg border border-border bg-background px-3">
            <Search className="size-4 text-muted-foreground" />
            <input
              className="w-full bg-transparent text-foreground outline-none"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm tên học sinh..."
              value={query}
            />
          </label>
        </div>
      </header>

      <section className="space-y-3">
        {loading ? (
          <StudentsSkeleton />
        ) : error ? (
          <article className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            Không thể tải danh sách học sinh. Vui lòng thử lại sau.
          </article>
        ) : filtered.length === 0 ? (
          <article className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            {query ? "Không có học sinh phù hợp với từ khóa tìm kiếm." : "Chưa có học sinh nào trong hệ thống."}
          </article>
        ) : null}
        {!loading && !error && filtered.map((student) => (
          <article key={student.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">{student.id.slice(0, 8)}…</p>
                <h3 className="text-lg font-semibold">{student.fullName}</h3>
                <p className="text-sm text-muted-foreground">{student.email}</p>
              </div>
              <div className="text-right">
                <span className={`inline-flex items-center gap-1 text-sm font-semibold ${student.isActive ? "text-emerald-600" : "text-rose-600"}`}>
                  <UserIcon className="size-4" />
                  {student.isActive ? "Đang học" : "Đã khoá"}
                </span>
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
