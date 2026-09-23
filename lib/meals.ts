export interface MealConfig {
    key: string;
    dayLabel: string;
    mealLabel: string;
    shortLabel: string;
}

export const EVENT_MEALS: MealConfig[] = [
    { key: "day1_breakfast", dayLabel: "Day 1", mealLabel: "Breakfast", shortLabel: "D1 Breakfast" },
    { key: "day1_lunch", dayLabel: "Day 1", mealLabel: "Lunch", shortLabel: "D1 Lunch" },
    { key: "day1_snacks", dayLabel: "Day 1", mealLabel: "Evening Snacks", shortLabel: "D1 Snacks" },
    { key: "day1_dinner", dayLabel: "Day 1", mealLabel: "Dinner", shortLabel: "D1 Dinner" },
    { key: "day2_breakfast", dayLabel: "Day 2", mealLabel: "Breakfast", shortLabel: "D2 Breakfast" },
    { key: "day2_lunch", dayLabel: "Day 2", mealLabel: "Lunch", shortLabel: "D2 Lunch" },
];

export function getDefaultMealAccess(): Record<string, { included: boolean; claimedAt: string | null; claimedBy?: string }> {
    const access: Record<string, { included: boolean; claimedAt: string | null; claimedBy?: string }> = {};
    EVENT_MEALS.forEach(meal => {
        access[meal.key] = { included: false, claimedAt: null };
    });
    return access;
}
