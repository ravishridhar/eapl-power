const calculatorData = window.eaplCalculatorData;
const calculatorLogic = window.eaplCalculatorLogic;
const applianceGrid = document.querySelector('.appliance-grid');
const applianceTemplate = applianceGrid.querySelector('.appliance');
const categories = calculatorData.categories;
applianceGrid.replaceChildren();
calculatorData.appliances.forEach(appliance => {
  const card = applianceTemplate.cloneNode(true);
  card.dataset.id = appliance.id;
  card.dataset.category = appliance.category;
  card.dataset.watts = appliance.watts;
  card.hidden = appliance.category !== categories[0];
  card.querySelector('b').textContent = appliance.name;
  card.querySelector('small').textContent = `${appliance.watts} W${appliance.inductive ? ' inductive' : ''}`;
  card.querySelector('.plus').setAttribute('aria-label', `Add ${appliance.name}`);
  card.querySelector('.minus').setAttribute('aria-label', `Remove ${appliance.name}`);
  applianceGrid.append(card);
});
let currentLoad;
let currentRecommendation;
const allApplianceCards = applianceGrid.querySelectorAll('.appliance');
const hoursInput = document.querySelector('#backupHours');
const hoursSlider = document.createElement('span');
hoursSlider.className = 'hours-slider';
const hoursThumb = document.createElement('span');
hoursThumb.className = 'hours-slider-thumb';
hoursThumb.setAttribute('aria-hidden', 'true');
hoursInput.before(hoursSlider);
hoursSlider.append(hoursInput, hoursThumb);


function updateCalculator() {
  const quantities = Object.fromEntries([...allApplianceCards].map(card => [card.dataset.id, Number(card.querySelector('output').value || 0)]));
  const hours = Number(hoursInput.value);
  const progress = (hours - Number(hoursInput.min)) / (Number(hoursInput.max) - Number(hoursInput.min));
  hoursSlider.style.setProperty('--thumb-position', `calc(${progress * 100}% - ${progress * 31}px)`);
  const wave = document.querySelector('[name="wave"]:checked').value;
  const battery = document.querySelector('[name="battery"]:checked').value;
  currentLoad = calculatorLogic.calculateLoad(quantities, calculatorData);
  currentRecommendation = calculatorLogic.recommend(currentLoad, hours, wave, battery, calculatorData);
  const result = currentRecommendation;
  document.querySelector('#hoursValue').textContent = hours;
  document.querySelector('#resultWatts').innerHTML = `${currentLoad.totalWatts}<small>W</small>`;
  document.querySelector('#resultVa').textContent = `${currentLoad.requiredVA} VA`;
  document.querySelector('#resultProduct').textContent = !currentLoad.items.length
    ? 'Add appliances to see your recommended Eastman setup.'
    : result.oversized || !result.inverter
      ? 'This load exceeds the Home UPS range. Please contact Eastman for an industrial solution.' : '';
  document.querySelector('#resultProduct').hidden = currentLoad.items.length > 0 && !!result.inverter;
  const selected = document.querySelector('#selectedAppliances');
  selected.replaceChildren(...currentLoad.items.map(item => {
    const row = document.createElement('li');
    const name = document.createElement('span');
    name.textContent = `${item.name} × ${item.qty}`;
    const watts = document.createElement('strong'); watts.textContent = `${item.total} W`;
    row.append(name, watts); return row;
  }));
  document.querySelector('#recommendationDetails').hidden = !result.inverter;
  document.querySelector('#batteryRecommendation').hidden = !result.battery;
  document.querySelector('#recommendedUps').textContent = result.inverter?.name || '';
  document.querySelector('#recommendedUpsMeta').textContent = result.inverter ? `${result.inverter.va} VA · ${result.inverter.wave} · ${result.inverter.warrantyMonths}-month warranty` : '';
  document.querySelector('#recommendedBattery').textContent = result.battery ? `${result.batteryCount} × ${result.battery.name}` : '';
  document.querySelector('#recommendedBatteryMeta').textContent = result.battery ? `${result.battery.ah} Ah ${result.battery.series} · ${result.battery.warrantyMonths}-month warranty` : '';
  document.querySelector('#estimatedBackup').textContent = `${result.achievedBackupHours} hrs`;
  document.querySelector('#estimatedBackupMeta').textContent = result.inverter ? `Needs ~${result.requiredAh} Ah at ${result.inverter.systemVoltage}V for ${hours} hr target` : '';
  document.querySelector('#formLoad').textContent = `${currentLoad.totalWatts} W`;
  document.querySelector('#formVa').textContent = `${currentLoad.requiredVA} VA`;
  document.querySelector('#formHours').textContent = `${hours} hrs`;
  document.querySelector('#formWave').textContent = wave;
  document.querySelector('#formBattery').textContent = battery;
  const selectedCount = currentLoad.items.reduce((sum, item) => sum + item.qty, 0);
  document.querySelector('#mobileLoad').textContent = `${currentLoad.totalWatts} W`;
  document.querySelector('#mobileSelection').textContent = selectedCount ? `${selectedCount} appliance${selectedCount === 1 ? '' : 's'} · ${currentLoad.requiredVA} VA` : 'Add your appliances';
  allApplianceCards.forEach(card => {
    const quantity = Number(card.querySelector('output').value || 0);
    card.classList.toggle('is-selected', quantity > 0);
    card.querySelector('.minus').disabled = quantity === 0;
  });
  document.querySelectorAll('.backup-presets button').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.hours) === hours)));
}

