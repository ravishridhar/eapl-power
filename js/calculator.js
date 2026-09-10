const applianceCards = document.querySelectorAll('.appliance');
const applianceGrid = document.querySelector('.appliance-grid');
const categories = ['Lighting & Fans', 'Kitchen', 'Entertainment', 'Cooling & Heating', 'Utility'];
applianceCards.forEach(card => { card.dataset.category = categories[0]; });
const additionalAppliances = {
  Kitchen: [['Refrigerator', 200], ['Mixer Grinder', 500], ['Microwave', 1200]],
  Entertainment: [['LED TV', 60], ['Set-top Box', 20], ['Wi-Fi Router', 15]],
  'Cooling & Heating': [['Air Cooler', 200], ['Air Conditioner', 1500], ['Room Heater', 2000]],
  Utility: [['Laptop', 65], ['Desktop Computer', 200], ['Washing Machine', 500]]
};
Object.entries(additionalAppliances).forEach(([category, appliances]) => {
  appliances.forEach(([name, watts]) => {
    const card = applianceCards[0].cloneNode(true);
    card.dataset.category = category;
    card.dataset.watts = watts;
    card.hidden = true;
    card.querySelector('b').textContent = name;
    card.querySelector('small').textContent = `${watts} W`;
    card.querySelector('.plus').setAttribute('aria-label', `Add ${name}`);
    card.querySelector('.minus').setAttribute('aria-label', `Remove ${name}`);
    applianceGrid.append(card);
  });
});
const allApplianceCards = applianceGrid.querySelectorAll('.appliance');
const hoursInput = document.querySelector('#backupHours');

function updateCalculator() {
  let watts = 0;
  allApplianceCards.forEach((card) => {
    watts += Number(card.dataset.watts) * Number(card.querySelector('output').value || 0);
  });
  const hours = Number(hoursInput.value);
  const va = watts ? Math.ceil((watts * 1.25) / 50) * 50 : 0;
  const wave = document.querySelector('[name="wave"]:checked').value;
  const battery = document.querySelector('[name="battery"]:checked').value;
  document.querySelector('#hoursValue').textContent = hours;
  document.querySelector('#resultWatts').innerHTML = `${watts}<small>W</small>`;
  document.querySelector('#resultVa').textContent = `${va} VA`;
  document.querySelector('#resultProduct').textContent = watts ? `${va} VA ${wave} Home UPS with ${battery} battery` : 'Add appliances to see your recommended Eastman setup.';
  document.querySelector('#formLoad').textContent = `${watts} W`;
  document.querySelector('#formVa').textContent = `${va} VA`;
  document.querySelector('#formHours').textContent = `${hours} hrs`;
  document.querySelector('#formWave').textContent = wave;
  document.querySelector('#formBattery').textContent = battery;
}

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

document.querySelector('#calculatorForm').addEventListener('submit', (event) => {
  event.preventDefault();
  document.querySelector('#calculatorStatus').textContent = 'Thank you. Your calculator result has been submitted.';
});

updateCalculator();
