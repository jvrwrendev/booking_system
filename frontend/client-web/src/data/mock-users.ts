import type { AuthUser } from "@/types/auth";

export const mockUsers: AuthUser[] = [
  {
    id: "USR-001",
    fullName: "Juan Dela Cruz",
    email: "superadmin@example.com",
    username: "superadmin",
    contactNumber: "+63 917 555 0001",
    role: "SUPER_ADMIN",
    status: "active",
    lastLogin: "2026-09-03T08:30:00Z",
    createdAt: "2024-01-15T08:00:00Z",
  },
  {
    id: "USR-002",
    fullName: "Maria Santos",
    email: "admin@example.com",
    username: "admin",
    contactNumber: "+63 917 555 0002",
    role: "ADMIN",
    status: "active",
    lastLogin: "2026-09-02T17:45:00Z",
    createdAt: "2024-03-22T08:00:00Z",
  },
  {
    id: "USR-003",
    fullName: "Pedro Reyes",
    email: "pedro.reyes@agrivet.ph",
    username: "preyes",
    contactNumber: "+63 917 555 0003",
    role: "ADMIN",
    status: "active",
    lastLogin: "2026-09-01T14:12:00Z",
    createdAt: "2024-05-10T08:00:00Z",
  },
  {
    id: "USR-004",
    fullName: "Ana Lim",
    email: "ana.lim@agrivet.ph",
    username: "alim",
    contactNumber: "+63 917 555 0004",
    role: "ADMIN",
    status: "inactive",
    lastLogin: "2026-08-12T10:05:00Z",
    createdAt: "2024-06-18T08:00:00Z",
  },
  {
    id: "USR-005",
    fullName: "Carlos Mendoza",
    email: "carlos.mendoza@agrivet.ph",
    username: "cmendoza",
    contactNumber: "+63 917 555 0005",
    role: "SUPER_ADMIN",
    status: "active",
    lastLogin: "2026-09-03T07:00:00Z",
    createdAt: "2024-02-01T08:00:00Z",
  },
];

export const mockCredentials = [
  {
    email: "superadmin@example.com",
    password: "password",
    role: "SUPER_ADMIN" as const,
  },
  {
    email: "admin@example.com",
    password: "password",
    role: "ADMIN" as const,
  },
];


