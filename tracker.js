/**
 * @file tracker.js
 * Core Business Logic, State Calculations, and Gamification Engine for EcoTrace 2.0.
 * Serves as a single source of truth for both browser and Node.js test runs.
 */

// ── CONSTANTS & EMISSION FACTORS ──
export const EMISSION_FACTORS = {
  // Transport (kg CO₂ per km)
  car_petrol: { label: 'Car (Petrol)', factor: 0.171, unit: 'km', cat: 'transport' },
  car_ev: { label: 'Car (Electric)', factor: 0.053, unit: 'km', cat: 'transport' },
  bus: { label: 'Bus', factor: 0.089, unit: 'km', cat: 'transport' },
  train: { label: 'Train', factor: 0.041, unit: 'km', cat: 'transport' },
  flight_short: { label: 'Short-haul Flight', factor: 0.255, unit: 'km', cat: 'transport' },
  flight_long: { label: 'Long-haul Flight', factor: 0.150, unit: 'km', cat: 'transport' },
  motorbike: { label: 'Motorbike', factor: 0.114, unit: 'km', cat: 'transport' },

  // Food (kg CO₂ per meal/litre)
  beef_meal: { label: 'Beef Meal', factor: 6.000, unit: 'meal', cat: 'food' },
  chicken_meal: { label: 'Chicken Meal', factor: 1.100, unit: 'meal', cat: 'food' },
  plant_meal: { label: 'Plant-based Meal', factor: 0.400, unit: 'meal', cat: 'food' },
  dairy: { label: 'Dairy (Litre)', factor: 3.200, unit: 'litre', cat: 'food' },

  // Energy (kg CO₂ per kWh)
  electricity: { label: 'Electricity', factor: 0.462, unit: 'kWh', cat: 'energy' },
  gas_heating: { label: 'Gas Heating', factor: 0.204, unit: 'kWh', cat: 'energy' },

  // Shopping (kg CO₂ per item)
  clothing: { label: 'Clothing Item', factor: 10.00, unit: 'item', cat: 'shopping' },
  electronics: { label: 'Electronics Item', factor: 70.00, unit: 'item', cat: 'shopping' }
};

export const GLOBAL_DAILY_AVG_KG = 16.0;

export const BADGES = [
  { id: 'first_step', title: 'First Step', desc: 'Log your first eco-activity', icon: '🌱' },
  { id: 'low_footprint', title: 'Featherweight', desc: 'Log a daily footprint below 4.0 kg CO₂', icon: '🪶' },
  { id: 'green_commuter', title: 'Green Commuter', desc: 'Log 5 public transport or EV trips', icon: '🚆' },
  { id: 'plant_lover', title: 'Plant Powered', desc: 'Log 5 plant-based meals', icon: '🥗' },
  { id: 'saver_streak', title: 'Carbon Saver', desc: 'Maintain a 5-day streak below the global average', icon: '🔥' },
  { id: 'century_saver', title: 'Eco Guardian', desc: 'Save a total of 100 kg CO₂ compared to global average', icon: '🛡️' },
  { id: 'quest_champion', title: 'Quest Master', desc: 'Complete at least 5 weekly challenges', icon: '🏆' }
];

export const QUESTS = [
  { id: 'quest_plant_day', title: 'Go Green Daily', desc: 'Eat at least 2 plant-based meals today', xp: 40, cat: 'food' },
  { id: 'quest_green_commute', title: 'Eco-Transit', desc: 'Travel at least 15km on public transit or EV', xp: 50, cat: 'transport' },
  { id: 'quest_vampire_power', title: 'Power Down', desc: 'Keep home electricity usage under 4 kWh', xp: 45, cat: 'energy' },
  { id: 'quest_thrift_buy', title: 'No Fast Fashion', desc: 'Shop second-hand or log zero shopping emissions', xp: 30, cat: 'shopping' }
];

// ── BUSINESS LOGIC ──

/**
 * Calculates carbon emissions based on subcategory and amount.
 * @param {string} key Subcategory key.
 * @param {number} amount Quantity consumed/traveled.
 * @returns {number} Emitted CO₂ in kg.
 */
export function getEmission(key, amount) {
  if (amount < 0) return 0;
  const factorInfo = EMISSION_FACTORS[key];
  if (!factorInfo) return 0;
  return parseFloat((factorInfo.factor * amount).toFixed(3));
}

/**
 * Categorizes a daily carbon footprint and returns grading details.
 * @param {number} todayKg Total emissions today.
 * @returns {object} Grade, visual color, and descriptive text.
 */
