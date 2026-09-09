const menuButton = document.querySelector('#menuButton');
const mobileMenu = document.querySelector('#mobileMenu');
const menuOverlay = document.querySelector('#menuOverlay');
const menuClose = document.querySelector('#menuClose');

const listingSizeButton = document.querySelector('.listing-hero .btn');
if (listingSizeButton) listingSizeButton.textContent = 'Size My Interter';

if (document.body.classList.contains('listing-page')) {
  const isBatteryPage = window.location.pathname.includes('inverter-batteries');
  const isLithtecPage = window.location.pathname.includes('lithtec-combo');
  const isHomeInverterPage = window.location.pathname.includes('home-inverters');
  const desktopMenus = [
    ['Home Inverters', ['Sino Series', 'Electro Series', 'Omega Series'], [isHomeInverterPage ? '#sino' : '../home-inverters/#sino', isHomeInverterPage ? '#electro' : '../home-inverters/#electro', isHomeInverterPage ? '#omega' : '../home-inverters/#omega']],
    ['Inverter Batteries', ['Regular Series', 'Smart Series', 'CitiMax Series'], [isBatteryPage ? '#regular' : '../inverter-batteries/#regular', isBatteryPage ? '#smart' : '../inverter-batteries/#smart', isBatteryPage ? '#citimax' : '../inverter-batteries/#citimax']],
    ['LithTec Combo', ['Lithium Battery', 'Complete Combo', 'Sine Wave Home UPS', 'Square Wave Home UPS'], [isLithtecPage ? '#lithium-battery' : '../lithtec-combo/#lithium-battery', isLithtecPage ? '#complete-combo' : '../lithtec-combo/#complete-combo', isLithtecPage ? '#sine-wave' : '../lithtec-combo/#sine-wave', isLithtecPage ? 'square-wave-home-ups/' : '../lithtec-combo/square-wave-home-ups/']],
  ];

  document.querySelectorAll('.nav-glass .nav-item').forEach((item) => {
    if (item.querySelector('.nav-dropdown')) return;
    const label = item.querySelector('.nav-trigger')?.textContent.trim();
    const menu = desktopMenus.find(([name]) => name === label);
    if (!menu) return;
    const dropdown = document.createElement('div');
    dropdown.className = 'nav-dropdown';
    dropdown.innerHTML = menu[1].map((entry, index) => `<a href="${menu[2][index]}">${entry}</a>`).join('');
    item.append(dropdown);
  });

  const mobileNav = document.querySelector('.mobile-nav');
  const mobileProducts = [
    ['Home Inverters', ['View All Home Inverters', 'Sino Series', 'Electro Series'], [isHomeInverterPage ? './' : '../home-inverters/', isHomeInverterPage ? '#sino' : '../home-inverters/#sino', isHomeInverterPage ? '#electro' : '../home-inverters/#electro']],
    ['Inverter Batteries', ['Regular Series', 'Smart Series', 'CitiMax Series'], [isBatteryPage ? '#regular' : '../inverter-batteries/', isBatteryPage ? '#smart' : '../inverter-batteries/#smart', isBatteryPage ? '#citimax' : '../inverter-batteries/#citimax']],
    ['LithTec Combo', ['Lithium Battery', 'Complete Combo', 'Sine Wave Home UPS', 'Square Wave Home UPS'], [isLithtecPage ? '#lithium-battery' : '../lithtec-combo/', isLithtecPage ? '#complete-combo' : '../lithtec-combo/#complete-combo', isLithtecPage ? '#sine-wave' : '../lithtec-combo/#sine-wave', isLithtecPage ? 'square-wave-home-ups/' : '../lithtec-combo/square-wave-home-ups/']],
  ];

  mobileProducts.forEach(([label, entries, links]) => {
    const sourceLink = [...mobileNav.children].find((child) => child.tagName === 'A' && child.textContent.trim() === label);
    if (!sourceLink) return;
    const group = document.createElement('div');
    group.className = 'mobile-nav-group';
    group.innerHTML = `<button class="mobile-nav-trigger">${label}<img src="../images/chevron.svg" alt=""></button><div class="mobile-submenu">${entries.map((entry, index) => `<a href="${links[index]}">${entry}</a>`).join('')}</div>`;
    sourceLink.replaceWith(group);
  });
}

if (document.body.classList.contains('product-detail-page')) {
  const mobileNav = document.querySelector('.mobile-nav');
  const sourceLink = [...mobileNav.children].find((child) => child.tagName === 'A' && child.textContent.trim() === 'LithTec Combo');
  if (sourceLink) {
    const group = document.createElement('div');
    group.className = 'mobile-nav-group';
    group.innerHTML = '<button class="mobile-nav-trigger">LithTec Combo<img src="../../images/chevron.svg" alt=""></button><div class="mobile-submenu"><a href="../#lithium-battery">Lithium Battery</a><a href="../#complete-combo">Complete Combo</a><a href="../#sine-wave">Sine Wave Home UPS</a><a href="./">Square Wave Home UPS</a></div>';
    sourceLink.replaceWith(group);
  }
}

