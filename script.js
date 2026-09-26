/**
 * قاعدة العمل لمشاريع خلدون وأنتي جرافيتي · حريق سوق المدينة بحلب القديمة 2012
 * البرمجة التفاعلية المستقلة — script.js
 */

document.addEventListener('DOMContentLoaded', () => {

  // 1 · شريط تقدم القراءة
  const readingProgressBar = document.getElementById('readingProgressBar');
  const updateReadingProgress = () => {
    if (!readingProgressBar) return;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    readingProgressBar.style.width = `${Math.min(100, Math.max(0, scrollPercent))}%`;
  };
  window.addEventListener('scroll', updateReadingProgress, { passive: true });

  // 2 · مؤشر الكشاف التوثيقي (Spotlight Cursor)
  const spotlightCursor = document.getElementById('spotlightCursor');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (spotlightCursor && !prefersReducedMotion && window.innerWidth > 768) {
    let mouseX = 0;
    let mouseY = 0;
    let cursorX = 0;
    let cursorY = 0;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    }, { passive: true });

    const animateCursor = () => {
      cursorX += (mouseX - cursorX) * 0.15;
      cursorY += (mouseY - cursorY) * 0.15;
      spotlightCursor.style.left = `${cursorX}px`;
      spotlightCursor.style.top = `${cursorY}px`;
      requestAnimationFrame(animateCursor);
    };
    requestAnimationFrame(animateCursor);
  }

  // 3 · عدادات الأرقام التوثيقية المعتمدة (§8.4)
  const statNumbers = document.querySelectorAll('.stat-number');
  if (statNumbers.length > 0) {
    const animateStat = (el) => {
      const targetStr = el.getAttribute('data-target');
      const targetNum = parseInt(targetStr, 10);
      if (isNaN(targetNum)) return;

      if (prefersReducedMotion) {
        return; // الإبقاء على القيمة النهائية فوراً
      }

      let current = 0;
      const duration = 1200;
      const stepTime = 20;
      const increment = targetNum / (duration / stepTime);

      const timer = setInterval(() => {
        current += increment;
        if (current >= targetNum) {
          clearInterval(timer);
          if (targetStr.includes('+')) {
            el.textContent = `${targetNum}+`;
          } else if (targetStr.includes('°')) {
            el.textContent = `${targetNum}°C`;
          } else {
            el.textContent = targetNum;
          }
        } else {
          el.textContent = Math.floor(current);
        }
      }, stepTime);
    };

    const statObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateStat(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    statNumbers.forEach((num) => statObserver.observe(num));
  }

  // 4 · وحدة المقارنة الجنائية البصرية (Forensic Comparison Slider)
  const comparisonWidget = document.getElementById('comparisonWidget');
  const compSliderHandle = document.getElementById('compSliderHandle');

  if (comparisonWidget && compSliderHandle) {
    let isDragging = false;

    const setSliderPosition = (xPos) => {
      const rect = comparisonWidget.getBoundingClientRect();
      let percent = ((xPos - rect.left) / rect.width) * 100;
      percent = Math.max(0, Math.min(100, percent));

      document.documentElement.style.setProperty('--slider-pos', `${percent}%`);
      compSliderHandle.setAttribute('aria-valuenow', Math.round(percent));
    };

    const onPointerMove = (e) => {
      if (!isDragging) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      setSliderPosition(clientX);
    };

    const stopDragging = () => {
      isDragging = false;
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', stopDragging);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', stopDragging);
    };

    const startDragging = (e) => {
      isDragging = true;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      setSliderPosition(clientX);

      window.addEventListener('mousemove', onPointerMove, { passive: true });
      window.addEventListener('mouseup', stopDragging);
      window.addEventListener('touchmove', onPointerMove, { passive: true });
      window.addEventListener('touchend', stopDragging);
    };

    comparisonWidget.addEventListener('mousedown', startDragging);
    comparisonWidget.addEventListener('touchstart', startDragging, { passive: true });

    compSliderHandle.addEventListener('keydown', (e) => {
      const currentVal = parseInt(compSliderHandle.getAttribute('aria-valuenow') || '50', 10);
      let newVal = currentVal;

      if (e.key === 'ArrowLeft') {
        newVal = Math.max(0, currentVal - 5);
      } else if (e.key === 'ArrowRight') {
        newVal = Math.min(100, currentVal + 5);
      }

      if (newVal !== currentVal) {
        document.documentElement.style.setProperty('--slider-pos', `${newVal}%`);
        compSliderHandle.setAttribute('aria-valuenow', newVal);
      }
    });
  }

  // 5 · عارض الصور التوثيقي المكبر (Forensic Lightbox)
  const galleryCards = document.querySelectorAll('.gallery-card');
  const lightboxModal = document.getElementById('lightboxModal');
  const lightboxBackdrop = document.getElementById('lightboxBackdrop');
  const lightboxClose = document.getElementById('lightboxClose');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxTitle = document.getElementById('lightboxTitle');
  const lightboxDesc = document.getElementById('lightboxDesc');
  const lightboxCamera = document.getElementById('lightboxCamera');
  const lbPrev = document.getElementById('lbPrev');
  const lbNext = document.getElementById('lbNext');

  let activeIndex = 0;
  let previousFocusedElement = null;

  const galleryData = Array.from(galleryCards).map((card) => {
    const img = card.querySelector('img');
    const title = card.querySelector('.card-title')?.textContent || '';
    const desc = card.querySelector('.card-desc')?.textContent || '';
    const metaSpans = card.querySelectorAll('.card-meta span');
    const cameraSpecs = Array.from(metaSpans).map((s) => s.textContent).join(' · ');

    return {
      src: img?.getAttribute('src') || '',
      alt: img?.getAttribute('alt') || '',
      title,
      desc,
      camera: cameraSpecs
    };
  });

  const renderLightbox = (index) => {
    if (index < 0 || index >= galleryData.length) return;
    activeIndex = index;
    const item = galleryData[activeIndex];

    if (lightboxImg) {
      lightboxImg.src = item.src;
      lightboxImg.alt = item.alt;
    }
    if (lightboxTitle) lightboxTitle.textContent = item.title;
    if (lightboxDesc) lightboxDesc.textContent = item.desc;
    if (lightboxCamera) lightboxCamera.textContent = item.camera;
  };

  const openLightbox = (index) => {
    previousFocusedElement = document.activeElement;
    renderLightbox(index);
    if (lightboxModal) {
      lightboxModal.classList.add('is-active');
      lightboxModal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      if (lightboxClose) lightboxClose.focus();
    }
  };

  const closeLightbox = () => {
    if (lightboxModal) {
      lightboxModal.classList.remove('is-active');
      lightboxModal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (previousFocusedElement) previousFocusedElement.focus();
    }
  };

  galleryCards.forEach((card, idx) => {
    card.addEventListener('click', () => openLightbox(idx));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openLightbox(idx);
      }
    });
  });

  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightboxBackdrop) lightboxBackdrop.addEventListener('click', closeLightbox);

  if (lbPrev) {
    lbPrev.addEventListener('click', () => {
      const nextIndex = activeIndex > 0 ? activeIndex - 1 : galleryData.length - 1;
      renderLightbox(nextIndex);
    });
  }

  if (lbNext) {
    lbNext.addEventListener('click', () => {
      const nextIndex = activeIndex < galleryData.length - 1 ? activeIndex + 1 : 0;
      renderLightbox(nextIndex);
    });
  }

  document.addEventListener('keydown', (e) => {
    if (!lightboxModal || !lightboxModal.classList.contains('is-active')) return;

    if (e.key === 'Escape') {
      closeLightbox();
    } else if (e.key === 'ArrowRight') {
      // في اللغة العربية السهم الأيمن ينقل للسابق
      const prevIdx = activeIndex > 0 ? activeIndex - 1 : galleryData.length - 1;
      renderLightbox(prevIdx);
    } else if (e.key === 'ArrowLeft') {
      // السهم الأيسر ينقل للتالي
      const nextIdx = activeIndex < galleryData.length - 1 ? activeIndex + 1 : 0;
      renderLightbox(nextIdx);
    }
  });

  // 6 · نموذج ميثاق الوفاء والربط السحابي الحقيقي (§4.10)
  const pledgeForm = document.getElementById('pledgeForm');
  const submitBtn = document.getElementById('submitBtn');
  const formFeedback = document.getElementById('formFeedback');

  let lastSubmissionTime = 0;
  const RATE_LIMIT_MS = 30000; // مهلة 30 ثانية بين إرسالين (§4.10.4)

  if (pledgeForm) {
    pledgeForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // فحص مهلة الإرسال
      const now = Date.now();
      if (now - lastSubmissionTime < RATE_LIMIT_MS) {
        const remaining = Math.ceil((RATE_LIMIT_MS - (now - lastSubmissionTime)) / 1000);
        showFeedback(`يرجى الانتظار ${remaining} ثانية قبل تسجيل توقيع آخر حفاظاً على سلامة السجل.`, 'error');
        return;
      }

      // فحص حقل المصيدة (Botcheck)
      const botcheck = pledgeForm.querySelector('input[name="botcheck"]');
      if (botcheck && botcheck.checked) {
        return; // تجاهل البوتات بصمت
      }

      // تجهيز واجهة الإرسال
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.classList.add('is-submitting');
      }

      showFeedback('جارٍ توثيق وثيقة الوفاء في السجل الوطني...', 'info');

      try {
        const formData = new FormData(pledgeForm);
        const response = await fetch(pledgeForm.action, {
          method: 'POST',
          body: formData,
          headers: {
            'Accept': 'application/json'
          }
        });

        const result = await response.json();

        if (response.ok && (result.success || result.message)) {
          lastSubmissionTime = Date.now();
          showFeedback('تم تسجيل شهادتك وتعهدك بنجاح في سجل ذاكرة حلب التوثيقية. سواعد السوريين لن تنسى.', 'success');
          pledgeForm.reset();
        } else {
          showFeedback('حدث تعذر مؤقت أثناء الاتصال بقاعدة البيانات. يرجى المحاولة بعد لحظات.', 'error');
        }
      } catch (err) {
        showFeedback('تعذر إرسال الوثيقة نتيجة انقطاع الاتصال بالشبكة. يرجى التأكد من اتصالك وإعادة المحاولة.', 'error');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.classList.remove('is-submitting');
        }
      }
    });
  }

  function showFeedback(message, type) {
    if (!formFeedback) return;
    formFeedback.textContent = message;
    formFeedback.className = 'form-feedback';

    if (type === 'success') {
      formFeedback.classList.add('is-success');
    } else if (type === 'error') {
      formFeedback.classList.add('is-error');
    } else {
      formFeedback.style.display = 'block';
    }
  }

});
