import { useNavigate } from "react-router-dom";
import { Check, Info, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CustomerForm } from "../components/CustomerForm";
import { useCustomersStore } from "../hooks/useCustomersStore";
import { usePermissions } from "@/hooks/usePermissions";
import { NotFound } from "@/components/common/NotFound";
import { FormPageLayout } from "@/components/common/FormPageLayout";
import { DetailsPanel } from "@/components/common/DetailsPanel";
import { useAgentsStore } from "@/features/agents/hooks/useAgentsStore";

export function CustomerAddPage() {
  const navigate = useNavigate();
  const { addCustomer } = useCustomersStore();
  const { agents } = useAgentsStore();
  const { can } = usePermissions();

  if (!can("customers.manage")) {
    return <NotFound permission title="Permission denied" />;
  }

  const activeAgents = agents.filter((a) => a.status === "active").length;

  return (
    <FormPageLayout
      fullscreen
      title="Add customer"
      description="Register a new customer account. Once added, the customer can be assigned to an agent."
      backHref="/customers"
      breadcrumbs={[
        { label: "People" },
        { label: "Customers", href: "/customers" },
        { label: "Add" },
      ]}
      topActions={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/customers")}
          >
            Cancel
          </Button>
          <Button type="submit" form="customer-add-form" className="min-w-[140px]">
            <UserPlus className="h-4 w-4" />
            Create customer
          </Button>
        </>
      }
      sidebar={
        <DetailsPanel
          title="Customer details"
          description="Helpful context before you save a new record."
          items={[
            {
              label: "Account type",
              value: "Customer",
              hint: "Customers can browse, book, and track their purchases.",
            },
            {
              label: "Login method",
              value: "Email + password",
              hint: "Password must be at least 8 characters.",
            },
            {
              label: "Available agents",
              value: `${activeAgents} active`,
              hint: "Only active agents can be assigned to a customer.",
            },
          ]}
        >
          <div className="space-y-3">
            <div className="flex items-start gap-2.5">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                Use the customer's legal name to keep records consistent across
                bookings and invoices.
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                Customers can be reassigned to another agent at any time.
              </p>
            </div>
          </div>
        </DetailsPanel>
      }
    >
      <CustomerForm
        formId="customer-add-form"
        hideFooter
        onSubmit={(data) => {
          addCustomer(data);
          navigate("/customers");
        }}
        onCancel={() => navigate("/customers")}
      />
    </FormPageLayout>
  );
}