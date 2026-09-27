import { Navigate, createBrowserRouter } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute, PermissionRoute } from "@/routes/ProtectedRoute";

import { LoginPage } from "@/features/auth/pages/LoginPage";
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage";

import { ProductsListPage } from "@/features/products/pages/ProductsListPage";
import { ProductDetailPage } from "@/features/products/pages/ProductDetailPage";
import { ProductsProvider } from "@/features/products/hooks/useProductsStore";

import { CategoriesListPage } from "@/features/categories/pages/CategoriesListPage";

import { InventoryPage } from "@/features/inventory/pages/InventoryPage";

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
import { CustomerAddPage } from "@/features/customers/pages/CustomerAddPage";
import { CustomerEditPage } from "@/features/customers/pages/CustomerEditPage";
import { CustomerDetailPage } from "@/features/customers/pages/CustomerDetailPage";
import { CustomersProvider } from "@/features/customers/hooks/useCustomersStore";

import { AgentsListPage } from "@/features/agents/pages/AgentsListPage";
import { AgentAddPage } from "@/features/agents/pages/AgentAddPage";
import { AgentEditPage } from "@/features/agents/pages/AgentEditPage";
import { AgentDetailPage } from "@/features/agents/pages/AgentDetailPage";
import { AgentsProvider } from "@/features/agents/hooks/useAgentsStore";

import { BranchesListPage } from "@/features/branches/pages/BranchesPages";
import { BranchAddPage } from "@/features/branches/pages/BranchAddPage";
import { BranchDetailPage } from "@/features/branches/pages/BranchDetailPage";
import { BranchEditPage } from "@/features/branches/pages/BranchEditPage";
import { BranchesProvider } from "@/features/branches/hooks/useBranchesStore";

import { UsersListPage } from "@/features/users/pages/UsersListPage";
import { UserAddPage } from "@/features/users/pages/UserAddPage";
import { UserEditPage } from "@/features/users/pages/UserEditPage";
import { UsersProvider } from "@/features/users/hooks/useUsersStore";
import { ReportsPage } from "@/features/reports/pages/ReportsPage";
import { AuditLogsPage } from "@/features/audit-logs/pages/AuditLogsPage";
import { SettingsPage } from "@/features/settings/pages/SettingsPage";

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
        <ProductsProvider>
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
        </ProductsProvider>
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
        path: "customers/add",
        element: (
          <PermissionRoute permission="customers.manage">
            <CustomerAddPage />
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
        path: "customers/:id/edit",
        element: (
          <PermissionRoute permission="customers.manage">
            <CustomerEditPage />
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
        path: "agents/add",
        element: (
          <PermissionRoute permission="agents.manage">
            <AgentAddPage />
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
        path: "agents/:id/edit",
        element: (
          <PermissionRoute permission="agents.manage">
            <AgentEditPage />
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
        path: "branches/add",
        element: (
          <PermissionRoute permission="branches.manage">
            <BranchAddPage />
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
        path: "branches/:id/edit",
        element: (
          <PermissionRoute permission="branches.manage">
            <BranchEditPage />
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
          <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
            <h2 className="text-lg font-semibold">Page not found</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              The page you are looking for does not exist.
            </p>
          </div>
        ),
      },
    ],
  },
]);