"use client";

import { useCallback, useEffect, useState } from "react";
import { BookOpen, Loader2, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { subjects, topics } from "@/lib/api";
import type { Subject, Topic } from "@/lib/types/api";

type Tab = "subjects" | "topics";

type SubjectForm = { name: string; description: string; icon: string };
type TopicForm = { name: string; subjectId: string; description: string };

const emptySubjectForm = (): SubjectForm => ({ name: "", description: "", icon: "" });
const emptyTopicForm = (): TopicForm => ({ name: "", subjectId: "", description: "" });

function ContentSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <article key={i} className="rounded-xl border-2 border-border bg-card p-4 animate-pulse">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="h-3 w-16 rounded bg-muted" />
              <div className="h-5 w-40 rounded bg-muted" />
              <div className="h-4 w-56 rounded bg-muted" />
            </div>
            <div className="flex gap-2">
              <div className="h-8 w-12 rounded-lg bg-muted" />
              <div className="h-8 w-8 rounded-lg bg-muted" />
            </div>
          </div>
        </article>
      ))}
    </>
  );
}

export default function AdminContentPage() {
  const [tab, setTab] = useState<Tab>("subjects");
  const [subjectList, setSubjectList] = useState<Subject[]>([]);
  const [topicList, setTopicList] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: Tab; id: string; name: string } | null>(null);

  // Subject form modal
  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [editSubjectId, setEditSubjectId] = useState<string | null>(null);
  const [subjectForm, setSubjectForm] = useState<SubjectForm>(emptySubjectForm());

  // Topic form modal
  const [showTopicForm, setShowTopicForm] = useState(false);
  const [editTopicId, setEditTopicId] = useState<string | null>(null);
  const [topicForm, setTopicForm] = useState<TopicForm>(emptyTopicForm());

  const loadSubjects = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await subjects.getAll({ limit: 50 });
      setSubjectList(res.data);
    } catch {
      setError(true);
      toast.error("Không thể tải môn học.");
    } finally { setLoading(false); }
  }, []);

  const loadTopics = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await topics.getAll({ limit: 100 });
      setTopicList(res.data);
    } catch {
      setError(true);
      toast.error("Không thể tải chủ đề.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadSubjects(); }, [loadSubjects]);
  useEffect(() => { if (tab === "topics") loadTopics(); }, [tab, loadTopics]);

  const openSubjectEdit = (s: Subject) => {
    setEditSubjectId(s.id);
    setSubjectForm({ name: s.name, description: s.description ?? "", icon: s.icon ?? "" });
    setShowSubjectForm(true);
  };

  const handleSubjectSave = async () => {
    if (!subjectForm.name.trim()) { toast.error("Tên môn học không được để trống."); return; }
    setSaving(true);
    try {
      if (editSubjectId) {
        await subjects.update(editSubjectId, subjectForm);
        toast.success("Cập nhật môn học thành công.");
      } else {
        await subjects.create(subjectForm);
        toast.success("Tạo môn học thành công.");
      }
      setShowSubjectForm(false);
      setEditSubjectId(null);
      setSubjectForm(emptySubjectForm());
      loadSubjects();
    } catch { toast.error("Thao tác thất bại."); }
    finally { setSaving(false); }
  };

  const openTopicEdit = (t: Topic) => {
    setEditTopicId(t.id);
    setTopicForm({ name: t.name, subjectId: t.subjectId, description: t.description ?? "" });
    setShowTopicForm(true);
  };

  const handleTopicSave = async () => {
    if (!topicForm.name.trim() || !topicForm.subjectId) { toast.error("Vui lòng điền đủ thông tin."); return; }
    setSaving(true);
    try {
      if (editTopicId) {
        await topics.update(editTopicId, { name: topicForm.name, description: topicForm.description });
        toast.success("Cập nhật chủ đề thành công.");
      } else {
        await topics.create({ name: topicForm.name, subjectId: topicForm.subjectId, description: topicForm.description });
        toast.success("Tạo chủ đề thành công.");
      }
      setShowTopicForm(false);
      setEditTopicId(null);
      setTopicForm(emptyTopicForm());
      loadTopics();
    } catch { toast.error("Thao tác thất bại."); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setSaving(true);
    try {
      if (deleteConfirm.type === "subjects") {
        await subjects.delete(deleteConfirm.id);
        toast.success("Đã xóa môn học.");
        loadSubjects();
      } else {
        await topics.delete(deleteConfirm.id);
        toast.success("Đã xóa chủ đề.");
        loadTopics();
      }
      setDeleteConfirm(null);
    } catch { toast.error("Không thể xóa."); }
    finally { setSaving(false); }
  };

  const Modal = ({ title, onClose, onSave, children }: { title: string; onClose: () => void; onSave: () => void; children: React.ReactNode }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border-2 border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">{title}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted" type="button"><X size={18} /></button>
        </div>
        <div className="space-y-4">{children}</div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 rounded-lg border-2 border-border py-2 font-semibold hover:bg-muted" type="button">Hủy</button>
          <button onClick={onSave} disabled={saving} className="flex-1 rounded-lg border-2 border-foreground bg-foreground py-2 font-semibold text-background hover:opacity-90 disabled:opacity-60 inline-flex items-center justify-center gap-2" type="button">
            {saving && <Loader2 size={16} className="animate-spin" />} Lưu
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Subject form */}
      {showSubjectForm && (
        <Modal title={editSubjectId ? "Chỉnh sửa môn học" : "Tạo môn học"} onClose={() => { setShowSubjectForm(false); setEditSubjectId(null); setSubjectForm(emptySubjectForm()); }} onSave={handleSubjectSave}>
          <div>
            <label className="block text-sm font-semibold text-muted-foreground mb-1">Tên môn học *</label>
            <input value={subjectForm.name} onChange={e => setSubjectForm(f => ({ ...f, name: e.target.value }))} className="w-full rounded-lg border-2 border-border bg-background px-3 py-2 font-semibold focus:outline-none" placeholder="VD: Toán học" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-muted-foreground mb-1">Mô tả</label>
            <input value={subjectForm.description} onChange={e => setSubjectForm(f => ({ ...f, description: e.target.value }))} className="w-full rounded-lg border-2 border-border bg-background px-3 py-2 font-semibold focus:outline-none" placeholder="Mô tả ngắn" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-muted-foreground mb-1">Icon (emoji hoặc URL)</label>
            <input value={subjectForm.icon} onChange={e => setSubjectForm(f => ({ ...f, icon: e.target.value }))} className="w-full rounded-lg border-2 border-border bg-background px-3 py-2 font-semibold focus:outline-none" placeholder="📐" />
          </div>
        </Modal>
      )}

      {/* Topic form */}
      {showTopicForm && (
        <Modal title={editTopicId ? "Chỉnh sửa chủ đề" : "Tạo chủ đề"} onClose={() => { setShowTopicForm(false); setEditTopicId(null); setTopicForm(emptyTopicForm()); }} onSave={handleTopicSave}>
          <div>
            <label className="block text-sm font-semibold text-muted-foreground mb-1">Tên chủ đề *</label>
            <input value={topicForm.name} onChange={e => setTopicForm(f => ({ ...f, name: e.target.value }))} className="w-full rounded-lg border-2 border-border bg-background px-3 py-2 font-semibold focus:outline-none" placeholder="VD: Đạo hàm" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-muted-foreground mb-1">Môn học *</label>
            <select value={topicForm.subjectId} onChange={e => setTopicForm(f => ({ ...f, subjectId: e.target.value }))} disabled={!!editTopicId} className="w-full rounded-lg border-2 border-border bg-background px-3 py-2 font-semibold focus:outline-none">
              <option value="">-- Chọn môn học --</option>
              {subjectList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-muted-foreground mb-1">Mô tả</label>
            <input value={topicForm.description} onChange={e => setTopicForm(f => ({ ...f, description: e.target.value }))} className="w-full rounded-lg border-2 border-border bg-background px-3 py-2 font-semibold focus:outline-none" placeholder="Mô tả ngắn" />
          </div>
        </Modal>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl border-2 border-border bg-card p-6">
            <h3 className="text-lg font-bold mb-2">Xác nhận xóa</h3>
            <p className="text-sm text-muted-foreground mb-6">Bạn có chắc muốn xóa <strong>{deleteConfirm.name}</strong>? Hành động này không thể hoàn tác.</p>
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
            <h2 className="text-2xl font-bold text-foreground">Quản lý nội dung</h2>
          </div>
          <button
            onClick={() => { if (tab === "subjects") { setEditSubjectId(null); setSubjectForm(emptySubjectForm()); setShowSubjectForm(true); } else { setEditTopicId(null); setTopicForm(emptyTopicForm()); setShowTopicForm(true); } }}
            className="inline-flex items-center gap-2 rounded-lg border-2 border-foreground bg-foreground px-4 py-2 font-semibold text-background hover:opacity-90"
            type="button"
          >
            <Plus size={16} /> Tạo mới
          </button>
        </div>
        <div className="flex gap-4 border-b-2 border-border">
          {([["subjects", "Môn học"], ["topics", "Chủ đề"]] as const).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} type="button"
              className={`pb-2 font-bold text-sm transition-colors relative ${tab === id ? "text-foreground" : "text-muted-foreground"}`}>
              {label}
              {tab === id && <div className="absolute bottom-[-2px] left-0 right-0 h-0.5 bg-primary" />}
            </button>
          ))}
        </div>
      </header>

      {loading ? (
        <section className="space-y-3"><ContentSkeleton /></section>
      ) : error ? (
        <div className="rounded-xl border-2 border-border bg-card p-10 text-center">
          <p className="text-base font-semibold text-foreground mb-4">
            Không thể tải dữ liệu.
          </p>
          <button
            onClick={() => tab === "subjects" ? loadSubjects() : loadTopics()}
            className="inline-flex items-center gap-2 rounded-lg border-2 border-border px-4 py-2 font-semibold hover:bg-muted"
            type="button"
          >
            <RefreshCw size={16} /> Thử lại
          </button>
        </div>
      ) : tab === "subjects" ? (
        <section className="space-y-3">
          {subjectList.length === 0 && <p className="text-center py-10 text-muted-foreground">Chưa có môn học nào.</p>}
          {subjectList.map(s => (
            <article key={s.id} className="rounded-xl border-2 border-border bg-card p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">{s.slug}</p>
                  <h3 className="text-lg font-semibold">{s.icon && <span className="mr-1">{s.icon}</span>}{s.name}</h3>
                  {s.description && <p className="text-sm text-muted-foreground">{s.description}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openSubjectEdit(s)} className="rounded-lg border border-border px-3 py-1.5 text-sm font-semibold hover:bg-muted" type="button">Sửa</button>
                  <button onClick={() => setDeleteConfirm({ type: "subjects", id: s.id, name: s.name })} className="rounded-lg border border-rose-200 text-rose-600 p-1.5 hover:bg-rose-50" type="button"><Trash2 size={16} /></button>
                </div>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="space-y-3">
          {topicList.length === 0 && <p className="text-center py-10 text-muted-foreground">Chưa có chủ đề nào.</p>}
          {topicList.map(t => (
            <article key={t.id} className="rounded-xl border-2 border-border bg-card p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">{t.subject?.name ?? t.subjectId}</p>
                  <h3 className="text-lg font-semibold">{t.name}</h3>
                  {t.description && <p className="text-sm text-muted-foreground">{t.description}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openTopicEdit(t)} className="rounded-lg border border-border px-3 py-1.5 text-sm font-semibold hover:bg-muted" type="button">Sửa</button>
                  <button onClick={() => setDeleteConfirm({ type: "topics", id: t.id, name: t.name })} className="rounded-lg border border-rose-200 text-rose-600 p-1.5 hover:bg-rose-50" type="button"><Trash2 size={16} /></button>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
