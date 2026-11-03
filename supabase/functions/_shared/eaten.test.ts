import { assertEquals } from 'jsr:@std/assert@1';
import { carryEaten } from './eaten.ts';

Deno.test('same meals keep their ticks', () => {
  assertEquals(
    carryEaten(
      [
        { meal_type: 'breakfast', eaten_at: 'T1' },
        { meal_type: 'lunch', eaten_at: null },
      ],
      [{ meal_type: 'breakfast' }, { meal_type: 'lunch' }],
    ),
    ['T1', null],
  );
});

Deno.test('repeated type matches first with first, second with second', () => {
  assertEquals(
    carryEaten(
      [
        { meal_type: 'evening_snack', eaten_at: 'A' },
        { meal_type: 'evening_snack', eaten_at: 'B' },
      ],
      [{ meal_type: 'evening_snack' }, { meal_type: 'dinner' }, { meal_type: 'evening_snack' }],
    ),
    ['A', null, 'B'],
  );
});

Deno.test('a vanished type loses its tick and a new type starts unticked', () => {
  assertEquals(
    carryEaten([{ meal_type: 'mid_morning', eaten_at: 'T' }], [{ meal_type: 'breakfast' }]),
    [null],
  );
});

Deno.test('no old meals means nothing ticked', () => {
  assertEquals(carryEaten([], [{ meal_type: 'lunch' }]), [null]);
});
