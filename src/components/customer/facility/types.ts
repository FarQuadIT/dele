import type {
  DocumentCategory,
  FacilityType,
  OrderStatus,
  RecommendationSeverity,
  RecommendationStatus,
  SystemType,
} from "@/generated/prisma/enums";

export type DocVersionItem = {
  id: string;
  version: number;
  fileName: string;
  fileUrl: string;
  fileSize: number | null;
  createdAt: Date;
};

export type DocItem = {
  id: string;
  title: string;
  category: DocumentCategory;
  currentVersion: number;
  updatedAt: Date;
  versions: DocVersionItem[];
  equipment?: { name: string } | null;
};

export type EquipmentVersionItem = {
  id: string;
  version: number;
  data: unknown;
  comment: string | null;
  createdAt: Date;
  author: { name: string | null } | null;
};

export type RecommendationItem = {
  id: string;
  title: string;
  reason: string | null;
  severity: RecommendationSeverity;
  status: RecommendationStatus;
  dueAt: Date | null;
  equipment?: { id: string; name: string } | null;
  system?: { type: SystemType; name: string } | null;
};

export type EquipmentItem = {
  id: string;
  name: string;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  installedAt: Date | null;
  warrantyUntil: Date | null;
  serviceIntervalDays: number | null;
  lastServiceAt: Date | null;
  specs: unknown;
  notes: string | null;
  system: { id: string; type: SystemType; name: string } | null;
  subsystem: { id: string; name: string } | null;
  zone: {
    id: string;
    name: string;
    floor: {
      id: string;
      number: number;
      name: string | null;
      building: { id: string; name: string };
    };
  } | null;
  versions: EquipmentVersionItem[];
  documents: DocItem[];
  recommendations: { id: string; severity: RecommendationSeverity }[];
};

export type SystemItem = {
  id: string;
  type: SystemType;
  name: string;
  notes: string | null;
  subsystems: { id: string; name: string }[];
};

export type BuildingItem = {
  id: string;
  name: string;
  floors: {
    id: string;
    number: number;
    name: string | null;
    zones: { id: string; name: string }[];
  }[];
};

export type OrderItem = {
  id: string;
  number: string;
  status: OrderStatus;
  priceTotal: number;
  updatedAt: Date;
  request: { title: string };
  organization: { name: string };
};

export type ProposalItem = {
  id: string;
  status: string;
  comment: string | null;
  changes: unknown;
  createdAt: Date;
  equipment: { id: string; name: string } | null;
  author: { name: string };
  authorOrg: { name: string } | null;
};

export type FacilityFull = {
  id: string;
  title: string;
  type: FacilityType;
  address: string;
  area: number | null;
  floorsCount: number | null;
  buildYear: number | null;
  description: string | null;
  buildings: BuildingItem[];
  systems: SystemItem[];
  equipment: EquipmentItem[];
  documents: DocItem[];
  recommendations: RecommendationItem[];
  proposals: ProposalItem[];
  orders: OrderItem[];
};
