/* ========================================
   VedTrim — Main Application JS
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize all modules
  Navigation.init();
  ScrollAnimations.init();
  BackToTop.init();
  ButtonEffects.init();
  updateAuthUI();
});

/* --- Navigation --- */
const Navigation = {
  init() {
    const toggle = document.querySelector('.mobile-toggle');
    const navLinks = document.querySelector('.nav-links');
    const overlay = document.querySelector('.mobile-overlay');

    if (toggle && navLinks) {
      toggle.addEventListener('click', () => {
        toggle.classList.toggle('active');
        navLinks.classList.toggle('active');
        if (overlay) overlay.classList.toggle('active');
        document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
      });

      if (overlay) {
        overlay.addEventListener('click', () => {
          toggle.classList.remove('active');
          navLinks.classList.remove('active');
          overlay.classList.remove('active');
          document.body.style.overflow = '';
        });
      }

      // Close on link click
      navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          toggle.classList.remove('active');
          navLinks.classList.remove('active');
          if (overlay) overlay.classList.remove('active');
          document.body.style.overflow = '';
        });
      });
    }

    // Navbar scroll effect
    window.addEventListener('scroll', () => {
      const navbar = document.querySelector('.navbar');
      if (navbar) {
        navbar.classList.toggle('scrolled', window.scrollY > 50);
      }
    });

    // Set active nav link
    this.setActiveLink();
  },

  setActiveLink() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a').forEach(link => {
      const href = link.getAttribute('href');
      if (href === currentPage || (currentPage === '' && href === 'index.html')) {
        link.classList.add('active');
      }
    });
  }
};

/* --- Scroll Animations --- */
const ScrollAnimations = {
  init() {
    const elements = document.querySelectorAll('.animate-on-scroll');
    if (elements.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animated');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    elements.forEach(el => observer.observe(el));
  }
};

/* --- Back to Top --- */
const BackToTop = {
  init() {
    const btn = document.querySelector('.back-to-top');
    if (!btn) return;

    window.addEventListener('scroll', () => {
      btn.classList.toggle('visible', window.scrollY > 400);
    });

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
};

/* --- Button Ripple Effects --- */
const ButtonEffects = {
  init() {
    document.querySelectorAll('.btn').forEach(btn => {
      btn.addEventListener('click', function(e) {
        const ripple = document.createElement('span');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        ripple.style.cssText = `
          position: absolute;
          width: ${size}px;
          height: ${size}px;
          left: ${x}px;
          top: ${y}px;
          background: rgba(255,255,255,0.3);
          border-radius: 50%;
          transform: scale(0);
          animation: rippleEffect 0.6s ease-out;
          pointer-events: none;
        `;

        this.style.position = 'relative';
        this.style.overflow = 'hidden';
        this.appendChild(ripple);

        setTimeout(() => ripple.remove(), 600);
      });
    });

    // Add ripple keyframes if not already present
    if (!document.querySelector('#ripple-styles')) {
      const style = document.createElement('style');
      style.id = 'ripple-styles';
      style.textContent = `
        @keyframes rippleEffect {
          to { transform: scale(4); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
  }
};

/* --- Toast Notifications --- */
function showToast(message, type = 'success', duration = 3000) {
  // Remove existing toasts
  document.querySelectorAll('.toast').forEach(t => t.remove());

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span>${message}</span>
  `;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/* --- Confetti Effect --- */
function triggerConfetti() {
  const container = document.createElement('div');
  container.className = 'confetti-container';
  document.body.appendChild(container);

  const colors = ['#D4A843', '#4A7C28', '#E74C3C', '#3498DB', '#F0D68A', '#27AE60', '#9B59B6'];

  for (let i = 0; i < 80; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    const color = colors[Math.floor(Math.random() * colors.length)];
    const left = Math.random() * 100;
    const delay = Math.random() * 0.5;
    const size = Math.random() * 8 + 4;
    const duration = Math.random() * 2 + 2;
    const shape = Math.random() > 0.5 ? '50%' : '0';

    confetti.style.cssText = `
      left: ${left}%;
      top: -10px;
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      border-radius: ${shape};
      animation: confettiFall ${duration}s ease-in ${delay}s forwards;
    `;
    container.appendChild(confetti);
  }

  setTimeout(() => container.remove(), 4000);
}

/* --- Auth UI Update --- */
function updateAuthUI() {
  const user = VedTrimDB.getCurrentUser();
  const authBtns = document.querySelectorAll('.nav-auth-btn');
  const dashBtns = document.querySelectorAll('.nav-dash-btn');
  const logoutBtns = document.querySelectorAll('.nav-logout-btn');

  if (user) {
    authBtns.forEach(btn => btn.style.display = 'none');
    dashBtns.forEach(btn => btn.style.display = 'inline-flex');
    logoutBtns.forEach(btn => {
      btn.style.display = 'inline-flex';
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        VedTrimDB.logout();
        showToast('Logged out successfully!', 'success');
        setTimeout(() => window.location.href = 'index.html', 500);
      });
    });
  } else {
    authBtns.forEach(btn => btn.style.display = 'inline-flex');
    dashBtns.forEach(btn => btn.style.display = 'none');
    logoutBtns.forEach(btn => btn.style.display = 'none');
  }
}

/* --- FAQ Accordion --- */
function initFAQ() {
  document.querySelectorAll('.faq-question').forEach(question => {
    question.addEventListener('click', () => {
      const item = question.closest('.faq-item');
      const wasActive = item.classList.contains('active');

      // Close all
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));

      // Toggle clicked
      if (!wasActive) {
        item.classList.add('active');
      }
    });
  });
}

/* --- Password Toggle --- */
function initPasswordToggle() {
  document.querySelectorAll('.toggle-password').forEach(toggle => {
    toggle.addEventListener('click', function() {
      const input = this.closest('.input-group').querySelector('input');
      if (input.type === 'password') {
        input.type = 'text';
        this.textContent = '🙈';
        this.title = 'Hide password';
      } else {
        input.type = 'password';
        this.textContent = '👁️';
        this.title = 'Show password';
      }
    });
  });
}

/* --- Form Validation --- */
function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone) {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 10;
}

function showFieldError(input, message) {
  input.classList.add('error');
  let errorEl = input.parentElement.querySelector('.form-error');
  if (!errorEl) {
    errorEl = document.createElement('div');
    errorEl.className = 'form-error';
    input.parentElement.appendChild(errorEl);
  }
  errorEl.textContent = message;
  errorEl.style.display = 'block';
}

function clearFieldError(input) {
  input.classList.remove('error');
  const errorEl = input.parentElement.querySelector('.form-error');
  if (errorEl) errorEl.style.display = 'none';
}

/* --- Counter Animation --- */
function animateCounters() {
  document.querySelectorAll('.counter').forEach(counter => {
    const target = parseInt(counter.getAttribute('data-target'));
    const suffix = counter.getAttribute('data-suffix') || '';
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;

    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      counter.textContent = Math.floor(current).toLocaleString('en-IN') + suffix;
    }, 16);
  });
}
