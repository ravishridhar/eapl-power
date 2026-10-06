// Match the reference calculator's rounding, product order and capacity fallback.
(function (root) {
  function calculateLoad(quantities, data) {
    const items = data.appliances.filter(item => (quantities[item.id] || 0) > 0)
      .map(item => ({ id: item.id, name: item.name, qty: quantities[item.id], watts: item.watts, total: quantities[item.id] * item.watts }));
    const totalWatts = items.reduce((sum, item) => sum + item.total, 0);
    return { totalWatts, requiredVA: Math.round(totalWatts / 0.8), items };
  }

  function recommend(load, hours, wave, chemistry, data) {
    const empty = { inverter: null, battery: null, batteryCount: 0, requiredAh: 0, achievedBackupHours: 0, oversized: false };
    if (load.totalWatts <= 0) return empty;
    const inverter = data.inverters.filter(item => item.wave === wave)
      .filter(item => chemistry === 'Lithium' ? item.lithium : !item.lithium)
      .sort((a, b) => a.va - b.va).find(item => item.va >= load.requiredVA);
    if (!inverter) return { ...empty, oversized: true };
    const voltage = inverter.systemVoltage;
    const requiredAh = Math.ceil(load.totalWatts * hours / (voltage * 0.8 * 0.8));
    const unitVoltage = item => item.chemistry === 'Lithium'
      ? Math.round(item.unitVoltage / 12) * 12 : Math.round(item.unitVoltage);
    const batteries = data.batteries.filter(item => item.chemistry === chemistry)
      .filter(item => unitVoltage(item) > 0 && voltage % unitVoltage(item) === 0)
      .sort((a, b) => a.ah - b.ah || b.warrantyMonths - a.warrantyMonths);
    const battery = batteries.find(item => item.ah >= requiredAh) || batteries[batteries.length - 1];
    if (!battery) return { ...empty, inverter, requiredAh };
    return {
      inverter, battery, requiredAh,
      batteryCount: Math.max(1, Math.round(voltage / unitVoltage(battery))),
      achievedBackupHours: Math.round(battery.ah * voltage * 0.8 * 0.8 / load.totalWatts * 10) / 10,
      oversized: false,
    };
  }
  const logic = { calculateLoad, recommend };
  if (typeof module !== 'undefined' && module.exports) module.exports = logic;
  else root.eaplCalculatorLogic = logic;
})(typeof window !== 'undefined' ? window : globalThis);
