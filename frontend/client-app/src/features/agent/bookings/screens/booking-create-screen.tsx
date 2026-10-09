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
  ArrowLeft,
  Info,
  Minus,
  Plus,
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
import { createBookingForAgent } from "@/services/booking.service";
import { cn } from "@/lib/utils";
import type { Customer } from "@/types/customer";
import type { Product } from "@/types/product";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QuantitySelector } from "@/components/shared/quantity-selector";
import { LoadingState } from "@/components/shared/loading-state";
import { ProductImage } from "@/components/shared/product-image";
import { ProductDetailsSheet } from "@/components/shared/product-details-sheet";
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

  const [step, setStep] = useState<Step>(
    route.params?.initialStep === "cart"
      ? "cart"
      : route.params?.initialStep === "products"
        ? "products"
        : "customer"
  );
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [customerQuery, setCustomerQuery] = useState("");
  const [productQuery, setProductQuery] = useState("");
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        const [c, p] = await Promise.all([
          listCustomersForAgent(agentId),
          listProducts(),
        ]);
        if (!mounted) return;
        setCustomers(c);
        setProducts(p);
        if (route.params?.customerId && !cart.customer) {
          const found = c.find((x) => x.id === route.params?.customerId);
          if (found) cart.setCustomer(found);
          if (step === "customer") setStep("products");
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

  const filteredProducts = useMemo(() => {
    const q = productQuery.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.categoryName.toLowerCase().includes(q)
    );
  }, [products, productQuery]);

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
    if (submitting || !cart.customer || cart.items.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      await createBookingForAgent({
        customer: cart.customer,
        agentId,
        agentName: user?.fullName ?? "Agent",
        items: cart.items,
        notes: notes.trim() || undefined,
      });
      cart.clear();
      navigation.goBack();
    } catch {
      setError("Failed to create booking. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const stepIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-secondary">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="px-6 pt-4">
          <View className="flex-row items-center justify-between">
            <Pressable
              onPress={() => {
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
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              className="h-10 w-10 items-center justify-center rounded-full border border-border bg-background"
            >
              <ArrowLeft size={18} color="#0F172A" />
            </Pressable>
            <Text variant="h3" weight="semibold">
              New Booking
            </Text>
            <View className="h-10 w-10" />
          </View>

          <View className="mt-4 flex-row items-center gap-2">
            {STEPS.map((s, i) => (
              <View key={s.key} className="flex-1 items-center">
                <View
                  className={`h-1.5 w-full rounded-full ${
                    i <= stepIndex ? "bg-primary" : "bg-border"
                  }`}
                />
                <Text
                  variant="small"
                  tone={i <= stepIndex ? "primary" : "muted"}
                  className="mt-1.5"
                >
                  {s.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

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
            <Input
              size="control"
              value={productQuery}
              onChangeText={setProductQuery}
              placeholder="Search products"
              autoCapitalize="none"
              leftIcon={<Search size={18} color="#64748B" />}
            />
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
                  <Text tone="muted" className="mt-8 text-center">
                    No products found.
                  </Text>
                }
                renderItem={({ item }) => {
                  const inCart =
                    cart.items.find((i) => i.productId === item.id)?.quantity ??
                    0;
                  const outOfStock = item.stockQuantity <= 0;
                  const atMax = !outOfStock && inCart >= item.stockQuantity;
                  return (
                    <Card
                      padded={false}
                      className="flex-1 justify-between overflow-hidden"
                    >
                      <Pressable
                        onPress={() => {
                          if (outOfStock || atMax) return;
                          cart.addItem(item, 1);
                        }}
                        disabled={outOfStock}
                        accessibilityRole="button"
                        accessibilityLabel={
                          outOfStock
                            ? `${item.name} is out of stock`
                            : `Add ${item.name} to cart`
                        }
                        className={cn(
                          "active:opacity-80",
                          outOfStock && "opacity-60"
                        )}
                      >
                        <View>
                          <ProductImage
                            source={item.image}
                            className="h-28 w-full border-b border-border"
                            iconSize={26}
                          />
                          <Pressable
                            onPress={() => setDetailProduct(item)}
                            hitSlop={6}
                            accessibilityRole="button"
                            accessibilityLabel={`View details for ${item.name}`}
                            className="absolute right-2 top-2 h-7 w-7 items-center justify-center rounded-full border border-border bg-background/90 active:bg-accent/10"
                          >
                            <Info size={13} color="#64748B" />
                          </Pressable>
                        </View>
                        <View className="p-2.5">
                          <Text
                            weight="semibold"
                            numberOfLines={2}
                            className="text-sm leading-5"
                          >
                            {item.name}
                          </Text>
                          <Text
                            variant="small"
                            tone="muted"
                            numberOfLines={1}
                            className="mt-0.5"
                          >
                            {item.categoryName}
                          </Text>
                          <Text
                            weight="semibold"
                            tone="primary"
                            className="mt-1.5 text-sm"
                          >
                            ₱{item.sellingPrice.toLocaleString()}
                            <Text variant="small" tone="muted">
                              {" "}
                              / {item.unit}
                            </Text>
                          </Text>
                          <View className="mt-2">
                            <Badge
                              label={
                                outOfStock
                                  ? "Out of stock"
                                  : `${item.stockQuantity} in stock`
                              }
                              tone={outOfStock ? "danger" : "success"}
                            />
                          </View>
                        </View>
                      </Pressable>
                      <View className="px-2.5 pb-2.5">
                        <View
                          className={cn(
                            "flex-row items-center overflow-hidden rounded-lg border",
                            inCart > 0
                              ? "border-primary bg-primary/5"
                              : "border-border bg-background"
                          )}
                        >
                          <Pressable
                            onPress={() =>
                              cart.setQuantity(item.id, inCart - 1)
                            }
                            disabled={inCart === 0}
                            hitSlop={4}
                            accessibilityRole="button"
                            accessibilityLabel={`Remove one ${item.name} from cart`}
                            className={cn(
                              "h-9 w-9 items-center justify-center active:bg-secondary",
                              inCart === 0 && "opacity-40"
                            )}
                          >
                            <Minus
                              size={14}
                              color={inCart === 0 ? "#CBD5E1" : "#0F172A"}
                            />
                          </Pressable>
                          <View className="flex-1 items-center justify-center">
                            <Text
                              variant="small"
                              weight="semibold"
                              tone={inCart > 0 ? "primary" : "muted"}
                            >
                              {inCart}
                            </Text>
                          </View>
                          <Pressable
                            onPress={() => cart.addItem(item, 1)}
                            disabled={outOfStock || atMax}
                            hitSlop={4}
                            accessibilityRole="button"
                            accessibilityLabel={`Add one ${item.name} to cart`}
                            className={cn(
                              "h-9 w-9 items-center justify-center active:bg-secondary",
                              (outOfStock || atMax) && "opacity-40"
                            )}
                          >
                            <Plus
                              size={14}
                              color={
                                outOfStock || atMax ? "#CBD5E1" : "#0F172A"
                              }
                            />
                          </Pressable>
                        </View>
                      </View>
                    </Card>
                  );
                }}
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
                disabled={!cart.customer || cart.items.length === 0}
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
    </SafeAreaView>
  );
}
