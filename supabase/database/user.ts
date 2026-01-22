import { SupabaseClient } from "@supabase/supabase-js";

export async function updateCustomerId(
    supabase: SupabaseClient,
    {
      userId,
      customerId,
    }: {
      userId: string;
      customerId: string;
    },
  ) {
    const { data, error } = await supabase
      .from("users")
      .update({
        customer_id: customerId,
      })
      .eq("user_id", userId)
      .select();
  
    if (error) {
      console.error(error);
      return null;
    }
  
    return data;
  }


  export async function getCustomerId(supabase: SupabaseClient, userId: string) {
    const { data, error } = await supabase
      .from("users")
      .select("customer_id")
      .eq("user_id", userId)
      .single();
  
    if (error) {
      console.error(error);
      return null;
    }
  
    return data.customer_id;
  }
  