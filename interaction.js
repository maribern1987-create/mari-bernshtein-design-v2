(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  if (!('IntersectionObserver' in window)) return;
  const seen = new WeakSet();
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      observer.unobserve(entry.target);
      if (!reduced.matches) entry.target.classList.add(
        entry.target.matches('.route-finish') ? 'is-visible' : 'revision-arrive'
      );
    }
  }, { threshold: 0, rootMargin: '0px 0px -6% 0px' });
  const topics = new IntersectionObserver(entries => {
    for (const {target, isIntersecting} of entries) {
      if (!isIntersecting) continue;
      topics.unobserve(target);
      if (!reduced.matches) target.classList.add('topic-arrive');
    }
  }, {threshold: .18});
  function bind() {
    document.querySelectorAll('#HM02 .topic-card').forEach((card,index) => {
      if (seen.has(card)) return;
      seen.add(card);
      card.style.setProperty('--topic-delay', (index % 3) * 65 + 'ms');
      topics.observe(card);
    });
    for (const section of document.querySelectorAll('#main .section, #HM04 .route-finish')) {
      if (seen.has(section)) continue;
      seen.add(section); observer.observe(section);
    }
  }
  bind();
  const app = document.getElementById('app');
  if (app) new MutationObserver(bind).observe(app, {childList:true});
})();