export function getScoreDetails(todayKg) {
  if (todayKg < 0) todayKg = 0;
  if (todayKg <= 4) return { grade: 'A+', color: 'green', text: 'Excellent!' };
  if (todayKg <= 8) return { grade: 'A', color: 'green', text: 'Great Job!' };
  if (todayKg <= 12) return { grade: 'B', color: 'orange', text: 'Good!' };
  if (todayKg <= 16) return { grade: 'C', color: 'orange', text: 'Fair' };
  return { grade: 'D', color: 'red', text: 'High' };
}

/**
 * Awards XP to a user profile and handles level progression.
 * @param {object} profile The profile containing level and xp.
 * @param {number} amount The XP amount to add.
 * @returns {object} Updated profile with level and remaining XP.
 */
export function awardXP(profile, amount) {
  if (amount <= 0) return profile;
  let xp = (profile.xp || 0) + amount;
  let level = profile.level || 1;

  while (xp >= level * 100) {
    xp -= level * 100;
    level += 1;
  }
  return { ...profile, level, xp };
}

/**
 * Escapes strings to avoid XSS injections.
 * @param {string} str Input string.
 * @returns {string} Sanitized string.
 */
export function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Validates form parameters.
 * @param {string} key Subcategory key.
 * @param {number} amount Input amount.
 * @returns {boolean} True if input parameters are correct.
 */
export function validateActivity(key, amount) {
  if (!key || !EMISSION_FACTORS[key]) return false;
  if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) return false;
  return true;
}

/**
 * Evaluates streaks based on historical activities.
 * Returns the current streak of days where footprint was <= GLOBAL_DAILY_AVG_KG.
 * @param {Array} activities Activity history.
 * @returns {number} Current consecutive days streak.
 */
export function calculateStreak(activities) {
  if (!activities || activities.length === 0) return 0;

  // Group emissions by date string (YYYY-MM-DD)
  const dailyEmissions = {};
  activities.forEach(act => {
    const day = act.date.slice(0, 10);
    dailyEmissions[day] = (dailyEmissions[day] || 0) + act.kg;
  });

  const datesSorted = Object.keys(dailyEmissions).sort((a, b) => new Date(b) - new Date(a));

  let streak = 0;
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);

  // If the last activity day was not today or yesterday, streak is broken
  if (datesSorted.length === 0 || (datesSorted[0] !== today && datesSorted[0] !== yesterday)) {
    return 0;
  }

  let expectedDate = new Date(datesSorted[0]);
  for (const dateStr of datesSorted) {
    const actualDate = new Date(dateStr);
    const diffDays = Math.round(Math.abs(expectedDate - actualDate) / 864e5);

    if (diffDays > 1) {
      break; // Streak broken
    }

    if (dailyEmissions[dateStr] < GLOBAL_DAILY_AVG_KG) {
      streak++;
      expectedDate = actualDate;
    } else {
      break; // Streak broken because daily target exceeded
    }
  }

  return streak;
}

/**
 * Evaluates and returns unlocked badge ids based on activities.
 * @param {object} profile The user profile.
 * @param {Array} activities Activity history.
 * @returns {Array} List of unlocked badge IDs.
 */
export function checkBadges(profile, activities) {
  const unlocked = [];
  if (!activities || activities.length === 0) return unlocked;

  // 1. First Step: Log your first activity
  unlocked.push('first_step');

  // 2. Featherweight: Log a daily footprint below 4.0 kg CO2
  const dailyEmissions = {};
  activities.forEach(a => {
    const day = a.date.slice(0, 10);
    dailyEmissions[day] = (dailyEmissions[day] || 0) + a.kg;
  });
  if (Object.values(dailyEmissions).some(kg => kg > 0 && kg < 4.0)) {
    unlocked.push('low_footprint');
  }

  // 3. Green Commuter: Log 5 public transport or EV trips
  const greenCommuteCount = activities.filter(a =>
    a.subcat === 'bus' || a.subcat === 'train' || a.subcat === 'car_ev'
  ).length;
  if (greenCommuteCount >= 5) {
    unlocked.push('green_commuter');
  }

  // 4. Plant Powered: Log 5 plant-based meals
  const plantMealCount = activities.filter(a => a.subcat === 'plant_meal').length;
  if (plantMealCount >= 5) {
    unlocked.push('plant_lover');
  }

  // 5. Carbon Saver: Maintain a 5-day streak below global average
  const streak = calculateStreak(activities);
  if (streak >= 5) {
    unlocked.push('saver_streak');
  }

  // 6. Eco Guardian: Save a total of 100 kg CO2 vs global average
  // Total savings = sum for all logged days of max(0, 16.0 - day_emission)
  let totalSaved = 0;
  Object.values(dailyEmissions).forEach(dayKg => {
    if (dayKg < GLOBAL_DAILY_AVG_KG) {
      totalSaved += (GLOBAL_DAILY_AVG_KG - dayKg);
    }
  });
  if (totalSaved >= 100.0) {
    unlocked.push('century_saver');
  }

  // 7. Quest Master: Complete at least 5 weekly challenges
  if (profile.completedQuestsCount >= 5) {
    unlocked.push('quest_champion');
  }

  return unlocked;
}

