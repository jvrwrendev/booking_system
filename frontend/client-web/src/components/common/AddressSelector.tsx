import { useMemo } from "react";
import { Loader2 } from "lucide-react";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  fetchBarangays,
  fetchCities,
  fetchCitiesInRegion,
  fetchMunicipalities,
  fetchProvinces,
  fetchRegions,
  type PSGCBarangay,
  type PSGCCityOrMunicipality,
  type PSGCProvince,
  type PSGCRegion,
} from "@/lib/psgc-api";
import { useAsync } from "@/lib/useAsync";
import {
  emptyAddressRef,
  type AddressParts,
} from "@/lib/utils";

interface AddressSelectorProps {
  value: AddressParts;
  onChange: (value: AddressParts) => void;
}

const NONE = "__none__";

export function AddressSelector({ value, onChange }: AddressSelectorProps) {
  const regions = useAsync<PSGCRegion[]>("regions", fetchRegions, []);
  const provinces = useAsync<PSGCProvince[]>(
    `provinces-${value.region.code}`,
    () => fetchProvinces(value.region.code),
    [value.region.code]
  );
  const regionCities = useAsync<PSGCCityOrMunicipality[]>(
    `region-cities-${value.region.code}`,
    () => fetchCitiesInRegion(value.region.code),
    [value.region.code]
  );
  const provinceCities = useAsync<PSGCCityOrMunicipality[]>(
    `province-cities-${value.province.code}`,
    () => fetchCities(value.province.code),
    [value.province.code]
  );
  const provinceMuns = useAsync<PSGCCityOrMunicipality[]>(
    `province-muns-${value.province.code}`,
    () => fetchMunicipalities(value.province.code),
    [value.province.code]
  );
  const barangays = useAsync<PSGCBarangay[]>(
    `barangays-${value.city.code}`,
    () => fetchBarangays(value.city.code),
    [value.city.code]
  );

  const hasProvinces = (provinces.data?.length ?? 0) > 0;

  const cityOptions = useMemo<PSGCCityOrMunicipality[]>(() => {
    if (!value.province.code) {
      return regionCities.data ?? [];
    }
    const cities = provinceCities.data ?? [];
    const muns = provinceMuns.data ?? [];
    return [...cities, ...muns].sort((a, b) => a.name.localeCompare(b.name));
  }, [
    value.province.code,
    regionCities.data,
    provinceCities.data,
    provinceMuns.data,
  ]);

  const handleRegionChange = (code: string) => {
    if (code === NONE) {
      onChange({
        ...value,
        region: emptyAddressRef(),
        province: emptyAddressRef(),
        city: emptyAddressRef(),
        barangay: emptyAddressRef(),
      });
      return;
    }
    const region = regions.data?.find((r) => r.code === code);
    if (!region) return;
    onChange({
      ...value,
      region: { code: region.code, name: region.name },
      province: emptyAddressRef(),
      city: emptyAddressRef(),
      barangay: emptyAddressRef(),
    });
  };

  const handleProvinceChange = (code: string) => {
    if (code === NONE) {
      onChange({
        ...value,
        province: emptyAddressRef(),
        city: emptyAddressRef(),
        barangay: emptyAddressRef(),
      });
      return;
    }
    const province = provinces.data?.find((p) => p.code === code);
    if (!province) return;
    onChange({
      ...value,
      province: { code: province.code, name: province.name },
      city: emptyAddressRef(),
      barangay: emptyAddressRef(),
    });
  };

  const handleCityChange = (code: string) => {
    if (code === NONE) {
      onChange({
        ...value,
        city: emptyAddressRef(),
        barangay: emptyAddressRef(),
      });
      return;
    }
    const city = cityOptions.find((c) => c.code === code);
    if (!city) return;
    onChange({
      ...value,
      city: { code: city.code, name: city.name },
      barangay: emptyAddressRef(),
    });
  };

  const handleBarangayChange = (code: string) => {
    if (code === NONE) {
      onChange({ ...value, barangay: emptyAddressRef() });
      return;
    }
    const barangay = barangays.data?.find((b) => b.code === code);
    if (!barangay) return;
    onChange({
      ...value,
      barangay: { code: barangay.code, name: barangay.name },
    });
  };

  const isCityLoading =
    provinceCities.loading || provinceMuns.loading || regionCities.loading;

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="address-street" className="text-[13px] font-medium">
          Street, Purok, House No.
        </Label>
        <Input
          id="address-street"
          value={value.street}
          onChange={(e) => onChange({ ...value, street: e.target.value })}
          placeholder="e.g., 123 Mahogany St., Purok 5"
          autoComplete="street-address"
          className="h-10"
        />
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Field
          label="Region"
          htmlFor="address-region"
          error={regions.error ? "Failed to load" : undefined}
        >
          <Select
            value={value.region.code || NONE}
            onValueChange={handleRegionChange}
          >
            <SelectTrigger id="address-region" className="h-10 w-full">
              <SelectValue
                placeholder={regions.loading ? "Loading..." : "Select region"}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>—</SelectItem>
              {regions.data?.map((r) => (
                <SelectItem key={r.code} value={r.code}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Province" htmlFor="address-province">
          <Select
            value={value.province.code || NONE}
            onValueChange={handleProvinceChange}
            disabled={!value.region.code || provinces.loading}
          >
            <SelectTrigger id="address-province" className="h-10 w-full">
              <SelectValue
                placeholder={
                  provinces.loading
                    ? "Loading..."
                    : !value.region.code
                    ? "Select region first"
                    : !hasProvinces
                    ? "No provinces"
                    : "Select province"
                }
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>—</SelectItem>
              {provinces.data?.map((p) => (
                <SelectItem key={p.code} value={p.code}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="City / Municipality" htmlFor="address-city">
          <Select
            value={value.city.code || NONE}
            onValueChange={handleCityChange}
            disabled={
              !value.region.code ||
              (hasProvinces && !value.province.code) ||
              isCityLoading
            }
          >
            <SelectTrigger id="address-city" className="h-10 w-full">
              <SelectValue
                placeholder={
                  isCityLoading ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Loader2 className="h-3 w-3 animate-spin" /> Loading...
                    </span>
                  ) : !value.region.code
                  ? "Select region first"
                  : hasProvinces && !value.province.code
                  ? "Select province first"
                  : cityOptions.length === 0
                  ? "No cities"
                  : "Select city"
                }
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>—</SelectItem>
              {cityOptions.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Barangay" htmlFor="address-barangay">
          <Select
            value={value.barangay.code || NONE}
            onValueChange={handleBarangayChange}
            disabled={!value.city.code || barangays.loading}
          >
            <SelectTrigger id="address-barangay" className="h-10 w-full">
              <SelectValue
                placeholder={
                  barangays.loading ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Loader2 className="h-3 w-3 animate-spin" /> Loading...
                    </span>
                  ) : !value.city.code
                  ? "Select city first"
                  : barangays.data?.length === 0
                  ? "No barangays"
                  : "Select barangay"
                }
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>—</SelectItem>
              {barangays.data?.map((b) => (
                <SelectItem key={b.code} value={b.code}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-[13px] font-medium">
        {label}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
