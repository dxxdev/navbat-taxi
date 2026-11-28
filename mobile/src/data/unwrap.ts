import type { PostgrestError } from "@supabase/supabase-js";

import { getErrorMessage } from "@/core/errors";

// Supabase javobini ochadi; xatoni o'zbekcha matnli Error'ga aylantiradi
export async function unwrap<T>(
  query: PromiseLike<{ data: T | null; error: PostgrestError | null }>,
): Promise<T> {
  const { data, error } = await query;
  if (error) throw new Error(getErrorMessage(error));
  return data as T;
}