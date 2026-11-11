(() => {
  'use strict';
  let mounted = false;
  let observer;
  let dialog;
  let activeDocs = [];
  let activeIndex = 0;
  let returnFocus = null;

  const closeNav = (restore = false) => {
    const header = document.querySelector('.site-header');
    const nav = document.getElementById('site-nav');
    const toggle = document.getElementById('menu-toggle');
    if (!nav || !toggle) return;
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    nav.querySelectorAll('[data-menu-toggle]').forEach(button => button.setAttribute('aria-expanded', 'false'));
    nav.querySelectorAll('.subnav').forEach(panel => { panel.hidden = true; });
    header?.classList.remove('nav-open');
    if (restore) toggle.focus({ preventScroll: true });
  };

  function ensureViewer() {
    if (dialog?.isConnected) return;
    dialog = document.createElement('dialog');
    dialog.className = 'v2-document-dialog';
    dialog.setAttribute('aria-label', 'Просмотр документа об образовании');
    dialog.innerHTML = `<div class="v2-document-viewer">
      <div class="v2-document-toolbar"><strong data-view-title></strong><button type="button" data-view-close aria-label="Закрыть просмотр документа">Закрыть</button></div>
      <div class="v2-document-stage" data-view-stage><img alt="" data-view-image></div>
      <div class="v2-document-controls"><button type="button" data-view-prev aria-label="Предыдущий документ">← Назад</button><span data-view-count aria-live="polite"></span><button type="button" data-view-zoom aria-pressed="false">Увеличить</button><button type="button" data-view-next aria-label="Следующий документ">Дальше →</button></div>
    </div>`;
    document.body.append(dialog);
    dialog.addEventListener('click', event => {
      const button = event.target.closest('button');
      if (!button) return;
      if (button.hasAttribute('data-view-close')) { dialog.close(); return; }
      if (button.hasAttribute('data-view-prev')) showDocument(activeIndex - 1);
      if (button.hasAttribute('data-view-next')) showDocument(activeIndex + 1);
      if (button.hasAttribute('data-view-zoom')) toggleZoom();
    });
    dialog.querySelector('[data-view-image]').addEventListener('click', toggleZoom);
    dialog.addEventListener('close', () => {
      dialog.classList.remove('is-zoomed');
      const zoom = dialog.querySelector('[data-view-zoom]');
      zoom.textContent = 'Увеличить'; zoom.setAttribute('aria-pressed', 'false');
      if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
    });
    dialog.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft') { event.preventDefault(); showDocument(activeIndex - 1); }
      if (event.key === 'ArrowRight') { event.preventDefault(); showDocument(activeIndex + 1); }
      if (event.key === 'Home') { event.preventDefault(); showDocument(0); }
      if (event.key === 'End') { event.preventDefault(); showDocument(activeDocs.length - 1); }
    });
    dialog.addEventListener('click', event => {
      if (event.target === dialog) dialog.close();
    });
  }

  function toggleZoom() {
    if (!dialog) return;
    const zoomed = !dialog.classList.contains('is-zoomed');
    dialog.classList.toggle('is-zoomed', zoomed);
    const button = dialog.querySelector('[data-view-zoom]');
    button.textContent = zoomed ? 'Уменьшить' : 'Увеличить';
    button.setAttribute('aria-pressed', String(zoomed));
  }

  function showDocument(index) {
    if (!activeDocs.length) return;
    activeIndex = (index + activeDocs.length) % activeDocs.length;
    const card = activeDocs[activeIndex];
    const source = card.querySelector('img');
    const image = dialog.querySelector('[data-view-image]');
    const title = source?.alt || 'Документ об образовании';
    image.src = source.currentSrc || source.src;
    image.alt = title;
    dialog.querySelector('[data-view-title]').textContent = title;
    dialog.querySelector('[data-view-count]').textContent = `${activeIndex + 1} из ${activeDocs.length}`;
    dialog.querySelector('[data-view-prev]').disabled = activeDocs.length < 2;
    dialog.querySelector('[data-view-next]').disabled = activeDocs.length < 2;
    dialog.classList.remove('is-zoomed');
    const zoom = dialog.querySelector('[data-view-zoom]');
    zoom.textContent = 'Увеличить'; zoom.setAttribute('aria-pressed', 'false');
    dialog.querySelector('[data-view-close]').focus({ preventScroll: true });
  }

  function openDocument(card) {
    ensureViewer();
    activeDocs = [...document.querySelectorAll('.credential-gallery .credential-preview')];
    activeIndex = Math.max(0, activeDocs.indexOf(card));
    returnFocus = card;
    showDocument(activeIndex);
    if (!dialog.open) dialog.showModal();
  }

  function decorate(root = document) {
    const header = root.querySelector?.('.site-header');
    if (header) {
      const toggle = header.querySelector('#menu-toggle');
      const nav = header.querySelector('#site-nav');
      if (toggle && nav) {
        nav.setAttribute('aria-label', 'Основная навигация');
        toggle.setAttribute('aria-controls', 'site-nav');
        nav.querySelectorAll('[data-menu-toggle]').forEach(button => {
          const panel = document.getElementById(button.getAttribute('aria-controls'));
          if (panel) panel.setAttribute('aria-label', button.textContent.trim());
        });
      }
    }
    root.querySelectorAll?.('.credential-gallery .credential-preview').forEach((card, index) => {
      const image = card.querySelector('img');
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', `Открыть документ ${index + 1}: ${image?.alt || 'документ об образовании'}`);
    });
  }

  function layoutCredentialPages() {
    document.querySelectorAll('.credential-gallery .credential-rail').forEach(rail => {
      const track = rail.querySelector('.credentials-strip');
      if (!track) return;
      const cards = rail.credentialCards || [...track.querySelectorAll('.credential-preview')];
      if (!cards.length) return;
      rail.credentialCards = cards;
      // Keep the gallery continuous so the first desktop viewport can show
      // four or more previews; group metadata must not force short pages.
      cards.forEach(card => { card.dataset.credentialGroup = ''; });
      const height = window.innerWidth <= 600 ? 145 : 170;
      rail.style.setProperty('--credential-height', `${height}px`, 'important');
      const gap = parseFloat(getComputedStyle(track).columnGap) || 14;
      const pageWidth = track.clientWidth || rail.clientWidth;
      const pages = [];
      let page = [], used = 0;
      const flush = () => { if (page.length) pages.push(page); page = []; used = 0; };
      cards.forEach((card, index) => {
        const ratio = Number(card.dataset.docRatio) || 1;
        const cardWidth = height * ratio;
        if (page.length && used + gap + cardWidth > pageWidth + .5) flush();
        card.style.width = `${cardWidth}px`;
        card.dataset.documentIndex = String(index);
        page.push(card);
        used += (page.length > 1 ? gap : 0) + cardWidth;
      });
      flush();
      const fragment = document.createDocumentFragment();
      pages.forEach((items, index) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'credential-page';
        wrapper.dataset.firstDocument = items[0].dataset.documentIndex;
        wrapper.setAttribute('role', 'group');
        wrapper.setAttribute('aria-label', `Страница документов ${index + 1} из ${pages.length}`);
        wrapper.append(...items);
        fragment.append(wrapper);
      });
      track.replaceChildren(fragment);
      track.scrollTo({ left: 0, behavior: 'instant' });
      rail.style.setProperty('--rail-visible', '1');
    });
  }

  function onScroll() {
    const header = document.querySelector('.site-header');
    if (!header) return;
    const compact = header.classList.contains('is-compact');
    if ((!compact && window.scrollY > 92) || (compact && window.scrollY < 38)) {
      const before = header.getBoundingClientRect().height;
      header.classList.toggle('is-compact', !compact);
      requestAnimationFrame(() => {
        const after = header.getBoundingClientRect().height;
        // Preserve the visible anchor while shrinking. On the way back to the
        // top, let normal scrolling continue instead of pushing the page down.
        if (!compact && Math.abs(window.scrollY) > 1) window.scrollBy(0, after - before);
      });
    }
  }

  function mountV2Interface() {
    if (mounted) { decorate(); return; }
    mounted = true;
    decorate();
    observer = new MutationObserver(records => {
      if (records.some(record => record.target === document.getElementById('app') && record.addedNodes.length)) {
        decorate(document.getElementById('app') || document);
        requestAnimationFrame(layoutCredentialPages);
      }
    });
    const app = document.getElementById('app');
    if (app) observer.observe(app, { childList: true });
    requestAnimationFrame(layoutCredentialPages);

    document.addEventListener('click', event => {
      const card = event.target.closest?.('.credential-gallery .credential-preview');
      if (card) { event.preventDefault(); openDocument(card); return; }
      const nav = document.getElementById('site-nav');
      const header = document.querySelector('.site-header');
      if (nav?.classList.contains('open') && header && !header.contains(event.target)) closeNav(false);
    }, true);

    document.addEventListener('keydown', event => {
      const card = event.target.closest?.('.credential-gallery .credential-preview');
      if (card && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); openDocument(card); }
    }, true);
    document.addEventListener('keydown', event => {
      const nav = document.getElementById('site-nav');
      const anyModalOpen = document.querySelector('dialog[open]');
      if (event.key === 'Escape' && !anyModalOpen && nav?.classList.contains('open')) closeNav(true);
    });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 680) closeNav(false);
      requestAnimationFrame(layoutCredentialPages);
    }, { passive: true });
    onScroll();
  }

  window.mountV2Interface = mountV2Interface;
  if (document.readyState !== 'loading') mountV2Interface();
  else document.addEventListener('DOMContentLoaded', mountV2Interface, { once: true });
})();
