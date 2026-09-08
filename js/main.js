const menuButton = document.querySelector('#menuButton');
const mobileMenu = document.querySelector('#mobileMenu');

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

menuButton?.addEventListener('click', () => {
  const open = mobileMenu.classList.toggle('hidden') === false;
  menuButton.setAttribute('aria-expanded', String(open));
});

mobileMenu?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => mobileMenu.classList.add('hidden'));
});

document.querySelector('#enquiryForm')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const status = document.querySelector('#formStatus');
  status.textContent = 'Thank you. Our team will contact you shortly.';
  status.classList.remove('hidden');
  event.currentTarget.reset();
});
