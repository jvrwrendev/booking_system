export interface ReportsBundle {
  bookingVolumeMonthly: { month: string; count: number }[];
  bookingRevenueMonthly: { month: string; revenue: number }[];
  bookingsByStatus: { status: string; count: number }[];
  inventoryByCategory: { category: string; value: number }[];
  branchPerformance: {
    branch: string;
    bookings: number;
    revenue: number;
  }[];
  agentPerformance: {
    agent: string;
    bookings: number;
    revenue: number;
  }[];
  lowStockProducts: {
    name: string;
    sku: string;
    stock: number;
    minimum: number;
  }[];
}

export const mockReports: ReportsBundle = {
  bookingVolumeMonthly: [
    { month: "Jan", count: 42 },
    { month: "Feb", count: 51 },
    { month: "Mar", count: 63 },
    { month: "Apr", count: 58 },
    { month: "May", count: 71 },
    { month: "Jun", count: 80 },
    { month: "Jul", count: 88 },
    { month: "Aug", count: 92 },
    { month: "Sep", count: 47 },
  ],
  bookingRevenueMonthly: [
    { month: "Jan", revenue: 245000 },
    { month: "Feb", revenue: 312000 },
    { month: "Mar", revenue: 398000 },
    { month: "Apr", revenue: 421000 },
    { month: "May", revenue: 512000 },
    { month: "Jun", revenue: 598000 },
    { month: "Jul", revenue: 645000 },
    { month: "Aug", revenue: 712000 },
    { month: "Sep", revenue: 358000 },
  ],
  bookingsByStatus: [
    { status: "Completed", count: 312 },
    { status: "Pending", count: 28 },
    { status: "Confirmed", count: 45 },
    { status: "Processing", count: 18 },
    { status: "Ready", count: 12 },
    { status: "Cancelled", count: 22 },
    { status: "Rejected", count: 9 },
  ],
  inventoryByCategory: [
    { category: "Feeds", value: 680000 },
    { category: "Fertilizers", value: 420000 },
    { category: "Pesticides", value: 195000 },
    { category: "Veterinary", value: 245000 },
    { category: "Seeds", value: 380000 },
    { category: "Tools", value: 85000 },
    { category: "Equipment", value: 520000 },
  ],
  branchPerformance: [
    { branch: "Quezon City", bookings: 145, revenue: 1240000 },
    { branch: "Cebu City", bookings: 112, revenue: 980000 },
    { branch: "Davao", bookings: 95, revenue: 850000 },
    { branch: "Iloilo", bookings: 78, revenue: 645000 },
    { branch: "Baguio", bookings: 54, revenue: 420000 },
    { branch: "Laguna", bookings: 89, revenue: 720000 },
  ],
  agentPerformance: [
    { agent: "Roberto Garcia", bookings: 84, revenue: 720000 },
    { agent: "Liza Tan", bookings: 65, revenue: 580000 },
    { agent: "Mark Villanueva", bookings: 58, revenue: 510000 },
    { agent: "Patricia Cruz", bookings: 51, revenue: 450000 },
    { agent: "Anna Reyes", bookings: 47, revenue: 395000 },
    { agent: "Diego Santos", bookings: 32, revenue: 280000 },
    { agent: "Sofia Mendoza", bookings: 28, revenue: 235000 },
  ],
  lowStockProducts: [
    { name: "Layer Poultry Feed", sku: "FEED-PLT-002", stock: 8, minimum: 25 },
    { name: "Antibiotic Injection", sku: "VET-ANT-010", stock: 6, minimum: 15 },
    { name: "Urea Fertilizer (46-0-0)", sku: "FERT-URE-005", stock: 18, minimum: 30 },
    { name: "Broad-Spectrum Herbicide", sku: "PEST-HRB-007", stock: 0, minimum: 20 },
    { name: "Portable Power Tiller", sku: "EQP-TIL-016", stock: 4, minimum: 2 },
  ],
};