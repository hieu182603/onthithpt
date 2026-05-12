"use client";

import { useCallback, useEffect, useState } from "react";
import { BookOpen, Loader2, Plus, Sparkles, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { quizzes, subjects } from "@/lib/api";
import type { Difficulty, Quiz, QuizType, Subject } from "@/lib/types/api";

const QUIZ_TYPE_LABELS: Record<QuizType, string> = {
  practice: "Đề luyện",
  exam: "Đề thi",
  smart_review: "Smart Review",
};

const QUIZ_TYPE_COLORS: Record<QuizType, string> = {
  practice: "bg-cyan-100 text-cyan-700",
  exam: "bg-purple-100 text-purple-700",
  smart_review: "bg-blue-100 text-blue-700",
};

type GenerateForm = {
  title: string;
  subjectId: string;
  type: QuizType;
  totalQuestions: string;
  timeLimit: string;
  difficulty: string;
};

type EditForm = { title: string; description: string; timeLimit: string };

const emptyGenerate = (): GenerateForm => ({
  title: "",
  subjectId: "",
  type: "practice",
  totalQuestions: "30",
  timeLimit: "45",
  difficulty: "",
});

export default function TeacherExamsPage() {
  const [quizList, setQuizList] = useState<Quiz[]>([]);
  const [subjectList, setSubjectList] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; title: string } | null>(null);

  const [showGenerate, setShowGenerate] = useState(false);
  const [genForm, setGenForm] = useState<GenerateForm>(emptyGenerate());

  const [editQuiz, setEditQuiz] = useState<(EditForm & { id: string }) | null>(null);

  const limit = 20;

  const load = useCallback(async (p: number, q: string) => {
    setLoading(true);
    try {
      const res = await quizzes.getAll({ page: p, limit, search: q || undefined });
      setQuizList(res.data);
      setTotal(res.meta.total);
    } catch { toast.error("Không thể tải danh sách đề thi."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    subjects.getActive().then(setSubjectList).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { load(1, query); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [query, load]);

  const handleGenerate = async () => {
    if (!genForm.title.trim()) { toast.error("Tiêu đề không được để trống."); return; }
    if (!genForm.subjectId) { toast.error("Vui lòng chọn môn học."); return; }
    const n = parseInt(genForm.totalQuestions);
    if (!n || n < 1) { toast.error("Số câu hỏi không hợp lệ."); return; }
    setSaving(true);
    try {
      await quizzes.generate({
        title: genForm.title,
        subjectId: genForm.subjectId,
        type: genForm.type,
        totalQuestions: n,
        timeLimit: genForm.timeLimit ? parseInt(genForm.timeLimit) : undefined,
        difficulty: genForm.difficulty ? (genForm.difficulty as Difficulty) : undefined,
      });
      toast.success("Tạo đề thi thành công.");
      setShowGenerate(false);
      setGenForm(emptyGenerate());
      load(1, query);
    } catch { toast.error("Không thể tạo đề thi."); }
    finally { setSaving(false); }
  };

  const handleEdit = async () => {
    if (!editQuiz) return;
    setSaving(true);
    try {
      await quizzes.update(editQuiz.id, {
        title: editQuiz.title,
        description: editQuiz.description || undefined,
        timeLimit: editQuiz.timeLimit ? parseInt(editQuiz.timeLimit) : undefined,
      });
      toast.success("Cập nhật đề thi thành công.");
      setEditQuiz(null);
      load(page, query);
    } catch { toast.error("Thao tác thất bại."); }
    finally { setSaving(false); }
  };

  const togglePublished = async (quiz: Quiz) => {
    try {
      await quizzes.update(quiz.id, { isPublished: !quiz.isPublished });
      toast.success(quiz.isPublished ? "Đã hủy đăng đề thi." : "Đã đăng đề thi.");
      load(page, query);
    } catch { toast.error("Không thể cập nhật trạng thái."); }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setSaving(true);
    try {
      await quizzes.delete(deleteConfirm.id);
      toast.success("Đã xóa đề thi.");
      setDeleteConfirm(null);
      load(page, query);
    } catch { toast.error("Không thể xóa."); }
    finally { setSaving(false); }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-12">
      {/* Generate modal */}
      {showGenerate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border-2 border-border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2"><Sparkles size={18} className="text-primary" /> Tạo đề thi tự động</h3>
              <button onClick={() => setShowGenerate(false)} className="p-1 rounded hover:bg-muted" type="button"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-muted-foreground mb-1">Tiêu đề đề thi *</label>
                <input value={genForm.title} onChange={e => setGenForm(f => ({ ...f, title: e.target.value }))} className="w-full rounded-lg border-2 border-border bg-background px-3 py-2 font-semibold focus:outline-none" placeholder="VD: Đề luyện tập tuần 5" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-muted-foreground mb-1">Môn học *</label>
                <select value={genForm.subjectId} onChange={e => setGenForm(f => ({ ...f, subjectId: e.target.value }))} className="w-full rounded-lg border-2 border-border bg-background px-3 py-2 font-semibold focus:outline-none">
                  <option value="">-- Chọn môn học --</option>
                  {subjectList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-muted-foreground mb-1">Loại đề</label>
                  <select value={genForm.type} onChange={e => setGenForm(f => ({ ...f, type: e.target.value as QuizType }))} className="w-full rounded-lg border-2 border-border bg-background px-3 py-2 font-semibold focus:outline-none">
                    <option value="practice">Đề luyện</option>
                    <option value="exam">Đề thi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-muted-foreground mb-1">Độ khó</label>
                  <select value={genForm.difficulty} onChange={e => setGenForm(f => ({ ...f, difficulty: e.target.value }))} className="w-full rounded-lg border-2 border-border bg-background px-3 py-2 font-semibold focus:outline-none">
                    <option value="">Hỗn hợp</option>
                    <option value="easy">Dễ</option>
                    <option value="medium">Trung bình</option>
                    <option value="hard">Khó</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-muted-foreground mb-1">Số câu hỏi *</label>
                  <input type="number" min="1" max="200" value={genForm.totalQuestions} onChange={e => setGenForm(f => ({ ...f, totalQuestions: e.target.value }))} className="w-full rounded-lg border-2 border-border bg-background px-3 py-2 font-semibold focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-muted-foreground mb-1">Thời gian (phút)</label>
                  <input type="number" min="1" value={genForm.timeLimit} onChange={e => setGenForm(f => ({ ...f, timeLimit: e.target.value }))} className="w-full rounded-lg border-2 border-border bg-background px-3 py-2 font-semibold focus:outline-none" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowGenerate(false)} className="flex-1 rounded-lg border-2 border-border py-2 font-semibold hover:bg-muted" type="button">Hủy</button>
              <button onClick={handleGenerate} disabled={saving} className="flex-1 rounded-lg border-2 border-foreground bg-foreground py-2 font-semibold text-background hover:opacity-90 disabled:opacity-60 inline-flex items-center justify-center gap-2" type="button">
                {saving && <Loader2 size={16} className="animate-spin" />} Tạo đề
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border-2 border-border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Chỉnh sửa đề thi</h3>
              <button onClick={() => setEditQuiz(null)} className="p-1 rounded hover:bg-muted" type="button"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-muted-foreground mb-1">Tiêu đề</label>
                <input value={editQuiz.title} onChange={e => setEditQuiz(f => f ? { ...f, title: e.target.value } : f)} className="w-full rounded-lg border-2 border-border bg-background px-3 py-2 font-semibold focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-muted-foreground mb-1">Mô tả</label>
                <input value={editQuiz.description} onChange={e => setEditQuiz(f => f ? { ...f, description: e.target.value } : f)} className="w-full rounded-lg border-2 border-border bg-background px-3 py-2 font-semibold focus:outline-none" placeholder="Mô tả ngắn (tuỳ chọn)" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-muted-foreground mb-1">Thời gian (phút)</label>
                <input type="number" min="1" value={editQuiz.timeLimit} onChange={e => setEditQuiz(f => f ? { ...f, timeLimit: e.target.value } : f)} className="w-full rounded-lg border-2 border-border bg-background px-3 py-2 font-semibold focus:outline-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditQuiz(null)} className="flex-1 rounded-lg border-2 border-border py-2 font-semibold hover:bg-muted" type="button">Hủy</button>
              <button onClick={handleEdit} disabled={saving} className="flex-1 rounded-lg border-2 border-foreground bg-foreground py-2 font-semibold text-background hover:opacity-90 disabled:opacity-60 inline-flex items-center justify-center gap-2" type="button">
                {saving && <Loader2 size={16} className="animate-spin" />} Lưu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl border-2 border-border bg-card p-6">
            <h3 className="text-lg font-bold mb-2">Xác nhận xóa</h3>
            <p className="text-sm text-muted-foreground mb-6">Bạn có chắc muốn xóa đề thi <strong>{deleteConfirm.title}</strong>? Hành động này không thể hoàn tác.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 rounded-lg border-2 border-border py-2 font-semibold hover:bg-muted" type="button">Hủy</button>
              <button onClick={handleDelete} disabled={saving} className="flex-1 rounded-lg border-2 border-rose-600 bg-rose-600 py-2 font-semibold text-white hover:bg-rose-700 disabled:opacity-60" type="button">Xóa</button>
            </div>
          </div>
        </div>
      )}

      <header className="rounded-xl border-2 border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="size-5 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">Quản lý Đề thi</h2>
            <span className="text-sm text-muted-foreground font-medium">({total} đề)</span>
          </div>
          <button onClick={() => setShowGenerate(true)} className="inline-flex items-center gap-2 rounded-lg border-2 border-foreground bg-foreground px-4 py-2 font-semibold text-background hover:opacity-90" type="button">
            <Plus size={16} /> Tạo đề mới
          </button>
        </div>
        <label className="flex items-center gap-2 rounded-lg border-2 border-border px-3">
          <svg className="size-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input className="h-10 w-full bg-transparent text-foreground outline-none" onChange={e => setQuery(e.target.value)} placeholder="Tìm tiêu đề đề thi..." value={query} />
        </label>
      </header>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-muted-foreground" size={32} /></div>
      ) : (
        <section className="space-y-3">
          {quizList.length === 0 && <p className="text-center py-10 text-muted-foreground">Chưa có đề thi nào.</p>}
          {quizList.map(q => (
            <article key={q.id} className="rounded-xl border-2 border-border bg-card p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${QUIZ_TYPE_COLORS[q.type]}`}>
                      {QUIZ_TYPE_LABELS[q.type]}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-bold ${q.isPublished ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-amber-100 text-amber-700 border-amber-200"}`}>
                      {q.isPublished ? "Đã đăng" : "Bản nháp"}
                    </span>
                    {q.subject && <span className="text-xs text-muted-foreground">• {q.subject.name}</span>}
                  </div>
                  <h3 className="text-base font-semibold truncate">{q.title}</h3>
                  <p className="text-sm text-muted-foreground">{q.totalQuestions} câu{q.timeLimit ? ` • ${q.timeLimit} phút` : ""}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => togglePublished(q)}
                    className={`rounded-lg border px-3 py-1.5 text-sm font-semibold ${q.isPublished ? "border-amber-200 text-amber-700 hover:bg-amber-50" : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"}`}
                    type="button"
                  >
                    {q.isPublished ? "Hủy đăng" : "Đăng"}
                  </button>
                  <button
                    onClick={() => setEditQuiz({ id: q.id, title: q.title, description: q.description ?? "", timeLimit: String(q.timeLimit ?? "") })}
                    className="rounded-lg border border-border px-3 py-1.5 text-sm font-semibold hover:bg-muted"
                    type="button"
                  >Sửa</button>
                  <button onClick={() => setDeleteConfirm({ id: q.id, title: q.title })} className="rounded-lg border border-rose-200 text-rose-600 p-1.5 hover:bg-rose-50" type="button"><Trash2 size={16} /></button>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button onClick={() => { const p = page - 1; setPage(p); load(p, query); }} disabled={page <= 1} className="rounded border border-border px-3 py-1.5 text-sm font-semibold disabled:opacity-40" type="button">Trước</button>
          <span className="text-sm font-semibold text-muted-foreground">Trang {page}/{totalPages}</span>
          <button onClick={() => { const p = page + 1; setPage(p); load(p, query); }} disabled={page >= totalPages} className="rounded border border-border px-3 py-1.5 text-sm font-semibold disabled:opacity-40" type="button">Sau</button>
        </div>
      )}
    </div>
  );
}
