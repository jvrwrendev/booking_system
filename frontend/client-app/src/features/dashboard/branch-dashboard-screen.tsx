import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Boxes,
  CheckCircle2,
  Clock,
  Plus,
  ShoppingBag,
} from "lucide-react-native";
import { useNavigation, type NavigationProp } from "@react-navigation/native";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { SearchInput } from "@/components/ui/search-input";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/shared/stat-card";
import { OrderCard } from "@/components/shared/order-card";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { ModuleHeader } from "@/components/shared/module-header";
import {
  NotificationBell,
  type NotificationItem,
} from "@/components/shared/notification-bell";
import { CategoryStrip } from "@/features/dashboard/components/category-strip";
import { RecommendedProducts } from "@/features/dashboard/components/recommended-products";
import { listOrdersForBranch } from "@/services/branch-order.service";
import { listCategories } from "@/services/category.service";
import { listProductsPage } from "@/services/product.service";
import { formatDateTime } from "@/lib/utils";
import type { BranchOrder } from "@/types/branch-order";
import type { Category } from "@/types/category";
import type { Product } from "@/types/product";
import type {
  BranchStackParamList,
  BranchTabParamList,
} from "@/app/navigation/types";

const CONTENT_MAX_WIDTH = 1120;
const RECOMMENDATION_LIMIT = 8;

function chunk<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    rows.push(items.slice(index, index + size));
  }
  return rows;
}

function OrderSkeleton() {
  return (
    <Card className="mb-2">
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Skeleton className="h-3.5 w-1/3" />
          <Skeleton className="mt-2 h-2.5 w-1/4" />
        </View>
        <Skeleton className="h-6 w-16 rounded-full" />
      </View>
    </Card>
  );
}

