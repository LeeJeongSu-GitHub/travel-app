import { Camera, Landmark, Luggage, Plane, Search, TrainFront, Utensils, type LucideIcon } from "lucide-react";
import type { Category } from "./types";
import type { CategoryConfig } from "./components";

export const CATEGORY_COLORS: Record<Category, string> = {
  photo: "#7357db",
  restaurant: "#ef5a6f",
  cafe: "#c1831f",
  hotel: "#139d8c",
  station: "#1457d9",
  airport: "#2d76c7",
  logistics: "#62718a",
};

export const categoryLabels: Record<Category, string> = {
  photo: "사진 명소",
  restaurant: "맛집",
  cafe: "카페",
  hotel: "숙소",
  station: "역",
  airport: "공항",
  logistics: "짐 보관·이동",
};

export const categoryIcons: Record<Category, LucideIcon> = {
  photo: Camera,
  restaurant: Utensils,
  cafe: Search,
  hotel: Landmark,
  station: TrainFront,
  airport: Plane,
  logistics: Luggage,
};

export const CATEGORY_CONFIGS: CategoryConfig[] = (["hotel", "photo", "restaurant", "cafe", "station", "airport", "logistics"] as Category[]).map((key) => ({ key, label: categoryLabels[key], color: CATEGORY_COLORS[key], Icon: categoryIcons[key] }));
