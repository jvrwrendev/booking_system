import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { UserForm } from "../components/UserForm";
import { useUsersStore } from "../hooks/useUsersStore";
import { getUser as fetchUser } from "../services/users.service";
import { usePermissions } from "@/hooks/usePermissions";
import { NotFound } from "@/components/common/NotFound";
import { FormPageLayout } from "@/components/common/FormPageLayout";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { ROLE_LABELS } from "@/lib/permissions";
import { formatStatus } from "../lib/user-mapper";
import { ApiError } from "@/lib/api-client";
import type { AuthUser } from "@/types/auth";

export function UserEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { editUser } = useUsersStore();
  const { can } = usePermissions();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadSignal, setReloadSignal] = useState(0);

  useEffect(() => {
    if (!id) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setLoadError(null);

    fetchUser(id)
      .then((result) => {
        if (!cancelled) setUser(result);
      })
      .catch((error) => {
        if (cancelled) return;
        // A 404 means the record is gone; anything else is a transient failure
        // worth retrying, so keep the shell and report it.
        if (error instanceof ApiError && error.status === 404) {
          setNotFound(true);
        } else {
          setLoadError(
            error instanceof ApiError ? error.message : "Could not load this user."
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, reloadSignal]);

  if (!can("users.manage")) {
    return <NotFound permission title="Permission denied" />;
  }

  if (loading) {
    return <LoadingState variant="detail" />;
  }

  if (loadError) {
    return (
      <div className="space-y-6">
        <ErrorState
          title="Couldn't load this user"
          message={loadError}
          onRetry={() => setReloadSignal((n) => n + 1)}
        />
      </div>
    );
  }

  if (notFound || !user) {
    return <NotFound title="User not found" backHref="/users" />;
  }

  return (
    <FormPageLayout
      title={user.fullName}
      description="Update the details of this account."
      backHref="/users"
      breadcrumbs={[
        { label: "Administration" },
        { label: "Users", href: "/users" },
        { label: user.fullName },
        { label: "Edit" },
      ]}
      meta={[
        { label: "ID", value: user.id },
        { label: "Role", value: ROLE_LABELS[user.role] },
        { label: "Status", value: formatStatus(user.status) },
        {
          label: "Created",
          value: new Date(user.createdAt).toLocaleDateString(),
        },
      ]}
    >
      <UserForm
        key={user.id}
        initial={user}
        submitting={submitting}
        submitError={submitError}
        onSubmit={async (data) => {
          setSubmitting(true);
          setSubmitError(null);
          try {
            await editUser(user.id, data);
            navigate("/users");
          } catch (error) {
            setSubmitError(
              error instanceof ApiError ? error.message : "Could not save the changes."
            );
            setSubmitting(false);
          }
        }}
        onCancel={() => navigate("/users")}
      />
    </FormPageLayout>
  );
}
