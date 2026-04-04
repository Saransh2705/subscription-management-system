"use client";

import { useEffect, useState } from "react";
import type { AppRole, StaffUser } from "@/lib/roles";
import { ROLES } from "@/lib/roles";
import { toast } from "@/components/ui/sonner";

export default function StaffPanelClient() {
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<AppRole>("STAFF");
  const [inviteLoading, setInviteLoading] = useState(false);

  const fetchUsers = async () => {
    const response = await fetch("/api/staff/users");
    const payload = await response.json();

    if (!response.ok) {
      toast.error(payload.error || "Unable to load staff users");
      setLoading(false);
      return;
    }

    setUsers(payload.users);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const inviteUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setInviteLoading(true);

    const response = await fetch("/api/staff/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
    });

    const payload = await response.json();

    if (!response.ok) {
      toast.error(payload.error || "Failed to invite user");
      setInviteLoading(false);
      return;
    }

    toast.success("Invite sent via magic link");
    setInviteEmail("");
    setInviteRole("STAFF");
    setInviteLoading(false);
    fetchUsers();
  };

  const updateUser = async (id: string, updates: Partial<Pick<StaffUser, "role" | "is_active">>) => {
    const response = await fetch(`/api/staff/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });

    const payload = await response.json();

    if (!response.ok) {
      toast.error(payload.error || "Failed to update user");
      return;
    }

    toast.success("User updated");
    fetchUsers();
  };

  return (
    <div className="glass-card p-6 md:p-8 rounded-2xl glow-border">
      <h1 className="text-2xl md:text-3xl font-bold mb-2">Staff Panel</h1>
      <p className="text-muted-foreground mb-8">Manage users, roles, and account status.</p>

      <form onSubmit={inviteUser} className="grid md:grid-cols-3 gap-3 mb-8">
        <input
          type="email"
          className="dark-input w-full"
          placeholder="staff@company.com"
          value={inviteEmail}
          onChange={(event) => setInviteEmail(event.target.value)}
          required
        />
        <select
          className="dark-input w-full"
          value={inviteRole}
          onChange={(event) => setInviteRole(event.target.value as AppRole)}
        >
          {ROLES.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
        <button disabled={inviteLoading} className="glow-button rounded-xl disabled:opacity-50">
          {inviteLoading ? "Sending..." : "Add User"}
        </button>
      </form>

      {loading ? (
        <p className="text-muted-foreground">Loading users...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-border">
                <th className="py-3">Email</th>
                <th className="py-3">Role</th>
                <th className="py-3">Status</th>
                <th className="py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-border/50">
                  <td className="py-3">{user.email}</td>
                  <td className="py-3">
                    <select
                      className="dark-input"
                      value={user.role}
                      onChange={(event) =>
                        updateUser(user.id, {
                          role: event.target.value as AppRole,
                        })
                      }
                    >
                      {ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3">{user.is_active ? "Active" : "Disabled"}</td>
                  <td className="py-3">
                    <button
                      className="glass-card px-3 py-2 rounded-lg"
                      onClick={() => updateUser(user.id, { is_active: !user.is_active })}
                    >
                      {user.is_active ? "Disable" : "Enable"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
