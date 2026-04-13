import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

const PORTFOLIO_OWNER_ID = "498ccf7e-4e97-45e5-8a54-08fb312b204f"

// Tightened: multi-word phrases that almost never appear outside job mail
const JOB_KEYWORDS = `("your application" OR "thank you for applying" OR "application has been received" OR "next steps in" OR "interview" OR "technical round" OR "phone screen" OR "coding challenge" OR "take-home" OR "we regret" OR "unfortunately" OR "pleased to offer" OR "move forward with your application" OR "schedule a call" OR "availability for")`

const EXCLUDE_CATEGORIES = `-category:promotions -category:social -category:forums -category:updates -from:linkedin.com -from:indeed.com -from:glassdoor.com -from:ziprecruiter.com -from:mittal.shivank@gmail.com -from:notifications@zohosign.in`

const BLOCKED_DOMAINS = [
  'medium.com', 'substack.com', 'mailchimp.com',
  'news.ycombinator.com', 'producthunt.com',
  'gmail.com', 'google.com', 'facebook.com', 'twitter.com',
  'mittalshivank.com', 'linkedin.com', 'indeed.com', 'glassdoor.com', 'ziprecruiter.com',
  'zohosign.in', 'docusign.net', 'hellosign.com', 'adobesign.com',
]

// ---------- Helpers ----------

function buildQuery(mode: string, days?: number, after?: string, before?: string): string {
  let dateFilter = ''
  if (mode === 'range' && after && before) {
    dateFilter = `after:${after.replaceAll('-', '/')} before:${before.replaceAll('-', '/')}`
  } else {
    dateFilter = `newer_than:${days || 30}d`
  }
  return `${dateFilter} ${JOB_KEYWORDS} ${EXCLUDE_CATEGORIES}`
}

function decodeBase64Url(data: string): string {
  const base64 = data.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '='.repeat((4 - base64.length % 4) % 4)
  try {
    const bytes = Uint8Array.from(atob(padded), c => c.charCodeAt(0))
    return new TextDecoder('utf-8').decode(bytes)
  } catch {
    return ''
  }
}

function extractBody(payload: any): string {
  if (!payload) return ''
  if (payload.body?.data) return decodeBase64Url(payload.body.data)
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        return decodeBase64Url(part.body.data)
      }
    }
    for (const part of payload.parts) {
      if (part.mimeType === 'text/html' && part.body?.data) {
        return decodeBase64Url(part.body.data)
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
      }
    }
    for (const part of payload.parts) {
      const nested = extractBody(part)
      if (nested) return nested
    }
  }
  return ''
}

function getHeader(headers: any[], name: string): string {
  const h = headers?.find(h => h.name.toLowerCase() === name.toLowerCase())
  return h?.value || ''
}

function stripQuotedReplies(body: string): string {
  const markers = [
    /\nOn .+wrote:/,
    /\n-----Original Message-----/,
    /\n_{20,}/,
    /\nFrom:.*\nSent:/,
  ]
  let result = body
  for (const marker of markers) {
    const match = result.match(marker)
    if (match && match.index !== undefined) {
      result = result.slice(0, match.index)
    }
  }
  return result.trim().slice(0, 4000)
}

function shouldBlock(fromDomain: string, subject: string, body: string): string | null {
  if (BLOCKED_DOMAINS.some(d => fromDomain.includes(d))) {
    return `blocked_domain:${fromDomain}`
  }

  const lowerSubject = subject.toLowerCase()
  const lowerBody = body.toLowerCase()
  const lowerAll = lowerSubject + ' ' + lowerBody

  // Strong subject signals — if any of these are in the subject, never drop the email
  const STRONG_SUBJECT_SIGNALS = [
    'interview', 'application', 'offer', 'position',
    'role', 'opportunity', 'recruiter', 'hiring',
    'next step', 'technical', 'assessment', 'screening',
  ]
  const subjectIsStrong = STRONG_SUBJECT_SIGNALS.some(s => lowerSubject.includes(s))
  if (subjectIsStrong) {
    return null  // bypass remaining rules, this is clearly job mail
  }

  if (lowerAll.includes('unsubscribe') && !lowerAll.includes('interview') && !lowerAll.includes('application')) {
    return 'newsletter_marker'
  }

  if (body.length < 40) {
    return 'body_too_short'
  }

  return null
}

