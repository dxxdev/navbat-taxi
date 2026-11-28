import type { Database } from "@/types/database";

// Jadval qatori turi uchun qisqa alias
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];