"use client";

import { useCallback, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import {
  createAnnouncement,
  deleteAnnouncement,
  listAnnouncements,
  updateAnnouncement,
  type AnnouncementRow,
  type Priority,
} from "@/app/actions/announcements";
import { formatDate, useActionData } from "@/components/admin/use-action";

const fieldClass =
  "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30";

const priorityBadge: Record<Priority, string> = {
  low: "bg-muted/40 text-muted-foreground",
  normal: "bg-sky-100 text-primary",
  high: "bg-red-100 text-red-800",
};

/** Create, list, edit and delete the announcements of one house. */
export function AnnouncementsManager({ adminId, houseId }: { adminId: string; houseId: string }) {
  const load = useCallback(() => listAnnouncements(adminId, houseId), [adminId, houseId]);
  const { data, error, loading, reload } = useActionData(load);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  async function remove(row: AnnouncementRow) {
    if (!window.confirm(`Delete the announcement "${row.title}"?`)) return;
    setActionError("");
    const result = await deleteAnnouncement(adminId, houseId, row.id);
    if (!result.ok) setActionError(result.error);
    await reload();
  }

  return (
    <div className="space-y-6">
      <section aria-labelledby="new-announcement" className="rounded-xl border border-border bg-accent/50 p-4">
        <h3 id="new-announcement" className="mb-3 font-semibold text-primary">New announcement</h3>
        <AnnouncementForm
          submitLabel="Post announcement"
          onSubmit={async (values) => {
            const result = await createAnnouncement(adminId, houseId, values);
            if (!result.ok) return result.error;
            await reload();
            return null;
          }}
        />
      </section>

      {(actionError || (data && error)) && (
        <p role="alert" className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-800">
          {actionError || error}
        </p>
      )}
      {loading && <p className="text-sm text-muted-foreground">Loading announcements…</p>}
      {!loading && !data && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {data && data.length === 0 && <p className="text-sm text-muted-foreground">No announcements yet.</p>}

      <ul className="space-y-3">
        {data?.map((row) => (
          <li key={row.id} className="rounded-xl border border-border p-4">
            {editingId === row.id ? (
              <AnnouncementForm
                initial={row}
                submitLabel="Save changes"
                onCancel={() => setEditingId(null)}
                onSubmit={async (values) => {
                  const result = await updateAnnouncement(adminId, houseId, row.id, values);
                  if (!result.ok) return result.error;
                  setEditingId(null);
                  await reload();
                  return null;
                }}
              />
            ) : (
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-semibold text-foreground">{row.title}</h4>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${priorityBadge[row.priority]}`}>
                      {row.priority}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDate(row.createdAt)}
                    {row.author ? ` · ${row.author}` : ""}
                  </p>
                  <p className="mt-2 text-sm whitespace-pre-line text-muted-foreground">{row.description}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingId(row.id)}
                    aria-label={`Edit ${row.title}`}
                    className="rounded-lg border border-border p-2 text-primary hover:bg-accent"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void remove(row)}
                    aria-label={`Delete ${row.title}`}
                    className="rounded-lg border border-red-300 p-2 text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function AnnouncementForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: AnnouncementRow;
  submitLabel: string;
  onSubmit: (values: { title: string; description: string; priority: string }) => Promise<string | null>;
  onCancel?: () => void;
}) {
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    setSaving(true);
    setError("");
    const message = await onSubmit({
      title: String(values.get("title")),
      description: String(values.get("description")),
      priority: String(values.get("priority")),
    });
    setSaving(false);
    if (message) setError(message);
    else if (!initial) form.reset();
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <div className="grid gap-3 sm:grid-cols-[1fr_10rem]">
        <label className="text-sm font-semibold text-primary">
          Title
          <input name="title" required maxLength={150} defaultValue={initial?.title} className={`${fieldClass} mt-1`} />
        </label>
        <label className="text-sm font-semibold text-primary">
          Priority
          <select name="priority" defaultValue={initial?.priority ?? "normal"} className={`${fieldClass} mt-1`}>
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
          </select>
        </label>
      </div>
      <label className="block text-sm font-semibold text-primary">
        Message
        <textarea name="description" required rows={3} maxLength={5000} defaultValue={initial?.description} className={`${fieldClass} mt-1`} />
      </label>
      <div className="flex justify-end gap-3">
        {onCancel && (
          <button type="button" onClick={onCancel} className="rounded-lg px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted">
            Cancel
          </button>
        )}
        <button type="submit" disabled={saving} className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
          {saving ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
