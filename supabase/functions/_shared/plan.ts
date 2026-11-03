import { z } from 'npm:zod@4.1.12';
import { completeJson, type Progress } from './ai.ts';

export const MEAL_TYPES = [
  'early_morning',
  'breakfast',
  'mid_morning',
  'lunch',
  'evening_snack',
  'dinner',
  'bedtime',
] as const;

const Item = z.strictObject({
  name: z.string(),
  quantity: z.string(),
  calories: z.number(),
  protein_g: z.number(),
  carbs_g: z.number(),
  fat_g: z.number(),
  fiber_g: z.number(),
});

const Meal = z.strictObject({
  meal_type: z.enum(MEAL_TYPES),
  label: z.string(),
  time_window: z.string().nullable(),
  items: z.array(Item),
});

const Day = z.strictObject({
  plan_date: z.string().describe('YYYY-MM-DD'),
  day_number: z.number().nullable(),
  stated_calories: z.number().nullable(),
  stated_protein_g: z.number().nullable(),
  guidelines: z.array(z.string()),
  meals: z.array(Meal),
});

const ParsedPlan = z.strictObject({ days: z.array(Day) });

export type ParsedItem = z.infer<typeof Item>;
export type ParsedDay = z.infer<typeof Day>;

const { $schema: _, ...schema } = z.toJSONSchema(ParsedPlan) as Record<string, unknown>;

const SYSTEM_PROMPT = `You turn a nutritionist's diet plan, sent as free text, into structured data.

The message may cover one day or several. Return one entry in "days" per day. Dates are written like "30th Oct 2026"; return them as YYYY-MM-DD. If a day has no date, use {{TODAY}}. If the message is not a meal plan at all, return an empty "days" array.

Map each section to the closest meal_type: early_morning (on waking, such as lemon water), breakfast, mid_morning, lunch, evening_snack, dinner, bedtime. Keep the plan's own heading as label and its time as time_window (for example "7-8 AM"), or null if none is given. Keep meals in the order they appear.

List one item per food or drink. Skip anything the plan marks as off for the day, such as "Detox water - x". Keep the quantity as written, for example "1-2 bowl medium size". Estimate calories, protein, carbs, fat and fiber for that quantity, assuming typical Indian home cooking unless the plan says otherwise. For a range, estimate the midpoint. Water and lemon water are close to zero.

If the plan states its own totals, copy them into stated_calories and stated_protein_g; a total written as "1450 g" for calories means 1450 kcal. Otherwise use null. Put the plan's advice (water goal, walking, lifestyle targets, coffee rules) into guidelines as short standalone sentences.

Respond with JSON only, matching this schema:
${JSON.stringify(schema)}`;

export async function parsePlan(
  text: string,
  today: string,
  onProgress?: Progress,
): Promise<ParsedDay[]> {
  const raw = await completeJson(
    {
      system: SYSTEM_PROMPT.replace('{{TODAY}}', today),
      user: text,
      schemaName: 'nutrition_plan',
      schema,
    },
    onProgress,
  );

  const { days } = ParsedPlan.parse(raw);
  for (const day of days) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day.plan_date) || isNaN(Date.parse(day.plan_date))) {
      throw new Error(`Invalid plan_date from AI: ${day.plan_date}`);
    }
  }
  return days;
}
