import { useState } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ImageUpload } from "@/components/common/ImageUpload";
import { BUSINESS_NAME } from "@/lib/constants";
import { useAuth } from "@/hooks/useAuth";
import { changePassword } from "@/features/auth/services/auth.service";
import { ApiError } from "@/lib/api-client";

/** Mirrors `api/src/modules/auth/dto/change-password.dto.ts`. */
const MIN_PASSWORD_LENGTH = 8;

const EMPTY_PASSWORD = { current: "", newPassword: "", confirm: "" };

export function SettingsPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    fullName: user?.fullName ?? "",
    email: user?.email ?? "",
    contactNumber: user?.contactNumber ?? "",
    avatar: user?.avatar,
  });
  const [password, setPassword] = useState(EMPTY_PASSWORD);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);
  const [general, setGeneral] = useState({
    businessName: BUSINESS_NAME,
    contactNumber: "+63 2 8123 4567",
    email: "support@agrivet.ph",
    address: "123 EDSA, Quezon City, Metro Manila",
    currency: "PHP",
  });
  const [booking, setBooking] = useState({
    autoConfirm: false,
    allowCancellation: true,
    cancellationWindow: 24,
    requireDeposit: false,
    depositPercent: 20,
  });
  const [inventory, setInventory] = useState({
    lowStockThreshold: 25,
    enableReservations: true,
    enableTransfers: true,
    autoReorder: false,
  });
  const [system, setSystem] = useState({
    enableNotifications: true,
    enableEmails: true,
    maintenanceMode: false,
    debugMode: false,
  });

  const handleSave = (section: string) => {
    toast.success(`${section} settings saved`);
  };

  const handleChangePassword = async () => {
    if (!password.current) {
      setPasswordError("Current password is required.");
      return;
    }
    if (password.newPassword.length < MIN_PASSWORD_LENGTH) {
      setPasswordError(
        `New password must be at least ${MIN_PASSWORD_LENGTH} characters.`
      );
      return;
    }
    if (password.newPassword !== password.confirm) {
      setPasswordError("New password and confirmation do not match.");
      return;
    }

    setPasswordError(null);
    setChangingPassword(true);
    try {
      await changePassword({
        currentPassword: password.current,
        newPassword: password.newPassword,
      });
      setPassword(EMPTY_PASSWORD);
      toast.success("Password updated", {
        description: "Other devices have been signed out.",
      });
    } catch (error) {
      setPasswordError(
        error instanceof ApiError
          ? error.message
          : "Could not change your password. Please try again."
      );
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Configure business, booking, inventory, and system preferences."
        breadcrumbs={[{ label: "Administration" }, { label: "Settings" }]}
      />

      <Tabs defaultValue="profile">
        <TabsList className="flex-wrap">
          <TabsTrigger value="profile">My Information</TabsTrigger>
          <TabsTrigger value="password">Change Password</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="booking">Booking</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>My Information</CardTitle>
              <CardDescription>
                Update your personal account details and profile picture.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                <div>
                  <Label>Profile Image</Label>
                  <div className="mt-1.5">
                    <ImageUpload
                      value={profile.avatar}
                      onChange={(img) =>
                        setProfile((p) => ({ ...p, avatar: img }))
                      }
                    />
                  </div>
                </div>
                <div className="space-y-4 md:col-span-2">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Full Name</Label>
                      <Input
                        value={profile.fullName}
                        onChange={(e) =>
                          setProfile((p) => ({ ...p, fullName: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={profile.email}
                        onChange={(e) =>
                          setProfile((p) => ({ ...p, email: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Contact Number</Label>
                      <Input
                        value={profile.contactNumber}
                        onChange={(e) =>
                          setProfile((p) => ({ ...p, contactNumber: e.target.value }))
                        }
                        placeholder="+63 9XX XXX XXXX"
                      />
                    </div>
                  </div>
                  <Separator />
                  <div className="flex justify-end">
                    <Button
                      onClick={() =>
                        toast.info("Profile editing is not available yet", {
                          description:
                            "The API has no self-profile update endpoint. Ask a super admin to change your name or email.",
                        })
                      }
                    >
                      <Save className="h-4 w-4" />
                      Save changes
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="password" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Changing your password signs you out on every other device.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-1 max-w-md">
                <div className="space-y-1.5">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={password.current}
                    onChange={(e) =>
                      setPassword((p) => ({ ...p, current: e.target.value }))
                    }
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={password.newPassword}
                    onChange={(e) =>
                      setPassword((p) => ({ ...p, newPassword: e.target.value }))
                    }
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                  <p className="text-xs text-muted-foreground">
                    At least {MIN_PASSWORD_LENGTH} characters.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                  <Input
                    id="confirm-new-password"
                    type="password"
                    value={password.confirm}
                    onChange={(e) =>
                      setPassword((p) => ({ ...p, confirm: e.target.value }))
                    }
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                </div>
              </div>
              {passwordError && (
                <div className="max-w-md rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {passwordError}
                </div>
              )}
              <Separator />
              <div className="flex justify-end">
                <Button onClick={handleChangePassword} disabled={changingPassword}>
                  <Save className="h-4 w-4" />
                  {changingPassword ? "Updating..." : "Update password"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="general" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Update your business profile and contact information.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Business Name</Label>
                  <Input
                    value={general.businessName}
                    onChange={(e) =>
                      setGeneral((g) => ({ ...g, businessName: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Contact Number</Label>
                  <Input
                    value={general.contactNumber}
                    onChange={(e) =>
                      setGeneral((g) => ({ ...g, contactNumber: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={general.email}
                    onChange={(e) =>
                      setGeneral((g) => ({ ...g, email: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Currency</Label>
                  <Input value={general.currency} disabled />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label>Address</Label>
                  <Textarea
                    rows={2}
                    value={general.address}
                    onChange={(e) =>
                      setGeneral((g) => ({ ...g, address: e.target.value }))
                    }
                  />
                </div>
              </div>
              <Separator />
              <div className="flex justify-end">
                <Button onClick={() => handleSave("General")}>
                  <Save className="h-4 w-4" />
                  Save changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="booking" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Booking Settings</CardTitle>
              <CardDescription>
                Define how bookings behave across the system.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Toggle
                label="Auto-confirm bookings"
                description="Automatically mark new bookings as Confirmed."
                checked={booking.autoConfirm}
                onCheckedChange={(v) =>
                  setBooking((b) => ({ ...b, autoConfirm: v }))
                }
              />
              <Toggle
                label="Allow customer cancellations"
                description="Permit customers to cancel bookings within a window."
                checked={booking.allowCancellation}
                onCheckedChange={(v) =>
                  setBooking((b) => ({ ...b, allowCancellation: v }))
                }
              />
              <div className="space-y-1.5">
                <Label>Cancellation window (hours)</Label>
                <Input
                  type="number"
                  value={booking.cancellationWindow}
                  onChange={(e) =>
                    setBooking((b) => ({
                      ...b,
                      cancellationWindow: Number(e.target.value) || 0,
                    }))
                  }
                  disabled={!booking.allowCancellation}
                />
              </div>
              <Toggle
                label="Require deposit"
                description="Require a deposit to confirm a booking."
                checked={booking.requireDeposit}
                onCheckedChange={(v) =>
                  setBooking((b) => ({ ...b, requireDeposit: v }))
                }
              />
              <div className="space-y-1.5">
                <Label>Deposit percentage</Label>
                <Input
                  type="number"
                  value={booking.depositPercent}
                  onChange={(e) =>
                    setBooking((b) => ({
                      ...b,
                      depositPercent: Number(e.target.value) || 0,
                    }))
                  }
                  disabled={!booking.requireDeposit}
                />
              </div>
              <Separator />
              <div className="flex justify-end">
                <Button onClick={() => handleSave("Booking")}>
                  <Save className="h-4 w-4" />
                  Save changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Settings</CardTitle>
              <CardDescription>
                Define stock thresholds and automation rules.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Low-stock threshold</Label>
                <Input
                  type="number"
                  value={inventory.lowStockThreshold}
                  onChange={(e) =>
                    setInventory((i) => ({
                      ...i,
                      lowStockThreshold: Number(e.target.value) || 0,
                    }))
                  }
                />
                <p className="text-[11px] text-muted-foreground">
                  Products at or below this quantity are flagged.
                </p>
              </div>
              <Toggle
                label="Enable stock reservations"
                description="Allow agents to temporarily reserve stock for bookings."
                checked={inventory.enableReservations}
                onCheckedChange={(v) =>
                  setInventory((i) => ({ ...i, enableReservations: v }))
                }
              />
              <Toggle
                label="Enable inter-branch transfers"
                description="Allow stock transfers between branches."
                checked={inventory.enableTransfers}
                onCheckedChange={(v) =>
                  setInventory((i) => ({ ...i, enableTransfers: v }))
                }
              />
              <Toggle
                label="Auto-reorder suggestions"
                description="Suggest reorder quantities when stock is low."
                checked={inventory.autoReorder}
                onCheckedChange={(v) =>
                  setInventory((i) => ({ ...i, autoReorder: v }))
                }
              />
              <Separator />
              <div className="flex justify-end">
                <Button onClick={() => handleSave("Inventory")}>
                  <Save className="h-4 w-4" />
                  Save changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>
                Internal preferences and developer options.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Toggle
                label="Enable in-app notifications"
                description="Show real-time notifications in the header."
                checked={system.enableNotifications}
                onCheckedChange={(v) =>
                  setSystem((s) => ({ ...s, enableNotifications: v }))
                }
              />
              <Toggle
                label="Send email notifications"
                description="Email customers and admins on key events."
                checked={system.enableEmails}
                onCheckedChange={(v) =>
                  setSystem((s) => ({ ...s, enableEmails: v }))
                }
              />
              <Toggle
                label="Maintenance mode"
                description="Disable write operations for the whole system."
                checked={system.maintenanceMode}
                onCheckedChange={(v) =>
                  setSystem((s) => ({ ...s, maintenanceMode: v }))
                }
              />
              <Toggle
                label="Debug mode"
                description="Verbose logging for development."
                checked={system.debugMode}
                onCheckedChange={(v) =>
                  setSystem((s) => ({ ...s, debugMode: v }))
                }
              />
              <Separator />
              <div className="flex justify-end">
                <Button onClick={() => handleSave("System")}>
                  <Save className="h-4 w-4" />
                  Save changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border bg-card px-4 py-3">
      <div>
        <div className="text-sm font-medium">{label}</div>
        {description && (
          <div className="text-xs text-muted-foreground">{description}</div>
        )}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}