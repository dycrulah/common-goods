import { createClient } from "@/lib/supabase/server";

export type Customer = {
  id: string;
  authUserId: string;
  name: string | null;
  email: string;
  phone: string | null;
};

/** Returns null when no one is signed in — never throws for that case. */
export async function getCurrentCustomer(): Promise<Customer | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    authUserId: data.auth_user_id,
    name: data.name,
    email: data.email,
    phone: data.phone,
  };
}
