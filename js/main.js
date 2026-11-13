/* ========================================
   Blink Beyond - Shared JavaScript
   ======================================== */

// Register GSAP plugins immediately if available
if (typeof gsap !== 'undefined') {
  if (typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ limitCallbacks: true, ignoreMobileResize: true });
  }
  if (typeof Draggable !== 'undefined') gsap.registerPlugin(Draggable);
}

/* ========================================
   PAGE TRANSITION - BLUE CURTAIN WIPE
   ======================================== */
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

// Reset scroll to top ONLY if no hash target is requested
if (!window.location.hash) {
  window.scrollTo(0, 0);
}

window.addEventListener('beforeunload', () => {
  if (!window.location.hash) {
    window.scrollTo(0, 0);
  }
});

window.addEventListener('load', () => {
  if (!window.location.hash) {
    window.scrollTo(0, 0);
  }
  if (typeof ScrollTrigger !== 'undefined') {
    ScrollTrigger.clearScrollMemory && ScrollTrigger.clearScrollMemory('manual');
    // Refresh ScrollTrigger after a slight tick so it doesn't stutter initial transition animation
    setTimeout(() => {
      ScrollTrigger.refresh();
    }, 120);
  }
});

(function() {
  var overlay = document.querySelector('.page-transition-overlay');

  function hideTransitionOverlay() {
    var ov = document.querySelector('.page-transition-overlay');
    if (ov) {
      if (typeof gsap !== 'undefined') gsap.killTweensOf(ov);
      ov.style.display = 'none';
      ov.style.pointerEvents = 'none';
      ov.style.transform = 'translateY(-100%)';
    }
    document.documentElement.classList.remove('bb-entering');
    document.documentElement.style.background = '';
    document.documentElement.style.backgroundColor = '';
  }

  // Detect back-forward navigation (browser back button, back gestures, history traversal)
  var navEntries = window.performance && window.performance.getEntriesByType && window.performance.getEntriesByType('navigation');
  var isBackNav = (navEntries && navEntries[0] && navEntries[0].type === 'back_forward') || 
                  (window.performance && window.performance.navigation && window.performance.navigation.type === 2);

  if (isBackNav) {
    try { sessionStorage.removeItem('bb_page_transition'); } catch(e) {}
    hideTransitionOverlay();
  }

  // Ensure bfcache restores instantly without any transitions, overlays, or delays
  window.addEventListener('pageshow', function(e) {
    var nav = window.performance && window.performance.getEntriesByType && window.performance.getEntriesByType('navigation');
    var isBack = e.persisted || (nav && nav[0] && nav[0].type === 'back_forward') || (window.performance && window.performance.navigation && window.performance.navigation.type === 2);
    if (isBack) {
      try { sessionStorage.removeItem('bb_page_transition'); } catch(err) {}
      hideTransitionOverlay();
    }
  });

  // Reset overlay state before the page enters bfcache snapshot
  window.addEventListener('pagehide', function() {
    var ov = document.querySelector('.page-transition-overlay');
    if (ov) {
      ov.style.display = 'none';
      ov.style.pointerEvents = 'none';
      ov.style.transform = 'translateY(-100%)';
    }
  });

  // Reset on any history popstate
  window.addEventListener('popstate', function() {
    try { sessionStorage.removeItem('bb_page_transition'); } catch(err) {}
    hideTransitionOverlay();
  });

  function triggerPageTransition(dest) {
    try { sessionStorage.setItem('bb_page_transition', '1'); } catch(e) {}
    var currentOverlay = document.querySelector('.page-transition-overlay');
    if (currentOverlay && typeof gsap !== 'undefined') {
      currentOverlay.style.display = 'block';
      gsap.killTweensOf(currentOverlay);
      gsap.set(currentOverlay, { y: '100%', pointerEvents: 'all' });
      gsap.to(currentOverlay, {
        y: '0%',
        duration: 0.28,
        ease: 'power2.inOut',
        onComplete: function() {
          window.location.href = dest;
        }
      });
    } else {
      window.location.href = dest;
    }
  }
  window.triggerPageTransition = triggerPageTransition;

  function scrollToHash(smooth) {
    if (window.location.hash) {
      var target = document.querySelector(window.location.hash);
      if (target) {
        target.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
      }
    } else {
      window.scrollTo(0, 0);
    }
  }
  window.bbScrollToHash = scrollToHash;

  if (!overlay) return;

  var cameFromTransition = false;
  if (!isBackNav) {
    try { cameFromTransition = sessionStorage.getItem('bb_page_transition') === '1'; } catch(e) {}
  }

  if (cameFromTransition) {
    try { sessionStorage.removeItem('bb_page_transition'); } catch(e) {}
    // Position target behind overlay before curtain lifts
    scrollToHash(false);
    document.documentElement.classList.remove('bb-entering');

    if (typeof gsap !== 'undefined') {
      overlay.style.display = 'block';
      gsap.killTweensOf(overlay);
      gsap.set(overlay, { y: '0%', pointerEvents: 'all' });
      requestAnimationFrame(function() {
        scrollToHash(false);
        gsap.to(overlay, {
          y: '-100%',
          duration: 0.32,
          ease: 'power2.out',
          onComplete: function() {
            gsap.set(overlay, { pointerEvents: 'none' });
            overlay.style.display = 'none';
            document.documentElement.style.background = '';
            document.documentElement.style.backgroundColor = '';
            scrollToHash(false);
          }
        });
      });
    } else {
      hideTransitionOverlay();
      scrollToHash(false);
    }
  } else {
    hideTransitionOverlay();
    if (window.location.hash) {
      scrollToHash(false);
    }
  }

  function normalizePath(p) {
    return p.split('#')[0].split('?')[0].replace(/\/$/, '').replace(/\.html$/, '');
  }

  document.addEventListener('click', function(e) {
    var link = e.target.closest('a[href]');
    if (!link) return;
    var href = link.getAttribute('href');
    if (!href || href.startsWith('http') || href.startsWith('mailto') || href.startsWith('tel') || href.startsWith('javascript')) return;
    if (link.target === '_blank') return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    // Completely disable transitions on any Back link or link explicitly flagged
    var isBackLink = link.hasAttribute('data-no-transition') || 
                     link.hasAttribute('data-back') || 
                     link.classList.contains('back-btn') || 
                     link.classList.contains('cs-back-link') ||
                     (link.textContent && link.textContent.trim().toLowerCase().startsWith('back'));

    if (isBackLink) {
      try { sessionStorage.removeItem('bb_page_transition'); } catch(err) {}
      hideTransitionOverlay();
      return; // Direct native navigation without transition
    }

    // Check if it's the current page
    try {
      var url = new URL(link.href, window.location.href);
      var targetPath = normalizePath(url.pathname);
      var currentPath = normalizePath(window.location.pathname);

      if (targetPath === currentPath) {
        if (url.hash) {
          e.preventDefault();
          var targetEl = document.querySelector(url.hash);
          if (targetEl) {
            targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            history.pushState(null, '', url.hash);
          }
          return;
        } else {
          // Same page click without hash (e.g. Home link while on Home page)
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
      }
    } catch(err) {}

    if (href.startsWith('#')) return;

    e.preventDefault();
    triggerPageTransition(href);
  });
})();

document.addEventListener('DOMContentLoaded', () => {
  if (!window.location.hash) {
    window.scrollTo(0, 0);
  } else if (typeof window.bbScrollToHash === 'function') {
    window.bbScrollToHash(false);
  }

  /* ========================================
     HIGHLIGHT ACTIVE PAGE IN QUICK LINKS & MENU
     ======================================== */
  (function highlightActivePage() {
    let currentFile = window.location.pathname.split('/').pop().split('?')[0].split('#')[0] || 'index.html';
    if (!currentFile || currentFile === '/') currentFile = 'index.html';
    if (!currentFile.endsWith('.html')) currentFile += '.html';

    // Only highlight active page in Quick Links and Fullscreen Menu (not sub-services)
    document.querySelectorAll('.footer-links-col a, .fs-link').forEach(link => {
      const rawHref = link.getAttribute('href');
      if (!rawHref) return;
      let linkFile = rawHref.split('/').pop().split('?')[0].split('#')[0];
      if (!linkFile || linkFile === '/') linkFile = 'index.html';
      if (!linkFile.endsWith('.html') && !linkFile.startsWith('#') && !linkFile.startsWith('http') && !linkFile.startsWith('mailto:') && !linkFile.startsWith('tel:')) {
        linkFile += '.html';
      }

      if (linkFile === currentFile) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      }
    });
  })();
  /* ========================================
     FAB TOGGLE (floating action button)
     ======================================== */
  (function() {
    const fabToggle  = document.querySelector('.fab-toggle');
    const fabOptions = document.querySelector('.fab-options');
    if (!fabToggle || !fabOptions) return;

    fabToggle.addEventListener('click', () => {
      const isOpen = fabOptions.classList.contains('open');
      fabOptions.classList.toggle('open', !isOpen);
      fabToggle.classList.toggle('open', !isOpen);
      fabToggle.setAttribute('aria-expanded', String(!isOpen));
    });

    // Close on outside click
    document.addEventListener('click', e => {
      if (!e.target.closest('.fab-container')) {
        fabOptions.classList.remove('open');
        fabToggle.classList.remove('open');
        fabToggle.setAttribute('aria-expanded', 'false');
      }
    });
  })();

  /* ========================================
     PREMIUM BRANDED SPLASH SCREEN
     ======================================== */
  const loader = document.getElementById('page-loader');

  if (loader) {
    const docEl = document.documentElement;

    // Optional manual force via ?loader=1 (great for testing)
    let forceLoader = false;
    try {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('loader')) {
        forceLoader = true;
        sessionStorage.removeItem('bb_preloader_seen');
        localStorage.removeItem('bb_preloader_seen');
        docEl.classList.remove('bb-loader-skip', 'loader-skip');
      }
    } catch (e) {}

    // Check if user has already seen the preloader on their first visit
    const alreadySeen = !forceLoader && (
      docEl.classList.contains('bb-loader-skip') ||
      (function() {
        try {
          return sessionStorage.getItem('bb_preloader_seen') === '1' || localStorage.getItem('bb_preloader_seen') === '1';
        } catch (e) {
          return false;
        }
      })()
    );

    if (alreadySeen) {
      docEl.classList.remove('is-preloading');
      loader.remove();
    } else {
      // Mark as seen immediately so reloads skip the preloader
      try {
        sessionStorage.setItem('bb_preloader_seen', '1');
        localStorage.setItem('bb_preloader_seen', '1');
      } catch (e) {}

      docEl.classList.add('is-preloading');
      const counterEl = document.getElementById('loader-percent');
      const barFill = document.getElementById('loader-bar-fill');
      const fillText = document.getElementById('loader-fill-text');
      let current = 0;
      const duration = 1800; // 1.8s for a crisp, cinematic load experience
      const startTime = performance.now();

      function animateLoader(now) {
        const elapsed = now - startTime;
        let progress = Math.min(elapsed / duration, 1);

        // Smooth cubic ease-in-out
        const eased = progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        current = Math.floor(eased * 100);

        if (counterEl) {
          const counterValue = current + '%';
          counterEl.textContent = counterValue;
          counterEl.dataset.value = counterValue;
          counterEl.style.setProperty('--progress', current + '%');
        }
        if (barFill) barFill.style.width = current + '%';

        if (fillText) {
          const pct = Math.floor(eased * 100);
          fillText.style.background = `linear-gradient(to right, #ffffff ${pct}%, rgba(255,255,255,0.18) ${pct}%)`;
          fillText.style.webkitBackgroundClip = 'text';
          fillText.style.backgroundClip = 'text';
          fillText.style.webkitTextFillColor = 'transparent';
        }

        if (progress < 1) {
          requestAnimationFrame(animateLoader);
        } else {
          // Pause momentarily at 100% so user sees completion, then slide up smoothly
          setTimeout(() => {
            docEl.classList.remove('is-preloading');
            loader.classList.add('hidden');

            if (typeof ScrollTrigger !== 'undefined') {
              setTimeout(() => { ScrollTrigger.refresh(); }, 50);
            }

            const fabContainer = document.querySelector('.fab-container');
            const agentBtn = document.getElementById('ai-agent-btn');
            if (fabContainer && typeof gsap !== 'undefined') {
              gsap.fromTo(fabContainer,
                { opacity: 0, scale: 0.8 },
                { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.4)', clearProps: 'all' }
              );
            }
            if (agentBtn && typeof gsap !== 'undefined') {
              gsap.fromTo(agentBtn,
                { opacity: 0, scale: 0.8 },
                { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.4)', clearProps: 'all' }
              );
            }

            // Wait until the 0.75s CSS slide-up transition completes before removing from DOM
            setTimeout(() => {
              if (loader && loader.parentNode) {
                loader.remove();
              }
            }, 800);
          }, 120);
        }
      }

      requestAnimationFrame(animateLoader);
    }
  } else {
    document.documentElement.classList.remove('is-preloading');
  }

  /* ========================================
     SPLIT LETTERS & MAGNETIC EFFECT
     ======================================== */
  function splitWord(el,text){
    if(el) el.innerHTML=[...text].map(l=>`<span class="letter">${l}</span>`).join('');
  }
  const wPlay = document.getElementById('wPlay');
  const wReel = document.getElementById('wReel');
  if (wPlay) splitWord(wPlay, 'Play');
  if (wReel) splitWord(wReel, 'Reel');

  document.querySelectorAll('.play-text .letter, .reel-text .letter').forEach(l=>{
    let r = null;
    l.addEventListener('mouseenter', ()=>{ r = l.getBoundingClientRect(); }, { passive: true });
    l.addEventListener('mousemove', e=>{
      if (!r) r = l.getBoundingClientRect();
      const x = (e.clientX - (r.left + r.width/2)) / r.width * 14;
      const y = (e.clientY - (r.top + r.height/2)) / r.height * 14;
      l.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }, { passive: true });
    l.addEventListener('mouseleave', ()=>{
      r = null;
      l.style.transform = '';
    }, { passive: true });
  });

  // ── Navbar scroll effect ──
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    let navTicking = false;
    window.addEventListener('scroll', () => {
      if (!navTicking) {
        requestAnimationFrame(() => {
          navbar.classList.toggle('scrolled', window.scrollY > 50);
          navTicking = false;
        });
        navTicking = true;
      }
    }, { passive: true });
  }

  // ── Fullscreen Menu GSAP ──
  (function initFullscreenMenu() {
    const btn = document.getElementById('cnHamburger');
    const closeBtn = document.getElementById('fsMenuClose');
    const menu = document.getElementById('fsMenu');
    const links = document.querySelectorAll('.fs-link');
    if (!menu || !btn || !closeBtn) return;

    const hasGsap = typeof gsap !== 'undefined';

    // Split text into spans for the text roll effect
    links.forEach(link => {
      const text = link.getAttribute('data-text');
      const topLayer = link.querySelector('.text-roll-top');
      const bottomLayer = link.querySelector('.text-roll-bottom');
      if (!topLayer || !bottomLayer || !text) return;

      const letters = [...text].map(char => `<span class="letter">${char}</span>`).join('');
      topLayer.innerHTML = letters;
      bottomLayer.innerHTML = letters;

      if (hasGsap) {
        // Position bottom letters below the overflow clip from the start
        gsap.set(link.querySelectorAll('.text-roll-bottom .letter'), { y: '100%' });

        // Hover animation logic for non-touch
        if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
          link.addEventListener('mouseenter', () => {
            gsap.killTweensOf(link.querySelectorAll('.text-roll-top .letter'));
            gsap.killTweensOf(link.querySelectorAll('.text-roll-bottom .letter'));
            gsap.to(link.querySelectorAll('.text-roll-top .letter'), {
              y: '-100%',
              duration: 0.4,
              ease: 'power2.inOut',
              stagger: 0.02
            });
            gsap.fromTo(link.querySelectorAll('.text-roll-bottom .letter'),
              { y: '100%' },
              { y: '0%', duration: 0.4, ease: 'power2.inOut', stagger: 0.02 }
            );
          });
          link.addEventListener('mouseleave', () => {
            gsap.killTweensOf(link.querySelectorAll('.text-roll-top .letter'));
            gsap.killTweensOf(link.querySelectorAll('.text-roll-bottom .letter'));
            gsap.to(link.querySelectorAll('.text-roll-top .letter'), {
              y: '0%',
              duration: 0.4,
              ease: 'power2.inOut',
              stagger: 0.02
            });
            gsap.to(link.querySelectorAll('.text-roll-bottom .letter'), {
              y: '100%',
              duration: 0.4,
              ease: 'power2.inOut',
              stagger: 0.02
            });
          });
        }
      }
    });

    let isOpen = false;
    let tl = hasGsap ? gsap.timeline({ paused: true })
      .set(menu, { visibility: 'visible' })
      .to(menu, { y: '0%', duration: 0.7, ease: 'power3.inOut' })
      .from(links, { y: 60, opacity: 0, duration: 0.5, stagger: 0.06, ease: 'power3.out' }, '-=0.2')
      .from('.fs-menu-footer', { opacity: 0, y: 20, duration: 0.4, ease: 'power2.out' }, '-=0.3') : null;

    const agentBtn = document.getElementById('ai-agent-btn');
    const fabContainer = document.querySelector('.fab-container');

    const openMenu = () => {
      if (isOpen) return;
      isOpen = true;
      document.body.style.overflow = 'hidden';
      if (hasGsap && tl) {
        tl.play(0);
        if (agentBtn) gsap.to(agentBtn, { opacity: 0, scale: 0.8, duration: 0.2, pointerEvents: 'none' });
        if (fabContainer) gsap.to(fabContainer, { opacity: 0, scale: 0.8, duration: 0.2, pointerEvents: 'none' });
      } else {
        menu.style.visibility = 'visible';
        menu.style.transform = 'translateY(0%)';
      }

      if (hasGsap && !window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        links.forEach(link => {
          gsap.fromTo(link.querySelectorAll('.text-roll-bottom .letter'),
            { y: '100%' },
            { y: '0%', duration: 0.5, ease: 'power2.inOut', stagger: 0.03, delay: 0.5 }
          );
          gsap.fromTo(link.querySelectorAll('.text-roll-top .letter'),
            { y: '0%' },
            { y: '-100%', duration: 0.5, ease: 'power2.inOut', stagger: 0.03, delay: 0.5 }
          );
        });
      }
    };

    const closeMenu = (onComplete) => {
      if (!isOpen) return;
      isOpen = false;
      document.body.style.overflow = '';
      if (hasGsap && tl) {
        tl.reverse().then(() => {
          if (onComplete) onComplete();
        });
        if (agentBtn) gsap.to(agentBtn, { opacity: 1, scale: 1, duration: 0.25, clearProps: 'pointerEvents' });
        if (fabContainer) gsap.to(fabContainer, { opacity: 1, scale: 1, duration: 0.25, clearProps: 'pointerEvents' });
      } else {
        menu.style.transform = 'translateY(-100%)';
        setTimeout(() => {
          menu.style.visibility = 'hidden';
          if (onComplete) onComplete();
        }, 400);
      }
    };

    btn.addEventListener('click', openMenu);
    closeBtn.addEventListener('click', () => closeMenu());

    // Intercept link clicks in menu to trigger transition curtain
    links.forEach(link => {
      link.addEventListener('click', (e) => {
        const dest = link.getAttribute('href');
        if (!dest) return;
        
        function normalizePath(p) {
          return p.split('#')[0].split('?')[0].replace(/\/$/, '').replace(/\.html$/, '');
        }

        try {
          var url = new URL(link.href, window.location.href);
          var targetPath = normalizePath(url.pathname);
          var currentPath = normalizePath(window.location.pathname);

          if (targetPath === currentPath) {
            closeMenu();
            if (url.hash) {
              e.preventDefault();
              var targetEl = document.querySelector(url.hash);
              if (targetEl) {
                targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                history.pushState(null, '', url.hash);
              }
            } else {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
            return;
          }
        } catch(err) {}

        if (dest.startsWith('#')) return;

        e.preventDefault();
        if (typeof window.triggerPageTransition === 'function') {
          window.triggerPageTransition(dest);
        } else {
          window.location.href = dest;
        }
      });
    });

  })();

  // ── Scroll Reveal (Intersection Observer) ──
  const revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(el => revealObserver.observe(el));
  }

  // ── Service word hover pulse (desktop only) ──
  document.querySelectorAll('.service-big-word').forEach(word => {
    word.addEventListener('mouseenter', () => {
      if (window.innerWidth > 1024) {
        word.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
        word.style.transform = 'scale(1.04)';
      }
    });
    word.addEventListener('mouseleave', () => {
      if (window.innerWidth > 1024) {
        word.style.transform = 'scale(1)';
        word.style.transition = '';
      }
    });
  });

  // ── Parallax Scroll-Driven Animation ──
  const parallaxSections = document.querySelectorAll('.parallax-word-section');
  if (parallaxSections.length && typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    const mm = gsap.matchMedia();

    // Desktop ONLY (> 1024px) — pin + card-rotation + image parallax
    mm.add("(min-width: 1025px)", () => {
      parallaxSections.forEach((section, i) => {
        gsap.set(section, { zIndex: i + 1 });

        const inner = section.querySelector('.parallax-sticky');
        if (!inner) return;

        if (i < parallaxSections.length - 1) {
          ScrollTrigger.create({
            trigger: section,
            start: 'top top',
            end: '+=120%',
            pin: true,
            pinSpacing: false,
            anticipatePin: 1,
            fastScrollEnd: true,
            preventOverlaps: true,
          });
        }

        if (i > 0) {
          gsap.set(inner, { rotation: 18, transformOrigin: 'bottom left' });
          gsap.to(inner, {
            rotation: 0,
            ease: 'none',
            scrollTrigger: {
              trigger: section,
              start: 'top bottom',
              end: 'top top',
              scrub: 0.3,
              fastScrollEnd: true,
              preventOverlaps: true,
            },
          });
        }

        const imgs = section.querySelectorAll('.parallax-img');
        const entryVectors = [
          { x: '-22vw', y: '-14vh', rot: -20 },
          { x:  '20vw', y: '-16vh', rot:  18 },
          { x: '-24vw', y:   '6vh', rot: -14 },
          { x:  '10vw', y:  '22vh', rot:  12 },
          { x: '-12vw', y:  '24vh', rot: -22 },
          { x:  '22vw', y:  '18vh', rot:  20 },
        ];
        imgs.forEach((img, index) => {
          const vec = entryVectors[index % entryVectors.length];
          gsap.fromTo(img,
            { x: vec.x, y: vec.y, rotation: vec.rot, scale: 0.82, opacity: 0 },
            {
              x: '0vw', y: '0vh', rotation: 0, scale: 1, opacity: 1, ease: 'none',
              scrollTrigger: { trigger: section, start: 'top bottom', end: 'top top', scrub: 0.3, fastScrollEnd: true }
            }
          );
        });
      });
    });

    // Mobile / Tablet (<= 1024px): cards are 100% static, unmovable, with zero GSAP pin or animation
    mm.add("(max-width: 1024px)", () => {
      parallaxSections.forEach(section => {
        gsap.set(section, { clearProps: "all" });
        const inner = section.querySelector('.parallax-sticky');
        if (inner) gsap.set(inner, { clearProps: "all" });
        const imgs = section.querySelectorAll('.parallax-img');
        imgs.forEach(img => gsap.set(img, { clearProps: "all" }));
      });
    });
  }

  // ── OSMO-style reel ring: circle + 36 tick marks ──
  document.querySelectorAll('.reel-ring-svg').forEach(ringSvg => {
    const isAbout = ringSvg.id === 'about-reel-ring';
    const strokeColor = isAbout ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.09)';
    const r = 200, tickLen = 8, numTicks = 36;
    let markup = `<circle cx="0" cy="0" r="${r}" fill="none" stroke="${strokeColor}" stroke-width="1"/>`;
    for (let i = 0; i < numTicks; i++) {
      const angle = (i * 360 / numTicks) * Math.PI / 180;
      const cos = Math.cos(angle), sin = Math.sin(angle);
      const x1 = (cos * (r - tickLen)).toFixed(2), y1 = (sin * (r - tickLen)).toFixed(2);
      const x2 = (cos * r).toFixed(2),             y2 = (sin * r).toFixed(2);
      markup += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${strokeColor}" stroke-width="1"/>`;
    }
    ringSvg.innerHTML = markup;
  });

  // ── Contact form interaction ──
  const contactForm = document.getElementById('contactForm');
  // (Formspree handles the submission natively, so JS intercept is removed)

  // ── Parallax-like float on mouse for hero ──
  const heroContent = document.querySelector('.hero-content');
  const heroSection = document.querySelector('.hero-parallax');
  if (heroContent && heroSection) {
    let heroRect = null;
    heroSection.addEventListener('mouseenter', () => { heroRect = heroSection.getBoundingClientRect(); }, { passive: true });
    heroSection.addEventListener('mousemove', (e) => {
      if (!heroRect) heroRect = heroSection.getBoundingClientRect();
      const x = (e.clientX - heroRect.left) / heroRect.width - 0.5;
      const y = (e.clientY - heroRect.top) / heroRect.height - 0.5;
      heroContent.style.transform = `translate3d(${x * 8}px, ${y * 8}px, 0)`;
    }, { passive: true });
    heroSection.addEventListener('mouseleave', () => {
      heroRect = null;
      heroContent.style.transform = '';
    }, { passive: true });
  }

  // ── Smooth number counter for stats ──
  const statEls = document.querySelectorAll('[data-count]');
  if (statEls.length) {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.dataset.count, 10);
          const suffix = el.dataset.suffix || '';
          let startTime = null;
          const duration = 1500;
          const easeOut = t => 1 - Math.pow(1 - t, 3);
          
          const animateCount = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = (timestamp - startTime) / duration;
            if (progress < 1) {
              const current = Math.floor(target * easeOut(progress));
              el.textContent = current + suffix;
              requestAnimationFrame(animateCount);
            } else {
              el.textContent = target + suffix;
            }
          };
          requestAnimationFrame(animateCount);
          counterObserver.unobserve(el);
        }
      });
    }, { threshold: 0.5 });
    statEls.forEach(el => counterObserver.observe(el));
  }

  // ── Magnetic Cards Reveal Effect ──
  const magneticCards = document.querySelectorAll('.magnetic-card');
  
  magneticCards.forEach(card => {
    const reveal = card.querySelector('.magnetic-reveal');
    const revealInner = card.querySelector('.magnetic-reveal-inner');
    
    if (!reveal || !revealInner) return;

    let isHovered = false;
    let cardSize = { width: 0, height: 0 };
    let cachedCardRect = null;
    
    // Target position (raw mouse) vs Current position (smoothed)
    const targetPos = { x: 0, y: 0 };
    const currentPos = { x: 0, y: 0 };
    let animationFrameId;

    // Smooth lerp function
    const lerp = (start, end, factor) => start + (end - start) * factor;

    const updateSize = () => {
      cachedCardRect = card.getBoundingClientRect();
      cardSize = {
        width: cachedCardRect.width || card.offsetWidth,
        height: cachedCardRect.height || card.offsetHeight
      };
      // Keep the inner text full width of the card
      revealInner.style.width = `${cardSize.width}px`;
      revealInner.style.height = `${cardSize.height}px`;
    };

    const animate = () => {
      currentPos.x = lerp(currentPos.x, targetPos.x, 0.18);
      currentPos.y = lerp(currentPos.y, targetPos.y, 0.18);

      // Move the circle cutout using translate3d
      reveal.style.transform = `translate3d(${currentPos.x}px, ${currentPos.y}px, 0) translate(-50%, -50%)`;
      // Move the inner text inversely to keep it fixed relative to the card
      revealInner.style.transform = `translate3d(${-currentPos.x}px, ${-currentPos.y}px, 0)`;

      if (isHovered || Math.abs(targetPos.x - currentPos.x) > 0.5 || Math.abs(targetPos.y - currentPos.y) > 0.5) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        animationFrameId = null;
      }
    };

    // Update dimensions on resize
    updateSize();
    window.addEventListener('resize', updateSize, { passive: true });

    card.addEventListener('mouseenter', (e) => {
      cachedCardRect = card.getBoundingClientRect();
      const x = e.clientX - cachedCardRect.left;
      const y = e.clientY - cachedCardRect.top;
      
      // Snap instantly to enter position
      targetPos.x = x;
      targetPos.y = y;
      currentPos.x = x;
      currentPos.y = y;
      
      isHovered = true;
      card.classList.add('is-hovered');
      
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      animate();
    }, { passive: true });

    card.addEventListener('mousemove', (e) => {
      if (!cachedCardRect) cachedCardRect = card.getBoundingClientRect();
      targetPos.x = e.clientX - cachedCardRect.left;
      targetPos.y = e.clientY - cachedCardRect.top;
    }, { passive: true });

    card.addEventListener('mouseleave', () => {
      isHovered = false;
      cachedCardRect = null;
      card.classList.remove('is-hovered');
    }, { passive: true });

    // ── Touch support: show reveal circle at tap point ──
    card.addEventListener('touchstart', (e) => {
      const rect = card.getBoundingClientRect();
      const touch = e.touches[0];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      targetPos.x = x;
      targetPos.y = y;
      currentPos.x = x;
      currentPos.y = y;

      isHovered = true;
      card.classList.add('is-hovered');

      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      animate();
    }, { passive: true });

    card.addEventListener('touchend', () => {
      isHovered = false;
      card.classList.remove('is-hovered');
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    });
  });

});

