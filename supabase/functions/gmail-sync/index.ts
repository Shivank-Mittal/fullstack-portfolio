import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

// Same owner ID as your calendar function
const PORTFOLIO_OWNER_ID = "498ccf7e-4e97-45e5-8a54-08fb312b204f"

serve(async (req) => {
  // 1. Handle Preflight CORS
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // 2. Identify the user calling the function (Auth Check)
    const authHeader = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!authHeader) throw new Error("Missing Authorization header")

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(authHeader)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized access" }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 3. Gate to portfolio owner only — Gmail is personal
    if (user.id !== PORTFOLIO_OWNER_ID) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 4. Get integration data (same table as calendar)
    const { data: integration, error: dbError } = await supabaseAdmin
      .from('user_integrations')
      .select('*')
      .eq('user_id', PORTFOLIO_OWNER_ID)
      .single()

    if (dbError || !integration) throw new Error("Portfolio owner integration data not found")
    if (!integration.gmail_refresh_token) throw new Error("Gmail refresh token not configured")

    // 5. Refresh Google Token (reuses your existing G_CLIENT_ID / G_CLIENT_SECRET secrets)
    const gResp = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      body: JSON.stringify({
        client_id: Deno.env.get('G_CLIENT_ID'),
        client_secret: Deno.env.get('G_CLIENT_SECRET'),
        refresh_token: integration.gmail_refresh_token,
        grant_type: 'refresh_token',
      }),
    })

    const gTokens = await gResp.json()
    if (!gTokens.access_token) {
      console.error("Gmail Auth Fail:", gTokens)
      throw new Error(`Gmail Refresh Failed: ${gTokens.error_description || gTokens.error}`)
    }

    // 6. Fetch Gmail profile (hello-world — proves token + scope + API all work)
    const profileResp = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/profile',
      { headers: { Authorization: `Bearer ${gTokens.access_token}` } }
    )

    const profile = await profileResp.json()

    if (profile.error) {
      console.error("Gmail API Error:", profile.error)
      throw new Error(`Gmail API: ${profile.error.message}`)
    }

    console.log("Full Gmail Profile Response:", JSON.stringify(profile))

    // 7. Persist the historyId so future incremental syncs have an anchor
    const { error: updateError } = await supabaseAdmin
      .from('user_integrations')
      .update({
        gmail_last_history_id: profile.historyId,
        gmail_last_synced_at: new Date().toISOString(),
      })
      .eq('user_id', PORTFOLIO_OWNER_ID)

    if (updateError) throw new Error(`DB update failed: ${updateError.message}`)

    // 8. Return Gmail profile summary
    return new Response(JSON.stringify({
      email: profile.emailAddress,
      historyId: profile.historyId,
      messagesTotal: profile.messagesTotal,
      threadsTotal: profile.threadsTotal,
      syncedAt: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error("Function Error:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})