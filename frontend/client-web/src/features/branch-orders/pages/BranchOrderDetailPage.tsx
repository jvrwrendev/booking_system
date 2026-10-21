import { BranchOrderDetailView } from "../components/BranchOrderDetailView";

/**
 * Branch-order detail as seen from the Branch Orders module.
 *
 * Shares its presentation with the Orders route — only the navigation
 * context differs.
 */
export function BranchOrderDetailPage() {
  return (
    <BranchOrderDetailView
      backHref="/branch-orders"
      backLabel="Back to branch orders"
      breadcrumbs={[
        { label: "Operations" },
        { label: "Branch Orders", href: "/branch-orders" },
      ]}
    />
  );
}
