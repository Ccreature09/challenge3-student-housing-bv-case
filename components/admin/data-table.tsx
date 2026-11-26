"use client";

import { useId, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Plus, Search } from "lucide-react";

export type CreateField = {
  name: string;
  label: string;
  type?: "text" | "number" | "email" | "tel" | "password" | "select";
  placeholder?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
  step?: string;
  defaultValue?: string;
  minLength?: number;
};

export type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  /** Present = the column can be sorted. */
  sortValue?: (row: T) => string | number | null;
  /** Present = the blank first row has an input for this column. */
  create?: CreateField;
  className?: string;
};

export type Filter<T> = {
  key: string;
  label: string;
  options: { value: string; label: string }[];
  matches: (row: T, value: string) => boolean;
  initial?: string;
};

const inputClass =
  "h-9 w-full min-w-24 rounded-lg border border-sky-300 bg-white px-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-200";

/**
 * Table with search, filters and column sorting. When onCreate is given, the
 * first row is a blank row of inputs and the + button on its left saves it.
 */
export function DataTable<T>({
  rows,
  rowKey,
  columns,
  searchText,
  searchPlaceholder = "Search…",
  filters = [],
  onCreate,
  createLabel = "Add",
  onRowClick,
  rowLabel,
  actions,
  emptyText = "Nothing here yet.",
}: {
  rows: T[];
  rowKey: (row: T) => string;
  columns: Column<T>[];
  searchText: (row: T) => string;
  searchPlaceholder?: string;
  filters?: Filter<T>[];
  /** Returns an error message, or null when the row was created. */
  onCreate?: (values: Record<string, string>) => Promise<string | null>;
  createLabel?: string;
  onRowClick?: (row: T) => void;
  /** Accessible name of a clickable row, e.g. "Open Room 12". */
  rowLabel?: (row: T) => string;
  actions?: (row: T) => React.ReactNode;
  emptyText?: string;
}) {
  const formId = useId();
  const [query, setQuery] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(filters.map((filter) => [filter.key, filter.initial ?? "all"])),
  );
  const [sort, setSort] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const [createError, setCreateError] = useState("");
  const [creating, setCreating] = useState(false);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = rows.filter((row) => {
      if (needle && !searchText(row).toLowerCase().includes(needle)) return false;
      return filters.every((filter) => {
        const value = filterValues[filter.key] ?? "all";
        return value === "all" || filter.matches(row, value);
      });
    });
    const column = sort && columns.find((item) => item.key === sort.key);
    if (!sort || !column?.sortValue) return filtered;
    const factor = sort.direction === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const left = column.sortValue!(a);
      const right = column.sortValue!(b);
      if (left === right) return 0;
      if (left === null) return 1;
      if (right === null) return -1;
      if (typeof left === "number" && typeof right === "number") return (left - right) * factor;
      return String(left).localeCompare(String(right), undefined, { numeric: true }) * factor;
    });
  }, [rows, query, filters, filterValues, sort, columns, searchText]);

  function toggleSort(key: string) {
    setSort((current) =>
      current?.key !== key
        ? { key, direction: "asc" }
        : current.direction === "asc"
          ? { key, direction: "desc" }
          : null,
    );
  }

  async function submitCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!onCreate) return;
    const form = event.currentTarget;
    const values = Object.fromEntries(
      [...new FormData(form).entries()].map(([name, value]) => [name, String(value)]),
    );
    setCreating(true);
    setCreateError("");
    const error = await onCreate(values);
    setCreating(false);
    if (error) {
      setCreateError(error);
    } else {
      form.reset();
    }
  }

  const leadColumn = Boolean(onCreate);
  const columnCount = columns.length + (leadColumn ? 1 : 0) + (actions ? 1 : 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="relative min-w-60 flex-1">
          <span className="sr-only">Search</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-stone-400" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            className={`${inputClass} h-10 pl-9`}
          />
        </label>
        {filters.map((filter) => (
          <label key={filter.key} className="flex flex-col gap-1 text-xs font-semibold text-sky-900">
            {filter.label}
            <select
              value={filterValues[filter.key] ?? "all"}
              onChange={(event) =>
                setFilterValues((current) => ({ ...current, [filter.key]: event.target.value }))
              }
              className={`${inputClass} h-10`}
            >
              <option value="all">All</option>
              {filter.options.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
        ))}
      </div>

      {onCreate && <form id={formId} onSubmit={submitCreate} />}
      {createError && (
        <p role="alert" className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-800">
          {createError}
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-sky-300">
        <table className="w-full text-sm">
          <thead className="bg-sky-50 text-left text-xs font-semibold text-sky-900">
            <tr>
              {leadColumn && <th className="w-12 px-3 py-3"><span className="sr-only">{createLabel}</span></th>}
              {columns.map((column) => {
                const active = sort?.key === column.key ? sort.direction : null;
                return (
                  <th
                    key={column.key}
                    className={`px-3 py-3 ${column.className ?? ""}`}
                    aria-sort={active === "asc" ? "ascending" : active === "desc" ? "descending" : undefined}
                  >
                    {column.sortValue ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(column.key)}
                        className="inline-flex items-center gap-1 hover:text-sky-700"
                      >
                        {column.header}
                        {active === "asc" ? (
                          <ArrowUp className="size-3.5" />
                        ) : active === "desc" ? (
                          <ArrowDown className="size-3.5" />
                        ) : (
                          <ArrowUpDown className="size-3.5 opacity-40" />
                        )}
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
              {actions && <th className="px-3 py-3"><span className="sr-only">Actions</span></th>}
            </tr>
          </thead>
          <tbody>
            {onCreate && (
              <tr className="border-t border-sky-200 bg-sky-50/40">
                <td className="px-3 py-2">
                  <button
                    type="submit"
                    form={formId}
                    disabled={creating}
                    aria-label={createLabel}
                    title={createLabel}
                    className="flex size-9 items-center justify-center rounded-lg bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-50"
                  >
                    <Plus className="size-5" />
                  </button>
                </td>
                {columns.map((column) => (
                  <td key={column.key} className={`px-3 py-2 ${column.className ?? ""}`}>
                    {column.create && <CreateInput field={column.create} formId={formId} />}
                  </td>
                ))}
                {actions && <td />}
              </tr>
            )}
            {visible.length === 0 && (
              <tr className="border-t border-sky-200">
                <td colSpan={columnCount} className="px-3 py-8 text-center text-stone-500">
                  {rows.length === 0 ? emptyText : "No results match your search and filters."}
                </td>
              </tr>
            )}
            {visible.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                onKeyDown={
                  onRowClick
                    ? (event) => {
                        if (event.target !== event.currentTarget) return;
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          onRowClick(row);
                        }
                      }
                    : undefined
                }
                tabIndex={onRowClick ? 0 : undefined}
                aria-label={onRowClick && rowLabel ? rowLabel(row) : undefined}
                className={`border-t border-sky-200 ${onRowClick ? "cursor-pointer hover:bg-sky-50 focus-visible:bg-sky-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-sky-500" : ""}`}
              >
                {leadColumn && <td className="px-3 py-3" />}
                {columns.map((column) => (
                  <td key={column.key} className={`px-3 py-3 text-stone-800 ${column.className ?? ""}`}>
                    {column.render(row)}
                  </td>
                ))}
                {actions && (
                  <td className="px-3 py-3 text-right" onClick={(event) => event.stopPropagation()}>
                    {actions(row)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-stone-500">
        Showing {visible.length} of {rows.length}
      </p>
    </div>
  );
}

function CreateInput({ field, formId }: { field: CreateField; formId: string }) {
  if (field.type === "select") {
    return (
      <select
        name={field.name}
        form={formId}
        aria-label={field.label}
        required={field.required}
        defaultValue={field.defaultValue ?? field.options?.[0]?.value}
        className={inputClass}
      >
        {field.options?.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    );
  }
  return (
    <input
      name={field.name}
      form={formId}
      type={field.type ?? "text"}
      step={field.step}
      minLength={field.minLength}
      autoComplete={field.type === "password" ? "new-password" : "off"}
      aria-label={field.label}
      placeholder={field.placeholder ?? field.label}
      required={field.required}
      defaultValue={field.defaultValue}
      className={inputClass}
    />
  );
}
