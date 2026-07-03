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

// sur mobile, l'accordéon ouvert par défaut prend tout l'écran : on le referme
if (window.matchMedia('(max-width: 780px)').matches) {
  document.querySelectorAll('details.pillar[open]').forEach(d => d.removeAttribute('open'));
}

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

// envoi du formulaire de contact en AJAX (reste sur le site, pas de redirection Formspree)
const contactForm = document.querySelector('.contact-form');
if (contactForm) {
  const formStatus = contactForm.querySelector('#formStatus');
  const submitBtn = contactForm.querySelector('button[type="submit"]');

  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const honeypot = contactForm.querySelector('[name="_gotcha"]');
    if (honeypot && honeypot.value) { return; }

    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Envoi en cours...'; }
    if (formStatus) { formStatus.textContent = ''; formStatus.className = 'form-status'; }

    try {
      const response = await fetch(contactForm.action, {
        method: 'POST',
        body: new FormData(contactForm),
        headers: { 'Accept': 'application/json' }
      });

      if (response.ok) {
        contactForm.reset();
        if (formStatus) {
          formStatus.textContent = 'Message envoyé, merci ! Je reviens vers vous sous 24h.';
          formStatus.classList.add('is-success');
        }
      } else {
        const data = await response.json().catch(() => null);
        const message = data && data.errors && data.errors.length
          ? data.errors.map(err => err.message).join(', ')
          : "Une erreur est survenue, réessayez ou contactez-moi directement.";
        if (formStatus) { formStatus.textContent = message; formStatus.classList.add('is-error'); }
      }
    } catch (err) {
      if (formStatus) {
        formStatus.textContent = "Connexion impossible, réessayez ou contactez-moi directement.";
        formStatus.classList.add('is-error');
      }
    } finally {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Envoyer le message'; }
    }
  });
}

// titre du hero : chaque mot arrive en cascade, flou qui se dissipe + remontee
function fadeInWords(el){
  const finalText = el.dataset.text || el.textContent;
  if (reduceMotion) { el.textContent = finalText; return; }
  const words = finalText.split(' ');
  el.textContent = '';
  words.forEach((word, i) => {
    const span = document.createElement('span');
    span.textContent = word;
    span.style.display = 'inline-block';
    span.style.opacity = '0';
    span.style.filter = 'blur(8px)';
    span.style.transform = 'translateY(18px)';
    span.style.transition = 'opacity .6s cubic-bezier(.2,.8,.2,1), transform .6s cubic-bezier(.2,.8,.2,1), filter .6s ease';
    span.style.transitionDelay = (0.15 + i * 0.08) + 's';
    el.appendChild(span);
    if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
    requestAnimationFrame(() => requestAnimationFrame(() => {
      span.style.opacity = '1';
      span.style.filter = 'blur(0)';
      span.style.transform = 'translateY(0)';
    }));
  });
}
document.querySelectorAll('.scramble').forEach(el => {
  el.dataset.text = el.textContent;
  fadeInWords(el);
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