/* ========================================
   GSAP PARALLAX + LENIS SMOOTH SCROLL
   (Runs after DOMContentLoaded, outside it)
   ======================================== */
window.addEventListener('load', () => {
  // Guard: only run if GSAP is available (loaded via CDN on index.html)
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  gsap.registerPlugin(ScrollTrigger);

  // ── Fonts-ready refresh (catches web font reflows that shift ScrollTrigger positions) ──
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      ScrollTrigger.refresh();
    });
  }
  // Debounced resize refresh
  let _stResizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(_stResizeTimer);
    _stResizeTimer = setTimeout(() => ScrollTrigger.refresh(), 250);
  });

  // ── Hero Parallax ──
  const triggerElement = document.querySelector('[data-parallax-layers]');

  if (triggerElement) {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: triggerElement,
        start: '0% 0%',
        end: '100% 0%',
        scrub: 0.3,
        fastScrollEnd: true
      }
    });

    const layers = [
      { layer: '1', yPercent: 70 },
      { layer: '2', yPercent: 55 },
      { layer: '3', yPercent: 40 },
      { layer: '4', yPercent: 10 }
    ];

    layers.forEach((layerObj, idx) => {
      tl.to(
        triggerElement.querySelectorAll(`[data-parallax-layer="${layerObj.layer}"]`),
        {
          yPercent: layerObj.yPercent,
          ease: 'none'
        },
        idx === 0 ? undefined : '<'
      );
    });
  }

  // ── Lamp Effect Observer ──
  const footerLamp = document.getElementById('footer-lamp');
  if (footerLamp) {
    const lampObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          footerLamp.classList.add('lamp-active');
          lampObserver.disconnect(); // only animate once
        }
      });
    }, { threshold: 0.3 });
    lampObserver.observe(footerLamp);
  }

  // ── Hero Inner Text — scroll-revealed paragraph ──
  // Skip animation when element lives inside the pinned reel section
  // (it's visible by default there; animating it conflicts with pinning)
  const heroInnerText = document.getElementById('heroInnerText');
  if (heroInnerText && !heroInnerText.closest('#home-reel-section')) {
    gsap.fromTo(heroInnerText,
      { opacity: 0, y: 32 },
      {
        opacity: 1,
        y: 0,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: heroInnerText,
          start: 'top 80%',
          end: 'top 45%',
          scrub: false,
          toggleActions: 'play none none reverse'
        }
      }
    );
  }

  // ── ARC — Static half-circle fan (Osmo-style) ──
  const arcScene = document.getElementById('arcScene');
  const arcRing  = document.getElementById('arcRing');

  if (arcScene && arcRing) {
    const cards      = gsap.utils.toArray('#arcRing > .a-card');
    const total      = cards.length;

    // Clone each card once to fill the full 360° circle evenly with no blank gap
    cards.forEach((card) => {
      const clone = card.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      clone.style.pointerEvents = 'none';
      arcRing.appendChild(clone);
    });

    // Ensure all card videos autoplay seamlessly
    arcRing.querySelectorAll('video').forEach((v) => {
      v.muted = true;
      v.playsInline = true;
      v.play().catch(() => {});
    });

    // Re-query so allCards includes originals + clones (14 total)
    const allCards   = gsap.utils.toArray('#arcRing > .a-card');
    const allTotal   = allCards.length;          // 14
    const stepDeg    = 360 / allTotal;           // ~25.7° even spacing

    // Layout function to dynamically place cards
    function layoutCards() {
      const ringRadius = arcRing.offsetWidth / 2;
      if (!ringRadius) return;

      allCards.forEach((card, i) => {
        const angleDeg = -170 + stepDeg * i;       // start at -170° and go full circle
        const angleRad = angleDeg * (Math.PI / 180);
        const cx = ringRadius + ringRadius * Math.cos(angleRad);
        const cy = ringRadius + ringRadius * Math.sin(angleRad);
        gsap.set(card, {
          left:            cx - card.offsetWidth  / 2,
          top:             cy - card.offsetHeight / 2,
          rotation:        angleDeg + 90,
          transformOrigin: 'center center',
          force3D:         true,
          opacity:         1   // reveal now that position is correct
        });
      });
    }

    // Run layout initially
    layoutCards();

    // Re-calculate layout on window resize to ensure full responsiveness across screens (like tablet)
    window.addEventListener('resize', layoutCards);

    // Ring starts at rest
    gsap.set(arcRing, { rotation: 0, force3D: true });

    // ── Continuous auto-rotation — pause when off-screen ──
    const DEG_PER_SEC = 6.3;
    let autoAngle  = 0;
    let lastTs     = null;
    let arcVisible = true;
    let arcRafId   = null;

    function rotateTick(ts) {
      if (!arcVisible) {
        arcRafId = null;
        lastTs = null;
        return;
      }
      if (!lastTs) lastTs = ts;
      const delta = Math.min((ts - lastTs) / 1000, 0.05);
      lastTs = ts;
      autoAngle -= DEG_PER_SEC * delta;
      arcRing.style.transform = `translate3d(-50%, 0, 0) rotate(${autoAngle}deg)`;
      arcRafId = requestAnimationFrame(rotateTick);
    }

    if ('IntersectionObserver' in window) {
      const arcVideos = arcRing.querySelectorAll('video');
      const arcIo = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          arcVisible = entry.isIntersecting;
          if (arcVisible) {
            arcVideos.forEach(function(v) { v.play().catch(function() {}); });
            if (!arcRafId) {
              lastTs = null;
              arcRafId = requestAnimationFrame(rotateTick);
            }
          } else {
            arcVideos.forEach(function(v) { if (!v.paused) v.pause(); });
            if (arcRafId) {
              cancelAnimationFrame(arcRafId);
              arcRafId = null;
            }
          }
        });
      }, { rootMargin: '60px 0px', threshold: 0 });
      arcIo.observe(arcScene);
    } else {
      arcRafId = requestAnimationFrame(rotateTick);
    }

  }

});

