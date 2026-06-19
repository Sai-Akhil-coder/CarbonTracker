/**
 * @file tests.spec.js
 * Comprehensive automated test suite for EcoQuest (EcoTrace 2.0).
 * Imports production business logic directly from tracker.js.
 * Run this test using standard Node.js: `node tests.spec.js`
 */

import test from 'node:test';
import assert from 'node:assert';
import {
  getEmission,
  getScoreDetails,
  awardXP,
  escapeHTML,
  checkBadges,
  calculateStreak,
  validateActivity,
  checkQuestProgress,
  validateAndLoadActivities,
  getTailoredInsight,
  GLOBAL_DAILY_AVG_KG,
  EMISSION_FACTORS
} from './tracker.js';

// ── TEST SUITE: EMISSION CALCULATIONS ──

test('Carbon emission calculations are accurate for standard factors', () => {
  // 10 km in petrol car (0.171 * 10 = 1.71)
  assert.strictEqual(getEmission('car_petrol', 10), 1.71);

  // 2 beef meals (6.0 * 2 = 12.0)
  assert.strictEqual(getEmission('beef_meal', 2), 12.0);

  // 3 plant meals (0.4 * 3 = 1.2)
  assert.strictEqual(getEmission('plant_meal', 3), 1.2);

  // 15 kWh electricity (0.462 * 15 = 6.93)
  assert.strictEqual(getEmission('electricity', 15), 6.93);
});

test('Carbon emission calculations handle boundary/invalid inputs correctly', () => {
  // Invalid category should return 0 emissions
  assert.strictEqual(getEmission('fake_category', 100), 0);

  // Zero quantity should return 0 emissions
  assert.strictEqual(getEmission('car_petrol', 0), 0);

  // Negative quantity should return 0 emissions
  assert.strictEqual(getEmission('car_petrol', -10), 0);
});

// ── TEST SUITE: XP & LEVELING PROGRESSION ──

test('XP Progression calculates levels and rollovers correctly', () => {
  let profile = { level: 1, xp: 0 };

  // Award 50 XP (Cap is 100 XP)
  profile = awardXP(profile, 50);
  assert.strictEqual(profile.level, 1);
  assert.strictEqual(profile.xp, 50);

  // Award 60 XP (Cross level 1 threshold, level up to 2, remainder 10 XP)
  profile = awardXP(profile, 60);
  assert.strictEqual(profile.level, 2);
  assert.strictEqual(profile.xp, 10);

  // Award 200 XP (Level 2 cap is 200 XP, should cross level 2 to level 3)
  profile = awardXP(profile, 200);
  assert.strictEqual(profile.level, 3);
  assert.strictEqual(profile.xp, 10);
});

test('XP Progression handles invalid amounts gracefully', () => {
  let profile = { level: 2, xp: 50 };

  // Awarding negative or zero XP should leave profile unchanged
  profile = awardXP(profile, 0);
  assert.strictEqual(profile.level, 2);
  assert.strictEqual(profile.xp, 50);

  profile = awardXP(profile, -100);
  assert.strictEqual(profile.level, 2);
  assert.strictEqual(profile.xp, 50);
});

// ── TEST SUITE: INPUT SANITIZATION (SECURITY) ──

test('escapeHTML sanitizes harmful elements to prevent XSS', () => {
  // Plain strings remain clean
  assert.strictEqual(escapeHTML('Healthy Planet'), 'Healthy Planet');

  // Script tags are escaped
  const scriptTag = '<script>alert("hack")</script>';
  const cleanScript = escapeHTML(scriptTag);
  assert.strictEqual(cleanScript.includes('<script>'), false);
  assert.strictEqual(cleanScript.includes('&lt;script&gt;'), true);

  // Attribute exploits are escaped
  const attributeExploit = 'onload="run()"';
  assert.strictEqual(escapeHTML(attributeExploit).includes('&quot;'), true);
});

// ── TEST SUITE: SCORE DETAILS ──

test('getScoreDetails correctly maps carbon footprint kg to letter grades', () => {
  // A+ category (<= 4.0 kg)
  const lowFootprint = getScoreDetails(3.5);
  assert.strictEqual(lowFootprint.grade, 'A+');
  assert.strictEqual(lowFootprint.color, 'green');

  // B category (8.0 < kg <= 12.0)
  const midFootprint = getScoreDetails(10.5);
  assert.strictEqual(midFootprint.grade, 'B');

  // D category (> 16.0 kg)
  const highFootprint = getScoreDetails(18.0);
  assert.strictEqual(highFootprint.grade, 'D');
  assert.strictEqual(highFootprint.color, 'red');
});

// ── TEST SUITE: FORM INPUT VALIDATION ──

test('validateActivity correctly identifies valid/invalid inputs', () => {
  assert.strictEqual(validateActivity('car_petrol', 10), true);
  assert.strictEqual(validateActivity('fake_item', 10), false);
  assert.strictEqual(validateActivity('car_petrol', -5), false);
  assert.strictEqual(validateActivity('car_petrol', 0), false);
  assert.strictEqual(validateActivity('car_petrol', 'ten'), false);
});

