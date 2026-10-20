import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Info, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { UserForm } from "../components/UserForm";
import { useUsersStore } from "../hooks/useUsersStore";
import { usePermissions } from "@/hooks/usePermissions";
import { NotFound } from "@/components/common/NotFound";
import { FormPageLayout } from "@/components/common/FormPageLayout";
import { DetailsPanel } from "@/components/common/DetailsPanel";
import { ApiError } from "@/lib/api-client";

export function UserAddPage() {
  const navigate = useNavigate();
  const { addUser } = useUsersStore();
  const { can } = usePermissions();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!can("users.manage")) {
    return <NotFound permission title="Permission denied" />;
  }

  return (
    <FormPageLayout
      fullscreen
      title="Add account"
      description="Create a new admin or super admin account with login credentials."
      backHref="/users"
      breadcrumbs={[
        { label: "Administration" },
        { label: "Users", href: "/users" },
        { label: "Add" },
      ]}
      topActions={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/users")}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="user-add-form"
            className="min-w-[140px]"
            disabled={submitting}
          >
            <UserPlus className="h-4 w-4" />
            {submitting ? "Creating..." : "Create account"}
          </Button>
        </>
      }
      sidebar={
        <DetailsPanel
          title="Account details"
          description="Helpful context before you save a new record."
          items={[
            {
              label: "Account type",
              value: "Staff login",
              hint: "Admins process orders while super admins also manage the system.",
            },
            {
              label: "Login method",
              value: "Email + password",
              hint: "Password must be at least 8 characters.",
            },
            {
              label: "Access",
              value: "Role-based permissions",
              hint: "Grant and revoke access in Roles & Permissions.",
            },
          ]}
        >
          <div className="space-y-3">
            <div className="flex items-start gap-2.5">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                Use the user&apos;s official full name so audit logs and orders stay
                consistent. Accounts are created active and can sign in immediately.
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                Inactive and suspended accounts cannot sign in until a super admin
                re-enables them.
              </p>
            </div>
          </div>
        </DetailsPanel>
      }
    >
      <UserForm
        formId="user-add-form"
        hideFooter
        submitting={submitting}
        submitError={submitError}
        onSubmit={async (data) => {
          setSubmitting(true);
          setSubmitError(null);
          try {
            await addUser(data);
            navigate("/users");
          } catch (error) {
            setSubmitError(
              error instanceof ApiError ? error.message : "Could not create the account."
            );
            setSubmitting(false);
          }
        }}
        onCancel={() => navigate("/users")}
      />
    </FormPageLayout>
  );
}
