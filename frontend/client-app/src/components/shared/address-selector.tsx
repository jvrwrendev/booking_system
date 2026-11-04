import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  View,
} from "react-native";
import { Check, ChevronDown, X } from "lucide-react-native";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import {
  fetchBarangays,
  fetchCities,
  fetchMunicipalities,
  fetchProvinces,
  fetchRegions,
  MINDANAO_REGION_CODES,
  type PSGCBarangay,
  type PSGCCityOrMunicipality,
  type PSGCProvince,
  type PSGCRegion,
} from "@/lib/psgc-api";
import type { AddressParts, AddressRef } from "@/types/auth";

interface AddressSelectorProps {
  value: AddressParts;
  onChange: (value: AddressParts) => void;
  disabled?: boolean;
}

const EMPTY_REF: AddressRef = { code: "", name: "" };

function optionKey(option: AddressRef): string {
  return option.code || option.name;
}

export function AddressSelector({
  value,
  onChange,
  disabled = false,
}: AddressSelectorProps) {
  const [regionsState, setRegionsState] = useState<{
    key: string;
    data: PSGCRegion[];
    error: string | null;
  }>({ key: "", data: [], error: null });

  const [provincesState, setProvincesState] = useState<{
    key: string;
    data: PSGCProvince[];
    error: string | null;
  }>({ key: "", data: [], error: null });

  const [citiesState, setCitiesState] = useState<{
    key: string;
    data: PSGCCityOrMunicipality[];
    error: string | null;
  }>({ key: "", data: [], error: null });

  const [barangaysState, setBarangaysState] = useState<{
    key: string;
    data: PSGCBarangay[];
    error: string | null;
  }>({ key: "", data: [], error: null });

  useEffect(() => {
    let active = true;

    fetchRegions()
      .then((items) => {
        if (!active) return;
        setRegionsState({
          key: "mindanao",
          data: items
            .filter((region) => MINDANAO_REGION_CODES.has(region.code))
            .sort((a, b) => a.name.localeCompare(b.name)),
          error: null,
        });
      })
      .catch(() => {
        if (!active) return;
        setRegionsState({
          key: "mindanao",
          data: [],
          error: "Failed to load Mindanao regions.",
        });
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const key = value.region.code;
    if (!key) return;

    let active = true;

    fetchProvinces(key)
      .then((items) => {
        if (!active) return;
        setProvincesState({
          key,
          data: [...items].sort((a, b) => a.name.localeCompare(b.name)),
          error: null,
        });
      })
      .catch(() => {
        if (!active) return;
        setProvincesState({
          key,
          data: [],
          error: "Failed to load provinces.",
        });
      });

    return () => {
      active = false;
    };
  }, [value.region.code]);

  useEffect(() => {
    const key = value.province.code;
    if (!key) return;

    let active = true;

    Promise.all([fetchCities(key), fetchMunicipalities(key)])
      .then(([cityItems, municipalityItems]) => {
        if (!active) return;
        const merged = [...cityItems, ...municipalityItems];
        const unique = new Map(merged.map((item) => [item.code, item]));
        setCitiesState({
          key,
          data: Array.from(unique.values()).sort((a, b) =>
            a.name.localeCompare(b.name),
          ),
          error: null,
        });
      })
      .catch(() => {
        if (!active) return;
        setCitiesState({
          key,
          data: [],
          error: "Failed to load cities and municipalities.",
        });
      });

    return () => {
      active = false;
    };
  }, [value.province.code]);

  useEffect(() => {
    const key = value.city.code;
    if (!key) return;

    let active = true;

    fetchBarangays(key)
      .then((items) => {
        if (!active) return;
        setBarangaysState({
          key,
          data: [...items].sort((a, b) => a.name.localeCompare(b.name)),
          error: null,
        });
      })
      .catch(() => {
        if (!active) return;
        setBarangaysState({
          key,
          data: [],
          error: "Failed to load barangays.",
        });
      });

    return () => {
      active = false;
    };
  }, [value.city.code]);

  const regionsLoading = regionsState.key !== "mindanao";
  const regionsError =
    regionsState.key === "mindanao" ? regionsState.error : null;

  const provincesLoading =
    Boolean(value.region.code) && provincesState.key !== value.region.code;
  const provincesError =
    provincesState.key === value.region.code ? provincesState.error : null;

  const citiesLoading =
    Boolean(value.province.code) && citiesState.key !== value.province.code;
  const citiesError =
    citiesState.key === value.province.code ? citiesState.error : null;

  const barangaysLoading =
    Boolean(value.city.code) && barangaysState.key !== value.city.code;
  const barangaysError =
    barangaysState.key === value.city.code ? barangaysState.error : null;

  const regionOptions = useMemo(
    () =>
      (regionsState.key === "mindanao" ? regionsState.data : []).map(
        (region) => ({ code: region.code, name: region.name }),
      ),
    [regionsState],
  );

  const provinceOptions = useMemo(
    () =>
      (provincesState.key === value.region.code ? provincesState.data : []).map(
        (province) => ({
          code: province.code,
          name: province.name,
        }),
      ),
    [provincesState, value.region.code],
  );

  const cityOptions = useMemo(
    () =>
      (citiesState.key === value.province.code ? citiesState.data : []).map(
        (city) => ({ code: city.code, name: city.name }),
      ),
    [citiesState, value.province.code],
  );

  const barangayOptions = useMemo(
    () =>
      (barangaysState.key === value.city.code ? barangaysState.data : []).map(
        (barangay) => ({
          code: barangay.code,
          name: barangay.name,
        }),
      ),
    [barangaysState, value.city.code],
  );

  return (
    <View className="gap-4">
      <Input
        size="control"
        label="Street, Purok, House No."
        value={value.street}
        onChangeText={(street) => onChange({ ...value, street })}
        placeholder="e.g., 123 Mahogany St., Purok 5"
        editable={!disabled}
      />

      <OptionField
        label="Region (Mindanao only)"
        value={value.region}
        options={regionOptions}
        placeholder={regionsLoading ? "Loading..." : "Select Mindanao region"}
        disabled={disabled || regionsLoading}
        loading={regionsLoading}
        error={regionsError}
        onChange={(region) =>
          onChange({
            ...value,
            region,
            province: EMPTY_REF,
            city: EMPTY_REF,
            barangay: EMPTY_REF,
            purok: "",
          })
        }
      />

      <OptionField
        label="Province"
        value={value.province}
        options={provinceOptions}
        placeholder={
          !value.region.code
            ? "Select region first"
            : provincesLoading
              ? "Loading..."
              : "Select province"
        }
        disabled={disabled || !value.region.code || provincesLoading}
        loading={provincesLoading}
        error={provincesError}
        onChange={(province) =>
          onChange({
            ...value,
            province,
            city: EMPTY_REF,
            barangay: EMPTY_REF,
            purok: "",
          })
        }
      />

      <OptionField
        label="City / Municipality"
        value={value.city}
        options={cityOptions}
        placeholder={
          !value.province.code
            ? "Select province first"
            : citiesLoading
              ? "Loading..."
              : "Select city or municipality"
        }
        disabled={disabled || !value.province.code || citiesLoading}
        loading={citiesLoading}
        error={citiesError}
        onChange={(city) =>
          onChange({
            ...value,
            city,
            barangay: EMPTY_REF,
            purok: "",
          })
        }
      />

      <OptionField
        label="Barangay"
        value={value.barangay}
        options={barangayOptions}
        placeholder={
          !value.city.code
            ? "Select city first"
            : barangaysLoading
              ? "Loading..."
              : "Select barangay"
        }
        disabled={disabled || !value.city.code || barangaysLoading}
        loading={barangaysLoading}
        error={barangaysError}
        onChange={(barangay) =>
          onChange({ ...value, barangay, purok: "" })
        }
      />

      <Input
        size="control"
        label="Purok"
        value={value.purok}
        onChangeText={(purok) => onChange({ ...value, purok })}
        placeholder="e.g., Purok 5"
        editable={!disabled}
      />
    </View>
  );
}

interface OptionFieldProps {
  label: string;
  value: AddressRef;
  options: AddressRef[];
  placeholder: string;
  disabled?: boolean;
  loading?: boolean;
  error?: string | null;
  onChange: (option: AddressRef) => void;
}

function OptionField({
  label,
  value,
  options,
  placeholder,
  disabled = false,
  loading = false,
  error,
  onChange,
}: OptionFieldProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.code === value.code);
  const displayName = selected?.name || value.name;

  return (
    <View>
      <Text variant="label" tone="muted" className="mb-1.5">
        {label}
      </Text>

      <Pressable
        onPress={() => {
          if (!disabled) setOpen(true);
        }}
        accessibilityRole="button"
        accessibilityLabel={label}
        disabled={disabled}
        className={`min-h-[44px] flex-row items-center justify-between rounded-md border bg-background px-3 ${
          disabled ? "opacity-60" : ""
        } ${
          error
            ? "border-danger"
            : "border-field hover:border-field-hover active:border-field-focus"
        }`}
      >
        <Text
          variant="small"
          tone={displayName ? "default" : "muted"}
          className="flex-1 pr-2"
          numberOfLines={1}
        >
          {displayName || placeholder}
        </Text>
        <ChevronDown size={16} color="#64748B" />
      </Pressable>

      {error ? (
        <Text variant="small" tone="danger" className="mt-1">
          {error}
        </Text>
      ) : null}

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <Pressable
            className="absolute inset-0"
            onPress={() => setOpen(false)}
            accessibilityLabel="Close selection"
          />
          <View className="max-h-[75%] rounded-t-2xl bg-background px-4 pb-6 pt-4">
            <View className="mb-3 flex-row items-center justify-between">
              <Text variant="h2" weight="semibold">
                {label}
              </Text>
              <Pressable
                onPress={() => setOpen(false)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Close"
                className="h-9 w-9 items-center justify-center rounded-full bg-secondary"
              >
                <X size={18} color="#0F172A" />
              </Pressable>
            </View>

            {loading ? (
              <Text variant="small" tone="muted" className="py-6 text-center">
                Loading...
              </Text>
            ) : (
              <FlatList
                data={options}
                keyExtractor={optionKey}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={
                  <Text variant="small" tone="muted" className="py-6 text-center">
                    No options available.
                  </Text>
                }
                renderItem={({ item }) => {
                  const isSelected = item.code === value.code;
                  return (
                    <Pressable
                      onPress={() => {
                        onChange(item);
                        setOpen(false);
                      }}
                      className={`mb-1 flex-row items-center justify-between rounded-md px-3 py-3 ${
                        isSelected ? "bg-primary/10" : "bg-background"
                      }`}
                    >
                      <Text
                        weight={isSelected ? "semibold" : "regular"}
                        className={isSelected ? "text-primary" : "text-foreground"}
                      >
                        {item.name}
                      </Text>
                      {isSelected ? (
                        <Check size={16} color="#16A34A" />
                      ) : null}
                    </Pressable>
                  );
                }}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
