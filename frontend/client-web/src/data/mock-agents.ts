import type { Agent } from "@/types/agent";
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

// Agents in Quezon City, NCR
const NCR_QC_MAHARANY = ADDR(
  "123 EDSA",
  { code: "1300000000", name: "National Capital Region (NCR)" },
  { code: "", name: "" },
  { code: "1381300000", name: "Quezon City" },
  { code: "1381300095", name: "San Agustin" }
);
const NCR_QC_DILIMAN = ADDR(
  "42 Tomas Morato Ave",
  { code: "1300000000", name: "National Capital Region (NCR)" },
  { code: "", name: "" },
  { code: "1381300000", name: "Quezon City" },
  { code: "1381300124", name: "U.P. Campus" }
);

const CEBU_CITY = ADDR(
  "88 Mango Ave",
  { code: "0700000000", name: "Region VII (Central Visayas)" },
  { code: "0702200000", name: "Cebu" },
  { code: "0730600000", name: "City of Cebu" },
  { code: "", name: "" } // will be filled with first barangay
);
const CEBU_COLON = ADDR(
  "15 Colon St",
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

export const mockAgents: Agent[] = [
  {
    id: "AGT-001",
    firstName: "Roberto",
    middleName: "",
    lastName: "Garcia",
    suffix: "",
    fullName: "Roberto Garcia",
    email: "roberto.garcia@agrivet.ph",
    password: "password",
    contactNumber: "+63 917 555 1001",
    ...NCR_QC_MAHARANY,
    totalBookings: 84,
    status: "active",
    dateJoined: "2024-02-10T08:00:00Z",
  },
  {
    id: "AGT-002",
    firstName: "Liza",
    middleName: "",
    lastName: "Tan",
    suffix: "",
    fullName: "Liza Tan",
    email: "liza.tan@agrivet.ph",
    password: "password",
    contactNumber: "+63 917 555 1002",
    ...CEBU_CITY,
    totalBookings: 65,
    status: "active",
    dateJoined: "2024-03-15T08:00:00Z",
  },
  {
    id: "AGT-003",
    firstName: "Mark",
    middleName: "",
    lastName: "Villanueva",
    suffix: "",
    fullName: "Mark Villanueva",
    email: "mark.villanueva@agrivet.ph",
    password: "password",
    contactNumber: "+63 917 555 1003",
    ...DAVAO_CITY,
    totalBookings: 58,
    status: "active",
    dateJoined: "2024-04-12T08:00:00Z",
  },
  {
    id: "AGT-004",
    firstName: "Anna",
    middleName: "",
    lastName: "Reyes",
    suffix: "",
    fullName: "Anna Reyes",
    email: "anna.reyes@agrivet.ph",
    password: "password",
    contactNumber: "+63 917 555 1004",
    ...ILOILO_CITY,
    totalBookings: 47,
    status: "active",
    dateJoined: "2024-05-20T08:00:00Z",
  },
  {
    id: "AGT-005",
    firstName: "Diego",
    middleName: "",
    lastName: "Santos",
    suffix: "",
    fullName: "Diego Santos",
    email: "diego.santos@agrivet.ph",
    password: "password",
    contactNumber: "+63 917 555 1005",
    ...BAGUIO_CITY,
    totalBookings: 32,
    status: "active",
    dateJoined: "2024-06-18T08:00:00Z",
  },
  {
    id: "AGT-006",
    firstName: "Patricia",
    middleName: "",
    lastName: "Cruz",
    suffix: "",
    fullName: "Patricia Cruz",
    email: "patricia.cruz@agrivet.ph",
    password: "password",
    contactNumber: "+63 917 555 1006",
    ...CALAMBA_CITY,
    totalBookings: 51,
    status: "active",
    dateJoined: "2024-07-22T08:00:00Z",
  },
  {
    id: "AGT-007",
    firstName: "Ramon",
    middleName: "",
    lastName: "Aquino",
    suffix: "",
    fullName: "Ramon Aquino",
    email: "ramon.aquino@agrivet.ph",
    password: "password",
    contactNumber: "+63 917 555 1007",
    ...SF_PAMPANGA,
    totalBookings: 19,
    status: "suspended",
    dateJoined: "2024-08-30T08:00:00Z",
  },
  {
    id: "AGT-008",
    firstName: "Sofia",
    middleName: "",
    lastName: "Mendoza",
    suffix: "",
    fullName: "Sofia Mendoza",
    email: "sofia.mendoza@agrivet.ph",
    password: "password",
    contactNumber: "+63 917 555 1008",
    ...NCR_QC_DILIMAN,
    totalBookings: 28,
    status: "active",
    dateJoined: "2024-09-14T08:00:00Z",
  },
  {
    id: "AGT-009",
    firstName: "Andres",
    middleName: "",
    lastName: "Bonifacio",
    suffix: "Jr.",
    fullName: "Andres Bonifacio Jr.",
    email: "andres.b@agrivet.ph",
    password: "password",
    contactNumber: "+63 917 555 1009",
    ...CEBU_COLON,
    totalBookings: 0,
    status: "inactive",
    dateJoined: "2025-01-05T08:00:00Z",
  },
];
