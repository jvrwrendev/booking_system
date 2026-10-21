import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Building2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FormPageLayout } from "@/components/common/FormPageLayout";
import { LoadingState } from "@/components/common/LoadingState";
import { NotFound } from "@/components/common/NotFound";
import { SupplierForm } from "../components/SupplierForm";
import { useSuppliersStore } from "../hooks/useSuppliersStore";
import { usePermissions } from "@/hooks/usePermissions";
import { ApiError } from "@/lib/api-client";
import { getSupplier } from "../services/suppliers.service";
import type { Supplier, SupplierFormValues } from "@/types/supplier";

export function SupplierEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { editSupplier } = useSuppliersStore();
  const { can } = usePermissions();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setLoadError(null);
    setNotFound(false);
    try {
      setSupplier(await getSupplier(id));
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setNotFound(true);
      } else {
        setLoadError(
          err instanceof ApiError
            ? err.message
            : "Could not load the supplier.",
        );
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!can("suppliers.update")) {
    return <NotFound permission title="Permission denied" />;
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" disabled>
          Back to suppliers
        </Button>
        <LoadingState rows={4} showHeader={false} />
      </div>
    );
  }

  if (notFound || (!supplier && !loadError)) {
    return <NotFound title="Supplier not found" backHref="/suppliers" />;
  }

  if (!supplier || loadError) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/suppliers")}>
          Back to suppliers
        </Button>
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <span>{loadError ?? "Could not load the supplier."}</span>
          <Button variant="outline" size="sm" onClick={() => void load()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (values: SupplierFormValues) => {
    setSaving(true);
    setError(null);
    try {
      const updated = await editSupplier(supplier.id, values);
      setSupplier(updated);
      navigate("/suppliers");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not save the supplier.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormPageLayout
      fullscreen
      title="Edit supplier"
      description="Update the supplier's business details and availability."
      backHref="/suppliers"
      backLabel="Back to suppliers"
      breadcrumbs={[
        { label: "Operations" },
        { label: "Suppliers", href: "/suppliers" },
        { label: supplier.name },
        { label: "Edit" },
      ]}
      meta={[
        { label: "Products", value: `${supplier.productCount}` },
        {
          label: "Status",
          value: supplier.status === "active" ? "Active" : "Inactive",
        },
      ]}
      topActions={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/suppliers")}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="supplier-edit-form"
            className="min-w-[150px]"
            disabled={saving}
          >
            <Building2 className="h-4 w-4" />
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </>
      }
    >
      {error && (
        <div className="mb-6 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}
      <SupplierForm
        formId="supplier-edit-form"
        hideFooter
        initial={supplier}
        onSubmit={handleSubmit}
        onCancel={() => navigate("/suppliers")}
      />
    </FormPageLayout>
  );
}
