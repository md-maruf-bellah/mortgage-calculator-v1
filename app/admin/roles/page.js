"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthContext";

import {
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  Loader2,
  Lock,
  Shield,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";

// Group permissions by category
const PERMISSION_GROUPS = {
  Calculator: [
    "calculator:view",
    "calculator:calculate",
    "calculator:export_pdf",
  ],
  "Loan Terms": [
    "loan_terms:view",
    "loan_terms:create",
    "loan_terms:edit",
    "loan_terms:delete",
  ],
  "Custom Fields": [
    "fields:view",
    "fields:create",
    "fields:edit",
    "fields:delete",
  ],
  Reports: ["analytics:view_own", "analytics:view_all"],
  Tools: ["compare:view", "dashboard:view"],
  Admin: [
    "users:view",
    "users:create",
    "users:edit",
    "users:delete",
    "users:assign_roles",
    "roles:view",
    "roles:create",
    "roles:edit",
    "roles:delete",
    "audit:view",
  ],
};

const ROLE_COLORS_OPTIONS = [
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
];

function RoleModal({ role, onClose, onSave }) {
  const isEdit = !!role?._id;
  const [form, setForm] = useState({
    name: role?.name || "",
    displayName: role?.displayName || "",
    description: role?.description || "",
    color: role?.color || "#6366f1",
    permissions: role?.permissions || [],
  });
  const [saving, setSaving] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState(
    Object.keys(PERMISSION_GROUPS),
  );
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const togglePerm = (perm) => {
    set(
      "permissions",
      form.permissions.includes(perm)
        ? form.permissions.filter((p) => p !== perm)
        : [...form.permissions, perm],
    );
  };

  const toggleGroup = (group) => {
    const groupPerms = PERMISSION_GROUPS[group];
    const allSelected = groupPerms.every((p) => form.permissions.includes(p));
    set(
      "permissions",
      allSelected
        ? form.permissions.filter((p) => !groupPerms.includes(p))
        : [...new Set([...form.permissions, ...groupPerms])],
    );
  };

  const toggleExpandGroup = (group) => {
    setExpandedGroups((prev) =>
      prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group],
    );
  };

  const handleSave = async () => {
    if (!form.displayName || (!isEdit && !form.name)) {
      toast.error("Name and display name are required");
      return;
    }
    setSaving(true);
    try {
      const body = isEdit
        ? {
            id: role._id,
            displayName: form.displayName,
            description: form.description,
            color: form.color,
            permissions: form.permissions,
          }
        : {
            name: form.name,
            displayName: form.displayName,
            description: form.description,
            color: form.color,
            permissions: form.permissions,
          };

      const res = await fetch("/api/roles", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(isEdit ? "Role updated" : "Role created");
      onSave(data.data, isEdit);
      onClose();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-content max-w-2xl">
        <div className="flex items-center justify-between p-6 border-b border-white/[0.08]">
          <h2
            className="text-lg font-bold text-slate-100"
            style={{ fontFamily: "Syne, sans-serif" }}
          >
            {isEdit ? `Edit Role: ${role.displayName}` : "Create Role"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/[0.06] text-slate-400 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto max-h-[65vh]">
          <div className="grid grid-cols-2 gap-4">
            {!isEdit && (
              <div>
                <label className="input-label">Role Key (lowercase)</label>
                <input
                  className="input-field font-mono"
                  placeholder="e.g. senior_analyst"
                  value={form.name}
                  onChange={(e) =>
                    set(
                      "name",
                      e.target.value.toLowerCase().replace(/\s/g, "_"),
                    )
                  }
                />
              </div>
            )}
            <div className={isEdit ? "col-span-2" : ""}>
              <label className="input-label">Display Name</label>
              <input
                className="input-field"
                placeholder="e.g. Senior Analyst"
                value={form.displayName}
                onChange={(e) => set("displayName", e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="input-label">Description</label>
            <input
              className="input-field"
              placeholder="Brief description of this role"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>

          <div>
            <label className="input-label">Role Color</label>
            <div className="flex gap-2 flex-wrap">
              {ROLE_COLORS_OPTIONS.map((c) => (
                <button
                  key={c}
                  onClick={() => set("color", c)}
                  className={`w-8 h-8 rounded-lg transition-all ${form.color === c ? "ring-2 ring-white/30 scale-110" : "opacity-60 hover:opacity-100"}`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>

          {/* Permission Matrix */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="input-label m-0">
                Permissions ({form.permissions.length} selected)
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => set("permissions", Object.values(PERMISSIONS))}
                  className="text-xs text-indigo-400 hover:text-indigo-300"
                >
                  Select All
                </button>
                <span className="text-slate-700">·</span>
                <button
                  onClick={() => set("permissions", [])}
                  className="text-xs text-slate-500 hover:text-slate-400"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {Object.entries(PERMISSION_GROUPS).map(([group, perms]) => {
                const expanded = expandedGroups.includes(group);
                const allSelected = perms.every((p) =>
                  form.permissions.includes(p),
                );
                const someSelected = perms.some((p) =>
                  form.permissions.includes(p),
                );
                return (
                  <div
                    key={group}
                    className="rounded-xl border border-white/[0.06] overflow-hidden"
                  >
                    <div
                      className="flex items-center justify-between px-4 py-3 bg-slate-800/50 cursor-pointer"
                      onClick={() => toggleExpandGroup(group)}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          ref={(el) => {
                            if (el)
                              el.indeterminate = someSelected && !allSelected;
                          }}
                          onChange={() => toggleGroup(group)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 rounded accent-indigo-500 cursor-pointer"
                        />
                        <span
                          className="text-sm font-bold text-slate-300"
                          style={{ fontFamily: "Syne, sans-serif" }}
                        >
                          {group}
                        </span>
                        <span className="text-xs text-slate-600">
                          {
                            perms.filter((p) => form.permissions.includes(p))
                              .length
                          }
                          /{perms.length}
                        </span>
                      </div>
                      {expanded ? (
                        <ChevronDown size={14} className="text-slate-500" />
                      ) : (
                        <ChevronRight size={14} className="text-slate-500" />
                      )}
                    </div>
                    {expanded && (
                      <div className="p-3 grid grid-cols-2 gap-2">
                        {perms.map((perm) => (
                          <label
                            key={perm}
                            className="flex items-center gap-2 cursor-pointer group"
                          >
                            <input
                              type="checkbox"
                              checked={form.permissions.includes(perm)}
                              onChange={() => togglePerm(perm)}
                              className="w-3.5 h-3.5 rounded accent-indigo-500"
                            />
                            <span className="text-xs font-mono text-slate-500 group-hover:text-slate-300 transition-colors">
                              {perm}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t border-white/[0.08]">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex items-center gap-2 flex-1 justify-center py-2.5"
          >
            {saving ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Check size={15} />
            )}
            {saving ? "Saving..." : isEdit ? "Update Role" : "Create Role"}
          </button>
          <button onClick={onClose} className="btn-secondary py-2.5 px-5">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminRolesPage() {
  const { can } = useAuth();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  useEffect(() => {
    fetch("/api/roles")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setRoles(d.data);
        setLoading(false);
      });
  }, []);

  const handleDelete = async (role) => {
    if (role.isSystem) {
      toast.error("System roles cannot be deleted");
      return;
    }
    if (!confirm(`Delete role "${role.displayName}"?`)) return;
    const res = await fetch(`/api/roles?id=${role._id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) {
      setRoles((p) => p.filter((r) => r._id !== role._id));
      toast.success("Role deleted");
    } else toast.error(data.error);
  };

  const onSave = (saved, isEdit) => {
    if (isEdit)
      setRoles((p) => p.map((r) => (r._id === saved._id ? saved : r)));
    else setRoles((p) => [...p, saved]);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-2xl font-black text-white"
            style={{ fontFamily: "Syne, sans-serif" }}
          >
            Role Management
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Define roles and their permission sets
          </p>
        </div>
        {can("roles:create") && (
          <button
            onClick={() => setModal("create")}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={15} />
            Create Role
          </button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading
          ? [...Array(5)].map((_, i) => (
              <div key={i} className="skeleton h-52 rounded-2xl" />
            ))
          : roles.map((role) => {
              const permCount = role.permissions?.length || 0;
              // const totalPerms = Object?.values(permissions)?.length;
              const totalPerms = role.permissions?.length;

              console.log("role", { role });

              return (
                <div key={role._id} className="glass-card glass-card-hover p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: `${role.color}20` }}
                      >
                        <Shield size={18} style={{ color: role.color }} />
                      </div>
                      <div>
                        <h3
                          className="font-bold text-slate-200 text-sm"
                          style={{ fontFamily: "Syne, sans-serif" }}
                        >
                          {role.displayName}
                        </h3>
                        <p className="text-xs font-mono text-slate-600">
                          {role.name}
                        </p>
                      </div>
                    </div>
                    {role.isSystem && (
                      <span className="badge badge-indigo text-[10px]">
                        System
                      </span>
                    )}
                  </div>

                  {role.description && (
                    <p className="text-xs text-slate-500 mb-4">
                      {role.description}
                    </p>
                  )}

                  {/* Permission bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-[11px] mb-1.5">
                      <span className="text-slate-500">Permissions</span>
                      <span className="font-mono text-slate-400">
                        {permCount}/{totalPerms}
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${(permCount / totalPerms) * 100}%`,
                          background: role.color,
                        }}
                      />
                    </div>
                  </div>

                  {/* Permission preview */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {role.permissions?.slice(0, 6).map((p) => (
                      <span
                        key={p}
                        className="text-[9px] font-mono bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded"
                      >
                        {p}
                      </span>
                    ))}
                    {permCount > 6 && (
                      <span className="text-[9px] text-slate-600">
                        +{permCount - 6}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {can("roles:edit") && (
                      <button
                        onClick={() => setModal(role)}
                        className="btn-secondary flex items-center gap-1.5 text-xs py-1.5 flex-1 justify-center"
                      >
                        <Edit3 size={12} />
                        Edit
                      </button>
                    )}
                    {can("roles:delete") && !role.isSystem && (
                      <button
                        onClick={() => handleDelete(role)}
                        className="btn-danger flex items-center gap-1.5 text-xs py-1.5 px-3"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
      </div>

      {modal && (
        <RoleModal
          role={modal === "create" ? null : modal}
          onClose={() => setModal(null)}
          onSave={onSave}
        />
      )}
    </div>
  );
}
