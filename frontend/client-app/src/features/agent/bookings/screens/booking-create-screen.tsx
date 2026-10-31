import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  AlertCircle,
  Search,
  ShoppingCart,
  Trash2,
} from "lucide-react-native";
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "@/hooks/use-auth";
import { useAgentCart } from "@/hooks/use-agent-cart";
import { listCustomersForAgent } from "@/services/customer.service";
import { listProducts } from "@/services/product.service";
import {
  createBookingForAgent,
  listBookingBranches,
  type BookingBranchOption,
} from "@/services/booking.service";
import type { Customer } from "@/types/customer";
import type { Product } from "@/types/product";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { QuantitySelector } from "@/components/shared/quantity-selector";
import { LoadingState } from "@/components/shared/loading-state";
import { ProductImage } from "@/components/shared/product-image";
import { ProductDetailsSheet } from "@/components/shared/product-details-sheet";
import { SuccessDialog } from "@/components/shared/success-dialog";
import { ProductCard } from "@/components/shared/product-card";
import { CategoryFilterButton } from "@/components/shared/category-filter";
import { WizardHeader } from "@/components/shared/wizard-header";
import type { AgentStackParamList } from "@/app/navigation/types";

type Step = "customer" | "products" | "cart" | "review";

const STEPS: { key: Step; label: string }[] = [
  { key: "customer", label: "Customer" },
  { key: "products", label: "Products" },
  { key: "cart", label: "Cart" },
  { key: "review", label: "Review" },
];

