import { useNavigate, useParams } from "react-router-dom";

import { BranchForm } from "../components/BranchForm";
import { useBranchesStore } from "../hooks/useBranchesStore";
import { usePermissions } from "@/hooks/usePermissions";
import { NotFound } from "@/components/common/NotFound";
import { FormPageLayout } from "@/components/common/FormPageLayout";

export function BranchEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getBranch, updateBranch } = useBranchesStore();
  const { can } = usePermissions();

  const branch = id ? getBranch(id) : undefined;

  if (!can("branches.manage")) {
    return <NotFound permission title="Permission denied" />;
  }
  if (!branch) {
    return <NotFound title="Branch not found" backHref="/branches" />;
  }

  return (
    <FormPageLayout
      title={branch.name}
      description="Update the details of this branch."
      backHref={`/branches/${branch.id}`}
      breadcrumbs={[
        { label: "People" },
        { label: "Branches", href: "/branches" },
        { label: branch.name, href: `/branches/${branch.id}` },
        { label: "Edit" },
      ]}
      meta={[
        { label: "Code", value: branch.code },
        { label: "Status", value: branch.status },
        { label: "Manager", value: branch.manager || "—" },
        { label: "Created", value: new Date(branch.createdAt).toLocaleDateString() },
      ]}
    >
      <BranchForm
        initial={branch}
        onSubmit={(data) => {
          updateBranch(branch.id, data);
          navigate(`/branches/${branch.id}`);
        }}
        onCancel={() => navigate(`/branches/${branch.id}`)}
      />
    </FormPageLayout>
  );
}
