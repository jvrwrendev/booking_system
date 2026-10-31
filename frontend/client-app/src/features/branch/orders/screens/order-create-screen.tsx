import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AlertCircle, Search, ShoppingCart, Trash2 } from "lucide-react-native";
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "@/hooks/use-auth";
import { useOrderCart } from "@/features/branch/orders/hooks/use-order-cart";
import { listProducts } from "@/services/product.service";
import { createBranchOrder } from "@/services/branch-order.service";
import { getBranchById } from "@/services/directory.service";
import type { Product } from "@/types/product";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { QuantitySelector } from "@/components/shared/quantity-selector";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { ProductImage } from "@/components/shared/product-image";
import { ProductDetailsSheet } from "@/components/shared/product-details-sheet";
import { SuccessDialog } from "@/components/shared/success-dialog";
import { ProductCard } from "@/components/shared/product-card";
import { CategoryFilterButton } from "@/components/shared/category-filter";
import { WizardHeader, type WizardStep } from "@/components/shared/wizard-header";
import type { BranchStackParamList } from "@/app/navigation/types";

type Step = "products" | "cart" | "review";

const STEPS: WizardStep<Step>[] = [
  { key: "products", label: "Products" },
  { key: "cart", label: "Cart" },
  { key: "review", label: "Review" },
];

const STEP_ORDER: Step[] = ["products", "cart", "review"];

