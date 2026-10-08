import React, { useCallback, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Mail, MapPin, Phone, UserRound } from "lucide-react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuth } from "@/hooks/use-auth";
import { getCustomerForAgent, updateCustomerForAgent } from "@/services/customer.service";
import type { Customer } from "@/types/customer";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { AgentStackParamList } from "@/app/navigation/types";

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
  const [form, setForm] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    suffix: "",
    email: "",
    contactNumber: "",
    gender: "",
    street: "",
    barangay: "",
    city: "",
    province: "",
    region: "",
  });

  const agentId = user?.agentId ?? "";

  const load = useCallback(async () => {
    setError(null);
    try {
      const c = await getCustomerForAgent(route.params.customerId, agentId);
      setCustomer(c);
      if (c) {
        setForm({
          firstName: c.firstName,
          middleName: c.middleName,
          lastName: c.lastName,
          suffix: c.suffix,
          email: c.email,
          contactNumber: c.contactNumber,
          gender: c.gender ?? "",
          street: c.addressParts.street,
          barangay: c.addressParts.barangay.name,
          city: c.addressParts.city.name,
          province: c.addressParts.province.name,
          region: c.addressParts.region.name,
        });
      }
      if (!c) setError("Customer not found.");
    } catch {
      setError("Failed to load customer.");
    } finally {
      setLoading(false);
    }
  }, [route.params.customerId, agentId]);

  const onSave = async () => {
    if (saving || !customer) return;
    setSaving(true);
    try {
      const updated = await updateCustomerForAgent(
        customer.id,
        {
          firstName: form.firstName.trim(),
          middleName: form.middleName.trim(),
          lastName: form.lastName.trim(),
          suffix: form.suffix.trim(),
          email: form.email.trim(),
          contactNumber: form.contactNumber.trim(),
          gender: form.gender,
          addressParts: {
            street: form.street.trim(),
            barangay: { code: "", name: form.barangay.trim() },
            city: { code: "", name: form.city.trim() },
            province: { code: "", name: form.province.trim() },
            region: { code: "", name: form.region.trim() },
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
    } catch {
      setError("Failed to update customer.");
    } finally {
      setSaving(false);
    }
  };

  React.useEffect(() => {
    void load();
  }, [load]);

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-secondary">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24 }}
      >
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
                onPress={() => setEditing((e) => !e)}
              />
            </View>

            {editing ? (
              <Card className="mt-4 gap-4">
                <Input label="First name" size="control" value={form.firstName} onChangeText={(v) => setForm({ ...form, firstName: v })} />
                <Input label="Middle name" size="control" value={form.middleName} onChangeText={(v) => setForm({ ...form, middleName: v })} />
                <Input label="Last name" size="control" value={form.lastName} onChangeText={(v) => setForm({ ...form, lastName: v })} />
                <Input label="Suffix" size="control" value={form.suffix} onChangeText={(v) => setForm({ ...form, suffix: v })} />
                <Input label="Email" size="control" autoCapitalize="none" value={form.email} onChangeText={(v) => setForm({ ...form, email: v })} />
                <Input label="Contact number" size="control" keyboardType="phone-pad" value={form.contactNumber} onChangeText={(v) => setForm({ ...form, contactNumber: v })} />
                <View>
                  <Text variant="label" tone="muted" className="mb-2">
                    GENDER
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
                          <Text weight="semibold" className={selected ? "text-primary" : "text-foreground"}>
                            {option}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
                <Input label="Street" size="control" value={form.street} onChangeText={(v) => setForm({ ...form, street: v })} />
                <Input label="Barangay" size="control" value={form.barangay} onChangeText={(v) => setForm({ ...form, barangay: v })} />
                <Input label="City / Municipality" size="control" value={form.city} onChangeText={(v) => setForm({ ...form, city: v })} />
                <Input label="Province" size="control" value={form.province} onChangeText={(v) => setForm({ ...form, province: v })} />
                <Input label="Region" size="control" value={form.region} onChangeText={(v) => setForm({ ...form, region: v })} />
                <Button
                  label="Save Changes"
                  size="control"
                  fullWidth
                  loading={saving}
                  onPress={() => {
                    void onSave();
                  }}
                />
              </Card>
            ) : null}

            <Card className="mt-6 gap-4">
              <View className="flex-row items-center gap-3">
                <Mail size={16} color="#64748B" />
                <Text className="flex-1">{customer.email}</Text>
              </View>
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
                <Text className="flex-1">{customer.address}</Text>
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
