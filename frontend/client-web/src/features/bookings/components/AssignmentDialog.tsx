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
import { initials } from "@/lib/utils";
import type { AuthUser } from "@/types/auth";
import type { Booking } from "@/types/booking";

interface AssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: Booking;
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
  booking,
  admins,
  currentUser,
  onAssign,
}: AssignmentDialogProps) {
  const activeAdmins = useMemo(
    () => admins.filter((a) => a.role === "ADMIN" && a.status === "active"),
    [admins]
  );
  const initialAdminId =
    booking.assignedAdminId ??
    activeAdmins.find((a) => a.id !== booking.assignedAdminId)?.id ??
    activeAdmins[0]?.id ??
    "";

  const [selectedAdminId, setSelectedAdminId] = useState<string>(initialAdminId);

  useEffect(() => {
    if (open) {
      setSelectedAdminId(initialAdminId);
    }
  }, [open, initialAdminId]);

  const isReassign = Boolean(booking.assignedAdminId);

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
                Reassign booking
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 text-muted-foreground" />
                Assign booking
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isReassign
              ? "Select a new admin to take over this booking task. The previous assignment will be replaced."
              : "Assign this booking to an admin to review and process it."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
            <div className="font-medium">{booking.reference}</div>
            <div className="text-xs text-muted-foreground">
              {booking.customerName} · {booking.branchName}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Assign to admin
            </label>
            <Select
              value={selectedAdminId}
              onValueChange={setSelectedAdminId}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select admin" />
              </SelectTrigger>
              <SelectContent>
                {activeAdmins.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-[10px]">
                          {initials(a.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col text-left">
                        <span className="text-sm">{a.fullName}</span>
                        <span className="text-[10px] text-muted-foreground">
                          @{a.username}
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isReassign && booking.assignedAdminName && (
            <>
              <Separator />
              <div className="rounded-md border bg-background px-3 py-2 text-sm">
                <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Currently assigned to
                </div>
                <div className="mt-1 font-medium">
                  {booking.assignedAdminName}
                </div>
                {booking.assignedByName && (
                  <div className="text-xs text-muted-foreground">
                    By {booking.assignedByName}
                    {booking.assignmentDate &&
                      ` · ${new Date(booking.assignmentDate).toLocaleString()}`}
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
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedAdmin}>
            {isReassign ? "Reassign booking" : "Assign booking"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
