import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Breadcrumb from "../components/ui/Breadcrumb.jsx";
import Drawer from "../components/ui/Drawer.jsx";
import ConfirmDialog from "../components/ui/ConfirmDialog.jsx";
import FilterBar from "../components/ui/FilterBar.jsx";
import Pagination from "../components/ui/Pagination.jsx";
import { EmptyState, OrgStatusBadge, TableSkeleton } from "../components/ui/OrgBadges.jsx";
import { TableAction, TableActions, EditIcon, DeleteIcon } from "../components/ui/TableActions.jsx";
import { useToast } from "../components/ui/Toast.jsx";
import { usePagination } from "../hooks/usePagination.js";
import { useMasterCategories, useTenantMasterData } from "../hooks/useTenantMasterData.js";
import {
  MASTER_DATA_LIMITS,
  validateMasterDataForm,
} from "../utils/masterDataValidation.js";

const inputClass = "admin-input";

const EMPTY_FORM = { name: "", code: "", description: "", status: "active" };

export default function MasterDataManagement() {
  const { toast } = useToast();
  const { categories, loading: categoriesLoading } = useMasterCategories();
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get("category") || categories[0]?.key || "department";
  const panel = searchParams.get("panel");
  const itemId = searchParams.get("id");

  const { items, loading, createItem, updateItem, deleteItem } = useTenantMasterData(category);
  const activeCategory = categories.find((c) => c.key === category) || categories[0];

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!searchParams.get("category") && categories[0]?.key) {
      setSearchParams({ category: categories[0].key }, { replace: true });
    }
  }, [categories, searchParams, setSearchParams]);

  const filtered = useMemo(() => {
    let list = [...items];
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          (i.code || "").toLowerCase().includes(q) ||
          (i.description || "").toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") list = list.filter((i) => i.status === statusFilter);
    list.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name));
    return list;
  }, [items, search, statusFilter]);

  const { page, setPage, pageSize, setPageSize, totalPages, totalItems, pagedItems } = usePagination(
    filtered,
    { resetDeps: [search, statusFilter, category] }
  );

  const setCategory = (key) => {
    setSearch("");
    setStatusFilter("all");
    setSearchParams({ category: key });
  };

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setSearchParams({ category, panel: "create" });
  };

  const openEdit = (item) => {
    setForm({
      name: item.name,
      code: String(item.code || "").toUpperCase(),
      description: item.description || "",
      status: item.status,
    });
    setErrors({});
    setSearchParams({ category, panel: "edit", id: item.id });
  };

  const closePanel = () => {
    setErrors({});
    setSearchParams({ category });
  };

  const saveItem = async (e) => {
    e.preventDefault();
    const nextErrors = validateMasterDataForm(form, {
      existingItems: items,
      excludeId: panel === "edit" ? itemId : null,
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      toast("Please fix the highlighted fields", "error");
      return;
    }

    const name = form.name.trim();
    const code = form.code.trim().toUpperCase();
    const description = form.description.trim();

    setSubmitting(true);
    try {
      if (panel === "create") {
        await createItem({
          name,
          code,
          description,
          status: form.status,
        });
        toast(`${activeCategory?.label || "Item"} created`, "success");
      } else if (panel === "edit" && itemId) {
        await updateItem(itemId, {
          name,
          code,
          description,
          status: form.status,
        });
        toast(`${activeCategory?.label || "Item"} updated`, "success");
      }
      closePanel();
    } catch {
      toast("Could not save. Check for duplicate names or codes.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    console.log("[ui:master-data:delete] requested", {
      category,
      id: deleteTarget.id,
      name: deleteTarget.name,
      code: deleteTarget.code,
    });
    try {
      await deleteItem(deleteTarget.id);
      console.log("[ui:master-data:delete] completed", {
        category,
        id: deleteTarget.id,
        name: deleteTarget.name,
      });
      toast("Deleted successfully", "success");
    } catch {
      console.warn("[ui:master-data:delete] failed", {
        category,
        id: deleteTarget.id,
        name: deleteTarget.name,
      });
      toast("Cannot delete — item may be assigned to users", "error");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const pageLoading = categoriesLoading || loading;
  const label = activeCategory?.label || "item";

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Organization", to: "/admin" },
          { label: "Master data" },
        ]}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Master data</h1>
          <p className="mt-1 text-slate-500">
            Manage lookup values for your organization. Selected options store MongoDB IDs on users and records.
          </p>
        </div>
        <button type="button" onClick={openCreate} className="admin-btn-primary">
          + Add {label}
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-2 border-b border-slate-200 pb-1">
        {categories.map((cat) => (
          <button
            key={cat.key}
            type="button"
            onClick={() => setCategory(cat.key)}
            className={`rounded-t-lg px-4 py-2 text-sm font-medium ${
              category === cat.key
                ? "border-b-2 border-indigo-600 text-indigo-600"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {cat.labelPlural}
          </button>
        ))}
      </div>

      {activeCategory?.description && (
        <p className="mt-3 text-sm text-slate-500">{activeCategory.description}</p>
      )}

      <FilterBar
        onClear={() => {
          setSearch("");
          setStatusFilter("all");
        }}
        showClear={Boolean(search.trim()) || statusFilter !== "all"}
      >
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search ${activeCategory?.labelPlural?.toLowerCase() || "items"}...`}
          className="admin-input admin-filter-search"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="admin-input admin-filter-select text-slate-700"
          aria-label="Filter by status"
        >
          <option value="all">All status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </FilterBar>

      <div className="admin-table mt-4">
        {pageLoading ? (
          <TableSkeleton rows={6} cols={5} />
        ) : pagedItems.length === 0 ? (
          <EmptyState
            title={`No ${activeCategory?.labelPlural?.toLowerCase() || "items"} yet`}
            description={`Create ${activeCategory?.labelPlural?.toLowerCase() || "items"} to use in user forms and across the app.`}
            action={
              <button type="button" onClick={openCreate} className="admin-btn-primary">
                + Add {label}
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-data-table admin-data-table-fixed">
              <thead>
                <tr>
                  <th className="col-name">Name</th>
                  <th className="col-desc">Description</th>
                  <th className="col-code">Code</th>
                  <th className="col-status">Status</th>
                  <th className="col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedItems.map((item) => (
                  <tr key={item.id} className="admin-table-row border-b border-slate-100 last:border-0">
                    <td className="col-name">
                      <p className="truncate font-medium text-slate-900" title={item.name}>
                        {item.name}
                      </p>
                    </td>
                    <td className="col-desc">
                      <span title={item.description || undefined}>{item.description || "—"}</span>
                    </td>
                    <td className="col-code">
                      <span className="font-mono text-xs uppercase text-slate-600">
                        {item.code || "—"}
                      </span>
                    </td>
                    <td className="col-status">
                      <OrgStatusBadge status={item.status === "active" ? "ACTIVE" : "INACTIVE"} />
                    </td>
                    <td className="col-actions">
                      <TableActions>
                        <TableAction variant="edit" onClick={() => openEdit(item)} title="Edit"><EditIcon /></TableAction>
                        <TableAction variant="warn" onClick={() => setDeleteTarget(item)} title="Delete"><DeleteIcon /></TableAction>
                      </TableActions>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!pageLoading && totalItems > 0 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            itemLabel={label.toLowerCase()}
          />
        )}
      </div>

      <Drawer
        open={panel === "create" || panel === "edit"}
        onClose={closePanel}
        title={panel === "create" ? `Add ${label}` : `Edit ${label}`}
        footer={
          <>
            <button type="button" onClick={closePanel} className="admin-btn-secondary" disabled={submitting}>
              Cancel
            </button>
            <button type="submit" form="master-data-form" disabled={submitting} className="admin-btn-primary">
              {submitting ? "Saving..." : "Save"}
            </button>
          </>
        }
      >
        <form id="master-data-form" onSubmit={saveItem} className="space-y-4" noValidate>
          <div>
            <label className="mb-1 block text-sm text-slate-500">Name *</label>
            <input
              value={form.name}
              onChange={(e) => setField("name", e.target.value.slice(0, MASTER_DATA_LIMITS.name.max))}
              className={inputClass}
              aria-invalid={Boolean(errors.name)}
            />
            <p className="mt-1 text-xs text-slate-500">
              {MASTER_DATA_LIMITS.name.min}–{MASTER_DATA_LIMITS.name.max} characters
            </p>
            {errors.name && (
              <p className="mt-1 text-xs text-red-600" role="alert">
                {errors.name}
              </p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-500">Code *</label>
            <input
              value={form.code}
              onChange={(e) =>
                setField(
                  "code",
                  e.target.value
                    .toUpperCase()
                    .replace(/[^A-Z0-9]/g, "")
                    .slice(0, MASTER_DATA_LIMITS.code.length)
                )
              }
              placeholder="e.g. ACA"
              className={`${inputClass} font-mono uppercase`}
              maxLength={MASTER_DATA_LIMITS.code.length}
              aria-invalid={Boolean(errors.code)}
            />
            <p className="mt-1 text-xs text-slate-500">Exactly 3 letters or numbers</p>
            {errors.code && (
              <p className="mt-1 text-xs text-red-600" role="alert">
                {errors.code}
              </p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-500">Description</label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setField("description", e.target.value.slice(0, MASTER_DATA_LIMITS.description.max))
              }
              rows={3}
              className={inputClass}
              aria-invalid={Boolean(errors.description)}
            />
            <p className="mt-1 text-xs text-slate-500">
              Optional · max {MASTER_DATA_LIMITS.description.max} characters
            </p>
            {errors.description && (
              <p className="mt-1 text-xs text-red-600" role="alert">
                {errors.description}
              </p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-500">Status</label>
            <select
              value={form.status}
              onChange={(e) => setField("status", e.target.value)}
              className={inputClass}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </form>
      </Drawer>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={`Delete ${deleteTarget?.name}?`}
        message="This cannot be undone. Items assigned to users cannot be deleted."
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
