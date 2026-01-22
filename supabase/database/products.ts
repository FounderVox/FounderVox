import { SupabaseClient } from "@supabase/supabase-js";

export async function upsertProduct(
  supabase: SupabaseClient,
  {
    variant_id,
    product_id,
    name,
    price,
  }: { variant_id: string; product_id: string; name: string; price: number },
) {
  const { data, error } = await supabase
    .from("products")
    .upsert(
      {
        variant_id,
        product_id,
        name,
        price,
      },
      { onConflict: "variant_id" },
    )
    .select();

  if (error) {
    console.error(error);
    return null;
  }

  return data;
}