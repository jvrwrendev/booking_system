import { useNavigate } from "react-router-dom";
import { UserForm } from "../components/UserForm";
import { useUsersStore } from "../hooks/useUsersStore";
import { usePermissions } from "@/hooks/usePermissions";
import { NotFound } from "@/components/common/NotFound";

export function UserAddPage() {
  const navigate = useNavigate();
  const { addUser } = useUsersStore();
  const { can } = usePermissions();

  if (!can("users.manage")) {
    return <NotFound permission title="Permission denied" />;
  }

  return (
    <UserForm
      title="Add Admin"
      description="Create a new system administrator account."
      submitLabel="Create user"
      onSubmit={(data) => {
        addUser(data);
        navigate("/users");
      }}
    />
  );
}