// Quick backup choices retain the slider for any duration between 1 and 12 hours.
const backupPresets = document.createElement('div');
backupPresets.className = 'backup-presets';
backupPresets.setAttribute('role', 'group');
backupPresets.setAttribute('aria-label', 'Quick backup duration');
[1, 3, 6, 12].forEach(hours => {
  const button = document.createElement('button');
  button.type = 'button'; button.dataset.hours = hours; button.textContent = `${hours} hr${hours === 1 ? '' : 's'}`;
  button.addEventListener('click', () => { hoursInput.value = hours; updateCalculator(); });
  backupPresets.append(button);
});
document.querySelector('.backup-panel > label').after(backupPresets);

const mobileSummary = document.querySelector('#mobileCalculatorSummary');
const mobileNext = document.querySelector('#mobileCalculatorNext');
const backupPanel = document.querySelector('#backup-preferences');
const recommendationPanel = document.querySelector('#calculator-recommendation');
let mobileNextTarget = backupPanel;
function updateMobileSummary() {
  const applianceRect = document.querySelector('.appliance-panel').getBoundingClientRect();
  const recommendationRect = recommendationPanel.getBoundingClientRect();
  const active = window.matchMedia('(max-width: 600px)').matches && applianceRect.top < window.innerHeight - 100 && recommendationRect.top > window.innerHeight - 100;
  mobileSummary.hidden = !active;
  document.body.classList.toggle('mobile-calculator-active', active);
  const choosingBackup = backupPanel.getBoundingClientRect().top < window.innerHeight * 0.5;
  mobileNextTarget = choosingBackup ? recommendationPanel : backupPanel;
  mobileNext.firstChild.textContent = choosingBackup ? 'View result ' : 'Set backup ';
}
mobileNext.addEventListener('click', () => {
  mobileNextTarget.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
});
let summaryFrame;
function scheduleMobileSummary() {
  if (summaryFrame) return;
  summaryFrame = requestAnimationFrame(() => { summaryFrame = null; updateMobileSummary(); });
}
window.addEventListener('scroll', scheduleMobileSummary, { passive: true });
window.addEventListener('resize', scheduleMobileSummary);
updateMobileSummary();

document.querySelector('#resetSelection').addEventListener('click', () => {
  allApplianceCards.forEach(card => { card.querySelector('output').value = 0; card.querySelector('output').textContent = '0'; });
  updateCalculator();
});

allApplianceCards.forEach((card) => {
  const output = card.querySelector('output');
  card.querySelector('.plus').addEventListener('click', () => { output.value = Number(output.value || 0) + 1; output.textContent = output.value; updateCalculator(); });
  card.querySelector('.minus').addEventListener('click', () => { output.value = Math.max(0, Number(output.value || 0) - 1); output.textContent = output.value; updateCalculator(); });
});

document.querySelectorAll('.category-tabs button').forEach(button => button.setAttribute('aria-pressed', String(button.classList.contains('active'))));
hoursInput.addEventListener('input', updateCalculator);
document.querySelectorAll('[name="wave"], [name="battery"]').forEach((input) => input.addEventListener('change', updateCalculator));
document.querySelectorAll('.category-tabs button').forEach((button) => button.addEventListener('click', () => {
  document.querySelectorAll('.category-tabs button').forEach((item) => item.classList.remove('active'));
  button.classList.add('active');
  document.querySelectorAll('.category-tabs button').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  allApplianceCards.forEach(card => { card.hidden = card.dataset.category !== button.textContent.trim(); });
}));

document.querySelector('#calculatorForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const status = document.querySelector('#calculatorStatus');
  const button = form.querySelector('[type="submit"]');
  const buttonLabel = button.textContent;
  button.disabled = true;
  button.textContent = 'Sending…';
  status.textContent = 'Sending your calculator result…';
  try {
    await window.sendEaplFormEmail(form, {
      source: 'Load calculator enquiry',
      extra: {
        calculatedLoad: document.querySelector('#formLoad').textContent,
        vaRequired: document.querySelector('#formVa').textContent,
        backupTime: document.querySelector('#formHours').textContent,
        waveform: document.querySelector('#formWave').textContent,
        selectedAppliances: currentLoad.items.map(item => `${item.name} × ${item.qty} (${item.total} W)`).join(', '),
        recommendedHomeUps: currentRecommendation.inverter?.name || 'No matching Home UPS',
        recommendedBattery: currentRecommendation.battery ? `${currentRecommendation.batteryCount} × ${currentRecommendation.battery.name}` : 'No matching battery',
        requiredBatteryAh: currentRecommendation.requiredAh,
        estimatedBackupHours: currentRecommendation.achievedBackupHours,
        batteryPreference: document.querySelector('#formBattery').textContent,
      },
    });
    status.textContent = 'Thank you. Your calculator result has been sent successfully.';
    form.reset();
    updateCalculator();
  } catch (error) {
    console.error('Email submission failed:', error);
    status.textContent = error.message === 'Email service is not configured yet.'
      ? 'Email service details need to be added before this form can send.'
      : 'We could not send your result. Please try again.';
  } finally {
    button.disabled = false;
    button.textContent = buttonLabel;
  }
});

updateCalculator();