export function BookingCreateScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AgentStackParamList>>();
  const route = useRoute<RouteProp<AgentStackParamList, "BookingCreate">>();
  const { user } = useAuth();
  const cart = useAgentCart();

  const [step, setStep] = useState<Step>(() => {
    const initial = route.params?.initialStep;
    if (initial === "products" || initial === "cart" || initial === "review") {
      return initial;
    }
    return "customer";
  });
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [branches, setBranches] = useState<BookingBranchOption[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [loading, setLoading] = useState(true);
  const [customerQuery, setCustomerQuery] = useState("");
  const [productQuery, setProductQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedReference, setConfirmedReference] = useState<string | null>(
    null,
  );

  const agentId = user?.agentId ?? "";
  const hydratedCart = useRef(false);

  useEffect(() => {
    if (!cart.hydrated || hydratedCart.current) return;
    hydratedCart.current = true;
    if (
      route.params?.customerId &&
      cart.customer?.id !== route.params.customerId
    ) {
      const found = customers.find((c) => c.id === route.params?.customerId);
      if (found) cart.setCustomer(found);
    }
  }, [cart, customers, route.params?.customerId]);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const [c, p, availableBranches] = await Promise.all([
          listCustomersForAgent(agentId),
          listProducts(),
          listBookingBranches(),
        ]);
        if (!mounted) return;
        setCustomers(c);
        setProducts(p);
        setBranches(availableBranches);
        setSelectedBranchId((current) =>
          current || availableBranches[0]?.id || "",
        );
        if (route.params?.customerId && !cart.customer) {
          const found = c.find((x) => x.id === route.params?.customerId);
          if (found) cart.setCustomer(found);
          if (step === "customer") setStep("products");
        }
      } catch {
        if (mounted) {
          setError("Failed to load your customers and products. Please try again.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId]);

  const filteredCustomers = useMemo(() => {
    const q = customerQuery.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.fullName.toLowerCase().includes(q) ||
        c.contactNumber.toLowerCase().includes(q)
    );
  }, [customers, customerQuery]);

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

  const canContinueFromProducts = cart.items.length > 0;

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
    if (
      submitting ||
      !cart.customer ||
      cart.items.length === 0 ||
      !selectedBranchId
    ) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const booking = await createBookingForAgent({
        customer: cart.customer,
        agentId,
        agentName: user?.fullName ?? "Agent",
        branchId: selectedBranchId,
        items: cart.items,
        notes: notes.trim() || undefined,
      });
      cart.clear();
      setConfirmedReference(booking.reference);
    } catch {
      setError("Failed to create booking. Please try again.");
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
          title="New Booking"
          steps={STEPS}
          activeStep={step}
          onBack={() => {
            const order: Step[] = [
              "customer",
              "products",
              "cart",
              "review",
            ];
            const index = order.indexOf(step);
            if (index > 0) {
              setStep(order[index - 1]);
            } else {
              navigation.goBack();
            }
          }}
        />

        {step === "customer" ? (
          <View className="flex-1 px-6 pt-4">
            <Input
              size="control"
              value={customerQuery}
              onChangeText={setCustomerQuery}
              placeholder="Search customers"
              autoCapitalize="none"
              leftIcon={<Search size={18} color="#64748B" />}
            />
            {loading ? (
              <LoadingState label="Loading customers..." />
            ) : (
              <FlatList
                data={filteredCustomers}
                keyExtractor={(c) => c.id}
                className="mt-4"
                ListEmptyComponent={
                  <Text tone="muted" className="mt-8 text-center">
                    No customers found.
                  </Text>
                }
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => {
                      cart.setCustomer(item);
                      setStep("products");
                    }}
                    className="active:opacity-90"
                  >
                    <Card className="mb-2">
                      <Text weight="semibold">{item.fullName}</Text>
                      <Text variant="small" tone="muted" className="mt-0.5">
                        {item.contactNumber} • {item.address}
                      </Text>
                    </Card>
                  </Pressable>
                )}
              />
            )}
          </View>
        ) : null}

        {step === "products" ? (
          <View className="flex-1 px-6 pt-4">
            {cart.customer ? (
              <Card className="mb-3 flex-row items-center justify-between">
                <View className="flex-1">
                  <Text variant="small" tone="muted">
                    Customer
                  </Text>
                  <Text weight="semibold">{cart.customer.fullName}</Text>
                </View>
                <Pressable onPress={() => setStep("customer")} hitSlop={8}>
                  <Text variant="small" weight="medium" tone="primary">
                    Change
                  </Text>
                </Pressable>
              </Card>
            ) : null}
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
            ) : (
              <FlatList
                data={filteredProducts}
                keyExtractor={(p) => p.id}
                className="mt-4"
                numColumns={2}
                columnWrapperStyle={{ gap: 12 }}
                contentContainerStyle={{ gap: 12 }}
                ListEmptyComponent={
                  <Text
                    tone={error ? "danger" : "muted"}
                    className="mt-8 text-center"
                  >
                    {error
                      ? error
                      : category !== "all"
                        ? `No products in ${category}.`
                        : "No products found."}
                  </Text>
                }
                renderItem={({ item }) => (
                  <ProductCard
                    product={item}
                    showFavorite={false}
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
            {canContinueFromProducts ? (
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
                  CUSTOMER
                </Text>
                <Text weight="semibold" className="mt-1">
                  {cart.customer?.fullName ?? "—"}
                </Text>
                <Text variant="small" tone="muted" className="mt-0.5">
                  {cart.customer?.contactNumber}
                </Text>
                <Text variant="small" tone="muted" className="mt-0.5">
                  {cart.customer?.address}
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

              <Card className="mt-4">
                <Text variant="label" tone="muted">
                  FULFILLING BRANCH
                </Text>
                <Text variant="small" tone="muted" className="mt-1">
                  This booking will be fulfilled from the selected branch.
                </Text>
                <View className="mt-3 gap-2">
                  {branches.map((branch) => {
                    const selected = branch.id === selectedBranchId;
                    return (
                      <Pressable
                        key={branch.id}
                        onPress={() => setSelectedBranchId(branch.id)}
                        className={`rounded-md border px-3 py-2.5 ${
                          selected
                            ? "border-primary bg-primary/5"
                            : "border-border bg-background"
                        }`}
                      >
                        <Text weight={selected ? "semibold" : "medium"}>
                          {branch.name}
                        </Text>
                        {branch.code ? (
                          <Text variant="small" tone="muted">
                            {branch.code}
                          </Text>
                        ) : null}
                      </Pressable>
                    );
                  })}
                  {branches.length === 0 ? (
                    <Text variant="small" tone="danger">
                      No active branch is available. Contact an administrator.
                    </Text>
                  ) : null}
                </View>
              </Card>

              <View className="mt-4">
                <Input
                  size="control"
                  label="Notes (optional)"
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Delivery notes..."
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
                disabled={
                  !cart.customer ||
                  cart.items.length === 0 ||
                  !selectedBranchId
                }
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
        title="Booking confirmed"
        description="The booking has been created successfully. You can track its status in Bookings."
        reference={confirmedReference}
        onConfirm={() => {
          setConfirmedReference(null);
          navigation.goBack();
        }}
      />
    </SafeAreaView>
  );
}
