import { describe, expect, it } from 'vitest';
import { openapiEnum } from '$lib/testing/openapi';
import { mealTitle } from './meal';
import { macroEnergy, NUTRIENT_GROUPS, nutrientGroups, nutrientLabel } from './nutrients';
import { toMealTotals } from './totals';
import type { Meal, MealTotalsResponse } from './types';

const meal = (over: Partial<Meal> = {}): Meal => ({
	id: 'm1',
	timestamp: '2026-10-05T06:00:00Z',
	meal_type: 'breakfast',
	name: 'Oatmeal with banana',
	source: {
		provider: 'apple',
		source: 'MyFitnessPal',
		device: null,
		device_type: null,
		device_name: null
	},
	calories_kcal: 420,
	macros: { protein_g: 14, carbohydrates_g: 68, fat_g: 9, fiber_g: null },
	water_ml: null,
	nutrients: {
		dietary_energy_consumed: { value: 420, unit: 'kcal' },
		dietary_protein: { value: 14, unit: 'g' },
		dietary_sodium: { value: 120.25, unit: 'mg' },
		dietary_vitamin_c: { value: 4, unit: 'mg' }
	},
	...over
});

describe('NUTRIENT_GROUPS', () => {
	it('places every nutrient series the API knows, exactly once', () => {
		const keys = NUTRIENT_GROUPS.flatMap((group) => group.keys);
		const nutrients = openapiEnum('SeriesType').filter(
			(type) => type.startsWith('dietary_') || type === 'hydration'
		);

		expect(new Set(keys).size).toBe(keys.length);
		expect([...keys].sort()).toEqual(nutrients.sort());
	});
});

describe('nutrientLabel', () => {
	it('reads the series code as words, with the names a slug would mangle spelled out', () => {
		expect(nutrientLabel('dietary_pantothenic_acid')).toBe('Pantothenic acid');
		expect(nutrientLabel('dietary_vitamin_b12')).toBe('Vitamin B12');
		expect(nutrientLabel('dietary_energy_consumed')).toBe('Energy');
		expect(nutrientLabel('hydration')).toBe('Water');
	});
});

describe('nutrientGroups', () => {
	it('shows only the groups and nutrients the meal carries, with their units', () => {
		const groups = nutrientGroups(meal());

		expect(groups.map((group) => group.title)).toEqual(['Energy & macros', 'Minerals', 'Vitamins']);
		expect(groups[1].fields).toEqual([{ label: 'Sodium', value: '120.3 mg' }]);
	});
});

describe('macroEnergy', () => {
	it('splits the energy 4/4/9 kcal per gram, and says nothing without macros', () => {
		expect(macroEnergy(meal()).map((part) => part.value)).toEqual([56, 272, 81]);
		expect(macroEnergy(meal({ macros: null }))).toEqual([]);
		expect(
			macroEnergy(meal({ macros: { protein_g: 0, carbohydrates_g: null, fat_g: 0, fiber_g: 3 } }))
		).toEqual([]);
	});
});

describe('mealTitle', () => {
	it('prefers the food name, then the meal type, then a plain word', () => {
		expect(mealTitle(meal())).toBe('Oatmeal with banana');
		expect(mealTitle(meal({ name: null, meal_type: 'BEFORE_DINNER' }))).toBe('Before dinner');
		expect(mealTitle(meal({ name: null, meal_type: null }))).toBe('Meal');
	});
});

describe('toMealTotals', () => {
	const totals = (over: Partial<MealTotalsResponse> = {}): MealTotalsResponse => ({
		count: 3,
		days_logged: 2,
		calories_kcal: 1020,
		macros: { protein_g: 28, carbohydrates_g: 90, fat_g: 40, fiber_g: null },
		water_ml: null,
		nutrients: {},
		...over
	});

	it('takes the sums as the API added them up, averaging calories over the days logged', () => {
		expect(toMealTotals(totals())).toEqual({
			count: 3,
			calories: 1020,
			caloriesPerDay: 510,
			protein: 28,
			partial: false
		});
	});

	it('says nothing per day, or of protein, when no meal reported them', () => {
		expect(
			toMealTotals(totals({ count: 0, days_logged: 0, calories_kcal: null, macros: null }))
		).toMatchObject({ count: 0, calories: null, caloriesPerDay: null, protein: null });
	});
});
