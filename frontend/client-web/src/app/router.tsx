import { Navigate, createBrowserRouter } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute, PermissionRoute } from "@/routes/ProtectedRoute";

import { LoginPage } from "@/features/auth/pages/LoginPage";
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage";

import { ProductsListPage } from "@/features/products/pages/ProductsListPage";
import { ProductDetailPage } from "@/features/products/pages/ProductDetailPage";
import { ProductsProvider } from "@/features/products/hooks/useProductsStore";

import { CategoriesListPage } from "@/features/categories/pages/CategoriesListPage";
import { CategoriesProvider } from "@/features/categories/hooks/useCategoriesStore";

import { SuppliersListPage } from "@/features/suppliers/pages/SuppliersListPage";
import { SupplierEditPage } from "@/features/suppliers/pages/SupplierEditPage";

import { InventoryPage } from "@/features/inventory/pages/InventoryPage";
import { InventoryProvider } from "@/features/inventory/hooks/useInventoryStore";

import { BookingsListPage } from "@/features/bookings/pages/BookingsListPage";
import { BookingDetailPage } from "@/features/bookings/pages/BookingDetailPage";
import { AssignBookingPage } from "@/features/bookings/pages/AssignBookingPage";
import { BookingsProvider } from "@/features/bookings/hooks/useBookingsStore";

import { OrdersPage } from "@/features/orders/pages/OrdersPage";
import { AgentOrderDetailPage } from "@/features/orders/pages/AgentOrderDetailPage";
import { BranchOrderDetailPage as OrdersBranchOrderDetailPage } from "@/features/orders/pages/BranchOrderDetailPage";

import { BranchOrdersListPage } from "@/features/branch-orders/pages/BranchOrdersListPage";
import { BranchOrderDetailPage } from "@/features/branch-orders/pages/BranchOrderDetailPage";
import { BranchOrdersProvider } from "@/features/branch-orders/hooks/useBranchOrdersStore";

import { CustomersListPage } from "@/features/customers/pages/CustomersListPage";
import { CustomerDetailPage } from "@/features/customers/pages/CustomerDetailPage";
import { CustomersProvider } from "@/features/customers/hooks/useCustomersStore";

import { AgentsListPage } from "@/features/agents/pages/AgentsListPage";
import { AgentDetailPage } from "@/features/agents/pages/AgentDetailPage";
import { AgentLocationPage } from "@/features/agents/pages/AgentLocationPage";
import { AgentsProvider } from "@/features/agents/hooks/useAgentsStore";

import { BranchesListPage } from "@/features/branches/pages/BranchesPages";
import { BranchDetailPage } from "@/features/branches/pages/BranchDetailPage";
import { BranchesProvider } from "@/features/branches/hooks/useBranchesStore";

import { UsersListPage } from "@/features/users/pages/UsersListPage";
import { UserAddPage } from "@/features/users/pages/UserAddPage";
import { UserEditPage } from "@/features/users/pages/UserEditPage";
import { UsersProvider } from "@/features/users/hooks/useUsersStore";
import { ReportsPage } from "@/features/reports/pages/ReportsPage";
import { AuditLogsPage } from "@/features/audit-logs/pages/AuditLogsPage";
import { SettingsPage } from "@/features/settings/pages/SettingsPage";
import { NotFound } from "@/components/common/NotFound";

import { RolesOverviewPage } from "@/features/roles-permissions/pages/RolesOverviewPage";
import { RolePermissionsPage } from "@/features/roles-permissions/pages/RolePermissionsPage";

