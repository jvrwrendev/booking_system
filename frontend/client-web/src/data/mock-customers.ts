import type { Customer } from "@/types/customer";
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
  "123 Mahogany St",
  { code: "1300000000", name: "National Capital Region (NCR)" },
  { code: "", name: "" },
  { code: "1381300000", name: "Quezon City" },
  { code: "1381300056", name: "Maharlika" }
);
const NCR_QC_DILIMAN = ADDR(
  "21 Rizal Ave",
  { code: "1300000000", name: "National Capital Region (NCR)" },
  { code: "", name: "" },
  { code: "1381300000", name: "Quezon City" },
  { code: "1381300124", name: "U.P. Campus" }
);

const CEBU_CITY = ADDR(
  "45 Narra Ave",
  { code: "0700000000", name: "Region VII (Central Visayas)" },
  { code: "0702200000", name: "Cebu" },
  { code: "0730600000", name: "City of Cebu" },
  { code: "", name: "" }
);
const CEBU_MANGO = ADDR(
  "55 Mango St",
  { code: "0700000000", name: "Region VII (Central Visayas)" },
  { code: "0702200000", name: "Cebu" },
  { code: "0730600000", name: "City of Cebu" },
  { code: "", name: "" }
);

const DAVAO_CITY = ADDR(
  "88 Acacia St",
  { code: "1100000000", name: "Region XI (Davao Region)" },
  { code: "1102400000", name: "Davao del Sur" },
  { code: "112402000", name: "Davao City" },
  { code: "", name: "" }
);
const DAVAO_BONIFACIO = ADDR(
  "101 Bonifacio St",
  { code: "1100000000", name: "Region XI (Davao Region)" },
  { code: "1102400000", name: "Davao del Sur" },
  { code: "112402000", name: "Davao City" },
  { code: "", name: "" }
);

const ILOILO_CITY = ADDR(
  "12 Molave St",
  { code: "0600000000", name: "Region VI (Western Visayas)" },
  { code: "0603000000", name: "Iloilo" },
  { code: "063002000", name: "Iloilo City" },
  { code: "", name: "" }
);

const BAGUIO_CITY = ADDR(
  "5 Pine Rd",
  { code: "1400000000", name: "Cordillera Administrative Region (CAR)" },
  { code: "1401100000", name: "Benguet" },
  { code: "142711000", name: "Baguio City" },
  { code: "", name: "" }
);

const CALAMBA_CITY = ADDR(
  "78 Lapu-Lapu Rd",
  { code: "0400000000", name: "Region IV-A (CALABARZON)" },
  { code: "0403400000", name: "Laguna" },
  { code: "0403405000", name: "City of Calamba" },
  { code: "", name: "" }
);

const SF_PAMPANGA = ADDR(
  "30 MacArthur Hwy",
  { code: "0300000000", name: "Region III (Central Luzon)" },
  { code: "0305400000", name: "Pampanga" },
  { code: "0305416000", name: "City of San Fernando " },
  { code: "", name: "" }
);

