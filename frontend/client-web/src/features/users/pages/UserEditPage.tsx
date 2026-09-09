import { useNavigate, useParams } from "react-router-dom";

import { UserForm } from "../components/UserForm";
import { useUsersStore } from "../hooks/useUsersStore";
import { usePermissions } from "@/hooks/usePermissions";
import { NotFound } from "@/components/common/NotFound";
import { FormPageLayout } from "@/components/common/FormPageLayout";
import { ROLE_LABELS } from "@/lib/permissions";

export function UserEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getUser, updateUser } = useUsersStore();
  const { can } = usePermissions();

  const user = id ? getUser(id) : undefined;

  if (!can("users.manage")) {
    return <NotFound permission title="Permission denied" />;
  }
  if (!user) {
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
        { label: "Status", value: user.status },
        {
          label: "Created",
          value: new Date(user.createdAt).toLocaleDateString(),
        },
      ]}
    >
      <UserForm
        initial={user}
        onSubmit={(data) => {
          updateUser(user.id, data);
          navigate("/users");
        }}
        onCancel={() => navigate("/users")}
      />
    </FormPageLayout>
  );
}