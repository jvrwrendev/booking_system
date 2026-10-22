import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, PackagePlus } from "lucide-react";

import { FormDialog } from "@/components/common/FormDialog";
import { Stepper } from "@/components/common/Stepper";
import { DescriptionList } from "@/components/common/DescriptionList";
import { FormSection } from "@/components/common/FormPageLayout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ProductDetailsSection,
  ProductPricingSection,
  ProductPublishSection,
  ProductStockSection,
} from "./ProductFormSections";
import {
  PRODUCT_STEPS,
  stepForField,
  validateProduct,
  validateProductStep,
  type ProductField,
  type ProductStepId,
} from "../lib/productValidation";
import { useProductsStore } from "../hooks/useProductsStore";
import { useCategoriesStore } from "@/features/categories/hooks/useCategoriesStore";
import { ApiError } from "@/lib/api-client";
import { formatCurrency } from "@/lib/utils";
import type { FieldErrors } from "@/lib/validation";
import type { Category } from "@/types/category";
import type { Product, ProductFormValues } from "@/types/product";

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Omit to create a new product. */
  product?: Product;
  onSaved?: (product: Product) => void;
}

const EMPTY_VALUES: ProductFormValues = {
  name: "",
  sku: "",
  categoryId: "",
  supplierId: "",
  supplierName: "",
  brand: "",
  description: "",
  unit: "piece",
  costPrice: 0,
  sellingPrice: 0,
  stockQuantity: 0,
  minimumStockLevel: 0,
  status: "active",
};

function toFormValues(product?: Product): ProductFormValues {
  if (!product) return { ...EMPTY_VALUES };
  return {
    name: product.name,
    sku: product.sku,
    categoryId: product.categoryId,
    supplierId: product.supplierId ?? "",
    supplierName: product.supplierName,
    brand: product.brand,
    description: product.description,
    unit: product.unit,
    costPrice: product.costPrice,
    sellingPrice: product.sellingPrice,
    stockQuantity: product.stockQuantity,
    minimumStockLevel: product.minimumStockLevel,
    status: product.status,
    image: product.image,
  };
}

/**
 * Create or edit a product.
 *
 * Creating runs as a four-step wizard — details, pricing, stock, review — so
 * a long form is never presented all at once. Editing keeps the original
 * single-page layout, where jumping between steps would only add friction.
 */
