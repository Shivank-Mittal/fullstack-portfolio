import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { enqueuePlan } from '../_shared/queue.ts';
import { sendMessage, editMessage } from '../_shared/telegram.ts';

// Receives Telegram updates and only queues them: the telegram-worker function does the AI
// parsing and saving, pushed one plan at a time by QStash with retries.

const WEBHOOK_SECRET = Deno.env.get('TELEGRAM_WEBHOOK_SECRET')!;
const OWNER_CHAT_ID = Number(Deno.env.get('TELEGRAM_OWNER_CHAT_ID'));

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

  // Always 200 to Telegram, otherwise it retries the same update.
  if (!message?.text || message.chat?.id !== OWNER_CHAT_ID || message.text.startsWith('/')) {
    return new Response('ok');
  }

  const chatId: number = message.chat.id;
  const statusId = await sendMessage(chatId, 'Queued, your plan will be read shortly…');
  try {
    await enqueuePlan(
      { chatId, text: message.text, messageId: message.message_id, sentAt: message.date, statusId },
      update.update_id,
    );
  } catch (err) {
    console.error('enqueue failed:', err);
    const reason = err instanceof Error ? err.message : String(err);
    const text = `Couldn't queue that plan, please send it again. (${reason})`;
    if (statusId) await editMessage(chatId, statusId, text);
    else await sendMessage(chatId, text);
  }
  return new Response('ok');
});