import { BookingTrackingPage } from "@/features/bookings/pages/BookingTrackingPage";
import { TrackingOverviewPage } from "@/features/orders/pages/TrackingOverviewPage";
import { BranchOrderTrackingPage } from "@/features/orders/pages/BranchOrderTrackingPage";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <CategoriesProvider>
          <ProductsProvider>
            <InventoryProvider>
              <BookingsProvider>
                <BranchOrdersProvider>
                  <AgentsProvider>
                    <BranchesProvider>
                      <CustomersProvider>
                        <UsersProvider>
                          <AppLayout />
                        </UsersProvider>
                      </CustomersProvider>
                    </BranchesProvider>
                  </AgentsProvider>
                </BranchOrdersProvider>
              </BookingsProvider>
            </InventoryProvider>
          </ProductsProvider>
        </CategoriesProvider>
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      {
        path: "dashboard",
        element: (
          <PermissionRoute permission="dashboard.view">
            <DashboardPage />
          </PermissionRoute>
        ),
      },
      {
        path: "products",
        element: (
          <PermissionRoute permission="products.view">
            <ProductsListPage />
          </PermissionRoute>
        ),
      },
      {
        path: "products/:id",
        element: (
          <PermissionRoute permission="products.view">
            <ProductDetailPage />
          </PermissionRoute>
        ),
      },
      {
        path: "categories",
        element: (
          <PermissionRoute permission="categories.view">
            <CategoriesListPage />
          </PermissionRoute>
        ),
      },
      {
        path: "suppliers",
        element: (
          <PermissionRoute permission="suppliers.view">
            <SuppliersListPage />
          </PermissionRoute>
        ),
      },
      {
        path: "suppliers/:id/edit",
        element: (
          <PermissionRoute permission="suppliers.update">
            <SupplierEditPage />
          </PermissionRoute>
        ),
      },
      {
        path: "inventory",
        element: (
          <PermissionRoute permission="inventory.view">
            <InventoryPage />
          </PermissionRoute>
        ),
      },
      {
        path: "bookings",
        element: (
          <PermissionRoute permission="bookings.view">
            <BookingsListPage />
          </PermissionRoute>
        ),
      },
      {
        path: "bookings/assign",
        element: (
          <PermissionRoute permission="bookings.assign">
            <AssignBookingPage />
          </PermissionRoute>
        ),
      },
      {
        path: "bookings/track/:id",
        element: (
          <PermissionRoute permission="bookings.view">
            <BookingTrackingPage />
          </PermissionRoute>
        ),
      },
      {
        path: "tracking",
        element: (
          <PermissionRoute permission="bookings.view">
            <TrackingOverviewPage />
          </PermissionRoute>
        ),
      },
      {
        path: "tracking/branch/:id",
        element: (
          <PermissionRoute permission="bookings.view">
            <BranchOrderTrackingPage />
          </PermissionRoute>
        ),
      },
      {
        path: "orders",
        element: (
          <PermissionRoute permission="bookings.process">
            <OrdersPage />
          </PermissionRoute>
        ),
      },
      {
        path: "orders/agent/:id",
        element: (
          <PermissionRoute permission="bookings.process">
            <AgentOrderDetailPage />
          </PermissionRoute>
        ),
      },
      {
        path: "orders/branch/:id",
        element: (
          <PermissionRoute permission="bookings.process">
            <OrdersBranchOrderDetailPage />
          </PermissionRoute>
        ),
      },
      {
        path: "branch-orders",
        element: (
          <PermissionRoute permission="branch_orders.view">
            <BranchOrdersListPage />
          </PermissionRoute>
        ),
      },
      {
        path: "branch-orders/:id",
        element: (
          <PermissionRoute permission="branch_orders.view">
            <BranchOrderDetailPage />
          </PermissionRoute>
        ),
      },
      {
        path: "bookings/:id",
        element: (
          <PermissionRoute permission="bookings.view">
            <BookingDetailPage />
          </PermissionRoute>
        ),
      },
      {
        path: "customers",
        element: (
          <PermissionRoute permission="customers.view">
            <CustomersListPage />
          </PermissionRoute>
        ),
      },
      {
        path: "customers/:id",
        element: (
          <PermissionRoute permission="customers.view">
            <CustomerDetailPage />
          </PermissionRoute>
        ),
      },
      {
        path: "agents",
        element: (
          <PermissionRoute permission="agents.view">
            <AgentsListPage />
          </PermissionRoute>
        ),
      },
      {
        // Must stay above agents/:id or "location" is captured as an id.
        path: "agents/location",
        element: (
          <PermissionRoute permission="agents.view">
            <AgentLocationPage />
          </PermissionRoute>
        ),
      },
      {
        path: "agents/:id",
        element: (
          <PermissionRoute permission="agents.view">
            <AgentDetailPage />
          </PermissionRoute>
        ),
      },
      {
        path: "branches",
        element: (
          <PermissionRoute permission="branches.view">
            <BranchesListPage />
          </PermissionRoute>
        ),
      },
      {
        path: "branches/:id",
        element: (
          <PermissionRoute permission="branches.view">
            <BranchDetailPage />
          </PermissionRoute>
        ),
      },
      {
        path: "users",
        element: (
          <PermissionRoute permission="users.view">
            <UsersListPage />
          </PermissionRoute>
        ),
      },
      {
        path: "users/add",
        element: (
          <PermissionRoute permission="users.manage">
            <UserAddPage />
          </PermissionRoute>
        ),
      },
      {
        path: "users/:id/edit",
        element: (
          <PermissionRoute permission="users.manage">
            <UserEditPage />
          </PermissionRoute>
        ),
      },
      {
        path: "reports",
        element: (
          <PermissionRoute permission="reports.view">
            <ReportsPage />
          </PermissionRoute>
        ),
      },
      {
        path: "audit-logs",
        element: (
          <PermissionRoute permission="audit_logs.view">
            <AuditLogsPage />
          </PermissionRoute>
        ),
      },
      {
        path: "settings",
        element: (
          <PermissionRoute permission="settings.manage">
            <SettingsPage />
          </PermissionRoute>
        ),
      },
      {
        path: "roles",
        element: (
          <PermissionRoute permission="roles.view">
            <RolesOverviewPage />
          </PermissionRoute>
        ),
      },
      {
        path: "roles/:roleId",
        element: (
          <PermissionRoute permission="roles.manage">
            <RolePermissionsPage />
          </PermissionRoute>
        ),
      },
      {
        path: "*",
        element: (
          <div className="flex min-h-[40vh] items-center justify-center">
            <NotFound
              backHref="/dashboard"
              backLabel="Back to dashboard"
              className="w-full max-w-md"
            />
          </div>
        ),
      },
    ],
  },
]);