import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import ical from "https://esm.sh/node-ical@0.16.1"

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

// Ensure this matches the ID in your user_integrations table
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

    // 3. Extract Dates from Body or Set Defaults
    let timeMin: string, timeMax: string;
    try {
      const body = await req.json();
      timeMin = body.timeMin;
      timeMax = body.timeMax;
    } catch {
      // Body might be empty, that's fine
    }

    // Fallback defaults: From 1 month ago to 3 months into the future
    if (!timeMin || !timeMax) {
      const now = new Date();
      timeMin = timeMin || new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      timeMax = timeMax || new Date(now.getFullYear(), now.getMonth() + 3, 1).toISOString();
    }

    // 4. Get YOUR integration data from the DB
    const { data: integration, error: dbError } = await supabaseAdmin
      .from('user_integrations')
      .select('*')
      .eq('user_id', PORTFOLIO_OWNER_ID)
      .single()

    if (dbError || !integration) throw new Error("Portfolio owner integration data not found")

    // 5. Refresh Google Token (Using Secrets you added to Supabase)
    const gResp = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      body: JSON.stringify({
        client_id: Deno.env.get('G_CLIENT_ID'),
        client_secret: Deno.env.get('G_CLIENT_SECRET'),
        refresh_token: integration.google_refresh_token,
        grant_type: 'refresh_token',
      }),
    })
    
    const gTokens = await gResp.json()
    if (!gTokens.access_token) {
      console.error("Google Auth Fail:", gTokens)
      throw new Error(`Google Refresh Failed: ${gTokens.error_description || gTokens.error}`)
    }

    // 6. Fetch Google & Apple simultaneously
    const googleParams = new URLSearchParams({
      timeMin: timeMin,
      timeMax: timeMax,
      singleEvents: 'true',
      orderBy: 'startTime',
    }).toString();

    const [googleResponse, appleResponse] = await Promise.all([
      fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${googleParams}`, {
        headers: { Authorization: `Bearer ${gTokens.access_token}` }
      }),
      fetch(integration.apple_ical_url.replace('webcal://', 'https://'))
    ])

    const googleData = await googleResponse.json();
    const appleRawText = await appleResponse.text();

    // DEBUG: Check if Google is complaining about permissions
    if (googleData.error) {
      console.error("Google API Error:", googleData.error);
    }
    console.log("Full Google Response:", JSON.stringify(googleData));

    // 7. Parse & Filter Apple iCal Data
    const appleParsed = ical.sync.parseICS(appleRawText);
    const rangeStart = new Date(timeMin);
    const rangeEnd = new Date(timeMax);

    const appleEvents = Object.values(appleParsed)
      .filter(e => 
        e.type === 'VEVENT' && 
        e.start && 
        new Date(e.start) >= rangeStart && 
        new Date(e.start) <= rangeEnd
      )
      .map(e => ({
        summary: e.summary,
        description: e.description || '',
        location: e.location || '',
        start: e.start,
        end: e.end,
        source: 'apple'
      }))

    // 8. Return Unified Data
    return new Response(JSON.stringify({
      google: googleData.items || [],
      apple: appleEvents,
      metadata: {
        rangeUsed: { timeMin, timeMax },
        googleCount: (googleData.items || []).length,
        appleCount: appleEvents.length
      }
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