// ── TEST SUITE: STREAKS & BADGES (GAMIFICATION) ──

test('calculateStreak counts consecutive carbon-saving days correctly', () => {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  const dayBefore = new Date(Date.now() - 2 * 864e5).toISOString().slice(0, 10);

  // Case 1: Empty activities
  assert.strictEqual(calculateStreak([]), 0);

  // Case 2: Clean streak (all under 16 kg global average)
  const cleanActivities = [
    { id: 1, subcat: 'car_ev', cat: 'transport', label: 'EV', amount: 10, unit: 'km', kg: 0.53, date: today },
    { id: 2, subcat: 'car_ev', cat: 'transport', label: 'EV', amount: 10, unit: 'km', kg: 0.53, date: yesterday },
    { id: 3, subcat: 'car_ev', cat: 'transport', label: 'EV', amount: 10, unit: 'km', kg: 0.53, date: dayBefore }
  ];
  assert.strictEqual(calculateStreak(cleanActivities), 3);

  // Case 3: Broken streak (one day exceeded 16 kg average)
  const brokenActivities = [
    { id: 1, subcat: 'car_ev', cat: 'transport', label: 'EV', amount: 10, unit: 'km', kg: 0.53, date: today },
    { id: 2, subcat: 'flight_short', cat: 'transport', label: 'Flight', amount: 100, unit: 'km', kg: 25.5, date: yesterday },
    { id: 3, subcat: 'car_ev', cat: 'transport', label: 'EV', amount: 10, unit: 'km', kg: 0.53, date: dayBefore }
  ];
  assert.strictEqual(calculateStreak(brokenActivities), 1); // today is fine, yesterday broke it
});

test('checkBadges returns expected unlocked badge IDs', () => {
  const profile = { level: 1, xp: 0, completedQuestsCount: 0 };

  // Case 1: No activities
  assert.deepStrictEqual(checkBadges(profile, []), []);

  // Case 2: First activity logged
  const activities = [
    { id: 1, subcat: 'plant_meal', cat: 'food', label: 'Meal', amount: 1, unit: 'meal', kg: 0.4, date: new Date().toISOString() }
  ];
  const badges = checkBadges(profile, activities);
  assert.ok(badges.includes('first_step'));
  assert.ok(badges.includes('low_footprint')); // 0.4 kg is below 4.0 kg limit

  // Case 3: 5 plant meals -> should unlock plant_lover
  const foodActivities = Array(5).fill(null).map((_, i) => ({
    id: i, subcat: 'plant_meal', cat: 'food', label: 'Meal', amount: 1, unit: 'meal', kg: 0.4, date: new Date().toISOString()
  }));
  const moreBadges = checkBadges(profile, foodActivities);
  assert.ok(moreBadges.includes('plant_lover'));
});

// ── TEST SUITE: QUEST PROGRESSION ──

test('checkQuestProgress detects completed challenges correctly', () => {
  const today = new Date().toISOString().slice(0, 10);

  // Case 1: Eat at least 2 plant meals today
  const plantActivities = [
    { id: 1, subcat: 'plant_meal', cat: 'food', label: 'Veggie', amount: 2, unit: 'meal', kg: 0.8, date: today }
  ];
  const completed = checkQuestProgress(plantActivities);
  assert.ok(completed.includes('quest_plant_day'));
});

// ── TEST SUITE: STORAGE VALIDATOR ──

test('validateAndLoadActivities filters corrupt localStorage JSON format safely', () => {
  const validJSON = JSON.stringify([
    { id: 1, subcat: 'train', cat: 'transport', label: 'Train', amount: 10, unit: 'km', kg: 0.41, date: new Date().toISOString() }
  ]);
  assert.strictEqual(validateAndLoadActivities(validJSON).length, 1);

  const invalidJSON = JSON.stringify([
    { id: "corrupt_id", subcat: 'train', kg: "invalid_string" } // missing fields and wrong types
  ]);
  assert.strictEqual(validateAndLoadActivities(invalidJSON).length, 0);

  // Random malformed text shouldn't crash it
  assert.deepStrictEqual(validateAndLoadActivities("malformed-data{[[}"), []);
});

// ── TEST SUITE: TAILORED INSIGHTS ──

test('getTailoredInsight returns appropriate suggestions based on main emission sources', () => {
  // Empty state
  assert.strictEqual(
    getTailoredInsight([]),
    "Log your first activity to analyze your carbon habits and receive personalized suggestions!"
  );

  // Highest is transport
  const transportHeavy = [
    { id: 1, subcat: 'car_petrol', cat: 'transport', label: 'Petrol Commute', amount: 100, unit: 'km', kg: 17.1, date: new Date().toISOString() }
  ];
  assert.ok(getTailoredInsight(transportHeavy).includes('Transport is your top emission source'));

  // Highest is food
  const foodHeavy = [
    { id: 1, subcat: 'beef_meal', cat: 'food', label: 'Steak', amount: 4, unit: 'meal', kg: 24.0, date: new Date().toISOString() }
  ];
  assert.ok(getTailoredInsight(foodHeavy).includes('Food emissions are your primary footprint contributor'));
});