// ══════════════════════════════════════════
// CINEMATIC TUBE-LIGHT FOOTER
// IntersectionObserver triggers flicker + content reveal
// ══════════════════════════════════════════
(function() {
  const footer = document.getElementById('site-footer');
  const lamp = document.getElementById('footer-lamp');
  if (!footer || !lamp) return;

  let fired = false;

  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting && !fired) {
        fired = true;

        // 1. Start flicker animation (CSS handles the keyframes)
        setTimeout(function() {
          lamp.classList.add('lamp-active');
        }, 200); // faster start

        // 2. After flicker completes (~2.5s animation + 0.6s delay = 3.1s),
        //    reveal footer content
        setTimeout(function() {
          footer.classList.add('footer-revealed');
        }, 1400);

        observer.disconnect();
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  observer.observe(footer);
})();


// ── Founder flip-cards ──
// Detects device type: touch (mobile/tablet/iPad) vs hover (laptop/computer)
// Touch  → "TAP FOR INFO"   — click toggles the card flip
// Hover  → "HOVER FOR INFO" — CSS hover reveals info, no flip needed
(function () {
  var flipCards = document.querySelectorAll('.flip-card');
  if (!flipCards.length) return;

  // Same media query used in CSS — matches laptop/desktop with a real mouse
  var isHoverDevice = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // ── Sync custom avatars if data-avatar is provided or handle image errors ──
  flipCards.forEach(function (card) {
    var customAvatar = card.getAttribute('data-avatar');
    var imgs = Array.from(card.querySelectorAll('.flip-avatar-img'));
    var foundSrc = customAvatar || '';
    if (!foundSrc) {
      for (var i = 0; i < imgs.length; i++) {
        var s = imgs[i].getAttribute('src');
        if (s && s.trim() !== '') {
          foundSrc = s.trim();
          break;
        }
      }
    }
    if (foundSrc) {
      imgs.forEach(function (img) {
        if (img.getAttribute('src') !== foundSrc) {
          img.setAttribute('src', foundSrc);
        }
        img.classList.remove('is-hidden');
        img.style.display = 'block';
      });
    }
    imgs.forEach(function (img) {
      img.addEventListener('error', function () {
        this.classList.add('is-hidden');
        this.style.display = 'none';
        var def = this.parentElement ? this.parentElement.querySelector('.flip-avatar-default') : null;
        if (def) def.style.display = 'flex';
      });
      img.addEventListener('load', function () {
        this.classList.remove('is-hidden');
        this.style.display = 'block';
        var def = this.parentElement ? this.parentElement.querySelector('.flip-avatar-default') : null;
        if (def) def.style.display = 'none';
      });
      if (img.getAttribute('src') && img.getAttribute('src').trim() !== '') {
        img.classList.remove('is-hidden');
      }
    });
  });

  // Restore saved state immediately so hint never flashes on revisit
  if (localStorage.getItem('bbFlipHintSeen')) {
    document.body.classList.add('bb-flip-hint-seen');
  }

  function markHintsSeen() {
    if (document.body.classList.contains('bb-flip-hint-seen')) return;
    localStorage.setItem('bbFlipHintSeen', '1');
    document.body.classList.add('bb-flip-hint-seen');
  }

  if (isHoverDevice) {
    // ── LAPTOP / COMPUTER (mouse hover) ──
    // Info is shown via CSS :hover — no click-flip needed.
    // Just mark hints as permanently seen on first mouseenter.
    flipCards.forEach(function (card) {
      card.addEventListener('mouseenter', function () {
        markHintsSeen();
      }, { once: true });
    });

  } else {
    // ── MOBILE / TABLET / iPAD (touch) ──
    // No hover, so tapping flips the card to reveal info.
    flipCards.forEach(function (card) {
      card.addEventListener('click', function (e) {
        e.stopPropagation();
        card.classList.toggle('flipped');
        markHintsSeen();
      });
    });

    // Tap outside any card → unflip all
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.flip-card')) {
        flipCards.forEach(function (card) {
          card.classList.remove('flipped');
        });
      }
    });
  }
}());