export const mockCustomers: Customer[] = [
  {
    id: "CUS-001",
    firstName: "Ricardo",
    middleName: "",
    lastName: "Bautista",
    suffix: "",
    fullName: "Ricardo Bautista",
    email: "ricardo.bautista@gmail.com",
    password: "password",
    contactNumber: "+63 917 200 1101",
    ...NCR_QC_MAHARANY,
    assignedAgentId: "AGT-001",
    assignedAgentName: "Roberto Garcia",
    totalBookings: 14,
    totalPurchases: 84200,
    status: "active",
    registeredDate: "2024-02-15T08:00:00Z",
  },
  {
    id: "CUS-002",
    firstName: "Elena",
    middleName: "",
    lastName: "Gomez",
    suffix: "",
    fullName: "Elena Gomez",
    email: "elena.gomez@yahoo.com",
    password: "password",
    contactNumber: "+63 920 555 2233",
    ...CEBU_CITY,
    assignedAgentId: "AGT-002",
    assignedAgentName: "Liza Tan",
    totalBookings: 9,
    totalPurchases: 52100,
    status: "active",
    registeredDate: "2024-04-02T08:00:00Z",
  },
  {
    id: "CUS-003",
    firstName: "Fernando",
    middleName: "",
    lastName: "Lopez",
    suffix: "III",
    fullName: "Fernando Lopez III",
    email: "fernando.lopez@gmail.com",
    password: "password",
    contactNumber: "+63 925 111 4477",
    ...DAVAO_CITY,
    assignedAgentId: "AGT-003",
    assignedAgentName: "Mark Villanueva",
    totalBookings: 22,
    totalPurchases: 124500,
    status: "active",
    registeredDate: "2024-05-18T08:00:00Z",
  },
  {
    id: "CUS-004",
    firstName: "Gloria",
    middleName: "",
    lastName: "Ramos",
    suffix: "",
    fullName: "Gloria Ramos",
    email: "gloria.ramos@hotmail.com",
    password: "password",
    contactNumber: "+63 922 333 8899",
    ...ILOILO_CITY,
    assignedAgentId: "AGT-004",
    assignedAgentName: "Anna Reyes",
    totalBookings: 7,
    totalPurchases: 28900,
    status: "active",
    registeredDate: "2024-07-12T08:00:00Z",
  },
  {
    id: "CUS-005",
    firstName: "Manuel",
    middleName: "",
    lastName: "Domingo",
    suffix: "",
    fullName: "Manuel Domingo",
    email: "manuel.domingo@gmail.com",
    password: "password",
    contactNumber: "+63 918 444 5566",
    ...BAGUIO_CITY,
    assignedAgentId: "AGT-005",
    assignedAgentName: "Diego Santos",
    totalBookings: 3,
    totalPurchases: 9800,
    status: "active",
    registeredDate: "2024-09-02T08:00:00Z",
  },
  {
    id: "CUS-006",
    firstName: "Isabel",
    middleName: "",
    lastName: "Castillo",
    suffix: "",
    fullName: "Isabel Castillo",
    email: "isabel.castillo@yahoo.com",
    password: "password",
    contactNumber: "+63 917 666 1122",
    ...CALAMBA_CITY,
    assignedAgentId: "AGT-006",
    assignedAgentName: "Patricia Cruz",
    totalBookings: 18,
    totalPurchases: 95300,
    status: "active",
    registeredDate: "2024-10-22T08:00:00Z",
  },
  {
    id: "CUS-007",
    firstName: "Tomas",
    middleName: "",
    lastName: "Aguilar",
    suffix: "",
    fullName: "Tomas Aguilar",
    email: "tomas.aguilar@gmail.com",
    password: "password",
    contactNumber: "+63 927 888 3344",
    ...SF_PAMPANGA,
    assignedAgentId: "AGT-007",
    assignedAgentName: "Ramon Aquino",
    totalBookings: 11,
    totalPurchases: 48700,
    status: "inactive",
    registeredDate: "2025-01-08T08:00:00Z",
  },
  {
    id: "CUS-008",
    firstName: "Lucia",
    middleName: "",
    lastName: "Navarro",
    suffix: "",
    fullName: "Lucia Navarro",
    email: "lucia.navarro@gmail.com",
    password: "password",
    contactNumber: "+63 926 222 9090",
    ...NCR_QC_DILIMAN,
    assignedAgentId: "AGT-008",
    assignedAgentName: "Sofia Mendoza",
    totalBookings: 5,
    totalPurchases: 18600,
    status: "active",
    registeredDate: "2025-03-15T08:00:00Z",
  },
  {
    id: "CUS-009",
    firstName: "Andres",
    middleName: "",
    lastName: "Soriano",
    suffix: "Jr.",
    fullName: "Andres Soriano Jr.",
    email: "andres.soriano@gmail.com",
    password: "password",
    contactNumber: "+63 921 777 6655",
    ...CEBU_MANGO,
    assignedAgentId: "AGT-002",
    assignedAgentName: "Liza Tan",
    totalBookings: 16,
    totalPurchases: 76800,
    status: "active",
    registeredDate: "2025-05-30T08:00:00Z",
  },
  {
    id: "CUS-010",
    firstName: "Maricel",
    middleName: "",
    lastName: "Tobias",
    suffix: "",
    fullName: "Maricel Tobias",
    email: "maricel.tobias@hotmail.com",
    password: "password",
    contactNumber: "+63 919 999 1010",
    ...DAVAO_BONIFACIO,
    assignedAgentId: "AGT-003",
    assignedAgentName: "Mark Villanueva",
    totalBookings: 4,
    totalPurchases: 14200,
    status: "active",
    registeredDate: "2025-08-12T08:00:00Z",
  },
];
