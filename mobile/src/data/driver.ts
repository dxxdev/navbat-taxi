import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/core/supabase";

export type DriverStatus = "pending" | "approved" | "blocked";

export type DriverVehicle = {
  id: string;
  model: string;
  color: string;
  plate_number: string;
  seats_total: number;
  is_active: boolean;
};

export type MyDriver = {
  status: DriverStatus;
  license_number: string;
  vehicles: DriverVehicle[];
} | null;

export const myDriverKey = ["my-driver"] as const;

// Haydovchi holati va mashinalari (yozuv bo'lmasa null).
export async function getMyDriver(): Promise<MyDriver> {
  const { data, error } = await supabase.rpc("get_my_driver");
  if (error) throw error;
  return (data as MyDriver) ?? null;
}

export function useMyDriver(enabled = true) {
  return useQuery({ queryKey: myDriverKey, queryFn: getMyDriver, enabled });
}

// ---------- Rasm yuklash ----------

export type PickedImage = {
  uri: string;
  mimeType?: string | null;
  base64?: string | null; // muqobil usul uchun
};

export class UploadError extends Error {}

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function normalizeMime(image: PickedImage): string {
  let mime = (image.mimeType ?? "").toLowerCase();
  if (mime === "image/jpg") mime = "image/jpeg";
  if (!mime) {
    const u = image.uri.toLowerCase();
    if (u.endsWith(".png")) mime = "image/png";
    else if (u.endsWith(".webp")) mime = "image/webp";
    else mime = "image/jpeg";
  }
  return mime;
}

// Birlamchi usul: fetch(uri) -> arrayBuffer. Muvaffaqiyatsiz bo'lsa base64 muqobili.
async function getBytes(image: PickedImage): Promise<ArrayBuffer | Uint8Array> {
  try {
    const res = await fetch(image.uri);
    const buf = await res.arrayBuffer();
    if (buf.byteLength > 0) return buf;
  } catch {
    // muqobil usulga o'tamiz
  }
  if (image.base64) {
    const bin = atob(image.base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }
  throw new UploadError("READ_FAILED");
}

// '{uid}/{prefix}_{timestamp}.{ext}' yo'liga yuklaydi va yo'lni qaytaradi.
export async function uploadDriverImage(
  image: PickedImage,
  prefix: "license" | "vehicle",
): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new UploadError("NO_SESSION");

  const contentType = normalizeMime(image);
  const ext = EXT_BY_MIME[contentType];
  if (!ext) throw new UploadError("BAD_TYPE");

  const bytes = await getBytes(image);
  if (bytes.byteLength > 5 * 1024 * 1024) throw new UploadError("TOO_LARGE");

  const path = `${session.user.id}/${prefix}_${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from("driver-documents")
    .upload(path, bytes, { contentType, upsert: false });
  if (error) throw new UploadError(error.message);
  return path;
}

// ---------- RPC ----------

export type DriverRegisterInput = {
  licenseNumber: string;
  licensePhotoPath: string;
  vehicle: {
    model: string;
    color: string;
    plate_number: string;
    seats_total: number;
    photo_path: string;
  };
};

export async function driverRegister(input: DriverRegisterInput) {
  const { data, error } = await supabase.rpc("driver_register", {
    p_license_number: input.licenseNumber,
    p_license_photo_path: input.licensePhotoPath,
    p_vehicle: input.vehicle,
  });
  if (error) throw error;
  return data as { driver_status: DriverStatus; vehicle_id: string };
}