import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronRight,
  LayoutGrid,
  Package,
  Shapes,
  Search,
} from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { listProductsPage } from "@/services/product.service";
import { listCategories } from "@/services/category.service";
import type { Product } from "@/types/product";
import type { Category } from "@/types/category";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProductImage } from "@/components/shared/product-image";
import { FavoriteButton } from "@/components/shared/favorite-button";
import { CategoryFilterButton } from "@/components/shared/category-filter";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

type CatalogMode = "products" | "categories";

type CatalogItem =
  | { kind: "product"; product: Product }
  | { kind: "category"; category: Category };

type CatalogNavigation = NativeStackNavigationProp<{
  CatalogProductDetail: { productId: string };
}>;

export function CatalogScreen() {
  const navigation = useNavigation<CatalogNavigation>();

  const [mode, setMode] = useState<CatalogMode>("products");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [categoryId, setCategoryId] = useState("all");

  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestId = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  const loadCategories = useCallback(async () => {
    setCategoriesLoading(true);
    setCategoriesError(null);
    try {
      const list = await listCategories();
      setCategories(list);
    } catch {
      setCategoriesError("Failed to load categories.");
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  useEffect(() => {
    // Defer out of the effect body so the synchronous loading state is not a
    // cascading render (React Compiler lint rule).
    const timer = setTimeout(() => {
      void loadCategories();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadCategories]);

  const loadProducts = useCallback(
    async (options: { append?: boolean; refresh?: boolean } = {}) => {
      const append = options.append ?? false;
      const targetPage = append ? page + 1 : 1;
      const id = ++requestId.current;

      if (append) {
        setLoadingMore(true);
      } else if (!options.refresh) {
        setLoading(true);
      }
      setError(null);

      try {
        const result = await listProductsPage({
          page: targetPage,
          pageSize: PAGE_SIZE,
          search: debouncedQuery || undefined,
          categoryId: categoryId === "all" ? undefined : categoryId,
          status: "active",
          sortBy: "name",
          sortOrder: "asc",
        });

        // A slower, older request must not overwrite a newer search.
        if (id !== requestId.current) return;

        setProducts((current) => {
          if (!append) return result.products;
          const seen = new Set(current.map((p) => p.id));
          return [
            ...current,
            ...result.products.filter((p) => !seen.has(p.id)),
          ];
        });
        setTotal(result.total);
        setPage(result.page);
        setTotalPages(result.totalPages);
      } catch {
        if (id === requestId.current) {
          setError("Failed to load products. Check your connection.");
        }
      } finally {
        if (id === requestId.current) {
          setLoading(false);
          setLoadingMore(false);
          setRefreshing(false);
        }
      }
    },
    [categoryId, debouncedQuery, page],
  );

  // Reload from the first page whenever filters change.
  useEffect(() => {
    const timer = setTimeout(() => {
      void loadProducts();
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, debouncedQuery]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void Promise.all([loadProducts({ refresh: true }), loadCategories()]);
  }, [loadCategories, loadProducts]);

  const onEndReached = useCallback(() => {
    if (
      mode !== "products" ||
      loading ||
      loadingMore ||
      error ||
      page >= totalPages
    ) {
      return;
    }
    void loadProducts({ append: true });
  }, [error, loadProducts, loading, loadingMore, mode, page, totalPages]);

  const categoryNames = useMemo(
    () => categories.map((category) => category.name),
    [categories],
  );

  const selectedCategoryName =
    categories.find((category) => category.id === categoryId)?.name ?? "all";

  const onCategoryFilterChange = (name: string) => {
    const match = categories.find((category) => category.name === name);
    setCategoryId(match?.id ?? "all");
  };

  const openCategory = (category: Category) => {
    setCategoryId(category.id);
    setMode("products");
  };

  const hasFilters = Boolean(debouncedQuery) || categoryId !== "all";

  const clearFilters = () => {
    setQuery("");
    setDebouncedQuery("");
    setCategoryId("all");
  };

  const data: CatalogItem[] = useMemo(() => {
    if (mode === "categories") {
      return categories.map((category) => ({ kind: "category", category }));
    }
    return products.map((product) => ({ kind: "product", product }));
  }, [categories, mode, products]);

  const renderProduct = (product: Product) => {
    const outOfStock = product.stockQuantity <= 0;

    return (
      <Card padded={false} className="flex-1 overflow-hidden">
        <Pressable
          onPress={() =>
            navigation.navigate("CatalogProductDetail", {
              productId: product.id,
            })
          }
          accessibilityRole="button"
          accessibilityLabel={`View ${product.name}`}
          className="active:opacity-80"
        >
          <View>
            <ProductImage
              source={product.image}
              className="h-28 w-full border-b border-border"
              iconSize={28}
            />
            <View className="absolute left-2 top-2">
              <FavoriteButton productId={product.id} />
            </View>
            {outOfStock ? (
              <View className="absolute inset-0 items-center justify-center bg-background/60">
                <View className="rounded-full bg-foreground/90 px-3 py-1">
                  <Text
                    variant="small"
                    weight="semibold"
                    className="text-white"
                  >
                    Out of stock
                  </Text>
                </View>
              </View>
            ) : null}
          </View>

          <View className="p-3">
            <Text
              variant="small"
              tone="muted"
              numberOfLines={1}
              className="text-[11px] uppercase tracking-wide"
            >
              {product.categoryName}
            </Text>
            <Text
              weight="semibold"
              numberOfLines={2}
              className="mt-1 text-sm leading-5"
            >
              {product.name}
            </Text>
            <Text weight="bold" tone="primary" className="mt-1.5 text-sm">
              ₱{product.sellingPrice.toLocaleString()}
              <Text variant="small" tone="muted" weight="regular">
                {" "}
                / {product.unit}
              </Text>
            </Text>
            <View className="mt-2 flex-row items-center justify-between gap-2">
              <Badge
                label={
                  outOfStock ? "0 left" : `${product.stockQuantity} left`
                }
                tone={
                  outOfStock
                    ? "danger"
                    : product.stockQuantity <= 5
                      ? "warning"
                      : "success"
                }
              />
              <ChevronRight size={15} color="#94A3B8" />
            </View>
          </View>
        </Pressable>
      </Card>
    );
  };

  const renderCategory = (category: Category) => (
    <Pressable
      onPress={() => openCategory(category)}
      accessibilityRole="button"
      accessibilityLabel={`Browse ${category.name}`}
      className="active:opacity-80"
    >
      <Card>
        <View className="flex-row items-center gap-3">
          <View className="h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
            <Package size={20} color="#16A34A" />
          </View>
          <View className="flex-1 pr-1">
            <Text weight="semibold" numberOfLines={1}>
              {category.name}
            </Text>
            {category.description ? (
              <Text
                variant="small"
                tone="muted"
                numberOfLines={1}
                className="mt-0.5"
              >
                {category.description}
              </Text>
            ) : null}
            <Text variant="small" tone="primary" className="mt-1">
              {category.productCount}{" "}
              {category.productCount === 1 ? "product" : "products"}
            </Text>
          </View>
          <ChevronRight size={18} color="#94A3B8" />
        </View>
      </Card>
    </Pressable>
  );

  const header = (
    <View className="pb-4">
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <Text variant="small" tone="muted">
            Browse
          </Text>
          <Text variant="h1" weight="bold">
            Catalog
          </Text>
        </View>
        <View className="mt-1 rounded-full bg-primary/10 px-2.5 py-1">
          <Text variant="small" weight="semibold" tone="primary">
            {mode === "products"
              ? `${total} ${total === 1 ? "product" : "products"}`
              : `${categories.length} ${
                  categories.length === 1 ? "category" : "categories"
                }`}
          </Text>
        </View>
      </View>
      <Text variant="small" tone="muted" className="mt-1">
        Browse the catalog and open a product for full details.
      </Text>

      {/* Products / Categories toggle */}
      <View className="mt-4 flex-row rounded-xl border border-border bg-secondary p-1">
        <Pressable
          onPress={() => setMode("products")}
          accessibilityRole="tab"
          accessibilityState={{ selected: mode === "products" }}
          accessibilityLabel="Products"
          className={cn(
            "h-9 flex-1 flex-row items-center justify-center gap-1.5 rounded-lg",
            mode === "products" ? "bg-background shadow-sm" : "opacity-80",
          )}
        >
          <LayoutGrid
            size={15}
            color={mode === "products" ? "#0F172A" : "#64748B"}
          />
          <Text
            variant="small"
            weight="semibold"
            tone={mode === "products" ? "default" : "muted"}
          >
            Products
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setMode("categories")}
          accessibilityRole="tab"
          accessibilityState={{ selected: mode === "categories" }}
          accessibilityLabel="Categories"
          className={cn(
            "h-9 flex-1 flex-row items-center justify-center gap-1.5 rounded-lg",
            mode === "categories" ? "bg-background shadow-sm" : "opacity-80",
          )}
        >
          <Shapes
            size={15}
            color={mode === "categories" ? "#0F172A" : "#64748B"}
          />
          <Text
            variant="small"
            weight="semibold"
            tone={mode === "categories" ? "default" : "muted"}
          >
            Categories
          </Text>
        </Pressable>
      </View>

      {mode === "products" ? (
        <View className="mt-3 flex-row gap-2">
          <Input
            size="control"
            containerClassName="flex-1"
            value={query}
            onChangeText={setQuery}
            placeholder="Search products"
            autoCapitalize="none"
            autoCorrect={false}
            leftIcon={<Search size={18} color="#64748B" />}
          />
          <CategoryFilterButton
            categories={categoryNames}
            value={selectedCategoryName}
            onChange={onCategoryFilterChange}
          />
        </View>
      ) : null}
    </View>
  );

  const emptyComponent = (() => {
    if (mode === "categories") {
      return categoriesLoading ? (
        <LoadingState label="Loading categories..." />
      ) : categoriesError ? (
        <ErrorState
          description={categoriesError}
          onRetry={() => void loadCategories()}
        />
      ) : (
        <EmptyState
          icon={<Shapes size={24} color="#64748B" />}
          title="No categories yet"
          description="Categories will appear here once products are organised."
        />
      );
    }

    if (loading) return <LoadingState label="Loading products..." />;
    if (error) {
      return (
        <ErrorState description={error} onRetry={() => void loadProducts()} />
      );
    }

    return (
      <EmptyState
        icon={<Package size={24} color="#64748B" />}
        title="No products found"
        description={
          hasFilters
            ? "Try a different search term or category."
            : "There are no products available right now."
        }
        actionLabel={hasFilters ? "Clear filters" : undefined}
        onAction={hasFilters ? clearFilters : undefined}
      />
    );
  })();

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <FlatList
        key={mode}
        data={data}
        keyExtractor={(item) =>
          item.kind === "product" ? item.product.id : item.category.id
        }
        numColumns={mode === "products" ? 2 : 1}
        columnWrapperStyle={
          mode === "products" ? { gap: 12 } : undefined
        }
        contentContainerStyle={{ padding: 16, paddingBottom: 28, gap: 12 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#16A34A"
          />
        }
        ListHeaderComponent={header}
        ListEmptyComponent={emptyComponent}
        ListFooterComponent={
          mode === "products" && products.length > 0 ? (
            <View className="items-center py-3">
              {loadingMore ? (
                <ActivityIndicator color="#16A34A" />
              ) : page >= totalPages ? (
                <Text variant="small" tone="muted">
                  Showing all {total}{" "}
                  {total === 1 ? "product" : "products"}
                </Text>
              ) : null}
            </View>
          ) : null
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.4}
        renderItem={({ item }) =>
          item.kind === "product"
            ? renderProduct(item.product)
            : renderCategory(item.category)
        }
      />
    </SafeAreaView>
  );
}
