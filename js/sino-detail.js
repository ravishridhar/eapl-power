// Accessible pagination for the responsive Sino benefits carousel.
(() => {
  const track = document.querySelector('.benefit-grid');
  const cards = [...track.querySelectorAll('article')];
  const pagination = document.querySelector('.benefit-pagination');
  const previous = document.querySelector('.benefit-prev');
  const next = document.querySelector('.benefit-next');
  const current = document.querySelector('.benefit-count strong');
  const step = () => cards[0].offsetWidth + parseFloat(getComputedStyle(track).gap || 0);
  pagination.replaceChildren(...cards.map((card, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-label', `Show benefit ${index + 1}: ${card.textContent.trim()}`);
    button.addEventListener('click', () => track.scrollTo({left: index * step(), behavior: 'smooth'}));
    return button;
  }));
  function update() {
    const index = Math.min(cards.length - 1, Math.round(track.scrollLeft / step()));
    current.textContent = String(index + 1).padStart(2, '0');
    [...pagination.children].forEach((button, i) => {
      button.classList.toggle('active', i === index);
      button.setAttribute('aria-current', String(i === index));
    });
    previous.disabled = track.scrollLeft < 1;
    next.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 1;
  }
  previous.addEventListener('click', () => track.scrollBy({left: -step(), behavior: 'smooth'}));
  next.addEventListener('click', () => track.scrollBy({left: step(), behavior: 'smooth'}));
  track.addEventListener('scroll', update, {passive: true});
  window.addEventListener('resize', update);
  update();
})();