const formatCount = (value) => String(value).padStart(2, '0');

const heroSlides = document.querySelectorAll('.hero-swiper .swiper-slide');
heroSlides.forEach((slide, index) => {
  if (index > 0) slide.innerHTML = heroSlides[0].innerHTML;
});

const heroElement = document.querySelector('.hero-swiper');
if (heroElement && typeof Swiper !== 'undefined') new Swiper(heroElement, {
  loop: true,
  speed: 700,
  autoplay: { delay: 5000, disableOnInteraction: false },
  pagination: { el: '.hero-pagination', clickable: true },
  navigation: { prevEl: '.hero-prev', nextEl: '.hero-next' },
  on: {
    realIndexChange(swiper) {
      document.querySelector('.hero-current').textContent = formatCount(swiper.realIndex + 1);
    },
  },
});

const rangeProducts = document.querySelector('.range-products');
if (rangeProducts && typeof Swiper !== 'undefined') {
  const cards = [...rangeProducts.children];
  const fifthCard = cards[0].cloneNode(true);
  rangeProducts.classList.add('swiper');
  const wrapper = document.createElement('div');
  wrapper.className = 'swiper-wrapper';
  [...cards, fifthCard].forEach((card) => {
    card.classList.add('swiper-slide');
    wrapper.append(card);
  });
  rangeProducts.append(wrapper);

  new Swiper(rangeProducts, {
    loop: true,
    speed: 550,
    spaceBetween: 25,
    slidesPerView: 'auto',
    pagination: { el: '.range-pagination', clickable: true },
    navigation: { prevEl: '.range-prev', nextEl: '.range-next' },
    on: {
      realIndexChange(swiper) {
        document.querySelector('.range-current').textContent = formatCount(swiper.realIndex + 1);
      },
    },
  });
}

const setMobileMenu = (open) => {
  mobileMenu?.classList.toggle('is-open', open);
  menuOverlay?.classList.toggle('is-open', open);
  document.body.classList.toggle('menu-open', open);
  menuButton?.setAttribute('aria-expanded', String(open));
  mobileMenu?.setAttribute('aria-hidden', String(!open));
  menuOverlay?.setAttribute('aria-hidden', String(!open));
};

menuButton?.addEventListener('click', () => setMobileMenu(true));
menuClose?.addEventListener('click', () => setMobileMenu(false));
menuOverlay?.addEventListener('click', () => setMobileMenu(false));

document.querySelectorAll('.mobile-nav-trigger').forEach((trigger) => {
  trigger.addEventListener('click', () => {
    const group = trigger.closest('.mobile-nav-group');
    document.querySelectorAll('.mobile-nav-group').forEach((item) => {
      if (item !== group) item.classList.remove('is-open');
    });
    group.classList.toggle('is-open');
  });
});

const benefitTrack = document.querySelector('.benefit-grid');
if (benefitTrack) {
  const benefitDots = [...document.querySelectorAll('.benefit-pagination i')];
  const benefitCurrent = document.querySelector('.benefit-count strong');
  const updateBenefits = () => {
    const step = benefitTrack.querySelector('article').offsetWidth + parseFloat(getComputedStyle(benefitTrack).gap || 0);
    const index = Math.min(benefitDots.length - 1, Math.round(benefitTrack.scrollLeft / step));
    benefitCurrent.textContent = formatCount(index + 1);
    benefitDots.forEach((dot, dotIndex) => dot.classList.toggle('active', dotIndex === index));
  };
  document.querySelector('.benefit-prev')?.addEventListener('click', () => benefitTrack.scrollBy({ left: -(benefitTrack.querySelector('article').offsetWidth + 30), behavior: 'smooth' }));
  document.querySelector('.benefit-next')?.addEventListener('click', () => benefitTrack.scrollBy({ left: benefitTrack.querySelector('article').offsetWidth + 30, behavior: 'smooth' }));
  benefitDots.forEach((dot, index) => dot.addEventListener('click', () => benefitTrack.scrollTo({ left: index * (benefitTrack.querySelector('article').offsetWidth + 30), behavior: 'smooth' })));
  benefitTrack.addEventListener('scroll', updateBenefits, { passive: true });
}

mobileMenu?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => setMobileMenu(false));
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') setMobileMenu(false);
});

document.querySelector('#enquiryForm')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const status = document.querySelector('#formStatus');
  status.textContent = 'Thank you. Our team will contact you shortly.';
  status.classList.remove('hidden');
  event.currentTarget.reset();
});
