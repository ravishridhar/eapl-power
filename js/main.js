const menuButton = document.querySelector('#menuButton');
const mobileMenu = document.querySelector('#mobileMenu');
const menuOverlay = document.querySelector('#menuOverlay');
const menuClose = document.querySelector('#menuClose');

const listingSizeButton = document.querySelector('.listing-hero .btn');
if (listingSizeButton) listingSizeButton.textContent = 'Size My Interter';

if (document.body.classList.contains('listing-page')) {
  const desktopMenus = [
    ['Inverter Batteries', ['Tall Tubular Batteries', 'Short Tubular Batteries', 'Solar Batteries']],
    ['LithTec Combo', ['LithTec Home UPS', 'Lithium Batteries', 'Complete Combo Systems']],
  ];

  document.querySelectorAll('.nav-glass .nav-item').forEach((item) => {
    if (item.querySelector('.nav-dropdown')) return;
    const label = item.querySelector('.nav-trigger')?.textContent.trim();
    const menu = desktopMenus.find(([name]) => name === label);
    if (!menu) return;
    const dropdown = document.createElement('div');
    dropdown.className = 'nav-dropdown';
    dropdown.innerHTML = menu[1].map((entry) => `<a href="index.html#range">${entry}</a>`).join('');
    item.append(dropdown);
  });

  const mobileNav = document.querySelector('.mobile-nav');
  const mobileProducts = [
    ['Home Inverters', ['View All Home Inverters', 'Sino Series', 'Electro Series'], ['home-inverters.html', '#sino', '#electro']],
    ['Inverter Batteries', ['Tall Tubular Batteries', 'Short Tubular Batteries', 'Solar Batteries'], ['index.html#range', 'index.html#range', 'index.html#range']],
    ['LithTec Combo', ['LithTec Home UPS', 'Lithium Batteries', 'Complete Combo Systems'], ['index.html#range', 'index.html#range', 'index.html#range']],
  ];

  mobileProducts.forEach(([label, entries, links]) => {
    const sourceLink = [...mobileNav.children].find((child) => child.tagName === 'A' && child.textContent.trim() === label);
    if (!sourceLink) return;
    const group = document.createElement('div');
    group.className = 'mobile-nav-group';
    group.innerHTML = `<button class="mobile-nav-trigger">${label}<img src="images/chevron.svg" alt=""></button><div class="mobile-submenu">${entries.map((entry, index) => `<a href="${links[index]}">${entry}</a>`).join('')}</div>`;
    sourceLink.replaceWith(group);
  });
}

const formatCount = (value) => String(value).padStart(2, '0');

const heroSlides = document.querySelectorAll('.hero-swiper .swiper-slide');
heroSlides.forEach((slide, index) => {
  if (index > 0) slide.innerHTML = heroSlides[0].innerHTML;
});

const heroSwiper = new Swiper('.hero-swiper', {
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
if (rangeProducts) {
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
