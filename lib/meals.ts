export interface MealConfig {
    key: string;
    dayLabel: string;
    mealLabel: string;
    shortLabel: string;
    timeWindow: string;
}

export const EVENT_MEALS: MealConfig[] = [
    { key: "day1_breakfast", dayLabel: "Day 1", mealLabel: "Breakfast", shortLabel: "D1 Breakfast", timeWindow: "8:00 AM – 10:00 AM" },
    { key: "day1_lunch", dayLabel: "Day 1", mealLabel: "Lunch", shortLabel: "D1 Lunch", timeWindow: "12:30 PM – 2:30 PM" },
    { key: "day1_snacks", dayLabel: "Day 1", mealLabel: "Evening Snacks", shortLabel: "D1 Snacks", timeWindow: "5:00 PM – 6:30 PM" },
    { key: "day1_dinner", dayLabel: "Day 1", mealLabel: "Dinner", shortLabel: "D1 Dinner", timeWindow: "8:00 PM – 10:00 PM" },
    { key: "day2_breakfast", dayLabel: "Day 2", mealLabel: "Breakfast", shortLabel: "D2 Breakfast", timeWindow: "7:30 AM – 9:30 AM" },
    { key: "day2_lunch", dayLabel: "Day 2", mealLabel: "Lunch", shortLabel: "D2 Lunch", timeWindow: "12:30 PM – 2:30 PM" },
];

export function getDefaultMealAccess(): Record<string, { included: boolean; claimedAt: string | null; claimedBy?: string }> {
    const access: Record<string, { included: boolean; claimedAt: string | null; claimedBy?: string }> = {};
    EVENT_MEALS.forEach(meal => {
        access[meal.key] = { included: false, claimedAt: null };
    });
    return access;
}

export function hasIndividualMealPass(team: any, memberId: string, memberEmail?: string): boolean {
    if (!team) return false;
    const memberMealState = team.memberMealState || team.member_meal_state || {};
    
    const key = memberId.toLowerCase();
    const emailKey = memberEmail ? memberEmail.toLowerCase() : '';
    
    const state = memberMealState[memberId] 
        || memberMealState[key] 
        || (emailKey ? memberMealState[emailKey] : null);

    if (state && typeof state === 'object') {
        return Object.values(state).some((meal: any) => meal && (meal.included === true || Boolean(meal.claimedAt)));
    }

    // Check if member has explicit meal pass flag in member object
    const members = Array.isArray(team.members) ? team.members : [];
    const memberObj = members.find((m: any) => {
        if (typeof m === 'string') return m.toLowerCase() === key;
        return (m.email && m.email.toLowerCase() === emailKey) || (m.fullName && m.fullName.toLowerCase() === key);
    });
    if (memberObj && typeof memberObj === 'object') {
        if (memberObj.hasMealPass === true || memberObj.mealPass === true || memberObj.meal_opt_in === true) {
            return true;
        }
        if (memberObj.hasMealPass === false || memberObj.mealPass === false || memberObj.meal_opt_in === false) {
            return false;
        }
    }

    // If team-wide mealAccess is present and memberMealState hasn't configured specific members
    if (Object.keys(memberMealState).length === 0 && team.mealAccess && typeof team.mealAccess === 'object') {
        return Object.values(team.mealAccess).some((meal: any) => meal && meal.included === true);
    }

    return false;
}
