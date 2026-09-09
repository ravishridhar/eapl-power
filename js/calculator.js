const applianceCards = document.querySelectorAll('.appliance');
const hoursInput = document.querySelector('#backupHours');

function updateCalculator() {
  let watts = 0;
  applianceCards.forEach((card) => {
    watts += Number(card.dataset.watts) * Number(card.querySelector('output').value || 0);
  });
  const hours = Number(hoursInput.value);
  const va = watts ? Math.ceil((watts * 1.25) / 50) * 50 : 0;
  const wave = document.querySelector('[name="wave"]:checked').value;
  const battery = document.querySelector('[name="battery"]:checked').value;
  document.querySelector('#hoursValue').textContent = hours;
  document.querySelector('#resultHours').innerHTML = `${hours}<small>hrs</small>`;
  document.querySelector('#resultLoad').textContent = `${watts} W required`;
  document.querySelector('#resultProduct').textContent = watts ? `${va} VA ${wave} Home UPS with ${battery} battery` : 'Add appliances to see your recommendation';
  document.querySelector('#formLoad').textContent = `${watts} W`;
  document.querySelector('#formVa').textContent = `${va} VA`;
  document.querySelector('#formHours').textContent = `${hours} hrs`;
  document.querySelector('#formWave').textContent = wave;
  document.querySelector('#formBattery').textContent = battery;
}

applianceCards.forEach((card) => {
  const output = card.querySelector('output');
  card.querySelector('.plus').addEventListener('click', () => { output.value = Number(output.value || 0) + 1; output.textContent = output.value; updateCalculator(); });
  card.querySelector('.minus').addEventListener('click', () => { output.value = Math.max(0, Number(output.value || 0) - 1); output.textContent = output.value; updateCalculator(); });
});

hoursInput.addEventListener('input', updateCalculator);
document.querySelectorAll('[name="wave"], [name="battery"]').forEach((input) => input.addEventListener('change', updateCalculator));
document.querySelectorAll('.category-tabs button').forEach((button) => button.addEventListener('click', () => {
  document.querySelectorAll('.category-tabs button').forEach((item) => item.classList.remove('active'));
  button.classList.add('active');
}));

document.querySelector('#calculatorForm').addEventListener('submit', (event) => {
  event.preventDefault();
  document.querySelector('#calculatorStatus').textContent = 'Thank you. Your calculator result has been submitted.';
});

updateCalculator();