// ---------- Main handler ----------

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const authHeader = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!authHeader) throw new Error("Missing Authorization header")

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(authHeader)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized access" }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    if (user.id !== PORTFOLIO_OWNER_ID) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    let mode = 'incremental'
    let days = 30
    let after: string | undefined
    let before: string | undefined
    try {
      const body = await req.json()
      mode = body.mode || 'incremental'
      days = body.days || 30
      after = body.after
      before = body.before
    } catch {
      // empty body is fine
    }

    const { data: integration, error: dbError } = await supabaseAdmin
      .from('user_integrations')
      .select('*')
      .eq('user_id', PORTFOLIO_OWNER_ID)
      .single()

    if (dbError || !integration) throw new Error("Integration data not found")
    if (!integration.gmail_refresh_token) throw new Error("Gmail refresh token not configured")

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
      throw new Error(`Gmail Refresh Failed: ${gTokens.error_description || gTokens.error}`)
    }
    const accessToken = gTokens.access_token

    const query = buildQuery(mode, days, after, before)
    console.log("Gmail query:", query)

    const listUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=500`
    const listResp = await fetch(listUrl, {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
    const listData = await listResp.json()
    if (listData.error) throw new Error(`Gmail list failed: ${listData.error.message}`)

    const messageIds: string[] = (listData.messages || []).map((m: any) => m.id)
    console.log(`Found ${messageIds.length} messages matching query`)

    // Cap at 150 per invocation and enforce a wall-clock deadline
    const MAX_MESSAGES = 150
    const TIME_BUDGET_MS = 90_000
    const startTime = Date.now()

    const capped = messageIds.slice(0, MAX_MESSAGES)
    if (messageIds.length > MAX_MESSAGES) {
      console.warn(`Capped from ${messageIds.length} to ${MAX_MESSAGES} — narrow your range`)
    }

    const passed: any[] = []
    const dropped: any[] = []
    let stoppedEarly = false

    for (const id of capped) {
      if (Date.now() - startTime > TIME_BUDGET_MS) {
        stoppedEarly = true
        console.warn(`Time budget exceeded at ${passed.length + dropped.length}/${capped.length}`)
        break
      }

      const msgResp = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )
      const msg = await msgResp.json()
      if (msg.error) {
        dropped.push({ id, reason: `fetch_error:${msg.error.message}` })
        continue
      }

      const headers = msg.payload?.headers || []
      const from = getHeader(headers, 'From')
      const subject = getHeader(headers, 'Subject')
      const fromEmail = from.match(/<(.+?)>/)?.[1] || from
      const fromDomain = fromEmail.split('@')[1]?.toLowerCase() || ''
      const receivedAt = new Date(parseInt(msg.internalDate)).toISOString()

      const rawBody = extractBody(msg.payload)
      const cleanBody = stripQuotedReplies(rawBody)

      const blockReason = shouldBlock(fromDomain, subject, cleanBody)
      if (blockReason) {
        dropped.push({ id, from: fromEmail, subject, reason: blockReason })
        continue
      }

      passed.push({
        gmail_message_id: id,
        gmail_thread_id: msg.threadId,
        from: fromEmail,
        from_domain: fromDomain,
        subject,
        received_at: receivedAt,
        snippet: msg.snippet,
        body_preview: cleanBody.slice(0, 500),
        body_length: cleanBody.length,
      })

      await new Promise(r => setTimeout(r, 100))
    }

    return new Response(JSON.stringify({
      query,
      mode,
      totalFound: messageIds.length,
      processed: passed.length + dropped.length,
      stoppedEarly,
      passedCount: passed.length,
      droppedCount: dropped.length,
      passed,
      dropped,
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