/**
 * ParticleText - Vanilla JS
 * Renders text as interactive particles on a canvas.
 * Mouse cursor pushes particles away; they spring back to their base positions.
 * Adapted from the Framer ParticleText component.
 */

(function () {
  'use strict';

  const CONFIG = {
    text: 'BLINK BEYOND',
    particleColor: '#FFFFFF',
    particleSize: 2,
    particleDensity: 3,      // lower = denser
    mouseRadius: 120,
    returnSpeed: 0.045,
    fontFamily: "'Barlow Condensed', sans-serif",
    fontWeight: '900'
  };

  function initParticleText(canvas) {
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    let particles = [];
    let mouse = { x: -1000, y: -1000 };
    let animationFrame = null;
    let isVisible = false;
    let initialized = false;

    function buildParticles() {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      if (w === 0 || h === 0) return;

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);

      // Binary search for the largest font size that fits the full width
      // with small horizontal padding so no letter gets clipped
      const hPad = w * 0.02; // 2% padding each side
      const maxTextWidth = w - hPad * 2;

      let lo = 10, hi = h * 2, bestSize = lo;
      ctx.textBaseline = 'middle';

      while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2);
        ctx.font = CONFIG.fontWeight + ' ' + mid + 'px ' + CONFIG.fontFamily;
        const measured = ctx.measureText(CONFIG.text).width;
        if (measured <= maxTextWidth) {
          bestSize = mid;
          lo = mid + 1;
        } else {
          hi = mid - 1;
        }
      }

      const fontSize = bestSize;

      // Draw text centered
      ctx.fillStyle = CONFIG.particleColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = CONFIG.fontWeight + ' ' + fontSize + 'px ' + CONFIG.fontFamily;
      ctx.fillText(CONFIG.text, w / 2, h / 2);

      // Extract pixel data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;

      particles = [];
      const gap = Math.max(2, CONFIG.particleDensity);

      for (let y = 0; y < canvas.height; y += gap) {
        for (let x = 0; x < canvas.width; x += gap) {
          const index = (y * canvas.width + x) * 4;
          const alpha = pixels[index + 3];

          if (alpha > 128) {
            const px = x / dpr;
            const py = y / dpr;
            particles.push({
              x: px,
              y: py,
              baseX: px,
              baseY: py,
              vx: 0,
              vy: 0
            });
          }
        }
      }

      initialized = true;
    }

    function animate() {
      if (!initialized) {
        animationFrame = requestAnimationFrame(animate);
        return;
      }

      const dpr = window.devicePixelRatio || 1;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;

      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Push particles away from mouse
        if (distance < CONFIG.mouseRadius) {
          const force = (CONFIG.mouseRadius - distance) / CONFIG.mouseRadius;
          const angle = Math.atan2(dy, dx);
          p.vx -= Math.cos(angle) * force * 2;
          p.vy -= Math.sin(angle) * force * 2;
        }

        // Return to base position
        p.vx += (p.baseX - p.x) * CONFIG.returnSpeed;
        p.vy += (p.baseY - p.y) * CONFIG.returnSpeed;

        // Damping
        p.vx *= 0.95;
        p.vy *= 0.95;

        p.x += p.vx;
        p.y += p.vy;

        // Draw particle
        ctx.fillStyle = CONFIG.particleColor;
        ctx.beginPath();
        ctx.arc(p.x, p.y, CONFIG.particleSize, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrame = requestAnimationFrame(animate);
    }

    function onMouseMove(e) {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    }

    function onTouchMove(e) {
      if (e.touches.length > 0) {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.touches[0].clientX - rect.left;
        mouse.y = e.touches[0].clientY - rect.top;
      }
    }

    function onMouseLeave() {
      mouse.x = -1000;
      mouse.y = -1000;
    }

    function onTouchEnd() {
      mouse.x = -1000;
      mouse.y = -1000;
    }

    // Observe visibility with IntersectionObserver for perf
    const observer = new IntersectionObserver(
      function(entries) {
        entries.forEach(function(entry) {
          isVisible = entry.isIntersecting;
          if (isVisible && !animationFrame) {
            animationFrame = requestAnimationFrame(animate);
          } else if (!isVisible && animationFrame) {
            cancelAnimationFrame(animationFrame);
            animationFrame = null;
          }
        });
      },
      { threshold: 0.05 }
    );

    // Resize handler with debounce
    var resizeTimeout;
    function onResize() {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(function() {
        if (animationFrame) {
          cancelAnimationFrame(animationFrame);
          animationFrame = null;
        }
        initialized = false;
        buildParticles();
        if (isVisible) {
          animationFrame = requestAnimationFrame(animate);
        }
      }, 200);
    }

    // Bind events
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseleave', onMouseLeave);
    canvas.addEventListener('touchmove', onTouchMove, { passive: true });
    canvas.addEventListener('touchend', onTouchEnd);
    window.addEventListener('resize', onResize);

    // Build + start
    buildParticles();
    observer.observe(canvas);

    // If custom web fonts finish loading, rebuild particles with exact font glyphs
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        initialized = false;
        buildParticles();
      });
    }

    // Always start animation (observer may not trigger if already in view)
    animationFrame = requestAnimationFrame(animate);
  }

  // Auto-init on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      initParticleText(document.getElementById('particleTextCanvas'));
    });
  } else {
    initParticleText(document.getElementById('particleTextCanvas'));
  }
})();
