(() => {
  'use strict';

  const videoDurations = { 'IMG_6970': 86.716667, 'IMG_6972': 23.7, 'IMG_6973': 146.116667, 'IMG_6974': 51.088345, 'IMG_6977': 71, 'IMG_6978': 26.353333, 'IMG_6979': 35.753333, 'IMG_6980': 21.033333, 'unique-20261105': 140.233333 };
  const videoEditorial = {
    'IMG_6970': { topic: 'Понимание себя и ценностей' },
    'IMG_6972': { topic: 'Опыт обращения за поддержкой' },
    'IMG_6973': { topic: 'Сепарация и свои приоритеты', summary: 'Говорит о сложной теме сепарации и о том, что стала ставить себя в приоритет.', selected: true },
    'IMG_6974': { topic: 'Ясность и личный контакт' },
    'IMG_6977': { topic: 'Учиться выражать чувства', summary: 'Рассказывает, как учится замечать чувства, понимать их и выражать.', selected: true },
    'IMG_6978': { topic: 'Спокойствие без осуждения', summary: 'Описывает спокойные встречи, где ей не приходится бояться осуждения.', selected: true },
    'IMG_6979': { topic: 'Внутренний конфликт и изменения' },
    'IMG_6980': { topic: 'Визуализация и работа после' },
    'unique-20261105': { topic: 'Контроль и доверие к себе' }
  };
  const videoPosterOverrides = {
    'IMG_6973': 'v2-media/posters/v2-video-img_6973.webp',
    'IMG_6977': 'v2-media/posters/v2-video-img_6977.webp'
  };
  const featuredVideoOrder = ['IMG_6973', 'IMG_6977', 'IMG_6978'];

  const verifiedQuotes = {
    'photo_2025-03-12_20-57-15.webp': {
      topic: 'Уверенность и свои решения',
      quote: 'Сейчас же я смотрю на себя и понимаю, что действительно начинаю чувствовать больше уверенности и внутренней свободы. За последние несколько дней я успела заметить, что уже могу смелее высказывать своё мнение на работе и даже решилась записаться на новые курсы.'
    },
    'photo_2024-12-17_16-53-44.webp': {
      topic: 'Желания и потребности',
      quote: 'Мы работали над возможностью говорить, заявлять о своих желаниях и потребностях. Спустя время я заметила, что сама правда с самой собой начала проясняться.'
    },
    'photo_2025-01-24_20-22-47.webp': {
      topic: 'Спокойствие и самостоятельность',
      quote: 'Внутри я чувствую какое-то спокойствие и уверенность. У меня всё есть, что мне надо. Я автономна.'
    }
  };

  const stem = (url) => decodeURIComponent((url || '').split('?')[0].split('/').pop() || '').replace(/\.mp4$/i, '');
  const basename = (url) => decodeURIComponent((url || '').split('?')[0].split('/').pop() || '');
  const formatDuration = (raw) => {
    const secs = Math.max(0, Math.round(Number(raw) || 0));
    return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
  };

  let activeDialog = null;
  let lastTrigger = null;
  let zoom = 1;

  function ensureDialog() {
    if (activeDialog) return activeDialog;
    activeDialog = document.createElement('dialog');
    activeDialog.className = 'v2-media-dialog';
    activeDialog.setAttribute('aria-label', 'Просмотр отзыва');
    activeDialog.innerHTML = '<div class="v2-media-dialog__top"><p class="v2-media-dialog__title" data-v2-dialog-title></p><div class="v2-media-dialog__tools" data-v2-image-tools hidden><button type="button" data-v2-zoom="out" aria-label="Уменьшить изображение">−</button><button type="button" data-v2-zoom="reset" aria-label="Сбросить масштаб">100%</button><button type="button" data-v2-zoom="in" aria-label="Увеличить изображение">+</button></div><button type="button" class="v2-media-dialog__close" data-v2-close aria-label="Закрыть просмотр">Закрыть</button></div><div class="v2-media-dialog__body" data-v2-dialog-body></div>';
    document.body.append(activeDialog);
    activeDialog.addEventListener('click', (event) => {
      if (event.target === activeDialog || event.target.closest('[data-v2-close]')) activeDialog.close();
      const control = event.target.closest('[data-v2-zoom]');
      if (!control) return;
      zoom = control.dataset.v2Zoom === 'reset' ? 1 : Math.max(.75, Math.min(3, zoom + (control.dataset.v2Zoom === 'in' ? .25 : -.25)));
      const img = activeDialog.querySelector('.v2-original-image');
      if (img) img.style.setProperty('--v2-zoom', zoom);
      const reset = activeDialog.querySelector('[data-v2-zoom="reset"]');
      if (reset) reset.textContent = `${Math.round(zoom * 100)}%`;
    });
    activeDialog.addEventListener('close', () => {
      activeDialog.querySelectorAll('video').forEach(video => { video.pause(); video.removeAttribute('src'); video.load(); });
      activeDialog.querySelector('[data-v2-dialog-body]').replaceChildren();
      if (lastTrigger?.isConnected) lastTrigger.focus({ preventScroll: true });
    });
    return activeDialog;
  }

  function openImage(src, title, trigger) {
    const dialog = ensureDialog();
    lastTrigger = trigger;
    zoom = 1;
    dialog.querySelector('[data-v2-dialog-title]').textContent = title;
    dialog.querySelector('[data-v2-image-tools]').hidden = false;
    dialog.querySelector('[data-v2-zoom="reset"]').textContent = '100%';
    const img = document.createElement('img');
    img.className = 'v2-original-image';
    img.src = src;
    img.alt = 'Полный скриншот отзыва';
    dialog.querySelector('[data-v2-dialog-body]').replaceChildren(img);
    if (!dialog.open) dialog.showModal();
    dialog.querySelector('[data-v2-close]').focus();
  }

  function openVideo(card, trigger) {
    const source = card?.dataset.videoSrc;
    if (!source) return;
    const dialog = ensureDialog();
    lastTrigger = trigger;
    dialog.querySelector('[data-v2-dialog-title]').textContent = 'Видеоотзыв';
    dialog.querySelector('[data-v2-image-tools]').hidden = true;
    const video = document.createElement('video');
    video.className = 'v2-dialog-video';
    video.controls = true;
    video.playsInline = true;
    video.preload = 'metadata';
    video.src = new URL(source, document.baseURI).href;
    if (card.dataset.poster) video.poster = new URL(card.dataset.poster, document.baseURI).href;
    dialog.querySelector('[data-v2-dialog-body]').replaceChildren(video);
    if (!dialog.open) dialog.showModal();
    video.play().catch(() => {});
    dialog.querySelector('[data-v2-close]').focus();
  }

  function makeTextCard(item, index) {
    const excerpt = verifiedQuotes[item.file];
    const card = document.createElement('article');
    card.className = 'v2-review-card v2-text-card';
    card.dataset.assetId = `text-${item.file.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase()}`;
    card.innerHTML = `<div class="v2-review-card__eyebrow">${excerpt ? 'Отзыв в сообщении' : 'Оригинал сообщения'}</div>${excerpt ? `<h3>${excerpt.topic}</h3><blockquote>${excerpt.quote}</blockquote>` : '<h3>Отзыв в сообщении</h3>'}<button type="button" class="v2-review-link" data-v2-open-image>Открыть оригинал <svg aria-hidden="true" viewBox="0 0 20 20" width="15" height="15" fill="none"><path d="M6 14 14 6M7 6h7v7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button>`;
    card.dataset.src = item.src;
    card.dataset.originalTitle = 'Оригинал сообщения';
    card.setAttribute('aria-label', `Отзыв ${index + 1}`);
    return card;
  }

  function uniqueImageEntries(container) {
    const seen = new Set();
    return [...container.querySelectorAll('.screenshot-slot img')].map(img => ({
      src: img.getAttribute('src'), file: basename(img.getAttribute('src'))
    })).filter(item => {
      if (!item.src || seen.has(item.file)) return false;
      seen.add(item.file);
      return true;
    });
  }

  function renderTextReviews() {
    const track = document.querySelector('#HM07_TEXT .media-track.text-review-grid');
    if (!track || track.dataset.v2Ready === 'true') return;
    const cards = uniqueImageEntries(track).map(makeTextCard);
    const selected = cards.slice(0, 3);
    const remainder = cards.slice(3);
    track.replaceChildren(...selected);
    if (remainder.length) {
      const disclosure = document.createElement('details');
      disclosure.className = 'v2-review-archive';
      disclosure.innerHTML = `<summary>Все оригиналы сообщений <span>${remainder.length}</span></summary>`;
      const archive = document.createElement('div');
      archive.className = 'v2-review-archive__grid';
      archive.append(...remainder);
      disclosure.append(archive);
      track.after(disclosure);
    }
    track.setAttribute('aria-label', 'Отзывы в сообщениях. Короткие цитаты и оригиналы');
    track.dataset.v2Ready = 'true';
  }

  function makeVideoCard(oldCard, index) {
      const video = oldCard.querySelector('video');
      if (!video) return null;
      const id = stem(video.getAttribute('src'));
      const editorial = videoEditorial[id];
      const seconds = video.duration && Number.isFinite(video.duration) ? video.duration : (videoDurations[id] || 0);
      const article = document.createElement('article');
      article.className = 'v2-review-card v2-video-card';
      article.dataset.assetId = `video-${id.toLowerCase()}`;
      const poster = videoPosterOverrides[id] || video.getAttribute('poster');
      const source = video.getAttribute('src');
      article.innerHTML = `<div class="v2-video-poster"><img loading="lazy" src="${poster}" alt="Кадр видеоотзыва"><button type="button" class="v2-play" data-v2-play aria-label="Смотреть видеоотзыв: ${editorial?.topic || 'полная запись'}" title="Смотреть видеоотзыв"><svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20"><path d="M7 4.5v15l12-7.5z" fill="currentColor"/></svg></button><span class="v2-video-duration">${formatDuration(seconds)}</span></div><div class="v2-video-copy"><div class="v2-review-card__eyebrow">Видеоотзыв</div><h3>${editorial?.topic || 'Видеоотзыв'}</h3>${editorial?.summary ? `<p>${editorial.summary}</p>` : ''}<button type="button" class="v2-review-link" data-v2-play>Смотреть отзыв <svg aria-hidden="true" viewBox="0 0 20 20" width="15" height="15" fill="none"><path d="M6 14 14 6M7 6h7v7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div>`;
      article.dataset.videoSrc = source;
      article.dataset.poster = poster || '';
      article.dataset.duration = String(seconds || 0);
      article.setAttribute('aria-label', `Видеоотзыв ${index + 1}, ${formatDuration(seconds)}`);
      return article;
  }

  function renderVideoReviews() {
    const track = document.querySelector('#HM07_VIDEO .media-track.video-review-grid');
    if (!track || track.dataset.v2Ready === 'true') return;
    const cards = [...track.querySelectorAll('.round-review')].map((oldCard, index) => {
      const card = makeVideoCard(oldCard, index);
      return card;
    });
    const priority = (card) => { const index = featuredVideoOrder.indexOf(stem(card?.dataset.videoSrc)); return index < 0 ? featuredVideoOrder.length : index; };
    track.replaceChildren(...cards.filter(Boolean).sort((a, b) => priority(a) - priority(b)));
    track.setAttribute('aria-label', 'Видеоотзывы. Полный ролик открывается в диалоге');
    track.dataset.v2Ready = 'true';
  }

  function renderReviewArchive() {
    const grid = document.querySelector('#app .mixed-review-grid');
    if (!grid || grid.dataset.v2Ready === 'true') return;
    const photos = uniqueImageEntries(grid).map(makeTextCard);
    const clips = [...grid.querySelectorAll('.round-review')].map(makeVideoCard).filter(Boolean);
    const priority = (card) => { const index = featuredVideoOrder.indexOf(stem(card?.dataset.videoSrc)); return index < 0 ? featuredVideoOrder.length : index; };
    clips.sort((a, b) => priority(a) - priority(b));
    const entries = [];
    let photo = 0, clip = 0;
    while (photo < photos.length || clip < clips.length) {
      if (photo < photos.length) entries.push(photos[photo++]);
      if (clip < clips.length && clip <= Math.round(photo * clips.length / photos.length)) entries.push(clips[clip++]);
    }
    grid.replaceChildren(...entries);
    grid.classList.add('v2-review-archive__grid');
    grid.setAttribute('aria-label', 'Полный архив текстовых и видеоотзывов');
    grid.dataset.v2Ready = 'true';
  }

  function onClick(event) {
    const imageButton = event.target.closest('[data-v2-open-image]');
    if (imageButton) {
      const card = imageButton.closest('.v2-text-card');
      openImage(card.dataset.src, card.dataset.originalTitle, imageButton);
      return;
    }
    const videoButton = event.target.closest('[data-v2-play]');
    if (videoButton) {
      openVideo(videoButton.closest('.v2-video-card'), videoButton);
    }
  }

  window.mountV2Media = function mountV2Media() {
    renderTextReviews();
    renderVideoReviews();
    renderReviewArchive();
    if (!document.documentElement.dataset.v2MediaEvents) {
      document.addEventListener('click', onClick);
      document.documentElement.dataset.v2MediaEvents = 'true';
    }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', window.mountV2Media, { once: true });
  else window.mountV2Media();
})();
