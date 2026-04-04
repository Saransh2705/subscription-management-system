"use client";

import { useState } from "react";
import { UserCog, Mail, ShieldCheck, ShieldAlert, Ban, Check, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "sonner";
import { inviteUser, toggleUserStatus, updateUserRole } from "@/lib/actions/staff";
import type { UserProfile, UserRole } from "@/lib/types/auth";
import { useRouter } from "next/navigation";

const roleColors = {
  SYSTEM_ADMIN: "bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400",
  ADMIN: "bg-red-500/10 text-red-500 border-red-500/20",
  MANAGER: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  STAFF: "bg-green-500/10 text-green-500 border-green-500/20",
  VIEWER: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

const roleIcons = {
  SYSTEM_ADMIN: Crown,
  ADMIN: ShieldAlert,
  MANAGER: ShieldCheck,
  STAFF: UserCog,
  VIEWER: UserCog,
};

interface StaffTableProps {
  initialUsers: UserProfile[];
}

export function StaffTableClient({ initialUsers }: StaffTableProps) {
  const router = useRouter();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [inviteForm, setInviteForm] = useState({ 
    email: "", 
    role: "VIEWER" as UserRole 
  });
  const [newRole, setNewRole] = useState<UserRole>("VIEWER");
  const [loading, setLoading] = useState(false);

  const handleInvite = async () => {
    if (!inviteForm.email) {
      toast.error("Please enter an email address");
      return;
    }

    setLoading(true);
    const result = await inviteUser(inviteForm.email, inviteForm.role);
    
    if (result.success) {
      toast.success("Invite sent successfully!");
      setInviteOpen(false);
      setInviteForm({ email: "", role: "VIEWER" });
      router.refresh();
    } else {
      toast.error(result.error || "Failed to send invite");
    }
    setLoading(false);
  };

  const handleToggleStatus = async (user: UserProfile) => {
    const result = await toggleUserStatus(user.id, !user.is_active);
    
    if (result.success) {
      toast.success(result.message);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to update user status");
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedUser) return;

    setLoading(true);
    const result = await updateUserRole(selectedUser.id, newRole);
    
    if (result.success) {
      toast.success(result.message);
      setRoleDialogOpen(false);
      setSelectedUser(null);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to update user role");
    }
    setLoading(false);
  };

  const openRoleDialog = (user: UserProfile) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setRoleDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setInviteOpen(true)} className="gap-2">
          <Mail className="h-4 w-4" /> Invite User
        </Button>
      </div>

      {initialUsers.length === 0 ? (
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
                  <TableHead>Password</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialUsers.map((user) => {
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
                          {user.role === 'SYSTEM_ADMIN' ? (
                            <Badge variant="outline" className="text-xs text-muted-foreground">
                              Protected
                            </Badge>
                          ) : (
                            <>
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
                            </>
                          )}
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
              <p className="text-xs text-muted-foreground">
                Note: SYSTEM_ADMIN role can only be set manually in the database
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleInvite} disabled={loading}>
              {loading ? "Sending..." : <><Mail className="h-4 w-4 mr-2" /> Send Invite</>}
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
              <p className="text-xs text-muted-foreground">
                Note: SYSTEM_ADMIN role can only be set manually in the database
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRole} disabled={loading}>
              {loading ? "Updating..." : "Update Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function StaffTableSkeleton() {
  return (
    <Card className="border border-border/50 shadow-sm">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Password</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
