import { serve } from "std/http/server.ts"
import { createClient } from "@supabase/supabase-js"
import ical from "node-ical"

// 1. Define the headers. '*' is okay for dev, 
// but in production, you can use 'http://localhost:4200'
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

serve(async (req) => {
  // 2. Handle the Preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 3. Your logic here...
    // (Auth, Google Fetch, Apple Fetch)

    const data = { message: "Success!", google: [], apple: [] }

    // 4. Return success with CORS headers
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    // 5. Return errors with CORS headers (critical!)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})