/**
 * Checks weekly quests completion status.
 * @param {Array} activities Today's activities.
 * @returns {Array} List of completed quest IDs.
 */
export function checkQuestProgress(activities) {
  const completed = [];
  const today = new Date().toISOString().slice(0, 10);
  const todayActs = activities.filter(a => a.date.slice(0, 10) === today);

  // Quest 1: Eat at least 2 plant-based meals today
  const plantMeals = todayActs.filter(a => a.subcat === 'plant_meal').reduce((sum, a) => sum + a.amount, 0);
  if (plantMeals >= 2) completed.push('quest_plant_day');

  // Quest 2: Travel at least 15km on public transit or EV
  const greenDist = todayActs
    .filter(a => a.subcat === 'bus' || a.subcat === 'train' || a.subcat === 'car_ev')
    .reduce((sum, a) => sum + a.amount, 0);
  if (greenDist >= 15) completed.push('quest_green_commute');

  // Quest 3: Keep home electricity usage under 4 kWh today
  const electricityUsed = todayActs.filter(a => a.subcat === 'electricity').reduce((sum, a) => sum + a.amount, 0);
  // Quest is complete if we logged energy and kept it under 4, or if we didn't exceed it. Let's say if we logged electricity at all and it's <= 4
  const hasLoggedElectricity = todayActs.some(a => a.subcat === 'electricity');
  if (hasLoggedElectricity && electricityUsed <= 4 && electricityUsed > 0) {
    completed.push('quest_vampire_power');
  }

  // Quest 4: Shop second-hand or log zero shopping emissions
  const shoppingEmissions = todayActs.filter(a => a.cat === 'shopping').reduce((sum, a) => sum + a.kg, 0);
  // User completes if they have some activity logged today but 0 shopping emissions
  const hasTodayActivities = todayActs.length > 0;
  if (hasTodayActivities && shoppingEmissions === 0) {
    completed.push('quest_thrift_buy');
  }

  return completed;
}

/**
 * Safe local storage state loader with format check.
 * @param {string} rawJSON Raw local storage value.
 * @returns {Array} Clean activities array.
 */
export function validateAndLoadActivities(rawJSON) {
  try {
    const list = JSON.parse(rawJSON);
    if (!Array.isArray(list)) return [];
    return list.filter(item => {
      return (
        item &&
        typeof item.id === 'number' &&
        typeof item.subcat === 'string' &&
        typeof item.cat === 'string' &&
        typeof item.label === 'string' &&
        typeof item.amount === 'number' &&
        typeof item.unit === 'string' &&
        typeof item.kg === 'number' &&
        typeof item.date === 'string'
      );
    });
  } catch (e) {
    return [];
  }
}

/**
 * Returns dynamic, tailored educational insights based on activity trends.
 * @param {Array} activities Recent activities list.
 * @returns {string} Tailored recommendation text.
 */
export function getTailoredInsight(activities) {
  if (!activities || activities.length === 0) {
    return "Log your first activity to analyze your carbon habits and receive personalized suggestions!";
  }

  const totals = { transport: 0, food: 0, energy: 0, shopping: 0 };
  activities.forEach(a => {
    if (totals[a.cat] !== undefined) totals[a.cat] += a.kg;
  });

  const highestCat = Object.keys(totals).reduce((a, b) => totals[a] > totals[b] ? a : b);
  const highestVal = totals[highestCat];

  if (highestVal === 0) {
    return "Excellent! You've logged activities but kept your carbon emissions at zero. Keep utilizing clean habits!";
  }

  switch (highestCat) {
    case 'transport':
      return "Transport is your top emission source. Swapping single-passenger car drives for cycling, walking, or bus transit will significantly lower your footprint.";
    case 'food':
      return "Food emissions are your primary footprint contributor. Reducing beef or dairy consumption in favor of plant-based swaps represents a fast carbon-saving strategy.";
    case 'energy':
      return "Household energy represents your highest carbon category. Unplugging devices on standby, running laundry on cold settings, and shifting usage to off-peak periods can reduce emissions.";
    case 'shopping':
      return "Shopping purchases represent your highest footprint category. Try shopping second-hand or repairing items instead of buying new, as manufacturing products emits significant CO₂.";
    default:
      return "You're doing great tracking your habits! Focus on making small, sustainable daily changes across all categories.";
  }
}
