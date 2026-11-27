"use client";

import { Suspense, useCallback, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ChevronLeft, Pencil, Trash2 } from "lucide-react";
import {
  createUser,
  deleteUser,
  listUsers,
  updateUser,
  type Role,
  type UserInput,
  type UserRow,
} from "@/app/actions/users";
import { DataTable, type Column } from "@/components/admin/data-table";
import { Modal } from "@/components/admin/modal";
import { useActionData } from "@/components/admin/use-action";

const roleOptions: { value: Role; label: string }[] = [
  { value: "tenant", label: "Tenant" },
  { value: "staff", label: "Staff" },
  { value: "admin", label: "Admin" },
];

const roleBadge: Record<Role, string> = {
  tenant: "bg-sky-100 text-primary",
  staff: "bg-amber-100 text-amber-900",
  admin: "bg-violet-100 text-violet-900",
};

const fieldClass =
  "h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30";

function UsersPageContent() {
  const adminId = useParams<{ "admin-id": string }>()["admin-id"];
  console.log(adminId);
  const houseFilter = useSearchParams().get("house") ?? "all";
  const load = useCallback(() => listUsers(adminId), [adminId]);
  const { data, error, loading, reload } = useActionData(load);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [actionError, setActionError] = useState("");

  const houses = [
    ...new Map(
      (data ?? [])
        .filter((user) => user.houseId)
        .map((user) => [user.houseId!, user.houseName ?? ""]),
    ),
  ].sort((a, b) => a[1].localeCompare(b[1]));
  // Opened from a house without tenants: keep that house selectable in the filter.
  if (
    houseFilter !== "all" &&
    houseFilter !== "none" &&
    !houses.some(([id]) => id === houseFilter)
  ) {
    houses.unshift([houseFilter, "Selected accommodation"]);
  }

  const columns: Column<UserRow>[] = [
    {
      key: "firstName",
      header: "First name",
      render: (row) => (
        <span className="font-medium text-foreground">{row.firstName}</span>
      ),
      sortValue: (row) => row.firstName,
      create: { name: "firstName", label: "First name", required: true },
    },
    {
      key: "lastName",
      header: "Last name",
      render: (row) => (
        <span className="font-medium text-foreground">{row.lastName}</span>
      ),
      sortValue: (row) => row.lastName,
      create: { name: "lastName", label: "Last name", required: true },
    },
    {
      key: "email",
      header: "Email",
      render: (row) => row.email,
      sortValue: (row) => row.email,
      create: { name: "email", label: "Email", type: "email", required: true },
    },
    {
      key: "phone",
      header: "Phone",
      render: (row) => row.phoneNumber ?? "—",
      sortValue: (row) => row.phoneNumber,
      create: { name: "phoneNumber", label: "Phone (optional)", type: "tel" },
    },
    {
      key: "role",
      header: "Role",
      render: (row) => (
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${roleBadge[row.role]}`}
        >
          {row.role}
        </span>
      ),
      sortValue: (row) => row.role,
      create: {
        name: "role",
        label: "Role",
        type: "select",
        options: roleOptions,
      },
      className: "w-32",
    },
    {
      key: "login",
      header: "Login",
      render: (row) =>
        row.hasLogin ? (
          <span className="text-green-700">Active</span>
        ) : (
          <span className="text-amber-800">None</span>
        ),
      sortValue: (row) => (row.hasLogin ? 1 : 0),
      create: {
        name: "password",
        label: "Temporary password",
        type: "password",
        placeholder: "Temporary password",
        required: true,
        minLength: 8,
      },
    },
    {
      key: "home",
      header: "Lives in",
      render: (row) =>
        row.houseId ? (
          <Link
            href={`/admin-dashboard/${adminId}/houses/${row.houseId}/rooms/${row.roomId}`}
            className="text-primary/80 underline-offset-2 hover:underline"
          >
            {row.houseName}, room {row.roomNumber}
          </Link>
        ) : (
          <span className="text-muted-foreground/70">—</span>
        ),
      sortValue: (row) =>
        row.houseName ? `${row.houseName} ${row.roomNumber}` : null,
    },
  ];

  async function remove(user: UserRow) {
    const warning = user.houseId
      ? " Their current tenancy will end today."
      : "";
    if (!window.confirm(`Delete ${user.firstName} ${user.lastName}?${warning}`))
      return;
    setActionError("");
    const result = await deleteUser(adminId, user.id);
    if (!result.ok) setActionError(result.error);
    await reload();
  }

  return (
    <div className="flex-1">
      <div className="flex items-center gap-4 border-b border-border px-8 py-6">
        <Link
          href={`/admin-dashboard/${adminId}/home`}
          aria-label="Back to dashboard"
          className="rounded-lg p-2 text-primary hover:bg-accent"
        >
          <ChevronLeft className="size-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-primary uppercase">Users</h1>
          <p className="text-sm text-muted-foreground">
            Fill in the first row and press + to add a user. Each user gets a
            login with the temporary password you set, and is asked to choose
            their own password when they first sign in.
          </p>
        </div>
      </div>

      <div className="space-y-4 px-8 py-6">
        {(actionError || (data && error)) && (
          <p
            role="alert"
            className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-800"
          >
            {actionError || error}
          </p>
        )}
        {loading && (
          <p className="text-sm text-muted-foreground">Loading users…</p>
        )}
        {!loading && !data && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}
        {data && (
          <DataTable
            key={houseFilter}
            rows={data}
            rowKey={(row) => row.id}
            columns={columns}
            searchText={(row) =>
              `${row.firstName} ${row.lastName} ${row.email} ${row.phoneNumber ?? ""} ${row.houseName ?? ""}`
            }
            searchPlaceholder="Search by name, email, phone or house"
            filters={[
              {
                key: "role",
                label: "Role",
                options: roleOptions,
                matches: (row, value) => row.role === value,
              },
              {
                key: "house",
                label: "House",
                initial: houseFilter,
                options: [
                  { value: "none", label: "Not living anywhere" },
                  ...houses.map(([value, label]) => ({ value, label })),
                ],
                matches: (row, value) =>
                  value === "none" ? !row.houseId : row.houseId === value,
              },
              {
                key: "login",
                label: "Login",
                options: [
                  { value: "yes", label: "Can sign in" },
                  { value: "no", label: "No login yet" },
                ],
                matches: (row, value) => row.hasLogin === (value === "yes"),
              },
            ]}
            createLabel="Add user"
            onCreate={async (values) => {
              const result = await createUser(
                adminId,
                values as UserInput & { password: string },
              );
              if (!result.ok) return result.error;
              await reload();
              return null;
            }}
            actions={(row) => (
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(row)}
                  aria-label={`Edit ${row.firstName} ${row.lastName}`}
                  className="rounded-lg border border-border p-2 text-primary hover:bg-accent"
                >
                  <Pencil className="size-4" />
                </button>
                {row.id !== adminId && (
                  <button
                    type="button"
                    onClick={() => void remove(row)}
                    aria-label={`Delete ${row.firstName} ${row.lastName}`}
                    className="rounded-lg border border-red-300 p-2 text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>
            )}
            emptyText="No users yet."
          />
        )}
      </div>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={
          editing
            ? `Edit ${editing.firstName} ${editing.lastName}`
            : "Edit user"
        }
        size="md"
      >
        {editing && (
          <EditUserForm
            user={editing}
            onSave={async (values) => {
              const result = await updateUser(adminId, editing.id, values);
              if (!result.ok) return result.error;
              setEditing(null);
              await reload();
              return null;
            }}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>
    </div>
  );
}

function EditUserForm({
  user,
  onSave,
  onCancel,
}: {
  user: UserRow;
  onSave: (values: UserInput & { password: string }) => Promise<string | null>;
  onCancel: () => void;
}) {
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setError("");
    const message = await onSave({
      firstName: String(form.get("firstName")),
      lastName: String(form.get("lastName")),
      email: String(form.get("email")),
      phoneNumber: String(form.get("phoneNumber")),
      role: String(form.get("role")),
      password: String(form.get("password") ?? ""),
    });
    setSaving(false);
    if (message) setError(message);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-800"
        >
          {error}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="First name"
          name="firstName"
          defaultValue={user.firstName}
          required
        />
        <Field
          label="Last name"
          name="lastName"
          defaultValue={user.lastName}
          required
        />
      </div>
      <Field
        label="Email"
        name="email"
        type="email"
        defaultValue={user.email}
        required
      />
      <Field
        label="Phone (optional)"
        name="phoneNumber"
        type="tel"
        defaultValue={user.phoneNumber ?? ""}
      />
      <label className="block text-sm font-semibold text-primary">
        Role
        <select
          name="role"
          defaultValue={user.role}
          className={`${fieldClass} mt-1`}
        >
          {roleOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-semibold text-primary">
        {user.hasLogin
          ? "Reset password (optional)"
          : "Password for a new login"}
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required={!user.hasLogin}
          className={`${fieldClass} mt-1`}
        />
        <span className="mt-1 block text-xs font-normal text-muted-foreground">
          {user.hasLogin
            ? "Leave empty to keep the current password. A new password is temporary: the user must change it at their next sign-in."
            : "This user cannot sign in yet. Set a temporary password to create their login."}
        </span>
      </label>
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm font-semibold text-primary">
      {label}
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        className={`${fieldClass} mt-1`}
      />
    </label>
  );
}

export default function UsersPage() {
  return (
    <Suspense fallback={null}>
      <UsersPageContent />
    </Suspense>
  );
}
