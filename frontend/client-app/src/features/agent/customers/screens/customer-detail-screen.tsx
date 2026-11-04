import React, { useCallback, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, MapPin, Phone, UserRound } from "lucide-react-native";
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "@/hooks/use-auth";
import {
  getCustomerForAgent,
  updateCustomerForAgent,
} from "@/services/customer.service";
import { ApiError } from "@/lib/api-client";
import { isMindanaoRegion } from "@/lib/psgc-api";
import { formatAddress } from "@/lib/utils";
import type { AddressParts } from "@/types/auth";
import type { Customer } from "@/types/customer";
import { AddressSelector } from "@/components/shared/address-selector";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { AgentStackParamList } from "@/app/navigation/types";

const EMPTY_ADDRESS: AddressParts = {
  street: "",
  purok: "",
  barangay: { code: "", name: "" },
  city: { code: "", name: "" },
  province: { code: "", name: "" },
  region: { code: "", name: "" },
};

interface CustomerEditForm {
  fullName: string;
  contactNumber: string;
  gender: string;
  addressParts: AddressParts;
}

export function CustomerDetailScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AgentStackParamList>>();
  const route = useRoute<RouteProp<AgentStackParamList, "CustomerDetail">>();
  const { user } = useAuth();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CustomerEditForm>({
    fullName: "",
    contactNumber: "",
    gender: "",
    addressParts: EMPTY_ADDRESS,
  });

  const agentId = user?.agentId ?? "";

  const load = useCallback(async () => {
    setError(null);
    try {
      const c = await getCustomerForAgent(route.params.customerId, agentId);
      setCustomer(c);
      if (c) {
        setForm({
          fullName: c.fullName,
          contactNumber: c.contactNumber,
          gender: c.gender ?? "",
          addressParts: c.addressParts,
        });
      }
      if (!c) setError("Customer not found.");
    } catch {
      setError("Failed to load customer.");
    } finally {
      setLoading(false);
    }
  }, [route.params.customerId, agentId]);

  const addressComplete =
    Boolean(form.addressParts.street.trim()) &&
    Boolean(form.addressParts.purok.trim()) &&
    Boolean(form.addressParts.barangay.name.trim()) &&
    Boolean(form.addressParts.city.name.trim()) &&
    Boolean(form.addressParts.province.name.trim()) &&
    Boolean(form.addressParts.region.name.trim()) &&
    isMindanaoRegion(form.addressParts.region);

  const canSave =
    Boolean(form.fullName.trim()) &&
    Boolean(form.contactNumber.trim()) &&
    addressComplete &&
    !saving;

  const onSave = async () => {
    if (!canSave || !customer) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await updateCustomerForAgent(
        customer.id,
        {
          fullName: form.fullName.trim(),
          contactNumber: form.contactNumber.trim(),
          gender: form.gender || undefined,
          addressParts: {
            ...form.addressParts,
            street: form.addressParts.street.trim(),
            purok: form.addressParts.purok.trim(),
          },
        },
        agentId,
      );
      if (updated) {
        setCustomer(updated);
        setEditing(false);
      } else {
        setError("Failed to update customer.");
      }
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Failed to update customer.",
      );
    } finally {
      setSaving(false);
    }
  };

  React.useEffect(() => {
    // The loader owns its async state; this keeps the screen in sync on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-secondary">
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 24 }}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="mb-6 h-10 w-10 items-center justify-center rounded-full border border-border bg-background"
        >
          <ArrowLeft size={18} color="#0F172A" />
        </Pressable>

        {loading ? (
          <LoadingState label="Loading customer..." />
        ) : error || !customer ? (
          <ErrorState
            description={error ?? "Customer not found."}
            onRetry={() => void load()}
          />
        ) : (
          <>
            <View className="items-center">
              <View className="h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <UserRound size={28} color="#16A34A" />
              </View>
              <Text variant="h1" weight="bold" className="mt-4 text-center">
                {customer.fullName}
              </Text>
              <View className="mt-2">
                <Badge
                  label={customer.status}
                  tone={customer.status === "active" ? "success" : "muted"}
                />
              </View>
            </View>

            <View className="mt-4">
              <Button
                label={editing ? "Cancel" : "Edit Customer"}
                variant={editing ? "outline" : "secondary"}
                size="control"
                fullWidth
                onPress={() => {
                  setError(null);
                  if (editing && customer) {
                    setForm({
                      fullName: customer.fullName,
                      contactNumber: customer.contactNumber,
                      gender: customer.gender ?? "",
                      addressParts: customer.addressParts,
                    });
                  }
                  setEditing((current) => !current);
                }}
              />
            </View>

            {editing ? (
              <Card className="mt-4 gap-4">
                <Input
                  label="Full name"
                  size="control"
                  value={form.fullName}
                  onChangeText={(fullName) => setForm({ ...form, fullName })}
                />
                <Input
                  label="Contact number"
                  size="control"
                  keyboardType="phone-pad"
                  value={form.contactNumber}
                  onChangeText={(contactNumber) =>
                    setForm({ ...form, contactNumber })
                  }
                />
                <View>
                  <Text variant="label" tone="muted" className="mb-2">
                    GENDER (OPTIONAL)
                  </Text>
                  <View className="flex-row gap-3">
                    {["Male", "Female", "Other"].map((option) => {
                      const selected = form.gender === option;
                      return (
                        <Pressable
                          key={option}
                          onPress={() => setForm({ ...form, gender: option })}
                          className={`flex-1 items-center rounded-md border px-3 py-3 ${
                            selected
                              ? "border-primary bg-primary/5"
                              : "border-border bg-background"
                          }`}
                        >
                          <Text
                            weight="semibold"
                            className={
                              selected ? "text-primary" : "text-foreground"
                            }
                          >
                            {option}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <AddressSelector
                  value={form.addressParts}
                  onChange={(addressParts) =>
                    setForm({ ...form, addressParts })
                  }
                  disabled={saving}
                />

                {!addressComplete ? (
                  <Text variant="small" tone="danger">
                    Complete the address and select a region within Mindanao.
                  </Text>
                ) : null}

                {error ? (
                  <Text variant="small" tone="danger">
                    {error}
                  </Text>
                ) : null}

                <Button
                  label="Save Changes"
                  size="control"
                  fullWidth
                  loading={saving}
                  disabled={!canSave}
                  onPress={() => {
                    void onSave();
                  }}
                />
              </Card>
            ) : null}

            <Card className="mt-6 gap-4">
              <View className="flex-row items-center gap-3">
                <Phone size={16} color="#64748B" />
                <Text className="flex-1">{customer.contactNumber}</Text>
              </View>
              {customer.gender ? (
                <View className="flex-row items-center gap-3">
                  <UserRound size={16} color="#64748B" />
                  <Text className="flex-1">{customer.gender}</Text>
                </View>
              ) : null}
              <View className="flex-row items-start gap-3">
                <MapPin size={16} color="#64748B" style={{ marginTop: 2 }} />
                <View className="flex-1">
                  <Text variant="small" tone="muted">
                    Address
                  </Text>
                  <Text className="mt-0.5">
                    {formatAddress(customer.addressParts) || customer.address}
                  </Text>
                </View>
              </View>
            </Card>

            <View className="mt-4 flex-row gap-3">
              <Card className="flex-1">
                <Text variant="small" tone="muted">
                  Bookings
                </Text>
                <Text variant="h2" weight="bold" tone="primary" className="mt-1">
                  {customer.totalBookings}
                </Text>
              </Card>
              <Card className="flex-1">
                <Text variant="small" tone="muted">
                  Total Purchases
                </Text>
                <Text variant="h2" weight="bold" className="mt-1">
                  ₱{customer.totalPurchases.toLocaleString()}
                </Text>
              </Card>
            </View>

            {customer.notes ? (
              <Card className="mt-4">
                <Text variant="small" tone="muted">
                  Notes
                </Text>
                <Text className="mt-1">{customer.notes}</Text>
              </Card>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
