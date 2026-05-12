"use client";

import { useCallback, useEffect, useState } from "react";
import { FileText, Loader2, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { questions, subjects, topics } from "@/lib/api";
import type { Difficulty, Question, QuestionType, Subject, Topic } from "@/lib/types/api";
import { MathText } from "@/components/ui/MathText";

type OptionForm = { id?: string; content: string; isCorrect: boolean };
type QuestionForm = {
  subjectId: string;
  topicId: string;
  content: string;
  explanation: string;
  difficulty: Difficulty;
  type: QuestionType;
  options: OptionForm[];
};

const emptyForm = (): QuestionForm => ({
  subjectId: "",
  topicId: "",
  content: "",
  explanation: "",
  difficulty: "medium",
  type: "single_choice",
  options: [
    { content: "", isCorrect: false },
    { content: "", isCorrect: false },
    { content: "", isCorrect: false },
    { content: "", isCorrect: false },
  ],
});

const DIFFICULTY_LABELS: Record<Difficulty, string> = { easy: "Dễ", medium: "Trung bình", hard: "Khó" };
const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  easy: "bg-emerald-100 text-emerald-700 border-emerald-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  hard: "bg-rose-100 text-rose-700 border-rose-200",
};
const OPTION_LABELS = ["A", "B", "C", "D"];

function QuestionsSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <article key={i} className="rounded-xl border-2 border-border bg-card p-4 animate-pulse">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex gap-2">
                <div className="h-5 w-16 rounded bg-muted" />
                <div className="h-5 w-20 rounded bg-muted" />
              </div>
              <div className="h-5 w-3/4 rounded bg-muted" />
              <div className="grid grid-cols-2 gap-1 mt-2">
                <div className="h-3 w-full rounded bg-muted" />
                <div className="h-3 w-full rounded bg-muted" />
                <div className="h-3 w-full rounded bg-muted" />
                <div className="h-3 w-full rounded bg-muted" />
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <div className="h-8 w-12 rounded-lg bg-muted" />
              <div className="h-8 w-8 rounded-lg bg-muted" />
            </div>
          </div>
        </article>
      ))}
    </>
  );
}