/* ========================================
   HOME PAGE — STANDALONE REEL SECTION
   ======================================== */
document.addEventListener('DOMContentLoaded', () => {
  const homeCard    = document.getElementById('home-card');
  const homeAnchor  = document.getElementById('home-card-anchor');
  const homeSection = document.getElementById('home-reel-section');
  if (!homeCard || !homeAnchor || !homeSection) return;

  function splitWord(el, text) {
    if (el) el.innerHTML = [...text].map(l => `<span class="letter">${l}</span>`).join('');
  }
  splitWord(document.getElementById('hPlay'), 'Play');
  splitWord(document.getElementById('hReel'), 'Reel');

  document.querySelectorAll('#hPlay .letter, #hReel .letter').forEach(l => {
    let r = null;
    l.addEventListener('mouseenter', () => { r = l.getBoundingClientRect(); }, { passive: true });
    l.addEventListener('mousemove', e => {
      if (!r) r = l.getBoundingClientRect();
      const x = (e.clientX - (r.left + r.width  / 2)) / r.width  * 14;
      const y = (e.clientY - (r.top  + r.height / 2)) / r.height * 14;
      l.style.transform = `translate(${x}px, ${y}px)`;
    }, { passive: true });
    l.addEventListener('mouseleave', () => {
      r = null;
      l.style.transform = '';
    });
  });

  const homePlayCircle = document.getElementById('home-play-circle');
  const homePlaySvg    = document.getElementById('home-play-svg');
  const homeFsUI       = document.getElementById('home-fs-ui');
  const homeFsFill     = document.getElementById('home-fs-fill');
  const homeInner      = document.getElementById('home-reel-inner');

  let scrollProg = 0, targetProg = 0, rafId = null;
  let isFS = false, progressTimer = null, barW = 0;

  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

  let homeAnchorWidth = 0, homeAnchorHeight = 0, homeAnchorLeftOffset = 0, homeAnchorTopOffset = 0;
  function cacheHomeDimensions() {
    const ar = homeAnchor.getBoundingClientRect();
    const sRect = homeSection.getBoundingClientRect();

    homeAnchorWidth = ar.width;
    homeAnchorHeight = ar.height;
    homeAnchorLeftOffset = ar.left - sRect.left;
    homeAnchorTopOffset = ar.top - sRect.top;
  }

  function updateHomeCard() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const maxP = 0.50;
    const t  = ease(Math.max(0, Math.min(1, (scrollProg - .05) / maxP)));
    const targetW = Math.max(vw, homeSection ? homeSection.clientWidth : vw);
    const targetH = Math.max(vh, homeSection ? homeSection.clientHeight : vh);
    const cW = lerp(homeAnchorWidth,            targetW, t);
    const cH = lerp(homeAnchorHeight,           targetH, t);
    const cX = lerp(homeAnchorLeftOffset, 0, t);
    const cY = lerp(homeAnchorTopOffset,  0, t);
    const cR = lerp(12, 0, t);

    homeCard.style.width        = cW + 'px';
    homeCard.style.height       = cH + 'px';
    homeCard.style.left         = cX + 'px';
    homeCard.style.top          = cY + 'px';
    homeCard.style.borderRadius = cR + 'px';

    const tf = Math.max(0, 1 - t * 2.8);
    if (homeInner) {
      homeInner.style.opacity       = tf;
      homeInner.style.transform     = `translateY(${-t * 28}px)`;
      homeInner.style.pointerEvents = tf > 0.15 ? 'all' : 'none';
    }
    const cardInfo = homeCard.querySelector('.home-card-info');
    if (cardInfo) cardInfo.style.opacity = String(Math.max(0, 1 - t * 6));

    const pc = lerp(44, 88, t);
    if (homePlayCircle) {
      homePlayCircle.style.width  = pc + 'px';
      homePlayCircle.style.height = pc + 'px';
      const si = Math.round(lerp(16, 28, t));
      if (homePlaySvg) { homePlaySvg.setAttribute('width', si); homePlaySvg.setAttribute('height', si); }
    }

    if (t >= 0.97) {
      if (!isFS) {
        isFS = true;
        if (homeFsUI) homeFsUI.classList.add('show');
        if (homePlayCircle) homePlayCircle.style.opacity = '0';
        homeCard.style.cursor = 'default';
        startProgress();
        hideImmersiveUI();
      }
    } else {
      if (isFS) {
        isFS = false;
        if (homeFsUI) homeFsUI.classList.remove('show');
        if (homePlayCircle) homePlayCircle.style.opacity = '1';
        homeCard.style.cursor = 'pointer';
        stopProgress();
        showImmersiveUI();
      }
    }
  }

  function hideImmersiveUI() {
    try {
      const navbarEl = document.querySelector('.navbar');
      if (navbarEl) { navbarEl.classList.add('bb-video-hidden'); navbarEl.setAttribute('aria-hidden', 'true'); }
      const strip = document.querySelector('.announcement-strip');
      if (strip && typeof gsap !== 'undefined') gsap.to(strip, { opacity: 0, duration: 0.25, pointerEvents: 'none' });
      const fab = document.querySelector('.fab-container');
      if (fab && typeof gsap !== 'undefined') gsap.to(fab, { opacity: 0, scale: 0.8, duration: 0.2, pointerEvents: 'none' });
      const agentBtn = document.getElementById('ai-agent-btn');
      if (agentBtn && typeof gsap !== 'undefined') gsap.to(agentBtn, { opacity: 0, scale: 0.8, duration: 0.2, pointerEvents: 'none' });
    } catch(e) {}
  }

  function showImmersiveUI() {
    try {
      const navbarEl = document.querySelector('.navbar');
      if (navbarEl) { navbarEl.classList.remove('bb-video-hidden'); navbarEl.removeAttribute('aria-hidden'); }
      const strip = document.querySelector('.announcement-strip');
      if (strip && typeof gsap !== 'undefined') gsap.to(strip, { opacity: 1, duration: 0.3, clearProps: 'pointerEvents' });
      const fab = document.querySelector('.fab-container');
      if (fab && typeof gsap !== 'undefined') gsap.to(fab, { opacity: 1, scale: 1, duration: 0.25, clearProps: 'pointerEvents' });
      const agentBtn = document.getElementById('ai-agent-btn');
      if (agentBtn && typeof gsap !== 'undefined') gsap.to(agentBtn, { opacity: 1, scale: 1, duration: 0.25, clearProps: 'pointerEvents' });
    } catch(e) {}
  }

  function startProgress() {
    barW = 0;
    progressTimer = setInterval(() => {
      barW = Math.min(100, barW + 0.12);
      if (homeFsFill) homeFsFill.style.width = barW + '%';
      if (barW >= 100) barW = 0;
    }, 30);
  }
  function stopProgress() {
    clearInterval(progressTimer);
    if (homeFsFill) homeFsFill.style.width = '0%';
  }

  function smoothStep() {
    const delta = targetProg - scrollProg;
    scrollProg += delta * 0.35;
    if (Math.abs(delta) < 0.002) {
      scrollProg = targetProg;
    }
    updateHomeCard();
    if (scrollProg !== targetProg) {
      rafId = requestAnimationFrame(smoothStep);
    } else {
      rafId = null;
    }
  }

  if (typeof ScrollTrigger !== 'undefined') {
    ScrollTrigger.create({
      trigger: homeSection,
      start: 'top top',
      end: () => '+=' + (window.innerWidth <= 768 ? 900 : 1000),
      pin: homeSection,
      pinSpacing: true,
      anticipatePin: 1,
      fastScrollEnd: true,
      preventOverlaps: true,
      onRefresh: () => {
        cacheHomeDimensions();
        updateHomeCard();
      },
      onUpdate: self => {
        targetProg = self.progress;
        if (!rafId) rafId = requestAnimationFrame(smoothStep);
      },
      onLeave: () => {
        targetProg = 1;
        scrollProg = 1;
        updateHomeCard();
        showImmersiveUI();
      },
      onLeaveBack: () => {
        targetProg = 0;
        scrollProg = 0;
        isFS = false;
        updateHomeCard();
        showImmersiveUI();
      },
      onEnter: () => {
        if (isFS) hideImmersiveUI();
      },
      onEnterBack: () => {
        showImmersiveUI();
      }
    });
  }

  setTimeout(() => { 
    homeCard.style.opacity = '1'; 
    cacheHomeDimensions();
    updateHomeCard(); 
  }, 150);
  window.addEventListener('resize', () => {
    cacheHomeDimensions();
    updateHomeCard();
  });

  const homeFsClose = document.getElementById('home-fs-close');
  if (homeFsClose) {
    homeFsClose.addEventListener('click', () => {
      homeSection.scrollIntoView({ behavior: 'smooth' });
    });
  }

  const homePlayBtn = document.querySelector('.home-play-btn');
  if (homePlayBtn) {
    homePlayBtn.addEventListener('mouseenter', () => {
      if (scrollProg < 0.05) homeCard.style.transform = 'scale(1.04)';
    });
    homePlayBtn.addEventListener('mouseleave', () => {
      if (scrollProg < 0.05) homeCard.style.transform = 'scale(1)';
    });
    // Scroll page smoothly to expand and play the video
    homePlayBtn.addEventListener('click', () => {
      const targetY = homeSection.getBoundingClientRect().top + window.scrollY + 600;
      window.scrollTo({ top: targetY, behavior: 'smooth' });
    });
  }
});

