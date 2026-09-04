import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { AuthUser } from "@/types/auth";
import type { UserFormValues } from "../hooks/useUsersStore";

interface UserFormProps {
  initial?: AuthUser;
  submitLabel?: string;
  onSubmit: (data: UserFormValues) => void;
  title: string;
  description: string;
}

export function UserForm({
  initial,
  submitLabel,
  onSubmit,
  title,
  description,
}: UserFormProps) {
  const navigate = useNavigate();
  const [values, setValues] = useState<UserFormValues>(
    initial
      ? {
          fullName: initial.fullName,
          email: initial.email,
          username: initial.username,
          role: initial.role,
          status: initial.status,
        }
      : {
          fullName: "",
          email: "",
          username: "",
          role: "ADMIN",
          status: "active",
        }
  );
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.fullName.trim() || !values.email.trim() || !values.username.trim()) {
      setError("All fields are required.");
      return;
    }
    onSubmit(values);
  };

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3"
        onClick={() => navigate("/users")}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to users
      </Button>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        {error && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">User Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={values.fullName}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, fullName: e.target.value }))
                  }
                  placeholder="e.g., Juan Dela Cruz"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  value={values.username}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, username: e.target.value }))
                  }
                  placeholder="username"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={values.email}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, email: e.target.value }))
                  }
                  placeholder="admin@agrivet.ph"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Role *</Label>
                <Select
                  value={values.role}
                  onValueChange={(v) =>
                    setValues((s) => ({ ...s, role: v as AuthUser["role"] }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={values.status}
                  onValueChange={(v) =>
                    setValues((s) => ({ ...s, status: v as AuthUser["status"] }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/users")}
          >
            Cancel
          </Button>
          <Button type="submit">
            {initial ? <Save className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
            {submitLabel}
          </Button>
        </div>
      </form>
    </div>
  );
}
