import type { Branch } from "@/types/branch";
import { formatAddress } from "@/lib/utils";

const ADDR = (
  street: string,
  region: { code: string; name: string },
  province: { code: string; name: string },
  city: { code: string; name: string },
  barangay: { code: string; name: string }
) => {
  const addressParts = { street, barangay, city, province, region };
  return { address: formatAddress(addressParts), addressParts };
};

const NCR_QC_MAHARANY = ADDR(
  "123 EDSA",
  { code: "1300000000", name: "National Capital Region (NCR)" },
  { code: "", name: "" },
  { code: "1381300000", name: "Quezon City" },
  { code: "1381300056", name: "Maharlika" }
);

const CEBU_CITY = ADDR(
  "88 Mango Ave",
  { code: "0700000000", name: "Region VII (Central Visayas)" },
  { code: "0702200000", name: "Cebu" },
  { code: "0730600000", name: "City of Cebu" },
  { code: "", name: "" }
);

const DAVAO_CITY = ADDR(
  "45 Roxas Ave",
  { code: "1100000000", name: "Region XI (Davao Region)" },
  { code: "1102400000", name: "Davao del Sur" },
  { code: "112402000", name: "Davao City" },
  { code: "", name: "" }
);

const ILOILO_CITY = ADDR(
  "12 Diversion Rd",
  { code: "0600000000", name: "Region VI (Western Visayas)" },
  { code: "0603000000", name: "Iloilo" },
  { code: "063002000", name: "Iloilo City" },
  { code: "", name: "" }
);

const BAGUIO_CITY = ADDR(
  "7 Session Rd",
  { code: "1400000000", name: "Cordillera Administrative Region (CAR)" },
  { code: "1401100000", name: "Benguet" },
  { code: "142711000", name: "Baguio City" },
  { code: "", name: "" }
);

const CALAMBA_CITY = ADDR(
  "30 National Highway",
  { code: "0400000000", name: "Region IV-A (CALABARZON)" },
  { code: "0403400000", name: "Laguna" },
  { code: "0403405000", name: "City of Calamba" },
  { code: "", name: "" }
);

const SF_PAMPANGA = ADDR(
  "200 MacArthur Highway",
  { code: "0300000000", name: "Region III (Central Luzon)" },
  { code: "0305400000", name: "Pampanga" },
  { code: "0305416000", name: "City of San Fernando " },
  { code: "", name: "" }
);

export const mockBranches: Branch[] = [
  {
    id: "BR-001",
    name: "Quezon City Main Branch",
    code: "AGR-QC",
    email: "qc@agrivet.ph",
    password: "password",
    manager: "Roberto Garcia",
    contactNumber: "+63 2 8123 4567",
    ...NCR_QC_MAHARANY,
    totalProducts: 18,
    totalStock: 1240,
    status: "active",
    createdAt: "2024-01-10T08:00:00Z",
  },
  {
    id: "BR-002",
    name: "Cebu City Branch",
    code: "AGR-CB",
    email: "cebu@agrivet.ph",
    password: "password",
    manager: "Liza Tan",
    contactNumber: "+63 32 412 3456",
    ...CEBU_CITY,
    totalProducts: 15,
    totalStock: 980,
    status: "active",
    createdAt: "2024-02-12T08:00:00Z",
  },
  {
    id: "BR-003",
    name: "Davao Branch",
    code: "AGR-DV",
    email: "davao@agrivet.ph",
    password: "password",
    manager: "Mark Villanueva",
    contactNumber: "+63 82 222 7890",
    ...DAVAO_CITY,
    totalProducts: 14,
    totalStock: 850,
    status: "active",
    createdAt: "2024-03-15T08:00:00Z",
  },
  {
    id: "BR-004",
    name: "Iloilo Branch",
    code: "AGR-IL",
    email: "iloilo@agrivet.ph",
    password: "password",
    manager: "Anna Reyes",
    contactNumber: "+63 33 335 1122",
    ...ILOILO_CITY,
    totalProducts: 12,
    totalStock: 720,
    status: "active",
    createdAt: "2024-04-08T08:00:00Z",
  },
  {
    id: "BR-005",
    name: "Baguio Branch",
    code: "AGR-BG",
    email: "baguio@agrivet.ph",
    password: "password",
    manager: "Diego Santos",
    contactNumber: "+63 74 444 5566",
    ...BAGUIO_CITY,
    totalProducts: 10,
    totalStock: 510,
    status: "active",
    createdAt: "2024-05-20T08:00:00Z",
  },
  {
    id: "BR-006",
    name: "Laguna Branch",
    code: "AGR-LG",
    email: "laguna@agrivet.ph",
    password: "password",
    manager: "Patricia Cruz",
    contactNumber: "+63 49 834 2200",
    ...CALAMBA_CITY,
    totalProducts: 13,
    totalStock: 690,
    status: "active",
    createdAt: "2024-06-22T08:00:00Z",
  },
  {
    id: "BR-007",
    name: "Pampanga Branch",
    code: "AGR-PM",
    email: "pampanga@agrivet.ph",
    password: "password",
    manager: "Ramon Aquino",
    contactNumber: "+63 45 961 3344",
    ...SF_PAMPANGA,
    totalProducts: 9,
    totalStock: 420,
    status: "inactive",
    createdAt: "2024-07-18T08:00:00Z",
  },
];
