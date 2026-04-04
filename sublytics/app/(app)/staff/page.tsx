"use client";

import { useState, useEffect } from "react";
import { UserCog, Plus, Mail, ShieldCheck, ShieldAlert, Ban, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "sonner";
import { getUsers, inviteUser, toggleUserStatus, updateUserRole } from "@/lib/actions/staff";
import type { UserProfile, UserRole } from "@/lib/types/auth";

const roleColors = {
  ADMIN: "bg-red-500/10 text-red-500 border-red-500/20",
  MANAGER: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  STAFF: "bg-green-500/10 text-green-500 border-green-500/20",
  VIEWER: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

const roleIcons = {
  ADMIN: ShieldAlert,
  MANAGER: ShieldCheck,
  STAFF: UserCog,
  VIEWER: UserCog,
};

export default function StaffPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [inviteForm, setInviteForm] = useState({ 
    email: "", 
    role: "VIEWER" as UserRole 
  });
  const [newRole, setNewRole] = useState<UserRole>("VIEWER");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const result = await getUsers();
    if (result.data) {
      setUsers(result.data);
    } else if (result.error) {
      toast.error(result.error);
    }
    setLoading(false);
  };

  const handleInvite = async () => {
    if (!inviteForm.email) {
      toast.error("Please enter an email address");
      return;
    }

    const result = await inviteUser(inviteForm.email, inviteForm.role);
    
    if (result.success) {
      toast.success("Invite sent successfully!");
      setInviteOpen(false);
      setInviteForm({ email: "", role: "VIEWER" });
      loadUsers();
    } else {
      toast.error(result.error || "Failed to send invite");
    }
  };

  const handleToggleStatus = async (user: UserProfile) => {
    const result = await toggleUserStatus(user.id, !user.is_active);
    
    if (result.success) {
      toast.success(result.message);
      loadUsers();
    } else {
      toast.error(result.error || "Failed to update user status");
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedUser) return;

    const result = await updateUserRole(selectedUser.id, newRole);
    
    if (result.success) {
      toast.success(result.message);
      setRoleDialogOpen(false);
      setSelectedUser(null);
      loadUsers();
    } else {
      toast.error(result.error || "Failed to update user role");
    }
  };

  const openRoleDialog = (user: UserProfile) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setRoleDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="page-container animate-fade-in">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Staff Management</h1>
          <p className="page-subtitle">Manage team members and their roles</p>
        </div>
        <Button onClick={() => setInviteOpen(true)} className="gap-2">
          <Mail className="h-4 w-4" /> Invite User
        </Button>
      </div>

      {users.length === 0 ? (
        <EmptyState 
          icon={UserCog} 
          title="No staff members yet" 
          description="Invite your first team member to get started." 
          action={
            <Button onClick={() => setInviteOpen(true)} className="gap-2">
              <Mail className="h-4 w-4" /> Invite User
            </Button>
          } 
        />
      ) : (
        <Card className="border border-border/50 shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Password Change</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                  const RoleIcon = roleIcons[user.role];
                  return (
                    <TableRow key={user.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={roleColors[user.role]}>
                          <RoleIcon className="h-3 w-3 mr-1" />
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.is_active ? "default" : "secondary"}>
                          {user.is_active ? "Active" : "Disabled"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.requires_password_change ? "outline" : "secondary"}>
                          {user.requires_password_change ? "Required" : "Set"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => openRoleDialog(user)}
                            className="h-8"
                          >
                            Change Role
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleToggleStatus(user)}
                            className={user.is_active ? "text-destructive hover:text-destructive h-8" : "text-green-600 hover:text-green-600 h-8"}
                          >
                            {user.is_active ? <Ban className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Invite User Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite New User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input 
                type="email"
                value={inviteForm.email} 
                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })} 
                placeholder="user@company.com" 
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select 
                value={inviteForm.role} 
                onValueChange={(v) => setInviteForm({ ...inviteForm, role: v as UserRole })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                  <SelectItem value="STAFF">Staff</SelectItem>
                  <SelectItem value="VIEWER">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button onClick={handleInvite}>
              <Mail className="h-4 w-4 mr-2" /> Send Invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>User</Label>
              <Input value={selectedUser?.email || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label>New Role</Label>
              <Select value={newRole} onValueChange={(v) => setNewRole(v as UserRole)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                  <SelectItem value="STAFF">Staff</SelectItem>
                  <SelectItem value="VIEWER">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateRole}>Update Role</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
