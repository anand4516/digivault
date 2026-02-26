import React, { useState, useMemo } from "react";
import { useTodos } from "@/hooks/useTodos";
import { Todo, PRIORITY_CONFIG, STATUS_CONFIG } from "@/types/todo";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  CheckSquare, Plus, Search, Calendar, Flag, Edit3, Trash2, ChevronDown, ChevronRight,
  StickyNote, ListTodo, X, Play, RotateCcw, CheckCircle2, Circle,
} from "lucide-react";
import { toast } from "sonner";

type ViewMode = "tasks" | "notes";

const STATUS_BUTTONS = [
  { key: "todo" as const, label: "To Do", icon: Circle, activeClass: "bg-muted text-foreground border-border" },
  { key: "in_progress" as const, label: "In Progress", icon: Play, activeClass: "bg-primary/15 text-primary border-primary/30" },
  { key: "done" as const, label: "Done", icon: CheckCircle2, activeClass: "bg-cv-teal/15 text-cv-teal border-cv-teal/30" },
];

const TodoPage: React.FC = () => {
  const { todos, loading, addTodo, updateTodo, deleteTodo } = useTodos();
  const [viewMode, setViewMode] = useState<ViewMode>("tasks");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Todo["priority"]>("medium");
  const [status, setStatus] = useState<Todo["status"]>("todo");
  const [dueDate, setDueDate] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | Todo["status"]>("all");
  const [filterPriority, setFilterPriority] = useState<"all" | Todo["priority"]>("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({ todo: true, in_progress: true, done: false });

  const isNote = (t: Todo) => t.tags?.includes("note");

  const allItems = useMemo(() => {
    return viewMode === "notes" ? todos.filter((t) => isNote(t)) : todos.filter((t) => !isNote(t));
  }, [todos, viewMode]);

  const filtered = useMemo(() => {
    let result = allItems;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((t) => t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q) || t.tags?.some((tg) => tg.toLowerCase().includes(q)));
    }
    if (viewMode === "tasks") {
      if (filterStatus !== "all") result = result.filter((t) => t.status === filterStatus);
      if (filterPriority !== "all") result = result.filter((t) => t.priority === filterPriority);
    }
    return result;
  }, [allItems, search, filterStatus, filterPriority, viewMode]);

  const grouped = useMemo(() => {
    const groups: Record<string, typeof filtered> = { todo: [], in_progress: [], done: [] };
    filtered.forEach((t) => { if (groups[t.status]) groups[t.status].push(t); });
    return groups;
  }, [filtered]);

  const resetForm = () => {
    setTitle(""); setDescription(""); setPriority("medium"); setStatus("todo"); setDueDate(""); setTags([]); setEditingId(null);
  };

  const openEdit = (todo: Todo) => {
    setTitle(todo.title); setDescription(todo.description || ""); setPriority(todo.priority);
    setStatus(todo.status); setDueDate(todo.dueDate || ""); setTags(todo.tags || []);
    setEditingId(todo.id); setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.error("Title is required"); return; }
    const finalTags = viewMode === "notes" && !tags.includes("note") ? [...tags, "note"] : tags;
    const data = { title: title.trim(), description, priority, status, dueDate, tags: finalTags };
    if (editingId) {
      await updateTodo(editingId, data);
      toast.success(viewMode === "notes" ? "Note updated" : "Task updated");
    } else {
      await addTodo(data);
      toast.success(viewMode === "notes" ? "Note added" : "Task added");
    }
    resetForm(); setShowForm(false);
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]); setTagInput("");
    }
  };

  const handleDelete = async () => {
    if (deleteId) { await deleteTodo(deleteId); toast.success("Deleted"); setDeleteId(null); }
  };

  const changeStatus = async (todo: Todo, newStatus: Todo["status"]) => {
    await updateTodo(todo.id, { status: newStatus });
    toast.success(`Moved to ${STATUS_CONFIG[newStatus].label}`);
  };

  const toggleSection = (key: string) => setExpandedSections((s) => ({ ...s, [key]: !s[key] }));

  const isOverdue = (d: string) => d && new Date(d) < new Date() && new Date(d).toDateString() !== new Date().toDateString();

  const stats = useMemo(() => ({
    total: allItems.length,
    done: allItems.filter((t) => t.status === "done").length,
    overdue: allItems.filter((t) => t.dueDate && isOverdue(t.dueDate) && t.status !== "done").length,
  }), [allItems]);

  return (
    <div className="space-y-6 animate-fade-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center">
            <CheckSquare className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">Tasks & Notes</h1>
            <p className="text-sm text-muted-foreground">{stats.done}/{stats.total} completed{stats.overdue > 0 && ` · ${stats.overdue} overdue`}</p>
          </div>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="gradient-hero text-foreground font-medium text-xs py-2 px-3.5 rounded-lg btn-press hover:opacity-90 transition-opacity flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Add
        </button>
      </div>

      {/* Tasks / Notes Toggle */}
      <div className="flex rounded-xl bg-secondary p-1">
        {([
          { key: "tasks" as ViewMode, label: "Tasks", icon: ListTodo },
          { key: "notes" as ViewMode, label: "Notes", icon: StickyNote },
        ]).map((tab) => (
          <button key={tab.key} onClick={() => setViewMode(tab.key)}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              viewMode === tab.key ? "bg-primary/15 text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}>
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Progress bar */}
      <div className="glass-panel rounded-2xl p-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-mono-data text-primary">{stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0}%</span>
        </div>
        <div className="w-full bg-secondary rounded-full h-2.5">
          <div className="h-full rounded-full gradient-hero transition-all duration-500" style={{ width: `${stats.total > 0 ? (stats.done / stats.total) * 100 : 0}%` }} />
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Search ${viewMode}...`} className="w-full bg-secondary border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" />
        </div>
        {viewMode === "tasks" && (
          <div className="flex gap-2 flex-wrap">
            {(["all", "todo", "in_progress", "done"] as const).map((s) => (
              <button key={s} onClick={() => setFilterStatus(s)} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${filterStatus === s ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>
                {s === "all" ? "All" : STATUS_CONFIG[s].label}
              </button>
            ))}
            <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value as any)} className="text-xs px-3 py-1.5 rounded-full border border-border bg-secondary text-foreground">
              <option value="all">All Priority</option>
              {Object.entries(PRIORITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        [...Array(3)].map((_, i) => <div key={i} className="glass-panel rounded-2xl h-16 skeleton-pulse" />)
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          {viewMode === "notes" ? <StickyNote className="w-12 h-12 text-muted-foreground mx-auto mb-3" /> : <CheckSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />}
          <p className="text-muted-foreground">No {viewMode} yet</p>
        </div>
      ) : viewMode === "notes" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((note) => (
            <div key={note.id} className="glass-panel rounded-xl p-4 space-y-2">
              <div className="flex items-start justify-between">
                <p className="text-sm font-semibold flex-1">{note.title}</p>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => openEdit(note)} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"><Edit3 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setDeleteId(note.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-cv-coral hover:bg-destructive/10 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              {note.description && <p className="text-xs text-muted-foreground line-clamp-4">{note.description}</p>}
              <div className="flex flex-wrap gap-1">
                {note.tags?.filter((t) => t !== "note").map((tag) => (
                  <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">#{tag}</span>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground">{new Date(note.createdAt).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      ) : (
        Object.entries(grouped).filter(([, items]) => items.length > 0).map(([key, items]) => (
          <div key={key} className="space-y-2">
            <button onClick={() => toggleSection(key)} className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
              {expandedSections[key] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              {STATUS_CONFIG[key as Todo["status"]].label} ({items.length})
            </button>
            {expandedSections[key] && items.map((todo) => (
              <div key={todo.id} className={`glass-panel rounded-xl p-4 space-y-3 transition-all ${todo.status === "done" ? "opacity-60" : ""}`}>
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${todo.status === "done" ? "line-through" : ""}`}>{todo.title}</p>
                    {todo.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{todo.description}</p>}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${PRIORITY_CONFIG[todo.priority].color}`}>
                        <Flag className="w-2.5 h-2.5 inline mr-0.5" />{PRIORITY_CONFIG[todo.priority].label}
                      </span>
                      {todo.dueDate && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${isOverdue(todo.dueDate) && todo.status !== "done" ? "bg-destructive/20 text-destructive" : "bg-muted text-muted-foreground"}`}>
                          <Calendar className="w-2.5 h-2.5 inline mr-0.5" />{new Date(todo.dueDate).toLocaleDateString()}
                        </span>
                      )}
                      {todo.tags?.map((tag) => (
                        <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">#{tag}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => openEdit(todo)} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"><Edit3 className="w-4 h-4" /></button>
                    <button onClick={() => setDeleteId(todo.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-cv-coral hover:bg-destructive/10 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                {/* Status change buttons */}
                <div className="flex gap-2">
                  {STATUS_BUTTONS.map((sb) => (
                    <button
                      key={sb.key}
                      onClick={() => changeStatus(todo, sb.key)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] font-medium rounded-lg border transition-all ${
                        todo.status === sb.key ? sb.activeClass : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground bg-transparent"
                      }`}
                    >
                      <sb.icon className="w-3.5 h-3.5" />
                      {sb.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) { setShowForm(false); resetForm(); } }}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit" : "New"} {viewMode === "notes" ? "Note" : "Task"}</DialogTitle>
            <DialogDescription>{viewMode === "notes" ? "Create or edit a note." : "Create or edit a task with priority and due date."}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" required />
            <textarea placeholder={viewMode === "notes" ? "Write your note..." : "Description (optional)"} value={description} onChange={(e) => setDescription(e.target.value)} rows={viewMode === "notes" ? 5 : 3} className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary resize-none" />
            {viewMode === "tasks" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Priority</label>
                    <select value={priority} onChange={(e) => setPriority(e.target.value as Todo["priority"])} className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-foreground">
                      {Object.entries(PRIORITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Status</label>
                    <select value={status} onChange={(e) => setStatus(e.target.value as Todo["status"])} className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-foreground">
                      {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Due Date</label>
                  <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary" />
                </div>
              </>
            )}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Tags</label>
              <div className="flex gap-2">
                <input placeholder="Add tag" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }} className="flex-1 bg-secondary border border-border rounded-lg px-3 py-1.5 text-xs text-foreground" />
                <button type="button" onClick={addTag} className="text-xs px-3 py-1.5 rounded-lg bg-primary/20 text-primary">Add</button>
              </div>
              {tags.filter((t) => t !== "note").length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {tags.filter((t) => t !== "note").map((tag) => (
                    <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary flex items-center gap-1">
                      #{tag}
                      <button type="button" onClick={() => setTags(tags.filter((t) => t !== tag))}><X className="w-2.5 h-2.5" /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <button type="submit" className="w-full gradient-hero text-foreground font-medium py-2.5 rounded-xl btn-press hover:opacity-90 transition-opacity">
              {editingId ? "Update" : "Add"} {viewMode === "notes" ? "Note" : "Task"}
            </button>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title={`Delete ${viewMode === "notes" ? "note" : "task"}?`} description="This item will be permanently removed." />
    </div>
  );
};

export default TodoPage;
