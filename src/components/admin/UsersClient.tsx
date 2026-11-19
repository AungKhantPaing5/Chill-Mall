'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, Search, ShieldCheck, Lock, Pencil, Trash2, X, Check } from 'lucide-react';

interface UserItem {
  id: string;
  email: string;
  username: string | null;
  name: string | null;
  status: string;
  role: string;
  createdAt: string;
  privateVideoIds: string[];
}

interface RoleItem {
  id: string;
  name: string;
  permissionIds: string[];
}

interface PermissionItem {
  id: string;
  code: string;
  description: string | null;
}

interface PrivateVideoItem {
  id: string;
  title: string;
}

export function UsersClient({
  currentAdminId,
  users,
  roles,
  permissions,
  privateVideos,
}: {
  currentAdminId: string;
  users: UserItem[];
  roles: RoleItem[];
  permissions: PermissionItem[];
  privateVideos: PrivateVideoItem[];
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'users' | 'permissions' | 'videoAccess'>('users');
  const [search, setSearch] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  // Create User Form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('USER');

  // Edit User state
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('USER');
  const [editPassword, setEditPassword] = useState('');

  // Private Video Access state
  const [selectedAccessUser, setSelectedAccessUser] = useState(users[0]?.id || '');
  const [selectedAccessVideo, setSelectedAccessVideo] = useState(privateVideos[0]?.id || '');

  async function postApi(payload: Record<string, unknown>, successMessage?: string) {
    setBusy(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'err', text: data.error || 'Action failed.' });
        return false;
      }
      if (successMessage) {
        setFeedback({ type: 'ok', text: successMessage });
      }
      router.refresh();
      return true;
    } catch {
      setFeedback({ type: 'err', text: 'Network error.' });
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    const ok = await postApi(
      {
        action: 'CREATE_USER',
        name: newName,
        username: newUsername,
        email: newEmail,
        password: newPassword,
        roleName: newRole,
      },
      `User "${newEmail}" created successfully.`
    );
    if (ok) {
      setNewName('');
      setNewUsername('');
      setNewEmail('');
      setNewPassword('');
      setNewRole('USER');
      setShowCreateForm(false);
    }
  }

  function startEdit(u: UserItem) {
    setEditingUser(u);
    setEditName(u.name || '');
    setEditUsername(u.username || '');
    setEditEmail(u.email);
    setEditRole(u.role);
    setEditPassword('');
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUser) return;
    const ok = await postApi(
      {
        action: 'EDIT_USER',
        userId: editingUser.id,
        name: editName,
        username: editUsername,
        email: editEmail,
        roleName: editRole,
        newPassword: editPassword,
      },
      `Updated user "${editEmail}".`
    );
    if (ok) {
      setEditingUser(null);
    }
  }

  async function handleDeleteUser(u: UserItem) {
    if (!confirm(`Delete user "${u.email}"?`)) return;
    await postApi({ action: 'DELETE_USER', userId: u.id }, `Deleted user "${u.email}".`);
  }

  async function handleGrantVideoAccess(e: React.FormEvent) {
    e.preventDefault();
    await postApi(
      { action: 'GRANT_VIDEO_ACCESS', userId: selectedAccessUser, videoId: selectedAccessVideo },
      'Private video watch permission granted.'
    );
  }

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      u.email.toLowerCase().includes(q) ||
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.username && u.username.toLowerCase().includes(q))
    );
  });

  const roleOrder = ['USER', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN'];
  const sortedRoles = [...roles].sort((a, b) => roleOrder.indexOf(a.name) - roleOrder.indexOf(b.name));

  return (
    <div className="space-y-6">
      {/* Top Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
              activeTab === 'users'
                ? 'bg-violet-600 text-white'
                : 'border border-white/10 bg-bg-card text-slate-300 hover:border-violet-500'
            }`}
          >
            <UserPlus className="h-4 w-4" />
            Users & Create ({users.length})
          </button>

          <button
            onClick={() => setActiveTab('permissions')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
              activeTab === 'permissions'
                ? 'bg-violet-600 text-white'
                : 'border border-white/10 bg-bg-card text-slate-300 hover:border-violet-500'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            Role Permissions
          </button>

          <button
            onClick={() => setActiveTab('videoAccess')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
              activeTab === 'videoAccess'
                ? 'bg-violet-600 text-white'
                : 'border border-white/10 bg-bg-card text-slate-300 hover:border-violet-500'
            }`}
          >
            <Lock className="h-4 w-4" />
            Private Video Permissions
          </button>
        </div>

        {activeTab === 'users' && (
          <button
            onClick={() => setShowCreateForm((v) => !v)}
            className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-5 py-2 text-sm font-semibold text-white hover:bg-violet-500 transition"
          >
            <UserPlus className="h-4 w-4" />
            {showCreateForm ? 'Close Form' : '+ Create New User'}
          </button>
        )}
      </div>

      {feedback && (
        <div
          className={`rounded-xl border p-4 text-sm ${
            feedback.type === 'ok'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
              : 'border-red-500/30 bg-red-500/10 text-red-300'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* TAB 1: USERS & CREATE USER */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {showCreateForm && (
            <form
              onSubmit={handleCreateUser}
              className="space-y-4 rounded-2xl border border-violet-500/30 bg-bg-card p-6"
            >
              <h2 className="text-lg font-bold text-white">Create New User Account</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="block text-xs text-slate-400">Full Name *</label>
                  <input
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Aung Aung"
                    className="mt-1 w-full rounded-xl border border-white/10 bg-bg-secondary px-3.5 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400">Username (Optional)</label>
                  <input
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="e.g. aungaung"
                    className="mt-1 w-full rounded-xl border border-white/10 bg-bg-secondary px-3.5 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="mt-1 w-full rounded-xl border border-white/10 bg-bg-secondary px-3.5 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400">Password (min 8 chars) *</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="mt-1 w-full rounded-xl border border-white/10 bg-bg-secondary px-3.5 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400">Assign Role *</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-bg-secondary px-3.5 py-2 text-sm text-white"
                  >
                    <option value="USER">USER (Viewer / Client)</option>
                    <option value="MODERATOR">MODERATOR</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
                >
                  {busy ? 'Creating...' : 'Create Account'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Edit User Modal / Panel */}
          {editingUser && (
            <form
              onSubmit={handleSaveEdit}
              className="space-y-4 rounded-2xl border border-sky-500/30 bg-bg-card p-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">Edit User: {editingUser.email}</h2>
                <button type="button" onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="block text-xs text-slate-400">Full Name</label>
                  <input
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-bg-secondary px-3.5 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400">Username</label>
                  <input
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-bg-secondary px-3.5 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400">Email</label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-bg-secondary px-3.5 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400">Role</label>
                  <select
                    disabled={editingUser.id === currentAdminId}
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-bg-secondary px-3.5 py-2 text-sm text-white disabled:opacity-50"
                  >
                    <option value="USER">USER</option>
                    <option value="MODERATOR">MODERATOR</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400">New Password (Leave blank to keep current)</label>
                  <input
                    type="password"
                    minLength={8}
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Optional new password"
                    className="mt-1 w-full rounded-xl border border-white/10 bg-bg-secondary px-3.5 py-2 text-sm text-white"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-500"
              >
                <Check className="h-4 w-4" /> Save Changes
              </button>
            </form>
          )}

          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users by name, username, or email..."
              className="w-full rounded-xl border border-white/10 bg-bg-card py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-400 focus:border-violet-500 focus:outline-none"
            />
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-bg-card">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/10 text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3 text-right">Manage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredUsers.map((u) => {
                  const isSelf = u.id === currentAdminId;
                  return (
                    <tr key={u.id}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-white">
                          {u.name || 'User'}{' '}
                          {u.username && <span className="text-xs text-slate-400">(@{u.username})</span>}
                        </div>
                        <div className="text-xs text-slate-400">{u.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          disabled={isSelf || busy}
                          value={u.role}
                          onChange={(e) =>
                            postApi({ userId: u.id, roleName: e.target.value }, `Role changed to ${e.target.value}.`)
                          }
                          className="rounded-lg border border-white/10 bg-bg-secondary px-2.5 py-1.5 text-xs text-white disabled:opacity-60"
                        >
                          <option value="USER">USER</option>
                          <option value="MODERATOR">MODERATOR</option>
                          <option value="ADMIN">ADMIN</option>
                          <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          disabled={isSelf || busy}
                          onClick={() =>
                            postApi(
                              { userId: u.id, status: u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' },
                              `Status updated for ${u.email}.`
                            )
                          }
                          className={`rounded-full px-3 py-1 text-xs font-medium disabled:opacity-60 ${
                            u.status === 'ACTIVE'
                              ? 'bg-emerald-500/15 text-emerald-300'
                              : 'bg-red-500/15 text-red-300'
                          }`}
                        >
                          {u.status}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">{u.createdAt}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => startEdit(u)}
                            className="rounded-lg border border-white/10 bg-bg-secondary p-1.5 text-slate-300 hover:border-violet-500 hover:text-white"
                            title="Edit User / Reset Password"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          {!isSelf && (
                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="rounded-lg border border-red-500/20 bg-red-500/10 p-1.5 text-red-400 hover:bg-red-500/20"
                              title="Delete User"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: ROLE PERMISSIONS MATRIX */}
      {activeTab === 'permissions' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-bg-card p-5 text-sm text-slate-300">
            Configure granular system permissions for each Role. Changes save immediately.
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-bg-card">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/10 text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-4 py-3">Permission</th>
                  {sortedRoles.map((r) => (
                    <th key={r.id} className="px-4 py-3 text-center">
                      {r.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {permissions.map((perm) => (
                  <tr key={perm.id}>
                    <td className="px-4 py-3">
                      <div className="font-mono text-xs font-semibold text-violet-300">{perm.code}</div>
                      {perm.description && <div className="text-xs text-slate-400">{perm.description}</div>}
                    </td>
                    {sortedRoles.map((role) => {
                      const checked = role.permissionIds.includes(perm.id);
                      const isSuperAdmin = role.name === 'SUPER_ADMIN';
                      return (
                        <td key={role.id} className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSuperAdmin ? true : checked}
                            disabled={isSuperAdmin || busy}
                            onChange={(e) =>
                              postApi(
                                {
                                  action: 'TOGGLE_ROLE_PERMISSION',
                                  roleId: role.id,
                                  permissionId: perm.id,
                                  enabled: e.target.checked,
                                },
                                `Updated ${perm.code} for ${role.name}.`
                              )
                            }
                            className="h-4 w-4 rounded border-white/20 bg-bg-secondary text-violet-600 focus:ring-violet-500"
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PRIVATE VIDEO ACCESS PERMISSIONS */}
      {activeTab === 'videoAccess' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-bg-card p-6">
            <h2 className="text-lg font-bold text-white">Grant Watch Permission to Private Videos</h2>
            <p className="mt-1 text-xs text-slate-400">
              Only explicitly permitted users (and Admins) can watch videos set to PRIVATE visibility.
            </p>

            {privateVideos.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-white/15 bg-bg-secondary p-6 text-sm text-slate-400">
                No PRIVATE videos exist yet. Set a video&apos;s visibility to PRIVATE in Video Management to assign user permissions here.
              </div>
            ) : (
              <form onSubmit={handleGrantVideoAccess} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <select
                  value={selectedAccessUser}
                  onChange={(e) => setSelectedAccessUser(e.target.value)}
                  className="rounded-xl border border-white/10 bg-bg-secondary px-3.5 py-2.5 text-sm text-white"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name || u.email} ({u.email})
                    </option>
                  ))}
                </select>

                <select
                  value={selectedAccessVideo}
                  onChange={(e) => setSelectedAccessVideo(e.target.value)}
                  className="rounded-xl border border-white/10 bg-bg-secondary px-3.5 py-2.5 text-sm text-white"
                >
                  {privateVideos.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.title}
                    </option>
                  ))}
                </select>

                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-500"
                >
                  Grant Permission
                </button>
              </form>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-bg-card p-6">
            <h3 className="mb-4 font-bold text-white">Active Private Video Permissions</h3>
            <div className="space-y-3">
              {users.filter((u) => u.privateVideoIds.length > 0).length === 0 ? (
                <p className="text-sm text-slate-400">No explicit private video permissions assigned yet.</p>
              ) : (
                users
                  .filter((u) => u.privateVideoIds.length > 0)
                  .map((u) => (
                    <div key={u.id} className="rounded-xl border border-white/10 bg-bg-secondary p-4">
                      <div className="font-medium text-white">
                        {u.name || u.email} <span className="text-xs text-slate-400">({u.email})</span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {u.privateVideoIds.map((vidId) => {
                          const vid = privateVideos.find((v) => v.id === vidId);
                          return (
                            <span
                              key={vidId}
                              className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs text-violet-200"
                            >
                              {vid?.title || vidId}
                              <button
                                onClick={() =>
                                  postApi(
                                    { action: 'REVOKE_VIDEO_ACCESS', userId: u.id, videoId: vidId },
                                    'Permission revoked.'
                                  )
                                }
                                className="text-red-400 hover:text-red-300"
                                title="Revoke"
                              >
                                ×
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
