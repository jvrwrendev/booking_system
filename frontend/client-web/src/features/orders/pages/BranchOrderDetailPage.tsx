import { BranchOrderDetailView } from "@/features/branch-orders/components/BranchOrderDetailView";

/**
 * Branch-order detail as seen from the Orders module.
 *
 * The presentation lives in `BranchOrderDetailView`; this route only
 * decides where the "back" affordance and the breadcrumbs point.
 */
export function BranchOrderDetailPage() {
  return (
    <BranchOrderDetailView
      backHref="/orders"
      backLabel="Back to orders"
      breadcrumbs={[
        { label: "Operations" },
        { label: "Orders", href: "/orders" },
        { label: "Branch Orders" },
      ]}
    />
  );
}
