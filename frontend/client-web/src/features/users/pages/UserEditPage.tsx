import { useNavigate, useParams } from "react-router-dom";
import { UserForm } from "../components/UserForm";
import { useUsersStore } from "../hooks/useUsersStore";
import { usePermissions } from "@/hooks/usePermissions";
import { NotFound } from "@/components/common/NotFound";

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
    <UserForm
      initial={user}
      title={`Edit ${user.fullName}`}
      description="Update user details and role."
      submitLabel="Save changes"
      onSubmit={(data) => {
        updateUser(user.id, data);
        navigate("/users");
      }}
    />
  );
}
