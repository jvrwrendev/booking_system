import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Edit, Mail, MapPin, Phone } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  StatusBadge,
  getStatusVariantFromGeneric,
  humanize,
} from "@/components/common/StatusBadge";
import { PageHeader } from "@/components/common/PageHeader";
import { NotFound } from "@/components/common/NotFound";

import { useBranchesStore } from "../hooks/useBranchesStore";
import { formatDate, formatNumber } from "@/lib/utils";
import { usePermissions } from "@/hooks/usePermissions";

export function BranchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { getBranch } = useBranchesStore();
  const { can } = usePermissions();
  const navigate = useNavigate();

  const branch = id ? getBranch(id) : undefined;
  if (!branch) {
    return <NotFound title="Branch not found" backHref="/branches" />;
  }

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3"
        onClick={() => navigate("/branches")}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to branches
      </Button>

      <PageHeader
        title={branch.name}
        description={`Code: ${branch.code}`}
        breadcrumbs={[
          { label: "People" },
          { label: "Branches", href: "/branches" },
          { label: branch.name },
        ]}
        actions={
          can("branches.manage") && (
            <Button asChild>
              <Link to={`/branches/${branch.id}/edit`}>
                <Edit className="h-4 w-4" />
                Edit
              </Link>
            </Button>
          )
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Branch Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-base font-semibold text-primary">
                {branch.code.replace("AGR-", "")}
              </div>
              <div>
                <div className="text-base font-semibold">{branch.name}</div>
                <StatusBadge
                  variant={getStatusVariantFromGeneric(branch.status)}
                  label={humanize(branch.status)}
                />
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                {branch.address || "—"}
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                {branch.contactNumber || "—"}
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                {branch.email}
              </div>
            </div>
            <Separator />
            <dl className="grid grid-cols-2 gap-4">
              <InfoRow label="Manager" value={branch.manager || "—"} />
              <InfoRow label="Established" value={formatDate(branch.createdAt)} />
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Products" value={formatNumber(branch.totalProducts)} />
            <Row label="Stock units" value={formatNumber(branch.totalStock)} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
