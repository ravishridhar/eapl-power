const menuButton = document.querySelector('#menuButton');
const mobileMenu = document.querySelector('#mobileMenu');
const menuOverlay = document.querySelector('#menuOverlay');
const menuClose = document.querySelector('#menuClose');

// Discourage casual access to the context menu and browser developer tools.
document.addEventListener('contextmenu', (event) => event.preventDefault());
document.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  const windowsDevTools = event.ctrlKey && event.shiftKey && ['i', 'j', 'c'].includes(key);
  const macDevTools = event.metaKey && event.altKey && ['i', 'j', 'c', 'u'].includes(key);
  const viewSource = event.ctrlKey && key === 'u';
  if (event.key === 'F12' || windowsDevTools || macDevTools || viewSource) {
    event.preventDefault();
    event.stopPropagation();
  }
}, true);

const listingSizeButton = document.querySelector('.listing-hero .btn');
if (listingSizeButton) listingSizeButton.textContent = 'Size My Interter';

// Share the complete product navigation across landing and detail pages.
const siteRoot = new URL('../', document.currentScript.src);
const productMenus = [
  { label: 'Home Inverters', path: 'home-inverters/', entries: [
    ['Sino Series', 'home-inverters/sino-series/'],
    ['Electro Series', 'home-inverters/electro-series/'],
    ['Omega Series', 'home-inverters/omega-series/'],
    ['Sigma Series', 'home-inverters/sigma-series/'],
    ['SinoSpark Series', 'home-inverters/sinospark-series/'],
    ['Wattrix Series', 'home-inverters/wattrix-series/'],
  ] },
  { label: 'Inverter Batteries', path: 'inverter-batteries/', entries: [
    ['Regular Series', 'inverter-batteries/regular-series/'],
    ['Smart Series', 'inverter-batteries/smart-series/'],
    ['CitiMax Series', 'inverter-batteries/citimax-series/'],
  ] },
  { label: 'LithTec Combo', path: 'lithtec-combo/', entries: [
    ['LithTec Combo', 'lithtec-combo/complete-combo/'],
    ['Lithium Battery', 'lithtec-combo/lithium-battery/'],
    ['Sine Wave Home UPS', 'lithtec-combo/sine-wave-home-ups/'],
    ['Square Wave Home UPS', 'lithtec-combo/square-wave-home-ups/'],
  ] },
];
const menuLinks = (menu) => menu.entries
  .map(([label, path]) => `<a href="${new URL(path, siteRoot).href}">${label}</a>`).join('');
const desktopNav = document.querySelector('.merged-header > .wrap > nav');
if (desktopNav) {
  productMenus.forEach((menu) => {
    let item = [...desktopNav.querySelectorAll('.nav-item')].find(node => node.querySelector('.nav-trigger')?.textContent.trim() === menu.label);
    if (!item) {
      item = document.createElement('div');
      item.className = 'nav-item';
      desktopNav.append(item);
    }
    const active = window.location.pathname.includes(`/${menu.path}`) ? ' !text-yellow' : '';
    item.innerHTML = `<a class="nav-trigger${active}" href="${new URL(menu.path, siteRoot).href}">${menu.label}<img src="${new URL('images/chevron.svg', siteRoot).href}" alt=""></a><div class="nav-dropdown">${menuLinks(menu)}</div>`;
  });
}
const mobileProductNav = document.querySelector('.mobile-nav');
if (mobileProductNav) {
  productMenus.forEach((menu, index) => {
    const existing = [...mobileProductNav.children].find(node => (node.querySelector('.mobile-nav-trigger')?.textContent || node.textContent).trim() === menu.label);
    const group = document.createElement('div');
    group.className = 'mobile-nav-group';
    group.innerHTML = `<button type="button" class="mobile-nav-trigger" aria-expanded="false" aria-controls="product-menu-${index}">${menu.label}<img src="${new URL('images/chevron.svg', siteRoot).href}" alt=""></button><div id="product-menu-${index}" class="mobile-submenu">${menuLinks(menu)}</div>`;
    if (existing) existing.replaceWith(group);
    else mobileProductNav.append(group);
  });
}

