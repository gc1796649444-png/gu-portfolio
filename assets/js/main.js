/* ==========================================================================
   咕咕手账工坊 · 单页五板块（柔和翻页）
   ========================================================================== */
(function () {
  'use strict';

  var doc = document;
  var html = doc.documentElement;
  html.classList.remove('no-js');
  html.classList.add('js');

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var gsap = window.gsap;
  var ScrollTrigger = window.ScrollTrigger;
  var motion = !reduced && gsap && ScrollTrigger;
  var coarse = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  var narrow = window.matchMedia('(max-width: 720px)').matches;
  var audioReady = false;
  function markAudioReady() { audioReady = true; }
  window.addEventListener('pointerdown', markAudioReady, { once: true });
  window.addEventListener('keydown', markAudioReady, { once: true });

  /* ---------- 板块 ---------- */
  var sections = Array.prototype.slice.call(doc.querySelectorAll('.page'));
  var navLinks = Array.prototype.slice.call(doc.querySelectorAll('[data-nav]'));
  var hintText = doc.getElementById('next-hint-text');
  var HINT_COPY = ['滚动查看工作经历', '继续看作品集', '看视频作品', '认识咕咕顾', '继续看个人技能', '联系我', '回到顶部'];

  var lock = false;
  var animId = null;

  function currentIndex() {
    var y = window.scrollY + window.innerHeight * 0.45;
    var idx = 0;
    for (var i = 0; i < sections.length; i++) {
      if (y >= sections[i].offsetTop) idx = i;
    }
    return idx;
  }

  function setActive(idx) {
    navLinks.forEach(function (link) {
      var on = link.getAttribute('href') === '#' + sections[idx].id;
      link.classList.toggle('is-active', on);
    });
  }

  function updateHint(idx) {
    if (!hintText) return;
    hintText.textContent = HINT_COPY[idx] || '';
    var hint = hintText.parentNode;
    hint.style.opacity = (idx === sections.length - 1) ? '.55' : '1';
    hint.classList.toggle('is-top', idx === sections.length - 1);
  }

  function easeInOutQuint(t) {
    return t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2;
  }

  function animateScrollTo(targetY, duration, done) {
    if (animId) cancelAnimationFrame(animId);
    var startY = window.scrollY;
    var diff = targetY - startY;
    if (Math.abs(diff) < 2 || duration <= 0 || reduced) {
      window.scrollTo(0, targetY);
      if (done) done();
      return;
    }
    var t0 = performance.now();
    (function step(now) {
      var p = Math.min(1, (now - t0) / duration);
      window.scrollTo(0, startY + diff * easeInOutQuint(p));
      if (p < 1) {
        animId = requestAnimationFrame(step);
      } else if (done) {
        done();
      }
    })(t0);
  }

  function goTo(i, opts) {
    opts = opts || {};
    i = Math.max(0, Math.min(sections.length - 1, i));
    if (lock && !opts.force) return;
    lock = true;
    setActive(i);
    updateHint(i);
    animateScrollTo(sections[i].offsetTop, opts.instant || reduced ? 0 : 1450, function () {
      lock = false;
      if (ScrollTrigger) ScrollTrigger.refresh();
    });
  }

  /* ---------- 导航定位 ---------- */
  navLinks.forEach(function (link) {
    link.addEventListener('click', function (e) {
      var id = link.getAttribute('href').slice(1);
      var target = -1;
      sections.forEach(function (s, i) { if (s.id === id) target = i; });
      if (target === -1) return;
      e.preventDefault();
      html.classList.remove('menu-open');
      var toggle = doc.querySelector('.nav-toggle');
      if (toggle) toggle.setAttribute('aria-expanded', 'false');
      goTo(target, { force: true });
    });
  });

  /* ---------- 滚动翻页（柔和） ---------- */
  window.addEventListener('wheel', function (e) {
    if (Math.abs(e.deltaY) < 6) return;
    if (lock) { e.preventDefault(); return; }
  var idx = currentIndex();
  var dir = e.deltaY > 0 ? 1 : -1;
  var sec = sections[idx];
  var secZone = sec.id === 'works' || sec.id === 'video' || sec.id === 'ip';
  if (secZone) {
    if (dir < 0 && window.scrollY <= sec.offsetTop + 2 && idx > 0) {
      e.preventDefault();
      goTo(idx - 1);
    }
    return;
  }
  var vh = window.innerHeight;
    var secTop = sec.offsetTop;
    var secBottom = sec.offsetTop + sec.offsetHeight;
    if (dir > 0 && window.scrollY + vh < secBottom - 6) return;
    if (dir < 0 && window.scrollY > secTop + 6) return;
    var next = idx + dir;
    if (next >= 0 && next < sections.length) {
      e.preventDefault();
      goTo(next);
    }
  }, { passive: false });

  /* ---------- 键盘翻页 ---------- */
  window.addEventListener('keydown', function (e) {
    var tag = (e.target && e.target.tagName) || '';
    if (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'].indexOf(tag) !== -1) return;
    var idx = currentIndex();
    var down = (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ');
    var up = (e.key === 'ArrowUp' || e.key === 'PageUp');
    var sec = sections[idx];
    var secZone = sec.id === 'works' || sec.id === 'video' || sec.id === 'ip';
    if (secZone) {
      if (up && window.scrollY <= sec.offsetTop + 2 && idx > 0) {
        e.preventDefault();
        goTo(idx - 1);
      }
      return;
    }
    var vh = window.innerHeight;
    var secTop = sec.offsetTop;
    var secBottom = sec.offsetTop + sec.offsetHeight;
    if ((down && window.scrollY + vh < secBottom - 6) || (up && window.scrollY > secTop + 6)) return;
    if (down) {
      e.preventDefault();
      goTo(idx + 1);
    } else if (up) {
      e.preventDefault();
      goTo(idx - 1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      goTo(0, { force: true });
    } else if (e.key === 'End') {
      e.preventDefault();
      goTo(sections.length - 1, { force: true });
    }
  });

  /* ---------- 当前板块高亮 + 浮动提示 ---------- */
  var scrollTick = false;
  window.addEventListener('scroll', function () {
    if (scrollTick) return;
    scrollTick = true;
    requestAnimationFrame(function () {
      var idx = currentIndex();
      setActive(idx);
      updateHint(idx);
      scrollTick = false;
    });
  }, { passive: true });

  /* ---------- 设计作品悬停：全貌预览（仅图片，无视频元素） ---------- */
  var workPreview = doc.getElementById('work-preview');
  var workPreviewImg = doc.getElementById('work-preview-img');
  var workPreviewTitle = doc.getElementById('work-preview-title');
  var workPreviewType = doc.getElementById('work-preview-type');
  var previewTimer = null;
  var previewPinned = false;

  function setPreviewMeta(card) {
    var titleEl = card.querySelector('.work-title');
    workPreviewTitle.textContent = titleEl ? titleEl.textContent : '';
    var t = card.querySelector('.stitch');
    workPreviewType.textContent = t ? t.textContent.replace('·', '').trim() : '';
  }

  function showImagePreview(card) {
    var img = card.querySelector('img');
    if (!img || !workPreview) return;
    workPreviewImg.src = img.src;
    workPreviewImg.alt = img.alt || '';
    setPreviewMeta(card);
    workPreview.classList.add('show');
    workPreview.setAttribute('aria-hidden', 'false');
  }

  function hideImagePreview(force) {
    if (!workPreview) return;
    if (previewPinned && !force) return;
    workPreview.classList.remove('show');
    workPreview.setAttribute('aria-hidden', 'true');
  }

  doc.querySelectorAll('.work-card').forEach(function (card) {
    card.addEventListener('mouseenter', function () {
      clearTimeout(previewTimer);
      showImagePreview(card);
    });
    card.addEventListener('mouseleave', function () {
      clearTimeout(previewTimer);
      previewTimer = setTimeout(function () { hideImagePreview(false); }, 180);
    });
    card.addEventListener('focus', function () { showImagePreview(card); });
    card.addEventListener('blur', function () { hideImagePreview(false); });
    card.addEventListener('click', function () {
      if (previewPinned) {
        previewPinned = false;
        hideImagePreview(true);
      } else {
        previewPinned = true;
        showImagePreview(card);
      }
    });
  });
  doc.addEventListener('click', function (e) {
    if (previewPinned && !e.target.closest('.work-card')) {
      previewPinned = false;
      hideImagePreview(true);
    }
  });

  /* ---------- 视频作品：直接在卡片内悬停播放；首次点击后自动带声音 ---------- */
  var soundGranted = false;

  function refreshVideoHint(card) {
    var note = card.querySelector('.vc-note');
    if (note) note.textContent = soundGranted ? '悬停播放 · 有声' : '悬停预览 · 点一次后自动有声';
  }

  /* 手机端：点击视频卡片 -> 全屏自适应播放；电脑端保持原有交互不受影响 */
  var videoPreview = doc.getElementById('video-preview');
  var videoPreviewVideo = doc.getElementById('video-preview-video');
  var videoPreviewTitle = doc.getElementById('video-preview-title');
  var videoPreviewClose = doc.getElementById('video-preview-close');
  var justOpened = false;

  function hideVideoPreview() {
    if (!videoPreview) return;
    if (videoPreviewVideo) {
      videoPreviewVideo.pause();
      videoPreviewVideo.removeAttribute('src');
      videoPreviewVideo.load();
    }
    videoPreview.classList.remove('show');
    videoPreview.setAttribute('aria-hidden', 'true');
    doc.body.style.overflow = '';
  }

  function openVideoPreview(card) {
    if (!videoPreview || !videoPreviewVideo) return;
    var v = card.querySelector('video');
    if (!v) return;
    stopCardVideo(card);
    var source = v.querySelector('source');
    videoPreviewVideo.src = source ? source.src : '';
    videoPreviewVideo.poster = v.poster || '';
    var title = card.querySelector('.vc-title');
    if (videoPreviewTitle) videoPreviewTitle.textContent = title ? title.textContent : '';
    videoPreviewVideo.muted = false;
    videoPreview.classList.add('show');
    videoPreview.setAttribute('aria-hidden', 'false');
    justOpened = true;
    clearTimeout(openVideoPreview._reset);
    openVideoPreview._reset = setTimeout(function () { justOpened = false; }, 450);
    if (narrow) doc.body.style.overflow = 'hidden';
    var p = videoPreviewVideo.play();
    if (p) p.catch(function () {
      videoPreviewVideo.muted = true;
      var p2 = videoPreviewVideo.play();
      if (p2) p2.catch(function () {});
    });
  }

  if (videoPreviewClose) videoPreviewClose.addEventListener('click', hideVideoPreview);

  function playCardVideo(card) {
    var v = card.querySelector('video');
    if (!v) return;
    if (v.currentTime === 0 || v.ended) v.currentTime = 0;
    v.muted = !(audioReady || soundGranted);
    var p = v.play();
    if (p) p.catch(function () {
      v.muted = true;
      var p2 = v.play();
      if (p2) p2.catch(function () {});
    });
  }

  function stopCardVideo(card) {
    var v = card.querySelector('video');
    if (!v) return;
    v.pause();
    v.currentTime = 0;
  }

  doc.querySelectorAll('.video-card').forEach(function (card) {
    var v = card.querySelector('video');
    if (!v) return;
    refreshVideoHint(card);
    card.addEventListener('mouseenter', function () { playCardVideo(card); });
    card.addEventListener('mouseleave', function () { stopCardVideo(card); });
    card.addEventListener('focus', function () { playCardVideo(card); });
    card.addEventListener('blur', function () { stopCardVideo(card); });
    card.addEventListener('click', function () {
      if (coarse || narrow) {
        openVideoPreview(card);
        return;
      }
      if (v.muted) {
        soundGranted = true;
        v.muted = false;
        v.currentTime = 0;
        var p = v.play();
        if (p) p.catch(function () {
          v.muted = true;
          var p2 = v.play();
          if (p2) p2.catch(function () {});
        });
        refreshVideoHint(card);
      } else if (v.paused) {
        v.play().catch(function () {});
      } else {
        v.pause();
      }
    });
  });
  if ((coarse || narrow) && videoPreview) {
    doc.addEventListener('click', function (e) {
      if (!justOpened && videoPreview.classList.contains('show') && !e.target.closest('.video-preview')) {
        hideVideoPreview();
      }
    });
  }

  /* ---------- 作品标签切换 ---------- */
  var tabButtons = doc.querySelectorAll('.tab-btn');
  var designMarquee = doc.getElementById('design-marquee');
  var videoMarquee = doc.getElementById('video-marquee');
  tabButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var video = btn.getAttribute('data-tab') === 'video';
      if (designMarquee) designMarquee.hidden = video;
      if (videoMarquee) videoMarquee.hidden = !video;
      tabButtons.forEach(function (b) {
        var active = b.getAttribute('data-tab') === (video ? 'video' : 'design');
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      if (video && videoMarquee) {
        videoMarquee.querySelectorAll('video').forEach(function (v) {
          v.pause();
          v.preload = 'metadata';
          v.load();
        });
        if (motion) {
          gsap.fromTo(videoMarquee.querySelectorAll('.video-card'), { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: .55, stagger: .04, ease: 'power3.out' });
        }
      }
    });
  });

  /* ---------- 工作经历：触屏点按展开（桌面为 CSS 悬停） ---------- */
  var expCards = doc.querySelectorAll('.exp-card');
  if (coarse || narrow) {
    expCards.forEach(function (card) {
      card.addEventListener('click', function (e) {
        e.preventDefault();
        var was = card.classList.contains('is-open');
        expCards.forEach(function (c) { c.classList.remove('is-open'); });
        if (!was) card.classList.add('is-open');
      });
    });
    doc.addEventListener('click', function (e) {
      if (!e.target.closest('.exp-card')) {
        expCards.forEach(function (c) { c.classList.remove('is-open'); });
      }
    });
  }

  /* ---------- 加载页 + 首页入场 ---------- */
  var loader = doc.getElementById('loader');

  function heroIntro() {
    var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.from('.home-en-top', { y: -16, autoAlpha: 0, duration: .6 })
      .from('.home-name', { y: 46, autoAlpha: 0, duration: .8 }, '-=.3')
      .from('.home-en-inline', { autoAlpha: 0, scale: .4, duration: .7, ease: 'back.out(2.2)' }, '-=.55')
      .from('.jobs-fan', { autoAlpha: 0, duration: .7, ease: 'power2.out' }, '-=.4')
      .from('.home-meta', { y: 16, autoAlpha: 0, duration: .55, ease: 'back.out(1.8)' }, '-=.35')
      .from('.next-hint', { autoAlpha: 0, duration: .4 }, '-=.2');
  }

  function hideLoader() {
    if (!loader) { heroIntro(); return; }
    var tl = gsap.timeline();
    tl.to('.loader-gugu', { y: -14, rotate: 6, duration: .35, yoyo: true, repeat: 1, ease: 'power2.inOut' })
      .to(loader, { yPercent: -100, duration: .62, ease: 'power2.inOut' }, '+=.1')
      .set(loader, { display: 'none' })
      .add(heroIntro);
  }

  if (!motion) {
    if (loader) loader.style.display = 'none';
  } else {
    var started = false;
    var start = function () {
      if (started) return;
      started = true;
      setTimeout(hideLoader, 700);
    };
    if (doc.readyState === 'complete') start();
    else window.addEventListener('load', start);
    setTimeout(start, 5000);
  }

  /* ---------- 首页视频 ---------- */
  var heroVideo = doc.getElementById('hero-video');
  if (heroVideo && !reduced) {
    var tryPlay = function () { heroVideo.play().catch(function () {}); };
    if (heroVideo.readyState >= 2) tryPlay();
    else heroVideo.addEventListener('canplay', tryPlay, { once: true });
  }

  /* ---------- 滚动揭示 ---------- */
  if (motion) {
    doc.querySelectorAll('[data-reveal]').forEach(function (el) {
      gsap.set(el, { autoAlpha: 0, y: 24 });
      gsap.to(el, {
        autoAlpha: 1, y: 0, duration: .85, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 92%', once: true }
      });
    });

    doc.querySelectorAll('[data-reveal-group]').forEach(function (group) {
      var items = Array.prototype.slice.call(group.children);
      gsap.set(items, { autoAlpha: 0, y: 24 });
      gsap.to(items, {
        autoAlpha: 1, y: 0, duration: .75, stagger: .1, ease: 'power3.out',
        scrollTrigger: { trigger: group, start: 'top 90%', once: true }
      });
    });

    var storm = doc.getElementById('tool-storm');
    if (storm && !coarse && !narrow) {
      gsap.to(storm, {
        yPercent: -12,
        ease: 'none',
        scrollTrigger: { trigger: '#skills', start: 'top bottom', end: 'bottom top', scrub: .5 }
      });
    }
  }

  /* ---------- 复制电话 ---------- */
  var copyBtn = doc.getElementById('copy-phone');
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      var phone = copyBtn.getAttribute('data-copy') || '';
      function done() { showToast('电话已复制：' + phone); }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(phone).then(done).catch(function () { fallbackCopy(phone, done); });
      } else {
        fallbackCopy(phone, done);
      }
    });
  }

  function fallbackCopy(text, done) {
    var ta = doc.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    doc.body.appendChild(ta);
    ta.select();
    try { doc.execCommand('copy'); done(); } catch (err) { showToast('复制失败，请手动复制'); }
    doc.body.removeChild(ta);
  }

  /* ---------- 回到顶部 ---------- */
  var backTop = doc.querySelector('.back-top');
  if (backTop) {
    backTop.addEventListener('click', function () { goTo(0, { force: true }); });
  }

  function showToast(msg) {
    var t = doc.querySelector('.toast');
    if (!t) {
      t = doc.createElement('div');
      t.className = 'toast';
      doc.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(function () { t.classList.remove('show'); }, 2200);
  }

  /* ---------- 移动端菜单 ---------- */
  var toggle = doc.querySelector('.nav-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var open = html.classList.toggle('menu-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  /* ---------- 首屏状态 ---------- */
  setActive(0);
  updateHint(0);
  if (ScrollTrigger) ScrollTrigger.refresh();
})();
