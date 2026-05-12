"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw, Search, Shield, User, UserCheck, X } from "lucide-react";
import { toast } from "sonner";
import { users } from "@/lib/api";
import type { User as UserType, UserRole } from "@/lib/types/api";

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  teacher: "Giáo viên",
  student: "Học sinh",
};

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-rose-100 text-rose-700 border-rose-200",
  teacher: "bg-blue-100 text-blue-700 border-blue-200",
  student: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

type EditState = { id: string; role: UserRole; isActive: boolean } | null;

function UsersSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <article key={i} className="rounded-xl border-2 border-border bg-card p-4 animate-pulse">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="h-3 w-16 rounded bg-muted" />
              <div className="h-5 w-44 rounded bg-muted" />
              <div className="h-4 w-56 rounded bg-muted" />
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="h-5 w-20 rounded bg-muted" />
              <div className="h-4 w-16 rounded bg-muted" />
            </div>
          </div>
        </article>
      ))}
    </>
  );
}

export default function AdminUsersPage() {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "">("");
  const [userList, setUserList] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [saving, setSaving] = useState(false);
  const [edit, setEdit] = useState<EditState>(null);

  const limit = 20;

  const load = useCallback(async (p: number, q: string, role: UserRole | "") => {
    setLoading(true);
    setError(false);
    try {
      const res = await users.getAll({
        page: p,
        limit,
        search: q || undefined,
        role: role || undefined,
      });
      setUserList(res.data);
      setTotal(res.meta.total);
    } catch {
      setError(true);
      toast.error("Không thể tải danh sách người dùng.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce search + role filter — always reset to page 1
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      load(1, query, roleFilter);
    }, 300);
    return () => clearTimeout(t);
  }, [query, roleFilter, load]);

  const goToPage = (p: number) => {
    setPage(p);
    load(p, query, roleFilter);
  };

  const handleSave = async () => {
    if (!edit) return;
    setSaving(true);
    try {
      await users.update(edit.id, { role: edit.role, isActive: edit.isActive });
      toast.success("Cập nhật người dùng thành công.");
      setEdit(null);
      load(page, query, roleFilter);
    } catch {
      toast.error("Không thể cập nhật người dùng.");
    } finally {
      setSaving(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-5">
      {/* ── Edit modal ───────────────────────────────── */}
      {edit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border-2 border-border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Chỉnh sửa người dùng</h3>
              <button onClick={() => setEdit(null)} className="p-1 rounded hover:bg-muted" type="button">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-muted-foreground mb-1">Vai trò</label>
                <select
                  value={edit.role}
                  onChange={(e) => setEdit({ ...edit, role: e.target.value as UserRole })}
                  className="w-full rounded-lg border-2 border-border bg-background px-3 py-2 font-semibold focus:outline-none"
                >
                  <option value="student">Học sinh</option>
                  <option value="teacher">Giáo viên</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={edit.isActive}
                  onChange={(e) => setEdit({ ...edit, isActive: e.target.checked })}
                  className="size-4 rounded"
                />
                <label htmlFor="isActive" className="text-sm font-semibold">
                  Tài khoản đang hoạt động
                </label>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEdit(null)}
                className="flex-1 rounded-lg border-2 border-border bg-background py-2 font-semibold hover:bg-muted"
                type="button"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 rounded-lg border-2 border-foreground bg-foreground py-2 font-semibold text-background hover:opacity-90 disabled:opacity-60 inline-flex items-center justify-center gap-2"
                type="button"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header / filters ─────────────────────────── */}
      <header className="rounded-xl border-2 border-border bg-card p-6">
        <h2 className="text-2xl font-bold text-foreground mb-1">Quản lý người dùng</h2>
        <p className="text-sm text-muted-foreground mb-4">
          {loading ? "Đang tải…" : `Tổng cộng: ${total} người dùng`}
        </p>
        <div className="flex flex-wrap gap-3">
          <label className="flex flex-1 min-w-48 items-center gap-2 rounded-lg border-2 border-border px-3">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              className="h-10 w-full bg-transparent text-foreground outline-none"
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm tên hoặc email…"
              value={query}
            />
          </label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as UserRole | "")}
            className="rounded-lg border-2 border-border bg-background px-3 py-2 font-semibold focus:outline-none"
          >
            <option value="">Tất cả vai trò</option>
            <option value="student">Học sinh</option>
            <option value="teacher">Giáo viên</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </header>

      {/* ── Content ──────────────────────────────────── */}
      {loading ? (
        <section className="space-y-3">
          <UsersSkeleton />
        </section>
      ) : error ? (
        <div className="rounded-xl border-2 border-border bg-card p-10 text-center">
          <p className="text-base font-semibold text-foreground mb-4">
            Không thể tải danh sách người dùng.
          </p>
          <button
            onClick={() => load(page, query, roleFilter)}
            className="inline-flex items-center gap-2 rounded-lg border-2 border-border px-4 py-2 font-semibold hover:bg-muted"
            type="button"
          >
            <RefreshCw size={16} />
            Thử lại
          </button>
        </div>
      ) : (
        <section className="space-y-3">
          {userList.length === 0 ? (
            <p className="text-center py-10 text-muted-foreground font-medium">
              {query || roleFilter
                ? "Không tìm thấy người dùng phù hợp với bộ lọc."
                : "Chưa có người dùng nào trong hệ thống."}
            </p>
          ) : (
            userList.map((item) => (
              <article
                key={item.id}
                className="rounded-xl border-2 border-border bg-card p-4 hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => setEdit({ id: item.id, role: item.role, isActive: item.isActive })}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase text-muted-foreground">
                      {item.id.slice(0, 8)}…
                    </p>
                    <h3 className="text-lg font-semibold">{item.fullName}</h3>
                    <p className="text-sm text-muted-foreground">{item.email}</p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-bold ${
                        ROLE_COLORS[item.role] ?? "bg-muted text-foreground"
                      }`}
                    >
                      {item.role === "admin" ? (
                        <Shield className="size-3" />
                      ) : (
                        <User className="size-3" />
                      )}
                      {ROLE_LABELS[item.role] ?? item.role}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-semibold ${
                        item.isActive ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      <UserCheck className="size-3" />
                      {item.isActive ? "Hoạt động" : "Bị khóa"}
                    </span>
                  </div>
                </div>
              </article>
            ))
          )}
        </section>
      )}

      {/* ── Pagination ───────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1 || loading}
            className="rounded border border-border px-3 py-1.5 text-sm font-semibold disabled:opacity-40"
            type="button"
          >
            Trước
          </button>
          <span className="text-sm font-semibold text-muted-foreground">
            Trang {page}/{totalPages}
          </span>
          <button
            onClick={() => goToPage(page + 1)}
            disabled={page >= totalPages || loading}
            className="rounded border border-border px-3 py-1.5 text-sm font-semibold disabled:opacity-40"
            type="button"
          >
            Sau
          </button>
        </div>
      )}
    </div>
  );
}
