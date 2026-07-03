const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', isOpen);
  });
  navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    navLinks.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  }));
}

const scrollBar = document.getElementById('scrollBar');
function updateScrollProgress(){
  if (!scrollBar) return;
  const h = document.documentElement;
  const scrolled = (h.scrollTop) / (h.scrollHeight - h.clientHeight) * 100;
  scrollBar.style.width = scrolled + '%';
}
window.addEventListener('scroll', updateScrollProgress, {passive:true});
updateScrollProgress();

const heroMark = document.getElementById('heroMark');
function updateParallax(){
  if (reduceMotion || !heroMark) return;
  const y = Math.min(window.scrollY, 600) * 0.12;
  heroMark.style.transform = 'translateY(calc(-50% + ' + y + 'px))';
}
window.addEventListener('scroll', updateParallax, {passive:true});

const revealEls = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  revealEls.forEach(el => obs.observe(el));
} else {
  revealEls.forEach(el => el.classList.add('is-visible'));
}

const counters = document.querySelectorAll('[data-count]');
const countObs = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const target = parseInt(el.dataset.count, 10);
      const suffix = el.dataset.suffix || '';
      if (reduceMotion) { el.textContent = target + suffix; countObs.unobserve(el); return; }
      let cur = 0;
      const step = Math.max(1, Math.round(target / 40));
      const tick = () => {
        cur += step;
        if (cur >= target) { el.textContent = target + suffix; }
        else { el.textContent = cur + suffix; requestAnimationFrame(tick); }
      };
      tick();
      countObs.unobserve(el);
    }
  });
}, { threshold: 0.4 });
counters.forEach(el => countObs.observe(el));

if (!reduceMotion) {
  document.querySelectorAll('.tilt').forEach(card => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = 'perspective(900px) rotateX(' + (-py * 8).toFixed(2) + 'deg) rotateY(' + (px * 8).toFixed(2) + 'deg) translateY(-2px)';
    });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; });
  });
}

document.querySelectorAll('a[href*="#pro"], a[href*="#particuliers"]').forEach(a => {
  a.addEventListener('click', () => {
    const select = document.getElementById('sujet');
    if (!select) return;
    const target = a.getAttribute('href');
    if (target.indexOf('#pro') !== -1) select.value = 'pro-securite';
    if (target.indexOf('#particuliers') !== -1) select.value = 'particulier-diagnostic';
  });
});

// retour en arrière intelligent (pas de redémarrage en haut de page)
document.querySelectorAll('.breadcrumb').forEach(link => {
  link.addEventListener('click', (e) => {
    if (window.history.length > 1 && document.referrer && document.referrer.indexOf(window.location.host) !== -1) {
      e.preventDefault();
      window.history.back();
    }
  });
});

// anti-spam formulaire de contact : honeypot (le filtrage réel se fait côté Formspree)
const contactForm = document.querySelector('.contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    const honeypot = contactForm.querySelector('[name="_gotcha"]');
    if (honeypot && honeypot.value) { e.preventDefault(); return; }
  });
}

// effet "décryptage" sur le titre du hero : les caractères défilent avant de se fixer
const SCRAMBLE_CHARS = '!<>-_\\/[]{}—=+*^?#01';
function scrambleReveal(el){
  const finalText = el.dataset.text || el.textContent;
  if (reduceMotion) { el.textContent = finalText; return; }
  const chars = finalText.split('');
  let frame = 0;
  const revealedUpTo = () => Math.floor(frame / 2.6);
  function tick(){
    let out = '';
    const upTo = revealedUpTo();
    for (let i = 0; i < chars.length; i++) {
      if (chars[i] === ' ') { out += ' '; continue; }
      if (i < upTo) { out += chars[i]; }
      else { out += SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]; }
    }
    el.textContent = out;
    frame++;
    if (upTo < chars.length) { requestAnimationFrame(tick); }
    else { el.textContent = finalText; }
  }
  tick();
}
document.querySelectorAll('.scramble').forEach(el => {
  el.dataset.text = el.textContent;
  scrambleReveal(el);
});

// boutons magnétiques : suivent légèrement le curseur
if (!reduceMotion && window.matchMedia('(pointer: fine)').matches) {
  document.querySelectorAll('.magnetic').forEach(btn => {
    btn.addEventListener('pointermove', (e) => {
      const r = btn.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) * 0.3;
      const y = (e.clientY - r.top - r.height / 2) * 0.3;
      btn.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) scale(1.04)';
    });
    btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
  });
}
