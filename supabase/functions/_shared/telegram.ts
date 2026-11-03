async function telegram(method: string, payload: Record<string, unknown>) {
  const token = Deno.env.get('TELEGRAM_BOT_TOKEN');
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
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

/**
 * Sends a message; with `replyTo`, it is shown as a reply to that message, so with several
 * plans in flight each status sits under the plan it belongs to.
 */
export async function sendMessage(
  chatId: number,
  text: string,
  replyTo?: number,
): Promise<number | undefined> {
  const data = await telegram('sendMessage', {
    chat_id: chatId,
    text: fit(text),
    ...(replyTo
      ? { reply_parameters: { message_id: replyTo, allow_sending_without_reply: true } }
      : {}),
  });
  return data.result?.message_id;
}

export async function editMessage(chatId: number, messageId: number, text: string) {
  await telegram('editMessageText', { chat_id: chatId, message_id: messageId, text: fit(text) });
}
