/**
 * Text Bloom (Inline Media Text)
 * Adapted from Framer Text-Bloom component (https://framer.com/m/Text-Bloom-hovyz1.js)
 * Embeds responsive, cycling media thumbnails directly into paragraph text that
 * expand smoothly into rich preview cards on hover or tap.
 */
(function () {
  'use strict';

  const MEDIA_SLOTS = [
    {
      id: 0,
      srcs: [
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80',
        'https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg'
      ],
      alt: 'Creative Visuals'
    },
    {
      id: 1,
      srcs: [
        'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=600&q=80',
        'https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg'
      ],
      alt: 'Brand Storytelling'
    },
    {
      id: 2,
      srcs: [
        'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
        'https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg'
      ],
      alt: 'Digital Strategy'
    },
    {
      id: 3,
      srcs: [
        'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
        'https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg'
      ],
      alt: 'Unforgettable Impact'
    }
  ];

  function createSlotElement(slotData) {
    const slot = document.createElement('span');
    slot.className = 'imt-slot';
    slot.setAttribute('tabindex', '0');
    slot.setAttribute('role', 'button');
    slot.setAttribute('aria-label', slotData.alt || 'Visual preview');

    const inner = document.createElement('span');
    inner.className = 'imt-bloom-inner';

    slotData.srcs.forEach((src, idx) => {
      const img = document.createElement('img');
      img.src = src;
      img.alt = slotData.alt;
      img.loading = 'lazy';
      img.decoding = 'async';
      if (idx === 0) img.classList.add('is-active');
      inner.appendChild(img);
    });

    slot.appendChild(inner);

    // Touch tap toggle for mobile
    slot.addEventListener('click', function (e) {
      e.stopPropagation();
      const wasExpanded = slot.classList.contains('is-expanded');
      document.querySelectorAll('.imt-slot.is-expanded').forEach(el => el.classList.remove('is-expanded'));
      if (!wasExpanded) {
        slot.classList.add('is-expanded');
      }
    });

    return slot;
  }

  function initTextBloom() {
    const paragraph = document.getElementById('textRevealParagraph');
    if (!paragraph) return;

    // The text with insertion markers
    const textPieces = [
      "Your story is created to inspire, connect,",
      "and lead the next generation of visual experiences. Yet it often gets lost in noisy digital feeds without driving the impact you deserve.",
      "It's time for a change.",
      "We blend strategic creativity, cinematic visual storytelling, and cutting-edge digital execution to elevate your brand from unnoticed to unforgettable."
    ];

    paragraph.innerHTML = '';
    paragraph.classList.add('text-bloom-wrap');

    const slots = [];

    textPieces.forEach((piece, index) => {
      // Create words
      const words = piece.trim().split(/\s+/);
      words.forEach(word => {
        const span = document.createElement('span');
        span.className = 'reveal-word';
        span.textContent = word;
        paragraph.appendChild(span);
        paragraph.appendChild(document.createTextNode(' '));
      });

      // Insert media slot after each piece
      if (index < MEDIA_SLOTS.length) {
        const slotEl = createSlotElement(MEDIA_SLOTS[index]);
        paragraph.appendChild(slotEl);
        paragraph.appendChild(document.createTextNode(' '));
        slots.push(slotEl);
      }
    });

    // Close any expanded slot on outside click
    document.addEventListener('click', function () {
      document.querySelectorAll('.imt-slot.is-expanded').forEach(el => el.classList.remove('is-expanded'));
    });

    // Cycle images in each slot every 3 seconds with smooth crossfade
    slots.forEach((slot, slotIdx) => {
      const images = slot.querySelectorAll('.imt-bloom-inner img');
      if (images.length <= 1) return;

      let currentIdx = 0;
      const intervalDelay = 3000 + slotIdx * 450; // slightly staggered cycling

      setInterval(() => {
        images[currentIdx].classList.remove('is-active');
        currentIdx = (currentIdx + 1) % images.length;
        images[currentIdx].classList.add('is-active');
      }, intervalDelay);
    });

    // Scroll reveal word-by-word (clean, NO neon glow)
    const wordEls = Array.from(paragraph.querySelectorAll('.reveal-word'));
    const revealCard = document.getElementById('textRevealCard');

    function updateWordReveal() {
      if (!revealCard) return;
      const rect = revealCard.getBoundingClientRect();
      const windowH = window.innerHeight;

      const startVal = windowH * 0.85;
      const endVal = windowH * 0.30;

      let progress = (startVal - rect.top) / (startVal - endVal);
      progress = Math.max(0, Math.min(1, progress));

      const totalWords = wordEls.length;
      const revealedCount = Math.floor(progress * (totalWords + 1));

      wordEls.forEach((el, idx) => {
        if (idx < revealedCount) {
          el.classList.add('is-revealed');
        } else {
          el.classList.remove('is-revealed');
        }
      });
    }

    window.addEventListener('scroll', updateWordReveal, { passive: true });
    window.addEventListener('resize', updateWordReveal, { passive: true });
    updateWordReveal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTextBloom);
  } else {
    initTextBloom();
  }
})();
