import type { Category } from "@/types/category";

export const mockCategories: Category[] = [
  {
    id: "CAT-001",
    name: "Veterinary Medicines",
    description:
      "Prescription and over-the-counter medicines for livestock and poultry.",
    status: "active",
    createdAt: "2024-01-15T08:00:00Z",
  },
  {
    id: "CAT-002",
    name: "Vitamins & Supplements",
    description:
      "Vitamins, minerals, and supplements supporting growth and production.",
    status: "active",
    createdAt: "2024-01-15T08:00:00Z",
  },
  {
    id: "CAT-003",
    name: "Feeds",
    description: "Prepared feeds for hogs, poultry, cattle, goat, and fish.",
    status: "active",
    createdAt: "2024-02-01T08:00:00Z",
  },
  {
    id: "CAT-004",
    name: "Agricultural Supplies",
    description:
      "Fertilizers, crop protection, and general farm inputs for planting.",
    status: "active",
    createdAt: "2024-02-01T08:00:00Z",
  },
  {
    id: "CAT-005",
    name: "Animal Care",
    description: "Grooming, hygiene, and everyday care for companion animals.",
    status: "active",
    createdAt: "2024-03-12T08:00:00Z",
  },
  {
    id: "CAT-006",
    name: "Poultry Supplies",
    description: "Equipment and consumables for broiler and layer operations.",
    status: "active",
    createdAt: "2024-03-12T08:00:00Z",
  },
  {
    id: "CAT-007",
    name: "Livestock Supplies",
    description: "Handling, milking, and husbandry supplies for large animals.",
    status: "active",
    createdAt: "2024-04-02T08:00:00Z",
  },
  {
    id: "CAT-008",
    name: "Farm Equipment",
    description: "Machinery and power equipment for farm operations.",
    status: "inactive",
    createdAt: "2024-04-02T08:00:00Z",
  },
];