/* ========================================
   ABOUT PAGE — EXPANDING REEL CARD
   ======================================== */
document.addEventListener('DOMContentLoaded', () => {
  const aboutCard    = document.getElementById('about-card');
  const aboutAnchor  = document.getElementById('about-card-anchor');
  const aboutSection = document.getElementById('about-reel-section');
  if (aboutCard && aboutAnchor && aboutSection) {
    // Split "Play" and "Reel" into individual letters
  function splitWord(el, text) {
    if (el) el.innerHTML = [...text].map(l => `<span class="letter">${l}</span>`).join('');
  }
  splitWord(document.getElementById('aPlay'), 'Play');
  splitWord(document.getElementById('aReel'), 'Reel');

  // Magnetic letter hover
  document.querySelectorAll('#aPlay .letter, #aReel .letter').forEach(l => {
    let r = null;
    l.addEventListener('mouseenter', () => { r = l.getBoundingClientRect(); }, { passive: true });
    l.addEventListener('mousemove', e => {
      if (!r) r = l.getBoundingClientRect();
      const x = (e.clientX - (r.left + r.width  / 2)) / r.width  * 14;
      const y = (e.clientY - (r.top  + r.height / 2)) / r.height * 14;
      l.style.transform = `translate(${x}px, ${y}px)`;
    }, { passive: true });
    l.addEventListener('mouseleave', () => {
      r = null;
      l.style.transform = '';
    });
  });

  const aboutPlayCircle = document.getElementById('about-play-circle');
  const aboutPlaySvg    = document.getElementById('about-play-svg');
  const aboutFsUI       = document.getElementById('about-fs-ui');
  const aboutFsFill     = document.getElementById('about-fs-fill');
  const aboutInner      = document.querySelector('.about-reel-inner');

  let scrollProg = 0, targetProg = 0, rafId = null;
  let isFS = false, progressTimer = null, barW = 0;

  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

  let aboutAnchorWidth = 0, aboutAnchorHeight = 0, aboutAnchorLeftOffset = 0, aboutAnchorTopOffset = 0;
  function cacheAboutDimensions() {
    const ar = aboutAnchor.getBoundingClientRect();
    const sRect = aboutSection.getBoundingClientRect();

    aboutAnchorWidth = ar.width;
    aboutAnchorHeight = ar.height;
    aboutAnchorLeftOffset = ar.left - sRect.left;
    aboutAnchorTopOffset = ar.top - sRect.top;
  }

  function updateAboutCard() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const maxP = vw <= 768 ? 0.72 : 0.50;
    const t  = ease(Math.max(0, Math.min(1, (scrollProg - .05) / maxP)));
    const cW = lerp(aboutAnchorWidth,            vw, t);
    const cH = lerp(aboutAnchorHeight,           vh, t);
    const cX = lerp(aboutAnchorLeftOffset, 0, t);
    const cY = lerp(aboutAnchorTopOffset,  0, t);
    const cR = lerp(12, 0, t);

    aboutCard.style.width        = cW + 'px';
    aboutCard.style.height       = cH + 'px';
    aboutCard.style.left         = cX + 'px';
    aboutCard.style.top          = cY + 'px';
    aboutCard.style.borderRadius = cR + 'px';

    const tf = Math.max(0, 1 - t * 2.8);
    if (aboutInner) {
      aboutInner.style.opacity      = tf;
      aboutInner.style.transform    = `translateY(${-t * 28}px)`;
      aboutInner.style.pointerEvents = tf > 0.15 ? 'all' : 'none';
    }

    const pc = lerp(44, 88, t);
    if (aboutPlayCircle) {
      aboutPlayCircle.style.width  = pc + 'px';
      aboutPlayCircle.style.height = pc + 'px';
      const si = Math.round(lerp(16, 28, t));
      if (aboutPlaySvg) { aboutPlaySvg.setAttribute('width', si); aboutPlaySvg.setAttribute('height', si); }
    }

    if (t >= 0.97) {
      if (!isFS) {
        isFS = true;
        if (aboutFsUI) aboutFsUI.classList.add('show');
        if (aboutPlayCircle) aboutPlayCircle.style.opacity = '0';
        aboutCard.style.cursor = 'default';
        startProgress();
        hideImmersiveUI();
      }
    } else {
      if (isFS) {
        isFS = false;
        if (aboutFsUI) aboutFsUI.classList.remove('show');
        if (aboutPlayCircle) aboutPlayCircle.style.opacity = '1';
        aboutCard.style.cursor = 'pointer';
        stopProgress();
        showImmersiveUI();
      }
    }
  }

  function hideImmersiveUI() {
    try {
      const navbarEl = document.querySelector('.navbar');
      if (navbarEl) { navbarEl.classList.add('bb-video-hidden'); navbarEl.setAttribute('aria-hidden', 'true'); }
      const strip = document.querySelector('.announcement-strip');
      if (strip && typeof gsap !== 'undefined') gsap.to(strip, { opacity: 0, duration: 0.25, pointerEvents: 'none' });
      const fab = document.querySelector('.fab-container');
      if (fab && typeof gsap !== 'undefined') gsap.to(fab, { opacity: 0, scale: 0.8, duration: 0.2, pointerEvents: 'none' });
      const agentBtn = document.getElementById('ai-agent-btn');
      if (agentBtn && typeof gsap !== 'undefined') gsap.to(agentBtn, { opacity: 0, scale: 0.8, duration: 0.2, pointerEvents: 'none' });
    } catch(e) {}
  }

  function showImmersiveUI() {
    try {
      const navbarEl = document.querySelector('.navbar');
      if (navbarEl) { navbarEl.classList.remove('bb-video-hidden'); navbarEl.removeAttribute('aria-hidden'); }
      const strip = document.querySelector('.announcement-strip');
      if (strip && typeof gsap !== 'undefined') gsap.to(strip, { opacity: 1, duration: 0.3, clearProps: 'pointerEvents' });
      const fab = document.querySelector('.fab-container');
      if (fab && typeof gsap !== 'undefined') gsap.to(fab, { opacity: 1, scale: 1, duration: 0.25, clearProps: 'pointerEvents' });
      const agentBtn = document.getElementById('ai-agent-btn');
      if (agentBtn && typeof gsap !== 'undefined') gsap.to(agentBtn, { opacity: 1, scale: 1, duration: 0.25, clearProps: 'pointerEvents' });
    } catch(e) {}
  }

  function startProgress() {
    barW = 0;
    progressTimer = setInterval(() => {
      barW = Math.min(100, barW + 0.12);
      if (aboutFsFill) aboutFsFill.style.width = barW + '%';
      if (barW >= 100) barW = 0;
    }, 30);
  }
  function stopProgress() {
    clearInterval(progressTimer);
    if (aboutFsFill) aboutFsFill.style.width = '0%';
  }

  function smoothStep() {
    const delta = targetProg - scrollProg;
    scrollProg += delta * 0.35;
    if (Math.abs(delta) < 0.002) {
      scrollProg = targetProg;
    }
    updateAboutCard();
    if (scrollProg !== targetProg) {
      rafId = requestAnimationFrame(smoothStep);
    } else {
      rafId = null;
    }
  }

  if (typeof ScrollTrigger !== 'undefined') {
    ScrollTrigger.create({
      trigger: aboutSection,
      start: 'top top',
      end: () => '+=' + (window.innerWidth <= 768 ? 900 : 1000),
      pin: aboutSection,
      pinSpacing: true,
      anticipatePin: 1,
      fastScrollEnd: true,
      preventOverlaps: true,
      onRefresh: () => {
        cacheAboutDimensions();
        updateAboutCard();
      },
      onUpdate: self => {
        targetProg = self.progress;
        if (!rafId) rafId = requestAnimationFrame(smoothStep);
      },
      onLeave: () => {
        targetProg = 1;
        scrollProg = 1;
        updateAboutCard();
        showImmersiveUI();
      },
      onLeaveBack: () => {
        targetProg = 0;
        scrollProg = 0;
        isFS = false;
        updateAboutCard();
        showImmersiveUI();
      },
      onEnter: () => {
        if (isFS) hideImmersiveUI();
      },
      onEnterBack: () => {
        showImmersiveUI();
      }
    });
  }

  setTimeout(() => { 
    aboutCard.style.opacity = '1'; 
    cacheAboutDimensions();
    updateAboutCard(); 
  }, 150);
  window.addEventListener('resize', () => {
    cacheAboutDimensions();
    updateAboutCard();
  });

  const aboutFsClose = document.getElementById('about-fs-close');
  if (aboutFsClose) {
    aboutFsClose.addEventListener('click', () => {
      aboutSection.scrollIntoView({ behavior: 'smooth' });
    });
  }

  const aboutPlayBtn = document.querySelector('.about-play-btn');
  if (aboutPlayBtn) {
    aboutPlayBtn.addEventListener('mouseenter', () => {
      if (scrollProg < 0.05) aboutCard.style.transform = 'scale(1.04)';
    });
    aboutPlayBtn.addEventListener('mouseleave', () => {
      if (scrollProg < 0.05) aboutCard.style.transform = 'scale(1)';
    });
    // Scroll page smoothly to expand and play the video
    aboutPlayBtn.addEventListener('click', () => {
      const targetY = aboutSection.getBoundingClientRect().top + window.scrollY + 600;
      window.scrollTo({ top: targetY, behavior: 'smooth' });
    });
  }
  }

  // navbar element reference (used to hide during immersive video)
  const navbarEl = document.querySelector('.navbar');

  // ── GPU marquees: pause when off-screen ──
  (function initMarqueePause() {
    var wraps = document.querySelectorAll('[data-marquee]');
    if (!wraps.length || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        entry.target.classList.toggle('is-paused', !entry.isIntersecting);
      });
    }, { rootMargin: '80px 0px', threshold: 0 });
    wraps.forEach(function(wrap) { io.observe(wrap); });
  })();

  // ── Hero reel: play local muted video when near view ──
  (function initHeroReelLazy() {
    var grids = document.querySelectorAll('[data-hero-reel]');
    if (!grids.length) return;

    function prep(v) {
      v.muted = true;
      v.defaultMuted = true;
      v.playsInline = true;
      v.setAttribute('playsinline', '');
      v.setAttribute('webkit-playsinline', '');
      v.setAttribute('muted', '');
    }

    function playGrid(grid) {
      var isMobile = window.innerWidth <= 768;
      var videos = grid.querySelectorAll('video');
      videos.forEach(function(video) {
        prep(video);
        var isDesktopVid = video.classList.contains('hero-video-desktop');
        var isMobileVid = video.classList.contains('hero-video-mobile');

        // Only play the video that corresponds to the current viewport width
        if ((isMobile && isDesktopVid) || (!isMobile && isMobileVid)) {
          try { video.pause(); } catch (e) {}
          return;
        }

        if (video.readyState < 2) {
          try { video.load(); } catch (e) {}
        }
        var p = video.play();
        if (p && typeof p.catch === 'function') {
          p.catch(function() {
            setTimeout(function() {
              video.muted = true;
              video.setAttribute('muted', '');
              video.play().catch(function() {});
            }, 100);
          });
        }
      });
    }

    function pauseGrid(grid) {
      grid.querySelectorAll('video').forEach(function(v) {
        try { v.pause(); } catch (e) {}
      });
    }

    function checkGrids() {
      grids.forEach(playGrid);
    }

    window.refreshHeroVideos = checkGrids;

    window.addEventListener('resize', checkGrids, { passive: true });
    window.addEventListener('orientationchange', checkGrids, { passive: true });

    if (!('IntersectionObserver' in window)) {
      checkGrids();
      return;
    }

    var io = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) playGrid(entry.target);
        else pauseGrid(entry.target);
      });
    }, { rootMargin: '200px 0px', threshold: 0.01 });

    grids.forEach(function(grid) { io.observe(grid); });
  })();

  // ── Autoplay local videos only while near viewport (keeps mobile smooth) ──
  window.initAutoplayVideos = function(container) {
    var root = container || document;
    var videos = root.querySelectorAll('.proj-video, .card-gif-video, .insta-reel-video, video');
    if (!videos.length) return;

    function prep(v) {
      v.muted = true;
      v.defaultMuted = true;
      v.playsInline = true;
      v.setAttribute('playsinline', '');
      v.setAttribute('webkit-playsinline', '');
      v.setAttribute('muted', '');
      v.disablePictureInPicture = true;
      if ('disableRemotePlayback' in v) v.disableRemotePlayback = true;
    }

    function tryPlay(v) {
      prep(v);
      var p = v.play();
      if (p && typeof p.catch === 'function') {
        p.catch(function() {
          setTimeout(function() {
            v.muted = true;
            v.setAttribute('muted', '');
            v.play().catch(function() {});
          }, 100);
        });
      }
    }

    videos.forEach(function(v) {
      prep(v);
    });

    if (!('IntersectionObserver' in window)) {
      videos.forEach(function(v) { tryPlay(v); });
      return;
    }

    // Observe project rows section as a whole so horizontal sliding does not pause/resume thrash
    var marqueeWrap = root.querySelectorAll('.proj-rows-section, .proj-marquee-wrap');
    if (marqueeWrap.length) {
      var marqueeIo = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          var rowVideos = entry.target.querySelectorAll('.proj-video');
          if (entry.isIntersecting) {
            rowVideos.forEach(function(v) { tryPlay(v); });
          } else {
            rowVideos.forEach(function(v) { if (!v.paused) v.pause(); });
          }
        });
      }, { rootMargin: '100px 0px', threshold: 0.001 });
      marqueeWrap.forEach(function(wrap) { marqueeIo.observe(wrap); });
    }

    // General observer for individual non-marquee videos
    var io = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        var v = entry.target;
        if (v.closest && v.closest('.proj-marquee-wrap')) return; // handled by marqueeIo
        if (entry.isIntersecting) {
          tryPlay(v);
        } else if (!v.paused) {
          v.pause();
        }
      });
    }, { rootMargin: '150px 50px', threshold: 0.001 });

    videos.forEach(function(v) {
      if (!v.closest || !v.closest('.proj-marquee-wrap')) {
        io.observe(v);
      }
    });

    var gestureEvents = ['touchstart', 'touchend', 'click', 'pointerdown'];
    function unlockAllVideos() {
      var allVids = document.querySelectorAll('.proj-video, .card-gif-video, .insta-reel-video, video');
      var vh = window.innerHeight || 800;
      allVids.forEach(function(v) {
        if (!v.paused) return;
        var rect = v.getBoundingClientRect();
        if (rect.bottom > -100 && rect.top < vh + 100) {
          tryPlay(v);
        }
      });
      gestureEvents.forEach(function(evt) {
        window.removeEventListener(evt, unlockAllVideos);
      });
    }

    if (!window._videoGestureUnlocked) {
      window._videoGestureUnlocked = true;
      gestureEvents.forEach(function(evt) {
        window.addEventListener(evt, unlockAllVideos, { passive: true, once: true });
      });
    }
  };

  // Run automatically on load
  window.initAutoplayVideos();

  // ── Circular Rotating Badge Stamp ──
  (function initCircularBadge() {
    const badges = document.querySelectorAll('.circular-badge');
    if (!badges.length) return;

    badges.forEach(badge => {
      const textContainer = badge.querySelector('.circular-badge-text');
      const text = badge.getAttribute('data-text') || 'BLINKBEYOND ★ ';
      const spinDuration = parseFloat(badge.getAttribute('data-spin-duration')) || 20;
      if (!textContainer) return;

      // 1. Split text into individual characters and wrap in spans
      const chars = [...text];
      textContainer.innerHTML = '';
      chars.forEach((char, index) => {
        const span = document.createElement('span');
        span.textContent = char;
        span.setAttribute('aria-hidden', 'true');
        textContainer.appendChild(span);
      });

      const spans = textContainer.querySelectorAll('span');

      // 2. Position letters on the circle's circumference
      const positionLetters = () => {
        let containerWidth = badge.offsetWidth;
        if (!containerWidth) {
          containerWidth = badge.getBoundingClientRect().width || 120;
        }
        
        // Subtract a bit of padding to fit letters inside container border
        const radius = containerWidth / 2 - 12;
        const totalChars = chars.length;

        spans.forEach((span, index) => {
          const angle = (360 / totalChars) * index;
          // Position tangent to circle (bottom of letter facing center)
          span.style.transform = `translate(-50%, -50%) rotate(${angle}deg) translateY(-${radius}px)`;
        });
      };

      // Recalculate positions on size changes (handles initial layout and responsive resize)
      if (window.ResizeObserver) {
        const ro = new ResizeObserver(() => {
          positionLetters();
        });
        ro.observe(badge);
      } else {
        // Fallback for older browsers
        window.addEventListener('resize', positionLetters);
      }

      // 3. Continuous rotation animation via GSAP
      if (typeof gsap === 'undefined') return;
      const tween = gsap.to(textContainer, {
        rotation: 360,
        duration: spinDuration,
        ease: 'none',
        repeat: -1
      });

      // 4. Hover behaviors (speedUp 4x faster by default)
      badge.addEventListener('mouseenter', () => {
        gsap.to(tween, { timeScale: 4, duration: 0.5, ease: 'power2.out' });
        gsap.to(badge, { scale: 1.05, duration: 0.4, ease: 'power2.out' });
      });

      badge.addEventListener('mouseleave', () => {
        gsap.to(tween, { timeScale: 1, duration: 0.5, ease: 'power2.out' });
        gsap.to(badge, { scale: 1, duration: 0.4, ease: 'power2.out' });
      });
    });
  })();

  /* ========================================
     SERVICE CAROUSEL CONTROLLER
     ======================================== */
  (function initServiceCarousels() {
    const carousels = document.querySelectorAll('.service-carousel');
    carousels.forEach(carousel => {
      const track = carousel.querySelector('.carousel-track');
      const slides = carousel.querySelectorAll('.carousel-slide');
      const prevBtn = carousel.querySelector('.carousel-prev');
      const nextBtn = carousel.querySelector('.carousel-next');
      const dots = carousel.querySelectorAll('.carousel-dot');

      if (!track || slides.length === 0) return;

      let currentIndex = 0;
      let autoSlideInterval = null;

      function goToSlide(index) {
        if (index < 0) index = slides.length - 1;
        if (index >= slides.length) index = 0;
        currentIndex = index;

        track.style.transform = `translateX(-${currentIndex * 100}%)`;

        slides.forEach((slide, i) => {
          slide.classList.toggle('active', i === currentIndex);
        });

        dots.forEach((dot, i) => {
          dot.classList.toggle('active', i === currentIndex);
        });
      }

      if (prevBtn) {
        prevBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          goToSlide(currentIndex - 1);
          resetAutoSlide();
        });
      }

      if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          goToSlide(currentIndex + 1);
          resetAutoSlide();
        });
      }

      dots.forEach((dot, index) => {
        dot.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          goToSlide(index);
          resetAutoSlide();
        });
      });

      // Touch / Swipe support
      let startX = 0;
      let isDragging = false;

      carousel.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        isDragging = true;
      }, { passive: true });

      carousel.addEventListener('touchend', (e) => {
        if (!isDragging) return;
        isDragging = false;
        const endX = e.changedTouches[0].clientX;
        const diffX = startX - endX;

        if (Math.abs(diffX) > 40) {
          if (diffX > 0) {
            goToSlide(currentIndex + 1);
          } else {
            goToSlide(currentIndex - 1);
          }
          resetAutoSlide();
        }
      }, { passive: true });

      function startAutoSlide() {
        stopAutoSlide();
        autoSlideInterval = setInterval(() => {
          goToSlide(currentIndex + 1);
        }, 3000);
      }

      function stopAutoSlide() {
        if (autoSlideInterval) clearInterval(autoSlideInterval);
      }

      function resetAutoSlide() {
        stopAutoSlide();
        startAutoSlide();
      }

      carousel.addEventListener('mouseenter', stopAutoSlide);
      carousel.addEventListener('mouseleave', startAutoSlide);

      startAutoSlide();
    });
  })();

  /* ===================================================
     CREATORS SCROLL-PIN HERO ANIMATION (jaeco.fr inspired)
     Pure White pinned stage scrubbed with GSAP ScrollTrigger
     =================================================== */
  function initCreatorsHeroPin() {
    const section = document.getElementById('creators-section');
    if (!section) return;
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    gsap.registerPlugin(ScrollTrigger);

    const cardNilesh = section.querySelector('.card-nilesh');
    const cardGaurav = section.querySelector('.card-gaurav');
    const cardKhushi = section.querySelector('.card-khushi');
    const propSocial = section.querySelector('.prop-social');
    const propWeb = section.querySelector('.prop-web');
    const propBranding = section.querySelector('.prop-branding');
    const propAds = section.querySelector('.prop-ads');
    const propSeo = section.querySelector('.prop-seo');
    const badgeSeal = section.querySelector('#badgeSeal');

    const isMobile = window.innerWidth <= 768;

    // Initial positioning offscreen and transparent
    if (cardNilesh) {
      gsap.set(cardNilesh, {
        xPercent: -50,
        yPercent: -50,
        x: isMobile ? '40vw' : '45vw',
        y: '65vh',
        rotation: 22,
        scale: 0.85,
        opacity: 0,
        force3D: true
      });
    }

    if (cardGaurav) {
      gsap.set(cardGaurav, {
        xPercent: -50,
        yPercent: -50,
        x: isMobile ? '-40vw' : '-45vw',
        y: '65vh',
        rotation: -22,
        scale: 0.85,
        opacity: 0,
        force3D: true
      });
    }

    if (cardKhushi) {
      gsap.set(cardKhushi, {
        xPercent: -50,
        yPercent: -50,
        x: '0vw',
        y: '75vh',
        rotation: 14,
        scale: 0.85,
        opacity: 0,
        force3D: true
      });
    }

    if (propSocial) {
      gsap.set(propSocial, {
        xPercent: -50,
        yPercent: -50,
        x: '-55vw',
        y: '-15vh',
        rotation: -18,
        scale: 0.8,
        opacity: 0,
        force3D: true
      });
    }

    if (propWeb) {
      gsap.set(propWeb, {
        xPercent: -50,
        yPercent: -50,
        x: '50vw',
        y: '-50vh',
        rotation: 16,
        scale: 0.8,
        opacity: 0,
        force3D: true
      });
    }

    if (propBranding) {
      gsap.set(propBranding, {
        xPercent: -50,
        yPercent: -50,
        x: '55vw',
        y: '12vh',
        rotation: 14,
        scale: 0.8,
        opacity: 0,
        force3D: true
      });
    }

    if (propAds) {
      gsap.set(propAds, {
        xPercent: -50,
        yPercent: -50,
        x: '-50vw',
        y: '50vh',
        rotation: -12,
        scale: 0.8,
        opacity: 0,
        force3D: true
      });
    }

    if (propSeo) {
      gsap.set(propSeo, {
        xPercent: -50,
        yPercent: -50,
        x: '-6vw',
        y: '-55vh',
        rotation: -10,
        scale: 0.8,
        opacity: 0,
        force3D: true
      });
    }

    if (badgeSeal) {
      gsap.set(badgeSeal, { opacity: 0, scale: 0.5, force3D: true });
    }

    const stickyStage = section.querySelector('.hero-pin__sticky');
    const heroTitle = section.querySelector('.hero-title');
    const heroEyebrow = section.querySelector('.hero-eyebrow');
    const heroSub = section.querySelector('.hero-sub');

    // Initial night state matching manifesto (#0a0a0f)
    gsap.set([section, stickyStage], { backgroundColor: '#0a0a0f' });
    if (heroTitle) gsap.set(heroTitle, { color: '#ffffff' });
    if (heroEyebrow) gsap.set(heroEyebrow, { color: 'rgba(255, 255, 255, 0.65)' });
    if (heroSub) gsap.set(heroSub, { color: 'rgba(255, 255, 255, 0.5)' });

    // Settled coordinates at peak density (0.45 - 0.65)
    const nileshPeakX = isMobile ? '24vw' : '18vw';
    const gauravPeakX = isMobile ? '-24vw' : '-18vw';
    const khushiPeakY = isMobile ? '8vh' : '5vh';

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: () => '+=' + (window.innerHeight * 2.5),
        pin: true,
        pinSpacing: true,
        scrub: 0.4,
        anticipatePin: 1,
        fastScrollEnd: true,
        preventOverlaps: true,
        invalidateOnRefresh: true
      }
    });

    // 0.00 -> 0.12: Night to Pure White transition (night to day, zero divider)
    tl.to([section, stickyStage], {
      backgroundColor: '#ffffff',
      ease: 'power2.inOut',
      duration: 12
    }, 0);

    if (heroTitle) {
      tl.to(heroTitle, {
        color: '#0a0a0a',
        ease: 'power2.inOut',
        duration: 12
      }, 0);
    }

    if (heroEyebrow) {
      tl.to(heroEyebrow, {
        color: 'rgba(10, 10, 10, 0.55)',
        ease: 'power2.inOut',
        duration: 12
      }, 0);
    }

    if (heroSub) {
      tl.to(heroSub, {
        color: 'rgba(10, 10, 10, 0.45)',
        ease: 'power2.inOut',
        duration: 12
      }, 0);
    }

    // 0.10 -> 0.25: Nilesh & Gaurav fly in onto the pure white stage
    if (cardNilesh) {
      tl.to(cardNilesh, {
        x: nileshPeakX,
        y: '3vh',
        rotation: 6,
        scale: 1,
        opacity: 1,
        ease: 'power2.out',
        duration: 17
      }, 10);
    }

    if (cardGaurav) {
      tl.to(cardGaurav, {
        x: gauravPeakX,
        y: '2vh',
        rotation: -7,
        scale: 1,
        opacity: 1,
        ease: 'power2.out',
        duration: 17
      }, 11);
    }

    // 0.20 -> 0.45: Khushi & props fly in
    if (cardKhushi) {
      tl.to(cardKhushi, {
        x: '1vw',
        y: khushiPeakY,
        rotation: 2,
        scale: 1.04,
        opacity: 1,
        ease: 'power2.out',
        duration: 22
      }, 20);
    }

    if (propSocial) {
      tl.to(propSocial, {
        x: isMobile ? '-32vw' : '-28vw',
        y: '-16vh',
        rotation: -8,
        scale: 1,
        opacity: 1,
        ease: 'power2.out',
        duration: 18
      }, 22);
    }

    if (propWeb) {
      tl.to(propWeb, {
        x: isMobile ? '30vw' : '26vw',
        y: '-18vh',
        rotation: 7,
        scale: 1,
        opacity: 1,
        ease: 'power2.out',
        duration: 18
      }, 24);
    }

    if (propBranding) {
      tl.to(propBranding, {
        x: isMobile ? '34vw' : '30vw',
        y: '7vh',
        rotation: 5,
        scale: 1,
        opacity: 1,
        ease: 'power2.out',
        duration: 18
      }, 26);
    }

    if (propAds) {
      tl.to(propAds, {
        x: isMobile ? '-30vw' : '-26vw',
        y: '22vh',
        rotation: -4,
        scale: 1,
        opacity: 1,
        ease: 'power2.out',
        duration: 18
      }, 28);
    }

    if (propSeo) {
      tl.to(propSeo, {
        x: '-5vw',
        y: '-25vh',
        rotation: -2,
        scale: 1,
        opacity: 1,
        ease: 'power2.out',
        duration: 18
      }, 30);
    }

    // 0.45 -> 0.65: Peak density subtle floating drift
    if (cardNilesh) {
      tl.to(cardNilesh, { x: isMobile ? '22vw' : '16vw', y: '-2vh', rotation: 4, ease: 'none', duration: 20 }, 45);
    }
    if (cardGaurav) {
      tl.to(cardGaurav, { x: isMobile ? '-22vw' : '-16vw', y: '-3vh', rotation: -5, ease: 'none', duration: 20 }, 45);
    }
    if (cardKhushi) {
      tl.to(cardKhushi, { x: '0vw', y: isMobile ? '6vh' : '3vh', rotation: 1, ease: 'none', duration: 20 }, 45);
    }

    if (propSocial) {
      tl.to(propSocial, { x: isMobile ? '-30vw' : '-26vw', y: '-18vh', rotation: -5, ease: 'none', duration: 20 }, 45);
    }
    if (propWeb) {
      tl.to(propWeb, { x: isMobile ? '28vw' : '24vw', y: '-20vh', rotation: 5, ease: 'none', duration: 20 }, 45);
    }
    if (propBranding) {
      tl.to(propBranding, { x: isMobile ? '32vw' : '28vw', y: '5vh', rotation: 3, ease: 'none', duration: 20 }, 45);
    }
    if (propAds) {
      tl.to(propAds, { x: isMobile ? '-28vw' : '-24vw', y: '20vh', rotation: -2, ease: 'none', duration: 20 }, 45);
    }
    if (propSeo) {
      tl.to(propSeo, { x: '-4vw', y: '-27vh', rotation: 0, ease: 'none', duration: 20 }, 45);
    }

    // 0.65 -> 0.84: Fly-through pass-through exits
    if (cardNilesh) {
      tl.to(cardNilesh, {
        x: '-32vw',
        y: '-65vh',
        rotation: -6,
        opacity: 0,
        scale: 0.9,
        ease: 'power2.in',
        duration: 19
      }, 65);
    }

    if (cardGaurav) {
      tl.to(cardGaurav, {
        x: '32vw',
        y: '-65vh',
        rotation: 6,
        opacity: 0,
        scale: 0.9,
        ease: 'power2.in',
        duration: 19
      }, 65);
    }

    if (cardKhushi) {
      tl.to(cardKhushi, {
        x: '-2vw',
        y: '-70vh',
        rotation: -3,
        opacity: 0,
        scale: 0.9,
        ease: 'power2.in',
        duration: 19
      }, 65);
    }

    if (propSocial) {
      tl.to(propSocial, {
        x: '45vw',
        y: '-35vh',
        rotation: 12,
        opacity: 0,
        ease: 'power2.in',
        duration: 17
      }, 66);
    }

    if (propWeb) {
      tl.to(propWeb, {
        x: '-42vw',
        y: '35vh',
        rotation: -10,
        opacity: 0,
        ease: 'power2.in',
        duration: 17
      }, 66);
    }

    if (propBranding) {
      tl.to(propBranding, {
        x: '-48vw',
        y: '-25vh',
        rotation: -8,
        opacity: 0,
        ease: 'power2.in',
        duration: 17
      }, 67);
    }

    if (propAds) {
      tl.to(propAds, {
        x: '42vw',
        y: '-48vh',
        rotation: 10,
        opacity: 0,
        ease: 'power2.in',
        duration: 17
      }, 67);
    }

    if (propSeo) {
      tl.to(propSeo, {
        x: '10vw',
        y: '55vh',
        rotation: 8,
        opacity: 0,
        ease: 'power2.in',
        duration: 17
      }, 68);
    }

    // 0.82 -> 0.92: Rotating seal badge reveals and holds
    if (badgeSeal) {
      tl.to(badgeSeal, {
        opacity: 1,
        scale: 1,
        ease: 'back.out(1.4)',
        duration: 10
      }, 82);
    }
  }

  // Initialize creators scroll-pin hero animation
  initCreatorsHeroPin();
});