export default function AdminQuestionsPage() {
  const [questionList, setQuestionList] = useState<Question[]>([]);
  const [subjectList, setSubjectList] = useState<Subject[]>([]);
  const [filterSubjectId, setFilterSubjectId] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string } | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<QuestionForm>(emptyForm());
  const [formTopics, setFormTopics] = useState<Topic[]>([]);

  const limit = 20;

  const load = useCallback(async (p: number) => {
    setLoading(true);
    setError(false);
    try {
      const res = await questions.getAll({
        page: p,
        limit,
        subjectId: filterSubjectId || undefined,
        difficulty: filterDifficulty ? (filterDifficulty as Difficulty) : undefined,
      });
      setQuestionList(res.data);
      setTotal(res.meta.total);
    } catch {
      setError(true);
      toast.error("Không thể tải câu hỏi.");
    } finally { setLoading(false); }
  }, [filterSubjectId, filterDifficulty]);

  useEffect(() => {
    subjects.getActive().then(setSubjectList).catch(() => {});
  }, []);

  useEffect(() => { load(1); setPage(1); }, [load]);

  const loadFormTopics = async (subjectId: string) => {
    if (!subjectId) { setFormTopics([]); return; }
    try {
      const res = await topics.getAll({ subjectId, limit: 100 });
      setFormTopics(res.data);
    } catch { setFormTopics([]); }
  };

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm());
    setFormTopics([]);
    setShowForm(true);
  };

  const openEdit = (q: Question) => {
    setEditId(q.id);
    const opts = q.options ?? [];
    const padded: OptionForm[] = opts.map(o => ({ id: o.id, content: o.content, isCorrect: o.isCorrect }));
    while (padded.length < 4) padded.push({ content: "", isCorrect: false });
    const subjectId = q.topic?.subjectId ?? "";
    setForm({
      subjectId,
      topicId: q.topicId,
      content: q.content,
      explanation: q.explanation ?? "",
      difficulty: q.difficulty,
      type: q.type,
      options: padded.slice(0, 4),
    });
    if (subjectId) loadFormTopics(subjectId);
    setShowForm(true);
  };

  const setOption = (idx: number, field: keyof OptionForm, value: string | boolean) => {
    setForm(f => {
      const opts = f.options.map((o, i) => {
        if (field === "isCorrect" && f.type === "single_choice") {
          return { ...o, isCorrect: i === idx };
        }
        if (i === idx) return { ...o, [field]: value };
        return o;
      });
      return { ...f, options: opts };
    });
  };

  const handleSave = async () => {
    if (!form.content.trim()) { toast.error("Nội dung câu hỏi không được để trống."); return; }
    if (!form.topicId) { toast.error("Vui lòng chọn chủ đề."); return; }
    if (form.options.some(o => !o.content.trim())) { toast.error("Vui lòng điền đủ nội dung 4 đáp án."); return; }
    if (!form.options.some(o => o.isCorrect)) { toast.error("Vui lòng chọn ít nhất 1 đáp án đúng."); return; }
    setSaving(true);
    try {
      const payload = {
        topicId: form.topicId,
        content: form.content,
        explanation: form.explanation || undefined,
        difficulty: form.difficulty,
        type: form.type,
        options: form.options.map((o, i) => ({ id: o.id, content: o.content, isCorrect: o.isCorrect, order: i + 1 })),
      };
      if (editId) {
        await questions.update(editId, payload);
        toast.success("Cập nhật câu hỏi thành công.");
      } else {
        await questions.create(payload);
        toast.success("Tạo câu hỏi thành công.");
      }
      setShowForm(false);
      load(page);
    } catch { toast.error("Thao tác thất bại."); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setSaving(true);
    try {
      await questions.delete(deleteConfirm.id);
      toast.success("Đã xóa câu hỏi.");
      setDeleteConfirm(null);
      load(page);
    } catch { toast.error("Không thể xóa."); }
    finally { setSaving(false); }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-5">
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-xl border-2 border-border bg-card p-6 my-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{editId ? "Chỉnh sửa câu hỏi" : "Tạo câu hỏi mới"}</h3>
              <button onClick={() => setShowForm(false)} className="p-1 rounded hover:bg-muted" type="button"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-muted-foreground mb-1">Môn học</label>
                  <select
                    value={form.subjectId}
                    onChange={e => { setForm(f => ({ ...f, subjectId: e.target.value, topicId: "" })); loadFormTopics(e.target.value); }}
                    className="w-full rounded-lg border-2 border-border bg-background px-3 py-2 font-semibold focus:outline-none"
                  >
                    <option value="">-- Chọn môn --</option>
                    {subjectList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-muted-foreground mb-1">Chủ đề *</label>
                  <select
                    value={form.topicId}
                    onChange={e => setForm(f => ({ ...f, topicId: e.target.value }))}
                    className="w-full rounded-lg border-2 border-border bg-background px-3 py-2 font-semibold focus:outline-none"
                  >
                    <option value="">-- Chọn chủ đề --</option>
                    {formTopics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-muted-foreground mb-1">Độ khó</label>
                  <select
                    value={form.difficulty}
                    onChange={e => setForm(f => ({ ...f, difficulty: e.target.value as Difficulty }))}
                    className="w-full rounded-lg border-2 border-border bg-background px-3 py-2 font-semibold focus:outline-none"
                  >
                    <option value="easy">Dễ</option>
                    <option value="medium">Trung bình</option>
                    <option value="hard">Khó</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-muted-foreground mb-1">Loại câu hỏi</label>
                  <select
                    value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value as QuestionType, options: f.options.map(o => ({ ...o, isCorrect: false })) }))}
                    className="w-full rounded-lg border-2 border-border bg-background px-3 py-2 font-semibold focus:outline-none"
                  >
                    <option value="single_choice">Một đáp án</option>
                    <option value="multiple_choice">Nhiều đáp án</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-muted-foreground mb-1">Nội dung câu hỏi *</label>
                <textarea
                  value={form.content}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  rows={3}
                  className="w-full rounded-lg border-2 border-border bg-background px-3 py-2 font-semibold focus:outline-none resize-none"
                  placeholder="Nhập nội dung câu hỏi..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-muted-foreground mb-2">
                  Đáp án ({form.type === "single_choice" ? "chọn 1 đáp án đúng" : "chọn nhiều đáp án đúng"})
                </label>
                <div className="space-y-2">
                  {form.options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      {form.type === "single_choice" ? (
                        <input type="radio" name="correct" checked={opt.isCorrect} onChange={() => setOption(idx, "isCorrect", true)} className="size-4 shrink-0" />
                      ) : (
                        <input type="checkbox" checked={opt.isCorrect} onChange={e => setOption(idx, "isCorrect", e.target.checked)} className="size-4 shrink-0" />
                      )}
                      <span className="font-bold text-sm w-5 shrink-0">{OPTION_LABELS[idx]}.</span>
                      <input
                        value={opt.content}
                        onChange={e => setOption(idx, "content", e.target.value)}
                        className="flex-1 rounded-lg border-2 border-border bg-background px-3 py-1.5 font-semibold focus:outline-none"
                        placeholder={`Đáp án ${OPTION_LABELS[idx]}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-muted-foreground mb-1">Lời giải (tuỳ chọn)</label>
                <textarea
                  value={form.explanation}
                  onChange={e => setForm(f => ({ ...f, explanation: e.target.value }))}
                  rows={2}
                  className="w-full rounded-lg border-2 border-border bg-background px-3 py-2 font-semibold focus:outline-none resize-none"
                  placeholder="Giải thích đáp án..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="flex-1 rounded-lg border-2 border-border py-2 font-semibold hover:bg-muted" type="button">Hủy</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 rounded-lg border-2 border-foreground bg-foreground py-2 font-semibold text-background hover:opacity-90 disabled:opacity-60 inline-flex items-center justify-center gap-2" type="button">
                {saving && <Loader2 size={16} className="animate-spin" />} Lưu
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl border-2 border-border bg-card p-6">
            <h3 className="text-lg font-bold mb-2">Xác nhận xóa</h3>
            <p className="text-sm text-muted-foreground mb-6">Bạn có chắc muốn xóa câu hỏi này? Hành động này không thể hoàn tác.</p>
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
            <FileText className="size-5 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">Ngân hàng câu hỏi</h2>
            <span className="text-sm text-muted-foreground font-medium">({total} câu)</span>
          </div>
          <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg border-2 border-foreground bg-foreground px-4 py-2 font-semibold text-background hover:opacity-90" type="button">
            <Plus size={16} /> Tạo câu hỏi
          </button>
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            value={filterSubjectId}
            onChange={e => setFilterSubjectId(e.target.value)}
            className="rounded-lg border-2 border-border bg-background px-3 py-2 font-semibold focus:outline-none"
          >
            <option value="">Tất cả môn học</option>
            {subjectList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select
            value={filterDifficulty}
            onChange={e => setFilterDifficulty(e.target.value)}
            className="rounded-lg border-2 border-border bg-background px-3 py-2 font-semibold focus:outline-none"
          >
            <option value="">Tất cả độ khó</option>
            <option value="easy">Dễ</option>
            <option value="medium">Trung bình</option>
            <option value="hard">Khó</option>
          </select>
        </div>
      </header>

      {loading ? (
        <section className="space-y-3"><QuestionsSkeleton /></section>
      ) : error ? (
        <div className="rounded-xl border-2 border-border bg-card p-10 text-center">
          <p className="text-base font-semibold text-foreground mb-4">Không thể tải câu hỏi.</p>
          <button
            onClick={() => load(page)}
            className="inline-flex items-center gap-2 rounded-lg border-2 border-border px-4 py-2 font-semibold hover:bg-muted"
            type="button"
          >
            <RefreshCw size={16} /> Thử lại
          </button>
        </div>
      ) : (
        <section className="space-y-3">
          {questionList.length === 0 && (
            <p className="text-center py-10 text-muted-foreground font-medium">
              {filterSubjectId || filterDifficulty ? "Không tìm thấy câu hỏi phù hợp với bộ lọc." : "Chưa có câu hỏi nào."}
            </p>
          )}
          {questionList.map(q => (
            <article key={q.id} className="rounded-xl border-2 border-border bg-card p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-bold ${DIFFICULTY_COLORS[q.difficulty]}`}>
                      {DIFFICULTY_LABELS[q.difficulty]}
                    </span>
                    <span className="text-xs text-muted-foreground">{q.type === "single_choice" ? "Một đáp án" : "Nhiều đáp án"}</span>
                    {q.topic && <span className="text-xs text-muted-foreground">• {q.topic.name}</span>}
                  </div>
                  <MathText content={q.content} className="font-semibold line-clamp-2" />
                  {q.options && q.options.length > 0 && (
                    <div className="mt-2 grid grid-cols-2 gap-1">
                      {q.options.slice(0, 4).map((o, idx) => (
                        <p key={o.id} className={`text-xs truncate ${o.isCorrect ? "text-emerald-600 font-bold" : "text-muted-foreground"}`}>
                          {OPTION_LABELS[idx]}. <MathText content={o.content} />
                        </p>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => openEdit(q)} className="rounded-lg border border-border px-3 py-1.5 text-sm font-semibold hover:bg-muted" type="button">Sửa</button>
                  <button onClick={() => setDeleteConfirm({ id: q.id })} className="rounded-lg border border-rose-200 text-rose-600 p-1.5 hover:bg-rose-50" type="button"><Trash2 size={16} /></button>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button onClick={() => { const p = page - 1; setPage(p); load(p); }} disabled={page <= 1} className="rounded border border-border px-3 py-1.5 text-sm font-semibold disabled:opacity-40" type="button">Trước</button>
          <span className="text-sm font-semibold text-muted-foreground">Trang {page}/{totalPages}</span>
          <button onClick={() => { const p = page + 1; setPage(p); load(p); }} disabled={page >= totalPages} className="rounded border border-border px-3 py-1.5 text-sm font-semibold disabled:opacity-40" type="button">Sau</button>
        </div>
      )}
    </div>
  );
}
