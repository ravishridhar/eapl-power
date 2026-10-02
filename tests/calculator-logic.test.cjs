const test = require('node:test');
const assert = require('node:assert/strict');
const data = require('../js/calculator-data.js');
const { calculateLoad, recommend } = require('../js/calculator-logic.js');
const run = (quantities, hours = 3, wave = 'Sine Wave', chemistry = 'Tubular') => {
  const load = calculateLoad(quantities, data);
  return { load, result: recommend(load, hours, wave, chemistry, data) };
};
test('empty selection has no recommendation', () => {
  const { load, result } = run({});
  assert.equal(load.totalWatts, 0); assert.equal(result.inverter, null); assert.equal(result.oversized, false);
});
test('29 appliances and exact VA rounding', () => {
  assert.equal(data.appliances.length, 29);
  assert.equal(run({ 'led-bulb': 1 }).load.requiredVA, 11);
  const { load } = run({ 'ceiling-fan': 2, 'tv-led': 1, router: 1 });
  assert.equal(load.totalWatts, 255); assert.equal(load.requiredVA, 319); assert.equal(load.items.length, 3);
});
test('backup hours change battery capacity, while inverter stays the same', () => {
  const a = run({ 'ceiling-fan': 2, 'tv-led': 1, router: 1 }, 1).result;
  const b = run({ 'ceiling-fan': 2, 'tv-led': 1, router: 1 }, 3).result;
  assert.equal(a.inverter.name, 'SINO 900VA-12V'); assert.equal(b.inverter.name, a.inverter.name);
  assert.equal(a.requiredAh, 34); assert.equal(b.requiredAh, 100);
  assert.equal(b.battery.name, 'EMSS100048TT'); assert.equal(b.achievedBackupHours, 3);
});
test('waveform and chemistry select compatible products', () => {
  for (const wave of ['Sine Wave', 'Square Wave']) for (const chemistry of ['Tubular', 'Lithium']) {
    const { result } = run({ 'ceiling-fan': 2 }, 3, wave, chemistry);
    assert.equal(result.inverter.wave, wave); assert.equal(result.battery.chemistry, chemistry);
    assert.equal(!!result.inverter.lithium, chemistry === 'Lithium');
  }
});
test('multi-battery system sizes capacity at system voltage', () => {
  const { result } = run({ geyser: 1 }, 3);
  assert.equal(result.inverter.name, 'SINO 2500VA-24V'); assert.equal(result.batteryCount, 2);
  assert.equal(result.requiredAh, 391); assert.equal(result.battery.ah, 400);
});
test('capacity shortfall uses largest compatible battery, matching reference', () => {
  const { result } = run({ geyser: 1 }, 12);
  assert.equal(result.requiredAh, 1563); assert.equal(result.battery.ah, 400);
  assert.equal(result.achievedBackupHours, 3.1);
});
test('excessive load returns oversized and no invented product', () => {
  const { result } = run({ geyser: 10 });
  assert.equal(result.oversized, true); assert.equal(result.inverter, null); assert.equal(result.battery, null);
});
