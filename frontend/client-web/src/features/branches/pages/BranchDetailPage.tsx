import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Edit, Mail, MapPin, Phone } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/common/StatusBadge";
import { getStatusVariant, humanize } from "@/lib/status";
import { PageHeader } from "@/components/common/PageHeader";
import { NotFound } from "@/components/common/NotFound";
import { DescriptionList } from "@/components/common/DescriptionList";

import { useBranchesStore } from "../hooks/useBranchesStore";
import { BranchEditDialog } from "../components/BranchEditDialog";
import { formatDate, formatNumber } from "@/lib/utils";
import { usePermissions } from "@/hooks/usePermissions";

export function BranchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { getBranch } = useBranchesStore();
  const { can } = usePermissions();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);

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
                  variant={getStatusVariant(branch.status)}
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
            <DescriptionList
              items={[
                { label: "Manager", value: branch.manager || "—" },
                { label: "Established", value: formatDate(branch.createdAt) },
              ]}
            />
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

      <BranchEditDialog
        branch={editOpen ? branch : null}
        onOpenChange={setEditOpen}
      />
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
