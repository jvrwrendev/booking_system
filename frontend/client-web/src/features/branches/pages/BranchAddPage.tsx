import { useNavigate } from "react-router-dom";
import { Building2, Check, Info } from "lucide-react";

import { Button } from "@/components/ui/button";
import { BranchForm } from "../components/BranchForm";
import { useBranchesStore } from "../hooks/useBranchesStore";
import { usePermissions } from "@/hooks/usePermissions";
import { NotFound } from "@/components/common/NotFound";
import { FormPageLayout } from "@/components/common/FormPageLayout";
import { DetailsPanel } from "@/components/common/DetailsPanel";

export function BranchAddPage() {
  const navigate = useNavigate();
  const { addBranch, branches } = useBranchesStore();
  const { can } = usePermissions();

  if (!can("branches.manage")) {
    return <NotFound permission title="Permission denied" />;
  }

  const totalBranches = branches.length;
  const activeBranches = branches.filter((b) => b.status === "active").length;

  return (
    <FormPageLayout
      fullscreen
      title="Add branch"
      description="Register a new branch location. The branch will be available for inventory and stock management."
      backHref="/branches"
      breadcrumbs={[
        { label: "People" },
        { label: "Branches", href: "/branches" },
        { label: "Add" },
      ]}
      topActions={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/branches")}
          >
            Cancel
          </Button>
          <Button type="submit" form="branch-add-form" className="min-w-[140px]">
            <Building2 className="h-4 w-4" />
            Create branch
          </Button>
        </>
      }
      sidebar={
        <DetailsPanel
          title="Branch details"
          description="Helpful context before you save a new record."
          items={[
            {
              label: "Account type",
              value: "Branch location",
              hint: "Used for inventory, stock, and agent assignments.",
            },
            {
              label: "Branch code",
              value: "Auto-uppercased",
              hint: "Short identifier shown across the system.",
            },
            {
              label: "Network",
              value: `${activeBranches} of ${totalBranches} active`,
              hint: "Inactive branches stay visible but stop receiving stock.",
            },
          ]}
        >
          <div className="space-y-3">
            <div className="flex items-start gap-2.5">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                Make sure the branch code is unique. Codes are commonly shown
                on receipts and pick lists.
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                New branches start as <span className="font-medium text-foreground">active</span>.
                Toggle the status after creation if you need to delay launch.
              </p>
            </div>
          </div>
        </DetailsPanel>
      }
    >
      <BranchForm
        formId="branch-add-form"
        hideFooter
        onSubmit={(data) => {
          addBranch(data);
          navigate("/branches");
        }}
        onCancel={() => navigate("/branches")}
      />
    </FormPageLayout>
  );
}