export function ProductFormDialog({
  open,
  onOpenChange,
  product,
  onSaved,
}: ProductFormDialogProps) {
  const { addProduct, updateProduct } = useProductsStore();
  const { options, optionsLoading } = useCategoriesStore();
  const isEdit = !!product;

  const [values, setValues] = useState<ProductFormValues>(() =>
    toFormValues(product)
  );
  const [errors, setErrors] = useState<FieldErrors<ProductField>>({});
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Each time the dialog opens, start from the current record (or a blank
  // form) and the first step — a half-finished draft never leaks between
  // openings.
  useEffect(() => {
    if (!open) return;
    setValues(toFormValues(product));
    setErrors({});
    setStep(0);
    setError(null);
  }, [open, product]);

  const setField = <K extends keyof ProductFormValues>(
    key: K,
    value: ProductFormValues[K]
  ) => {
    setValues((v) => ({ ...v, [key]: value }));
    // Clear the message as soon as the offending field is edited.
    if (key in errors) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const focusFirstInvalid = () => {
    requestAnimationFrame(() => {
      formRef.current
        ?.querySelector<HTMLElement>('[aria-invalid="true"]')
        ?.focus();
    });
  };

  const submit = async (payload: ProductFormValues) => {
    setSaving(true);
    setError(null);
    try {
      const saved = product
        ? await updateProduct(product.id, payload)
        : await addProduct(payload);
      onSaved?.(saved);
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not save the product."
      );
    } finally {
      setSaving(false);
    }
  };

  /** Advances one step, or reports what is blocking the current one. */
  const goNext = () => {
    const stepId = PRODUCT_STEPS[step].id;
    const nextErrors = validateProductStep(stepId, values);
    if (Object.values(nextErrors).some(Boolean)) {
      setErrors(nextErrors);
      focusFirstInvalid();
      return;
    }
    setErrors({});
    setStep((s) => Math.min(s + 1, PRODUCT_STEPS.length - 1));
  };

  const goBack = () => {
    setErrors({});
    setStep((s) => Math.max(s - 1, 0));
  };

  /** Jumps back to a step from the review summary. */
  const goToStep = (id: ProductStepId) => {
    const index = PRODUCT_STEPS.findIndex((s) => s.id === id);
    if (index >= 0) {
      setErrors({});
      setStep(index);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;

    // Editing: one page, one validation pass.
    if (isEdit) {
      const nextErrors = validateProduct(values);
      if (Object.values(nextErrors).some(Boolean)) {
        setErrors(nextErrors);
        focusFirstInvalid();
        return;
      }
      await submit(values);
      return;
    }

    // Creating: Enter advances until the final step.
    if (step < PRODUCT_STEPS.length - 1) {
      goNext();
      return;
    }

    const nextErrors = validateProduct(values);
    if (Object.values(nextErrors).some(Boolean)) {
      setErrors(nextErrors);
      const firstField = Object.keys(nextErrors)[0] as ProductField;
      const target = stepForField(firstField);
      setStep(PRODUCT_STEPS.findIndex((s) => s.id === target));
      focusFirstInvalid();
      return;
    }

    await submit(values);
  };

  const noCategories = !optionsLoading && options.length === 0;
  const isLastStep = step === PRODUCT_STEPS.length - 1;
  const stepDefinition = PRODUCT_STEPS[step];

  const sectionProps = { values, onChange: setField, errors };

  /** One step of the wizard. */
  const renderStep = () => {
    switch (stepDefinition.id) {
      case "details":
        return (
          <ProductDetailsSection {...sectionProps} categories={options} />
        );
      case "pricing":
        return <ProductPricingSection {...sectionProps} />;
      case "stock":
        return <ProductStockSection {...sectionProps} />;
      case "review":
        return (
          <div className="space-y-6">
            <ProductReviewSummary
              values={values}
              categories={options}
              onEdit={goToStep}
            />
            <ProductPublishSection {...sectionProps} />
          </div>
        );
      default:
        return null;
    }
  };

  const body = optionsLoading ? (
    <div className="space-y-4" aria-busy="true">
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  ) : noCategories ? (
    <Alert variant="warning">
      <AlertDescription>
        No categories exist yet. Create a category before adding a product.
      </AlertDescription>
    </Alert>
  ) : (
    <div className="space-y-5">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form
        id="product-form"
        ref={formRef}
        onSubmit={handleSubmit}
        noValidate
        className={isEdit ? "space-y-10" : undefined}
      >
        {isEdit ? (
          <>
            <FormSection
              title="Product image & identity"
              description="Photo, name, SKU, category and unit."
            >
              <ProductDetailsSection {...sectionProps} categories={options} />
            </FormSection>
            <FormSection
              title="Pricing"
              description="Cost, selling price and the resulting margin."
            >
              <ProductPricingSection {...sectionProps} />
            </FormSection>
            <FormSection
              title="Stock"
              description="Opening quantity, reorder threshold and supplier."
            >
              <ProductStockSection {...sectionProps} />
            </FormSection>
            <FormSection
              title="Description & status"
              description="Optional copy and catalogue visibility."
            >
              <ProductPublishSection {...sectionProps} />
            </FormSection>
          </>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {stepDefinition.description}
            </p>
            {renderStep()}
          </div>
        )}

        {/*
          A submit button is required for Enter-to-advance, but the visible
          actions live in the dialog footer. It stays out of the tab order.
        */}
        <button type="submit" className="hidden" tabIndex={-1} aria-hidden />
      </form>
    </div>
  );

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit product" : "Add product"}
      description={
        isEdit
          ? `Update ${product.name}. Changes apply immediately.`
          : "Add a product to the catalog. You can review everything before it is created."
      }
      icon={<PackagePlus className="h-4 w-4" aria-hidden />}
      formId="product-form"
      submitLabel={isEdit ? "Save changes" : "Create product"}
      submitting={saving}
      submitDisabled={optionsLoading || noCategories}
      className={isEdit ? "sm:max-w-3xl" : "sm:max-w-2xl"}
      headerExtra={
        !isEdit && !optionsLoading && !noCategories ? (
          <Stepper steps={PRODUCT_STEPS} current={step} />
        ) : undefined
      }
      footer={
        isEdit ? undefined : (
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Step {step + 1} of {PRODUCT_STEPS.length} ·{" "}
              {stepDefinition.title}
            </p>
            <div className="flex items-center gap-2 sm:ml-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => (step === 0 ? onOpenChange(false) : goBack())}
                disabled={saving}
              >
                {step === 0 ? (
                  "Cancel"
                ) : (
                  <>
                    <ArrowLeft className="h-4 w-4" aria-hidden />
                    Back
                  </>
                )}
              </Button>

              {isLastStep ? (
                <Button
                  type="submit"
                  form="product-form"
                  className="min-w-[150px]"
                  disabled={saving || optionsLoading || noCategories}
                  aria-busy={saving}
                >
                  {saving ? (
                    "Creating…"
                  ) : (
                    <>
                      <Check className="h-4 w-4" aria-hidden />
                      Create product
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  type="submit"
                  form="product-form"
                  className="min-w-[110px]"
                  disabled={optionsLoading || noCategories}
                >
                  Next
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Button>
              )}
            </div>
          </div>
        )
      }
    >
      {body}

      {/* Announces the step change to screen readers without visual noise. */}
      {!isEdit && (
        <span className="sr-only" aria-live="polite">
          Step {step + 1} of {PRODUCT_STEPS.length}: {stepDefinition.title}
        </span>
      )}
    </FormDialog>
  );
}

interface ProductReviewSummaryProps {
  values: ProductFormValues;
  categories: Category[];
  onEdit: (step: ProductStepId) => void;
}

/** Read-only recap of everything entered, with a jump-back link per group. */
function ProductReviewSummary({
  values,
  categories,
  onEdit,
}: ProductReviewSummaryProps) {
  const categoryName =
    categories.find((c) => c.id === values.categoryId)?.name ?? "—";
  const margin = values.sellingPrice - values.costPrice;
  const marginPercent =
    values.costPrice > 0 ? Math.round((margin / values.costPrice) * 100) : 0;

  return (
    <div className="space-y-5">
      <ReviewGroup title="Details" onEdit={() => onEdit("details")}>
        <DescriptionList
          items={[
            { label: "Name", value: values.name || "—" },
            { label: "SKU", value: values.sku || "—" },
            { label: "Category", value: categoryName },
            { label: "Brand", value: values.brand || "—" },
            { label: "Unit", value: values.unit || "—" },
          ]}
        />
      </ReviewGroup>

      <ReviewGroup title="Pricing" onEdit={() => onEdit("pricing")}>
        <DescriptionList
          items={[
            { label: "Cost price", value: formatCurrency(values.costPrice) },
            {
              label: "Selling price",
              value: formatCurrency(values.sellingPrice),
            },
            {
              label: "Margin",
              value:
                values.costPrice > 0
                  ? `${formatCurrency(margin)} (${marginPercent}%)`
                  : "—",
            },
          ]}
        />
      </ReviewGroup>

      <ReviewGroup title="Stock" onEdit={() => onEdit("stock")}>
        <DescriptionList
          items={[
            { label: "Quantity", value: String(values.stockQuantity) },
            {
              label: "Minimum level",
              value: String(values.minimumStockLevel),
            },
            { label: "Supplier", value: values.supplierName || "—" },
          ]}
        />
      </ReviewGroup>
    </div>
  );
}

function ReviewGroup({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border bg-card">
      <header className="flex items-center justify-between gap-2 border-b px-4 py-2.5">
        <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          {title}
        </h3>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onEdit}
          className="h-7 px-2 text-xs"
        >
          Edit
        </Button>
      </header>
      <div className="px-4 py-3">
        {children}
      </div>
    </section>
  );
}
