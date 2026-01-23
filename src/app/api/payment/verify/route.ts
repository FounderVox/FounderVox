import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Manual payment verification endpoint
 * For local testing when webhooks can't reach localhost
 * 
 * In production, this should verify with Lemon Squeezy API
 * For now, it just grants access for testing
 */
export async function POST(request: Request) {
  try {
    // Get current user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Use service role client to bypass RLS for the update
    const supabaseAdmin = createServiceRoleClient();

    // For testing: manually grant beta access
    // In production, you should verify with Lemon Squeezy API first
    console.log('[PaymentVerify] Attempting to grant beta access to user:', user.id);
    
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ 
        is_paid_beta: true,
        onboarding_completed: true,
        subscription_tier: 'beta'
      })
      .eq('id', user.id)
      .select();

    if (error) {
      console.error('[PaymentVerify] Error updating profile:', error);
      return NextResponse.json({ error: "Failed to update profile", details: error.message }, { status: 500 });
    }

    console.log('[PaymentVerify] Update result:', data);
    console.log('[PaymentVerify] Granted beta access to user:', user.id);
    return NextResponse.json({ success: true, is_paid_beta: true });
  } catch (error) {
    console.error('[PaymentVerify] Error:', error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('is_paid_beta')
      .eq('id', user.id)
      .single();

    console.log('[PaymentVerify] GET - Profile:', profile, 'Error:', error);

    return NextResponse.json({ 
      is_paid_beta: profile?.is_paid_beta || false 
    });
  } catch (error) {
    console.error('[PaymentVerify] Error:', error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
