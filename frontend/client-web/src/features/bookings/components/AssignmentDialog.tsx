import { useEffect, useMemo, useState } from "react";
import { UserCheck, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { initials } from "@/lib/utils";
import { ROLE_LABELS } from "@/lib/permissions";
import type { AuthUser } from "@/types/auth";

export interface AssignmentTarget {
  reference: string;
  details: string;
  assignedAdminId?: string | null;
  assignedAdminName?: string | null;
  assignedByName?: string | null;
  assignmentDate?: string | null;
}

interface AssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: AssignmentTarget;
  admins: AuthUser[];
  currentUser: AuthUser;
  onAssign: (
    admin: Pick<AuthUser, "id" | "fullName">,
    by: Pick<AuthUser, "id" | "fullName">
  ) => void;
}

export function AssignmentDialog({
  open,
  onOpenChange,
  target,
  admins,
  currentUser,
  onAssign,
}: AssignmentDialogProps) {
  const activeAdmins = useMemo(
    () =>
      admins.filter(
        (a) =>
          a.role === "ADMIN" &&
          a.status === "active" &&
          a.id !== currentUser.id
      ),
    [admins, currentUser.id]
  );
  const initialAdminId =
    target.assignedAdminId ??
    activeAdmins.find((a) => a.id !== target.assignedAdminId)?.id ??
    activeAdmins[0]?.id ??
    "";

  const [selectedAdminId, setSelectedAdminId] = useState<string>(initialAdminId);

  useEffect(() => {
    if (open) {
      setSelectedAdminId(initialAdminId);
    }
  }, [open, initialAdminId]);

  const isReassign = Boolean(target.assignedAdminId);

  const handleAssignToMe = () => {
    onAssign(
      { id: currentUser.id, fullName: currentUser.fullName },
      { id: currentUser.id, fullName: currentUser.fullName }
    );
    onOpenChange(false);
  };

  const handleConfirm = () => {
    const admin = activeAdmins.find((a) => a.id === selectedAdminId);
    if (!admin) return;
    onAssign(
      { id: admin.id, fullName: admin.fullName },
      { id: currentUser.id, fullName: currentUser.fullName }
    );
    onOpenChange(false);
  };

  const selectedAdmin = activeAdmins.find((a) => a.id === selectedAdminId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isReassign ? (
              <>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
                Reassign task
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 text-muted-foreground" />
                Assign task
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isReassign
              ? "Select a new admin to take over this task. The previous assignment will be replaced."
              : "Assign this task to an admin to review and process it."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
            <div className="font-medium">{target.reference}</div>
            <div className="text-xs text-muted-foreground">
              {target.details}
            </div>
          </div>

            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Assign to
              </h3>
              <Button
                type="button"
                variant="outline"
                className="h-auto w-full justify-start gap-2 py-2"
                onClick={handleAssignToMe}
              >
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">
                    {initials(currentUser.fullName)}
                  </AvatarFallback>
                </Avatar>
                <span className="flex flex-col items-start text-left">
                  <span className="text-sm font-medium">
                    Assign to me{" "}
                    <span className="text-muted-foreground">(You)</span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {currentUser.fullName} · {ROLE_LABELS[currentUser.role]}
                  </span>
                </span>
                <UserCheck
                  className="ml-auto h-4 w-4 text-muted-foreground"
                  aria-hidden
                />
              </Button>

              <div className="flex items-center gap-3 py-0.5">
                <Separator className="flex-1" />
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  or choose an admin
                </span>
                <Separator className="flex-1" />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="assignment-admin"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Assign to admin
              </Label>
              <Select
                value={selectedAdminId}
                onValueChange={setSelectedAdminId}
              >
                <SelectTrigger id="assignment-admin" className="h-10">
                  <SelectValue placeholder="Select admin" />
                </SelectTrigger>
                <SelectContent>
                  {activeAdmins.length > 0 ? (
                    activeAdmins.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {initials(a.fullName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col text-left">
                            <span className="text-sm">{a.fullName}</span>
                            <span className="text-xs text-muted-foreground">
                              @{a.username}
                            </span>
                          </div>
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="__none" disabled>
                      No other active admins
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isReassign && target.assignedAdminName && (
            <>
              <Separator />
              <div className="rounded-md border bg-background px-3 py-2 text-sm">
                <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Currently assigned to
                </div>
                <div className="mt-1 font-medium">
                  {target.assignedAdminName}
                </div>
                {target.assignedByName && (
                  <div className="text-xs text-muted-foreground">
                    By {target.assignedByName}
                    {target.assignmentDate &&
                      ` · ${new Date(target.assignmentDate).toLocaleString()}`}
                  </div>
                )}
              </div>
            </>
          )}

          {selectedAdmin && (
            <div className="rounded-md border bg-background px-3 py-2 text-sm">
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Task assignment
              </div>
              <div className="mt-1 flex items-center gap-2">
                <Avatar className="h-7 w-7">
                  <AvatarFallback>{initials(selectedAdmin.fullName)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{selectedAdmin.fullName}</div>
                  <div className="text-xs text-muted-foreground">
                    Assigned by {currentUser.fullName}
                  </div>
                </div>
              </div>
            </div>
          )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedAdmin}>
            {isReassign ? "Reassign task" : "Assign task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
