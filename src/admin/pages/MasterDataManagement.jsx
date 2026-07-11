import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Breadcrumb from "../components/ui/Breadcrumb.jsx";
import Drawer from "../components/ui/Drawer.jsx";
import ConfirmDialog from "../components/ui/ConfirmDialog.jsx";
import FilterBar from "../components/ui/FilterBar.jsx";
import Pagination from "../components/ui/Pagination.jsx";
import { EmptyState, OrgStatusBadge, TableSkeleton } from "../components/ui/OrgBadges.jsx";
import { TableAction, TableActions } from "../components/ui/TableActions.jsx";
import { useToast } from "../components/ui/Toast.jsx";
import { usePagination } from "../hooks/usePagination.js";
import { useMasterCategories, useTenantMasterData } from "../hooks/useTenantMasterData.js";

const inputClass = "admin-input";

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
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", description: "", status: "active" });

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

  const activeItem = items.find((i) => i.id === itemId);

  const setCategory = (key) => {
    setSearch("");
    setStatusFilter("all");
    setSearchParams({ category: key });
  };

  const openCreate = () => {
    setForm({ name: "", code: "", description: "", status: "active" });
    setSearchParams({ category, panel: "create" });
  };

  const openEdit = (item) => {
    setForm({
      name: item.name,
      code: item.code || "",
      description: item.description || "",
      status: item.status,
    });
    setSearchParams({ category, panel: "edit", id: item.id });
  };

  const closePanel = () => setSearchParams({ category });

  const saveItem = async (e) => {
    e.preventDefault();
    const name = form.name.trim();
    if (name.length < 2) {
      toast("Name must be at least 2 characters", "error");
      return;
    }

    setSubmitting(true);
    try {
      if (panel === "create") {
        await createItem({
          name,
          code: form.code.trim(),
          description: form.description.trim(),
          status: form.status,
        });
        toast(`${activeCategory?.label || "Item"} created`, "success");
      } else if (panel === "edit" && itemId) {
        await updateItem(itemId, {
          name,
          code: form.code.trim(),
          description: form.description.trim(),
          status: form.status,
        });
        toast(`${activeCategory?.label || "Item"} updated`, "success");
      }
      closePanel();
    } catch {
      toast("Could not save. Check for duplicate names.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteItem(deleteTarget.id);
      toast("Deleted successfully", "success");
    } catch {
      toast("Cannot delete — item may be assigned to users", "error");
    }
    setDeleteTarget(null);
  };

  const pageLoading = categoriesLoading || loading;

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
          + Add {activeCategory?.label || "item"}
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
                + Add {activeCategory?.label || "item"}
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Code</th>
                  <th>Status</th>
                  <th className="col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedItems.map((item) => (
                  <tr key={item.id} className="admin-table-row border-b border-slate-100 last:border-0">
                    <td>
                      <p className="font-medium text-slate-900">{item.name}</p>
                    </td>
                    <td>
                      <span className="block max-w-[280px] truncate text-slate-500" title={item.description || undefined}>
                        {item.description || "—"}
                      </span>
                    </td>
                    <td>
                      <span className="font-mono text-xs text-slate-600">{item.code || "—"}</span>
                    </td>
                    <td>
                      <OrgStatusBadge status={item.status === "active" ? "ACTIVE" : "INACTIVE"} />
                    </td>
                    <td className="col-actions">
                      <TableActions>
                        <TableAction variant="edit" onClick={() => openEdit(item)}>
                          Edit
                        </TableAction>
                        <TableAction variant="warn" onClick={() => setDeleteTarget(item)}>
                          Delete
                        </TableAction>
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
            itemLabel={activeCategory?.label?.toLowerCase() || "item"}
          />
        )}
      </div>

      <Drawer
        open={panel === "create" || panel === "edit"}
        onClose={closePanel}
        title={panel === "create" ? `Add ${activeCategory?.label || "item"}` : `Edit ${activeCategory?.label || "item"}`}
      >
        <form onSubmit={saveItem} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-slate-500">Name *</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-500">Code</label>
            <input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="Optional short code"
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-500">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-500">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className={inputClass}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <button type="submit" disabled={submitting} className="admin-btn-primary w-full">
            {submitting ? "Saving..." : "Save"}
          </button>
        </form>
      </Drawer>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={`Delete ${deleteTarget?.name}?`}
        message="This cannot be undone. Items assigned to users cannot be deleted."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
