import type { MealTotalsResponse } from './types';

export type MealTotals = {
	count: number;
	calories: number | null;
	/** Over the local days that have a meal, by each meal's zone offset. */
	caloriesPerDay: number | null;
	protein: number | null;
	/** Always false: the database adds up every matching meal, not a page of them. */
	partial: boolean;
};

export const toMealTotals = (totals: MealTotalsResponse): MealTotals => ({
	count: totals.count,
	calories: totals.calories_kcal,
	caloriesPerDay:
		totals.calories_kcal === null || totals.days_logged === 0
			? null
			: totals.calories_kcal / totals.days_logged,
	protein: totals.macros?.protein_g ?? null,
	partial: false
});
