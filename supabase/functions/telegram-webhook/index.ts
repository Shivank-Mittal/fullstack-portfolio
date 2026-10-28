import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { parsePlan, type ParsedDay, type ParsedItem } from './plan.ts';
import { carryEaten } from './eaten.ts';

declare const EdgeRuntime: { waitUntil(promise: Promise<unknown>): void };

const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!;
const WEBHOOK_SECRET = Deno.env.get('TELEGRAM_WEBHOOK_SECRET')!;
const OWNER_CHAT_ID = Number(Deno.env.get('TELEGRAM_OWNER_CHAT_ID'));
const TIME_ZONE = 'Asia/Kolkata';

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

type Macros = Pick<ParsedItem, 'calories' | 'protein_g' | 'carbs_g' | 'fat_g' | 'fiber_g'>;

async function telegram(method: string, payload: Record<string, unknown>) {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!data.ok) console.error(`Telegram ${method} failed:`, res.status, JSON.stringify(data));
  return data;
}

// Telegram rejects messages over 4096 characters, which long AI or validation errors can exceed.
const fit = (text: string) => (text.length > 4000 ? `${text.slice(0, 4000)}…` : text);

async function sendMessage(chatId: number, text: string): Promise<number | undefined> {
  const data = await telegram('sendMessage', { chat_id: chatId, text: fit(text) });
  return data.result?.message_id;
}

async function editMessage(chatId: number, messageId: number, text: string) {
  await telegram('editMessageText', { chat_id: chatId, message_id: messageId, text: fit(text) });
}

function sum(rows: Macros[]): Macros {
  const r1 = (n: number) => Math.round(n * 10) / 10;
  const total = (key: keyof Macros) => rows.reduce((acc, row) => acc + row[key], 0);
  return {
    calories: Math.round(total('calories')),
    protein_g: r1(total('protein_g')),
    carbs_g: r1(total('carbs_g')),
    fat_g: r1(total('fat_g')),
    fiber_g: r1(total('fiber_g')),
  };
}

async function saveDay(day: ParsedDay, rawText: string, messageId: number) {
  const meals = day.meals.map((meal, position) => ({
    meal_type: meal.meal_type,
    label: meal.label,
    time_window: meal.time_window,
    position,
    items: meal.items,
    ...sum(meal.items),
  }));
  const totals = sum(meals);

  // Read the old plan's ticks first so a re-sent plan doesn't wipe what was already eaten.
  const { data: oldDay, error: oldError } = await db
    .from('nutrition_days')
    .select('nutrition_meals(meal_type, eaten_at, position)')
    .eq('plan_date', day.plan_date)
    .maybeSingle();
  if (oldError) throw oldError;
  const oldMeals = [...(oldDay?.nutrition_meals ?? [])].sort((a, b) => a.position - b.position);
  const eatenAt = carryEaten(oldMeals, meals);

  // Re-sending a plan for the same date replaces it; meals go with it via ON DELETE CASCADE.
  const { error: deleteError } = await db
    .from('nutrition_days')
    .delete()
    .eq('plan_date', day.plan_date);
  if (deleteError) throw deleteError;

  const { data, error } = await db
    .from('nutrition_days')
    .insert({
      plan_date: day.plan_date,
      day_number: day.day_number,
      stated_calories: day.stated_calories,
      stated_protein_g: day.stated_protein_g,
      guidelines: day.guidelines,
      raw_text: rawText,
      telegram_message_id: messageId,
      ...totals,
    })
    .select('id')
    .single();
  if (error) throw error;

  const { error: mealsError } = await db
    .from('nutrition_meals')
    .insert(meals.map((meal, i) => ({ ...meal, day_id: data.id, eaten_at: eatenAt[i] })));
  if (mealsError) throw mealsError;

  return { meals, totals };
}

function summary(day: ParsedDay, saved: Awaited<ReturnType<typeof saveDay>>) {
  const { totals, meals } = saved;
  const date = new Date(`${day.plan_date}T00:00:00`).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const lines = [
    `Saved ${day.day_number ? `Day ${day.day_number} · ` : ''}${date}`,
    `${totals.calories} kcal · P ${totals.protein_g}g · C ${totals.carbs_g}g · F ${totals.fat_g}g · Fiber ${totals.fiber_g}g`,
  ];
  if (day.stated_calories || day.stated_protein_g) {
    lines.push(
      `Plan says: ${day.stated_calories ?? '?'} kcal · ${day.stated_protein_g ?? '?'}g protein`,
    );
  }
  lines.push('');
  for (const meal of meals) {
    lines.push(`${meal.label}: ${meal.calories} kcal · P ${meal.protein_g}g`);
  }
  return lines.join('\n');
}

async function handlePlan(chatId: number, text: string, messageId: number, sentAt: number) {
  // One status message, edited in place as the parse moves along, so the chat isn't flooded.
  const statusId = await sendMessage(chatId, 'Got it, working on your plan…');
  const status = async (update: string) => {
    if (statusId) await editMessage(chatId, statusId, update);
    else await sendMessage(chatId, update);
  };

  try {
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE }).format(
      new Date(sentAt * 1000),
    );
    const days = await parsePlan(text, today, status);
    console.log('parsed days', days.length);
    if (days.length === 0) {
      await status("That doesn't look like a meal plan, so nothing was saved.");
      return;
    }
    await status(`Saving ${days.length} day${days.length === 1 ? '' : 's'}…`);
    for (const day of days) {
      const saved = await saveDay(day, text, messageId);
      await sendMessage(chatId, summary(day, saved));
    }
    await status(`Done, saved ${days.length} day${days.length === 1 ? '' : 's'}.`);
  } catch (err) {
    console.error('telegram-webhook failed:', err);
    await status(`Couldn't save that plan: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// Shows why the runtime stopped the worker (e.g. wall clock or CPU limit) if a background parse never finishes.
addEventListener('beforeunload', (ev) => {
  console.log('shutting down:', (ev as CustomEvent).detail?.reason);
});

serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  if (req.headers.get('X-Telegram-Bot-Api-Secret-Token') !== WEBHOOK_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }

  const update = await req.json();
  const message = update.message;
  console.log(
    'update',
    update.update_id,
    'chat',
    message?.chat?.id,
    'chars',
    message?.text?.length ?? 0,
  );

  // Always 200 to Telegram, otherwise it retries the same update indefinitely.
  if (!message?.text || message.chat?.id !== OWNER_CHAT_ID || message.text.startsWith('/')) {
    return new Response('ok');
  }

  // Answer Telegram immediately; AI parsing can take longer than its webhook timeout.
  EdgeRuntime.waitUntil(
    handlePlan(message.chat.id, message.text, message.message_id, message.date),
  );
  return new Response('ok');
});
