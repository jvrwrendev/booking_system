import type { Agent } from "@/types/agent";
import type { AuthAccount } from "@/types/auth";

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
    address: "123 EDSA, San Agustin, Quezon City, NCR",
    addressParts: {
      street: "123 EDSA",
      barangay: { code: "1381300095", name: "San Agustin" },
      city: { code: "1381300000", name: "Quezon City" },
      province: { code: "", name: "" },
      region: {
        code: "1300000000",
        name: "National Capital Region (NCR)",
      },
    },
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
    address: "88 Mango Ave, Cebu City",
    addressParts: {
      street: "88 Mango Ave",
      barangay: { code: "", name: "" },
      city: { code: "0730600000", name: "City of Cebu" },
      province: { code: "0702200000", name: "Cebu" },
      region: { code: "0700000000", name: "Region VII (Central Visayas)" },
    },
    totalBookings: 65,
    status: "active",
    dateJoined: "2024-03-15T08:00:00Z",
  },
];

export const mockAgentAuthAccounts: AuthAccount[] = mockAgents.map((a) => ({
  id: a.id,
  fullName: a.fullName,
  email: a.email,
  username: a.email.split("@")[0],
  contactNumber: a.contactNumber,
  role: "AGENT",
  status: a.status === "active" ? "active" : "inactive",
  lastLogin: a.dateJoined,
  createdAt: a.dateJoined,
  agentId: a.id,
  password: a.password,
}));