const formatCount = (value) => String(value).padStart(2, '0');

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
  rangeProducts.classList.add('swiper');
  const wrapper = document.createElement('div');
  wrapper.className = 'swiper-wrapper';
  cards.forEach((card) => {
    card.classList.add('swiper-slide');
    wrapper.append(card);
  });
  rangeProducts.append(wrapper);

  new Swiper(rangeProducts, {
    loop: false,
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
      if (item !== group) { item.classList.remove('is-open'); item.querySelector('.mobile-nav-trigger')?.setAttribute('aria-expanded', 'false'); }
    });
    group.classList.toggle('is-open');
    trigger.setAttribute('aria-expanded', String(group.classList.contains('is-open')));
  });
});

const benefitTrack = document.querySelector('.benefit-grid');
if (benefitTrack && !document.body.classList.contains('sino-page')) {
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

const sendEaplFormEmail = async (form, { source, extra = {} } = {}) => {
  const config = window.EAPL_EMAIL_CONFIG;
  const requiredConfig = [config?.serviceId, config?.templateId, config?.publicKey];
  if (!config || requiredConfig.some((value) => !value || value.startsWith('YOUR_'))) {
    throw new Error('Email service is not configured yet.');
  }

  const formValues = Object.fromEntries(new FormData(form).entries());
  const submittedValues = { ...formValues, ...extra };
  const message = Object.entries(submittedValues)
    .map(([key, value]) => `${key.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase())}: ${value || '—'}`)
    .join('\n');

  const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id: config.serviceId,
      template_id: config.templateId,
      user_id: config.publicKey,
      template_params: {
        to_email: config.toEmail,
        from_email: config.fromEmail,
        reply_to: formValues.email || config.fromEmail,
        subject: `EAPL website enquiry — ${source}`,
        form_source: source,
        message,
        ...submittedValues,
      },
    }),
  });

  if (!response.ok) throw new Error((await response.text()) || 'Unable to send email.');
};

window.sendEaplFormEmail = sendEaplFormEmail;

document.querySelector('#enquiryForm')?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const status = document.querySelector('#formStatus');
  status.classList.remove('hidden');
  const button = form.querySelector('[type="submit"]');
  const buttonLabel = button.textContent;
  button.disabled = true;
  button.textContent = 'Sending…';
  status.textContent = 'Sending your enquiry…';
  try {
    await sendEaplFormEmail(form, { source: 'Home enquiry form' });
    status.textContent = 'Thank you. Your enquiry has been sent successfully.';
    form.reset();
  } catch (error) {
    console.error('Email submission failed:', error);
    status.textContent = error.message === 'Email service is not configured yet.'
      ? 'Email service details need to be added before this form can send.'
      : 'We could not send your enquiry. Please try again.';
  } finally {
    button.disabled = false;
    button.textContent = buttonLabel;
  }
});

document.querySelector('#partnerForm')?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const status = document.querySelector('#partnerFormStatus');
  const button = form.querySelector('[type="submit"]');
  const buttonLabel = button.textContent;
  button.disabled = true;
  button.textContent = 'Sending…';
  status.textContent = 'Sending your application…';
  try {
    await sendEaplFormEmail(form, { source: 'Partner application form' });
    status.textContent = 'Thank you. Your partner application has been sent successfully.';
    form.reset();
  } catch (error) {
    console.error('Email submission failed:', error);
    status.textContent = error.message === 'Email service is not configured yet.'
      ? 'Email service details need to be added before this form can send.'
      : 'We could not send your application. Please try again.';
  } finally {
    button.disabled = false;
    button.textContent = buttonLabel;
  }
});

// Keep the header compact after scrolling, without shifting the page content.
const siteHeader = document.querySelector('.merged-header');
if (siteHeader) {
  const topNavigation = siteHeader.querySelector('.top-strip');
  let compactHeader = false;
  const updateHeader = () => {
    const nextCompact = compactHeader ? window.scrollY > 8 : window.scrollY > 80;
    if (nextCompact === compactHeader) return;
    compactHeader = nextCompact;
    siteHeader.classList.toggle('is-compact', compactHeader);
    if (topNavigation) topNavigation.inert = compactHeader;
  };
  window.addEventListener('scroll', updateHeader, { passive: true });
  window.addEventListener('pageshow', updateHeader);
  updateHeader();
}
