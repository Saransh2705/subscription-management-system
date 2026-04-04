"use client";

import { useState, useEffect } from "react";
import { UserPlus, Mail, Shield, CheckCircle, XCircle } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { addStaffAction, getStaffListAction } from "./actions";

export default function StaffPage() {
  const [loading, setLoading] = useState(false);
  const [staff, setStaff] = useState<any[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  useEffect(() => {
    loadStaffList();
  }, []);

  async function loadStaffList() {
    setLoadingList(true);
    const result = await getStaffListAction();
    if (result.staff) {
      setStaff(result.staff);
    }
    setLoadingList(false);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const result = await addStaffAction(formData);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Staff member added! Invitation email sent.");
      event.currentTarget.reset();
      loadStaffList();
    }

    setLoading(false);
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          Staff <span className="gradient-text">Management</span>
        </h1>
        <p className="text-muted-foreground">Add and manage your team members</p>
      </div>

      {/* Add Staff Form */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <UserPlus className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-bold">Add New Staff Member</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                Email Address
              </label>
              <input
                type="email"
                name="email"
                required
                className="dark-input w-full"
                placeholder="staff@company.com"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Credentials will be sent to this email
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4 text-secondary" />
                Role
              </label>
              <select name="role" className="dark-input w-full" required>
                <option value="VIEWER">Viewer</option>
                <option value="STAFF">Staff</option>
                <option value="MANAGER">Manager</option>
                <option value="ADMIN">Admin</option>
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                Assign appropriate access level
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="glow-button px-6 py-3 rounded-xl disabled:opacity-50 flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            {loading ? "Adding Staff..." : "Add Staff Member"}
          </button>
        </form>
      </div>

      {/* Staff List */}
      <div className="glass-card p-6 rounded-2xl">
        <h2 className="text-xl font-bold mb-6">Current Staff Members</h2>

        {loadingList ? (
          <div className="text-center py-8 text-muted-foreground">Loading staff...</div>
        ) : staff.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No staff members yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Email</th>
                  <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Role</th>
                  <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Added</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((member) => (
                  <tr key={member.id} className="border-b border-border/50 hover:bg-muted/20 transition-all">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xs font-bold">
                          {member.email[0].toUpperCase()}
                        </div>
                        <span className="text-sm">{member.email}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs px-2 py-1 rounded-full glass-card">
                        {member.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {member.is_active ? (
                        <span className="flex items-center gap-1 text-xs text-green-500">
                          <CheckCircle className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-destructive">
                          <XCircle className="w-3 h-3" /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">
                      {new Date(member.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