export function BranchDashboardScreen() {
  const navigation =
    useNavigation<NavigationProp<BranchStackParamList & BranchTabParamList>>();
  const { user } = useAuth();
  const { width } = useWindowDimensions();

  const [orders, setOrders] = useState<BranchOrder[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productCount, setProductCount] = useState(0);

  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const branchId = user?.branchId ?? "";

  const layoutWidth = Math.min(width, CONTENT_MAX_WIDTH);
  const statColumns = layoutWidth >= 768 ? 4 : 2;

  const loadOrders = useCallback(async () => {
    if (!branchId) {
      setOrders([]);
      setLoadingOrders(false);
      return;
    }

    setOrdersError(null);
    try {
      const result = await listOrdersForBranch(branchId);
      setOrders(result);
    } catch {
      setOrdersError("Failed to load orders.");
    } finally {
      setLoadingOrders(false);
    }
  }, [branchId]);

  const loadCatalog = useCallback(async () => {
    setCatalogError(null);
    try {
      const [categoryList, productPage] = await Promise.all([
        listCategories(),
        listProductsPage({
          page: 1,
          pageSize: 100,
          status: "active",
          sortBy: "createdAt",
          sortOrder: "desc",
        }),
      ]);
      setCategories(categoryList);
      setProducts(productPage.products);
      setProductCount(productPage.total);
    } catch {
      setCatalogError("Failed to load the catalog.");
    } finally {
      setLoadingCatalog(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await Promise.all([loadOrders(), loadCatalog()]);
    })();
  }, [loadOrders, loadCatalog]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void Promise.all([loadOrders(), loadCatalog()]).finally(() =>
      setRefreshing(false),
    );
  }, [loadOrders, loadCatalog]);

  const counts = useMemo(
    () => ({
      pending: orders.filter((o) => o.status === "pending").length,
      processing: orders.filter(
        (o) => o.status === "processing" || o.status === "assigned",
      ).length,
      ready: orders.filter((o) => o.status === "ready").length,
      completed: orders.filter((o) => o.status === "completed").length,
    }),
    [orders],
  );

  const recent = useMemo(
    () =>
      [...orders]
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
        .slice(0, 5),
    [orders],
  );

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return orders.filter((o) => {
      if (o.reference.toLowerCase().includes(q)) return true;
      if (o.status.toLowerCase().includes(q)) return true;
      if (o.branchName.toLowerCase().includes(q)) return true;
      return o.items.some(
        (i) =>
          i.productName.toLowerCase().includes(q) ||
          i.sku.toLowerCase().includes(q),
      );
    });
  }, [orders, query]);

  const displayedOrders = searchResults ?? recent;

  const popularity = useMemo(() => {
    const countsByProduct = new Map<string, number>();
    for (const order of orders) {
      if (order.status === "rejected") continue;
      for (const item of order.items) {
        countsByProduct.set(
          item.productId,
          (countsByProduct.get(item.productId) ?? 0) + item.quantity,
        );
      }
    }
    return countsByProduct;
  }, [orders]);

  const rankedProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      const aOut = a.stockQuantity <= 0 ? 1 : 0;
      const bOut = b.stockQuantity <= 0 ? 1 : 0;
      if (aOut !== bOut) return aOut - bOut;

      const aPopularity = popularity.get(a.id) ?? 0;
      const bPopularity = popularity.get(b.id) ?? 0;
      if (aPopularity !== bPopularity) return bPopularity - aPopularity;

      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [products, popularity]);

  const recommended = useMemo(() => {
    return rankedProducts.slice(0, RECOMMENDATION_LIMIT);
  }, [rankedProducts]);

  const openCatalog = useCallback(
    (categoryId: string | null = null) => {
      navigation.navigate("Catalog", {
        categoryId: categoryId ?? "all",
        requestId: Date.now(),
      });
    },
    [navigation],
  );

  const notifications = useMemo<NotificationItem[]>(() => {
    const items: NotificationItem[] = [];

    if (counts.pending > 0) {
      items.push({
        id: "pending-orders",
        title: "Pending orders",
        description: `${counts.pending} order${counts.pending === 1 ? "" : "s"} waiting to be processed.`,
        tone: "warning",
      });
    }

    if (counts.ready > 0) {
      items.push({
        id: "ready-orders",
        title: "Orders ready",
        description: `${counts.ready} order${counts.ready === 1 ? "" : "s"} ready for pickup or delivery.`,
        tone: "primary",
      });
    }

    recent.slice(0, 3).forEach((order) => {
      items.push({
        id: order.id,
        title: order.reference,
        description: `${order.totalQuantity} item${order.totalQuantity === 1 ? "" : "s"} · ${order.status}`,
        time: formatDateTime(order.createdAt),
        tone:
          order.status === "pending"
            ? "warning"
            : order.status === "ready"
              ? "primary"
              : "info",
      });
    });

    if (items.length === 0) {
      items.push({
        id: "all-clear",
        title: "You're all caught up",
        description: "No recent activity on your orders.",
        tone: "muted",
        unread: false,
      });
    }

    return items;
  }, [counts, recent]);

  const onPressNotification = useCallback(
    (item: NotificationItem) => {
      if (item.id.startsWith("BO-")) {
        navigation.navigate("OrderDetail", { orderId: item.id });
      } else {
        navigation.navigate("Orders");
      }
    },
    [navigation],
  );

  const statCards = [
    {
      label: "Products",
      value: loadingCatalog ? "—" : productCount,
      tone: "primary" as const,
      icon: <Boxes size={16} color="#16A34A" />,
    },
    {
      label: "Orders",
      value: loadingOrders ? "—" : orders.length,
      tone: "info" as const,
      icon: <ShoppingBag size={16} color="#2563EB" />,
    },
    {
      label: "Pending",
      value: loadingOrders ? "—" : counts.pending,
      tone: "warning" as const,
      icon: <Clock size={16} color="#D97706" />,
    },
    {
      label: "Completed",
      value: loadingOrders ? "—" : counts.completed,
      tone: "success" as const,
      icon: <CheckCircle2 size={16} color="#16A34A" />,
    },
  ];

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#16A34A"
          />
        }
      >
        <ModuleHeader
          eyebrow="Welcome back"
          title={user?.fullName ?? "Branch"}
          action={
            <NotificationBell
              items={notifications}
              onPressItem={onPressNotification}
            />
          }
          contentMaxWidth={CONTENT_MAX_WIDTH}
          className="mb-5"
        />

        <View
          className="w-full self-center"
          style={{ maxWidth: CONTENT_MAX_WIDTH }}
        >
          <View className="mb-5 w-full" style={{ maxWidth: 480 }}>
            <SearchInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search orders, items, references..."
            />
          </View>

          <View className="gap-3">
            {chunk(statCards, statColumns).map((row, rowIndex) => (
              <View key={rowIndex} className="flex-row gap-3">
                {row.map((stat) => (
                  <StatCard
                    key={stat.label}
                    label={stat.label}
                    value={stat.value}
                    tone={stat.tone}
                    icon={stat.icon}
                    className="flex-1"
                  />
                ))}
                {Array.from({ length: statColumns - row.length }).map(
                  (_, spacerIndex) => (
                    <View key={`stat-spacer-${spacerIndex}`} className="flex-1" />
                  ),
                )}
              </View>
            ))}
          </View>

          <View className="mt-6">
            <SectionHeader
              title="Product Categories"
              subtitle="Browse the catalog by category"
            />
            <CategoryStrip
              categories={categories}
              onSelect={openCatalog}
              loading={loadingCatalog}
              error={catalogError}
              onRetry={() => void loadCatalog()}
            />
          </View>

          <View className="mt-6">
            <RecommendedProducts
              products={recommended}
              loading={loadingCatalog}
              error={catalogError}
              onRetry={() => void loadCatalog()}
              onPressProduct={(product) =>
                navigation.navigate("ProductDetail", {
                  productId: product.id,
                })
              }
              onBrowseCatalog={() => openCatalog()}
            />
          </View>

          <View className="mt-6">
            <SectionHeader
              title={
                searchResults
                  ? `Search results (${searchResults.length})`
                  : "Recent Orders"
              }
              subtitle={
                searchResults
                  ? "Matches across references, statuses, and items"
                  : "Latest orders from your branch"
              }
              action={
                <Button
                  size="sm"
                  label="Create Order"
                  leftIcon={<Plus size={14} color="#FFFFFF" />}
                  onPress={() => navigation.navigate("OrderCreate")}
                />
              }
            />

            {loadingOrders ? (
              <View>
                {Array.from({ length: 3 }).map((_, index) => (
                  <OrderSkeleton key={index} />
                ))}
              </View>
            ) : ordersError ? (
              <ErrorState
                description={ordersError}
                onRetry={() => void loadOrders()}
              />
            ) : searchResults && displayedOrders.length === 0 ? (
              <EmptyState
                title="No matches found"
                description="Try a different reference, status, or product name."
              />
            ) : displayedOrders.length === 0 ? (
              <EmptyState
                title="No orders yet"
                description="Create your first branch order to see it here."
                actionLabel="Create Order"
                onAction={() => navigation.navigate("OrderCreate")}
              />
            ) : (
              <View>
                {displayedOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onPress={() =>
                      navigation.navigate("OrderDetail", {
                        orderId: order.id,
                      })
                    }
                  />
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
