import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Edit, Mail, MapPin, Phone, User } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/common/StatusBadge";
import { getStatusVariant, humanize } from "@/lib/status";
import { PageHeader } from "@/components/common/PageHeader";
import { NotFound } from "@/components/common/NotFound";
import { DescriptionList } from "@/components/common/DescriptionList";

import { useCustomersStore } from "../hooks/useCustomersStore";
import { CustomerEditDialog } from "../components/CustomerEditDialog";
import { formatCurrency, formatDate, initials } from "@/lib/utils";
import { usePermissions } from "@/hooks/usePermissions";

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { getCustomer } = useCustomersStore();
  const { can } = usePermissions();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);

  const customer = id ? getCustomer(id) : undefined;
  if (!customer) {
    return <NotFound title="Customer not found" backHref="/customers" />;
  }

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3"
        onClick={() => navigate("/customers")}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to customers
      </Button>

      <PageHeader
        title={customer.fullName}
        description={customer.email}
        breadcrumbs={[
          { label: "People" },
          { label: "Customers", href: "/customers" },
          { label: customer.fullName },
        ]}
        actions={
          can("customers.manage") && (
            <Button onClick={() => setEditOpen(true)}>
              <Edit className="h-4 w-4" aria-hidden />
              Edit
            </Button>
          )
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center gap-3">
              <Avatar className="h-14 w-14">
                <AvatarFallback>{initials(customer.fullName)}</AvatarFallback>
              </Avatar>
              <div>
                <div className="text-base font-semibold">{customer.fullName}</div>
                <StatusBadge
                  variant={getStatusVariant(customer.status)}
                  label={humanize(customer.status)}
                />
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                {customer.email}
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                {customer.contactNumber || "—"}
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                {customer.address || "—"}
              </div>
              <div className="flex items-start gap-2">
                <User className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                Assigned agent:{" "}
                <Link
                  to={`/agents/${customer.assignedAgentId}`}
                  className="text-primary hover:underline"
                >
                  {customer.assignedAgentName || "Unassigned"}
                </Link>
              </div>
            </div>
            <Separator />
            <DescriptionList
              items={[
                {
                  label: "Registered",
                  value: formatDate(customer.registeredDate),
                },
                {
                  label: "Total bookings",
                  value: String(customer.totalBookings),
                },
                {
                  label: "Total purchases",
                  value: formatCurrency(customer.totalPurchases),
                },
              ]}
            />
          </CardContent>
        </Card>
      </div>

      <CustomerEditDialog
        customer={editOpen ? customer : null}
        onOpenChange={setEditOpen}
      />
    </div>
  );
}

