import { useNavigate, useParams } from "react-router-dom";

import { CustomerForm } from "../components/CustomerForm";
import { useCustomersStore } from "../hooks/useCustomersStore";
import { usePermissions } from "@/hooks/usePermissions";
import { NotFound } from "@/components/common/NotFound";
import { FormPageLayout } from "@/components/common/FormPageLayout";
import { computeFullName } from "@/lib/utils";

export function CustomerEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getCustomer, updateCustomer } = useCustomersStore();
  const { can } = usePermissions();

  const customer = id ? getCustomer(id) : undefined;

  if (!can("customers.manage")) {
    return <NotFound permission title="Permission denied" />;
  }
  if (!customer) {
    return <NotFound title="Customer not found" backHref="/customers" />;
  }

  const fullName = computeFullName(
    customer.firstName,
    customer.middleName,
    customer.lastName,
    customer.suffix
  );

  return (
    <FormPageLayout
      title={fullName}
      description="Update the details of this customer."
      backHref={`/customers/${customer.id}`}
      breadcrumbs={[
        { label: "People" },
        { label: "Customers", href: "/customers" },
        { label: fullName, href: `/customers/${customer.id}` },
        { label: "Edit" },
      ]}
      meta={[
        { label: "ID", value: customer.id },
        { label: "Status", value: customer.status },
        { label: "Registered", value: new Date(customer.registeredDate).toLocaleDateString() },
        { label: "Agent", value: customer.assignedAgentName || "Unassigned" },
      ]}
    >
      <CustomerForm
        initial={customer}
        onSubmit={(data) => {
          updateCustomer(customer.id, data);
          navigate(`/customers/${customer.id}`);
        }}
        onCancel={() => navigate(`/customers/${customer.id}`)}
      />
    </FormPageLayout>
  );
}