export function OrderCreateScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<BranchStackParamList>>();
  const route = useRoute<RouteProp<BranchStackParamList, "OrderCreate">>();
  const { user } = useAuth();
  const cart = useOrderCart();

  const [step, setStep] = useState<Step>(() => {
    const initial = route.params?.initialStep;
    return initial === "cart" || initial === "review" ? initial : "products";
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [branchName, setBranchName] = useState<string>("Branch");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [productQuery, setProductQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedReference, setConfirmedReference] = useState<string | null>(
    null,
  );

  const branchId = user?.branchId ?? "";

  const load = async () => {
    setLoadError(null);
    try {
      const [p, branch] = await Promise.all([
        listProducts(),
        branchId ? getBranchById(branchId) : Promise.resolve(null),
      ]);
      setProducts(p);
      setBranchName(branch?.name ?? user?.fullName ?? "Branch");
    } catch {
      setLoadError("Failed to load products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void (async () => {
      await load();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onBack = () => {
    const index = STEP_ORDER.indexOf(step);
    if (index > 0) {
      setStep(STEP_ORDER[index - 1]);
    } else {
      navigation.goBack();
    }
  };

  const categories = useMemo(
    () =>
      Array.from(new Set(products.map((p) => p.categoryName)))
        .filter(Boolean)
        .sort(),
    [products],
  );

  const filteredProducts = useMemo(() => {
    const q = productQuery.trim().toLowerCase();
    return products.filter((p) => {
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.categoryName.toLowerCase().includes(q);
      const matchesCategory = category === "all" || p.categoryName === category;
      return matchesQuery && matchesCategory;
    });
  }, [products, productQuery, category]);

  const detailInCart = detailProduct
    ? (cart.items.find((i) => i.productId === detailProduct.id)?.quantity ?? 0)
    : 0;

  const imageFor = (productId: string) =>
    products.find((p) => p.id === productId)?.image;

  const onAddFromDetails = (product: Product, quantity: number) => {
    cart.addItem(product, quantity);
    setDetailProduct(null);
  };

  const onConfirm = async () => {
    if (submitting || cart.items.length === 0) return;
    if (!branchId) {
      setError(
        "Your account is not linked to a branch. Contact an administrator.",
      );
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const order = await createBranchOrder({
        branchId,
        items: cart.items,
        notes: notes.trim() || undefined,
      });
      cart.clear();
      setConfirmedReference(order.reference);
    } catch (submitError) {
      setError(
        submitError instanceof Error && submitError.message
          ? submitError.message
          : "Failed to create order. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-secondary">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <WizardHeader
          title="Create Order"
          steps={STEPS}
          activeStep={step}
          onBack={onBack}
        />

        {step === "products" ? (
          <View className="flex-1 px-6 pt-4">
            <View className="flex-row gap-2">
              <Input
                size="control"
                containerClassName="flex-1"
                value={productQuery}
                onChangeText={setProductQuery}
                placeholder="Search products"
                autoCapitalize="none"
                leftIcon={<Search size={18} color="#64748B" />}
              />
              <CategoryFilterButton
                categories={categories}
                value={category}
                onChange={setCategory}
              />
            </View>
            {loading ? (
              <LoadingState label="Loading products..." />
            ) : loadError ? (
              <ErrorState
                description={loadError}
                onRetry={() => {
                  setLoading(true);
                  void load();
                }}
              />
            ) : (
              <FlatList
                data={filteredProducts}
                keyExtractor={(p) => p.id}
                className="mt-4"
                numColumns={2}
                columnWrapperStyle={{ gap: 12 }}
                contentContainerStyle={{ gap: 12, paddingBottom: 8 }}
                ListEmptyComponent={
                  <View className="mt-8 items-center">
                    <Text tone="muted">
                      {category !== "all"
                        ? `No products in ${category}.`
                        : "No products found."}
                    </Text>
                  </View>
                }
                renderItem={({ item }) => (
                  <ProductCard
                    product={item}
                    hideQuantityControls
                    inCart={
                      cart.items.find((i) => i.productId === item.id)
                        ?.quantity ?? 0
                    }
                    onIncrement={() => cart.addItem(item, 1)}
                    onDecrement={() =>
                      cart.setQuantity(
                        item.id,
                        (cart.items.find((i) => i.productId === item.id)
                          ?.quantity ?? 0) - 1,
                      )
                    }
                    onInfo={() => setDetailProduct(item)}
                  />
                )}
              />
            )}
            {cart.items.length > 0 ? (
              <View className="py-4">
                <Button
                  label={`View cart (${cart.totalQuantity})`}
                  size="control"
                  fullWidth
                  leftIcon={<ShoppingCart size={18} color="#FFFFFF" />}
                  onPress={() => setStep("cart")}
                />
              </View>
            ) : null}
          </View>
        ) : null}

        {step === "cart" ? (
          <View className="flex-1 px-6 pt-4">
            <FlatList
              data={cart.items}
              keyExtractor={(i) => i.productId}
              ListEmptyComponent={
                <View className="mt-12 items-center">
                  <Text tone="muted">Your cart is empty.</Text>
                  <Pressable
                    onPress={() => setStep("products")}
                    className="mt-4"
                    hitSlop={8}
                  >
                    <Text weight="medium" tone="primary">
                      Browse products
                    </Text>
                  </Pressable>
                </View>
              }
              renderItem={({ item }) => (
                <Card className="mb-2">
                  <View className="flex-row items-center justify-between gap-3">
                    <ProductImage
                      source={imageFor(item.productId)}
                      className="h-14 w-14 rounded-lg border border-border"
                      iconSize={18}
                    />
                    <View className="flex-1">
                      <Text weight="semibold">{item.productName}</Text>
                      <Text variant="small" tone="muted" className="mt-0.5">
                        ₱{item.unitPrice.toLocaleString()} × {item.quantity}
                      </Text>
                      <Text weight="semibold" tone="primary" className="mt-1">
                        ₱{item.subtotal.toLocaleString()}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => cart.removeItem(item.productId)}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel="Remove item"
                    >
                      <Trash2 size={18} color="#DC2626" />
                    </Pressable>
                  </View>
                  <View className="mt-3 w-36">
                    <QuantitySelector
                      value={item.quantity}
                      onChange={(v) => cart.setQuantity(item.productId, v)}
                    />
                  </View>
                </Card>
              )}
            />
            <View className="gap-3 py-4">
              <View className="flex-row items-center justify-between">
                <Text tone="muted">Subtotal</Text>
                <Text weight="bold">₱{cart.subtotal.toLocaleString()}</Text>
              </View>
              <Button
                label="Review order"
                size="control"
                fullWidth
                disabled={cart.items.length === 0}
                onPress={() => setStep("review")}
              />
              <Button
                label="Add more products"
                variant="outline"
                size="control"
                fullWidth
                onPress={() => setStep("products")}
              />
            </View>
          </View>
        ) : null}

        {step === "review" ? (
          <View className="flex-1">
            <ScrollView className="flex-1 px-6 pt-4">
              <Card>
                <Text variant="label" tone="muted">
                  BRANCH ORDER
                </Text>
                <Text weight="semibold" className="mt-1">
                  {branchName}
                </Text>
                <Text variant="small" tone="muted" className="mt-0.5">
                  Placed by {user?.fullName ?? "Branch staff"}
                </Text>
                <Text variant="small" tone="muted" className="mt-0.5">
                  {new Date().toLocaleDateString()}
                </Text>
              </Card>

              <Card className="mt-4">
                <Text variant="label" tone="muted">
                  ITEMS
                </Text>
                {cart.items.map((item) => (
                  <View
                    key={item.productId}
                    className="mt-3 flex-row items-center justify-between gap-3"
                  >
                    <View className="flex-1">
                      <Text weight="medium">{item.productName}</Text>
                      <Text variant="small" tone="muted">
                        ₱{item.unitPrice.toLocaleString()} × {item.quantity}
                      </Text>
                    </View>
                    <Text weight="semibold">
                      ₱{item.subtotal.toLocaleString()}
                    </Text>
                  </View>
                ))}
                <View className="mt-4 border-t border-border pt-3">
                  <View className="flex-row items-center justify-between">
                    <Text tone="muted">Total quantity</Text>
                    <Text weight="semibold">{cart.totalQuantity}</Text>
                  </View>
                  <View className="mt-1 flex-row items-center justify-between">
                    <Text weight="semibold">Total</Text>
                    <Text variant="h3" weight="bold" tone="primary">
                      ₱{cart.subtotal.toLocaleString()}
                    </Text>
                  </View>
                </View>
              </Card>

              <View className="mt-4">
                <Input
                  size="control"
                  label="Notes (optional)"
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Restock notes..."
                />
              </View>

              {error ? (
                <View className="mt-4 flex-row items-start gap-2.5 rounded-md border border-danger/30 bg-danger/5 px-3 py-2.5">
                  <AlertCircle
                    size={14}
                    color="#DC2626"
                    style={{ marginTop: 2 }}
                  />
                  <Text variant="small" tone="danger" className="flex-1">
                    {error}
                  </Text>
                </View>
              ) : null}
            </ScrollView>
            <View className="gap-3 px-6 py-4">
              <Button
                label="Confirm order"
                size="control"
                fullWidth
                loading={submitting}
                disabled={cart.items.length === 0}
                onPress={() => {
                  void onConfirm();
                }}
              />
              <Button
                label="Discard"
                variant="outline"
                size="control"
                fullWidth
                onPress={() => {
                  cart.clear();
                  navigation.goBack();
                }}
              />
            </View>
          </View>
        ) : null}
      </KeyboardAvoidingView>

      <ProductDetailsSheet
        product={detailProduct}
        inCart={detailInCart}
        onClose={() => setDetailProduct(null)}
        onAdd={onAddFromDetails}
      />

      <SuccessDialog
        visible={confirmedReference !== null}
        title="Order confirmed"
        description="Your order has been placed successfully. You can track its status in Orders."
        reference={confirmedReference}
        onConfirm={() => {
          setConfirmedReference(null);
          navigation.goBack();
        }}
      />
    </SafeAreaView>
  );
}
