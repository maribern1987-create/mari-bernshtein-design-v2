(() => {
  let activeRoute, resize, arrival;
  function connect() {
    const route = document.querySelector('#HM04 .route, .journey .route');
    if (route === activeRoute) return;
    resize?.disconnect();
    arrival?.disconnect();
    activeRoute = route;
    if (!route) return;
    function traceVein() {
      const bounds = route.getBoundingClientRect();
      const vertical = matchMedia('(max-width:800px)').matches;
      function center(element) {
        const rect = element.getBoundingClientRect();
        return {x:rect.left - bounds.left + rect.width / 2, y:rect.top - bounds.top + rect.height / 2};
      }
      const start = center(route.querySelector('.start'));
      const finish = center(route.querySelector('.finish'));
      start.y += 32;
      finish.y += vertical ? -32 : 32;
      const points = [start, ...Array.from(route.querySelectorAll('.stop'), center), finish];
      let line = 'M ' + start.x + ' ' + start.y;
      for (let i = 1; i < points.length; i++) {
        const a = points[i - 1], b = points[i];
        const dx = b.x - a.x, dy = b.y - a.y;
        const bend = (i % 2 ? 1 : -1) * (vertical ? 11 : 17);
        const cx = vertical ? bend : 0, cy = vertical ? 0 : bend;
        line += ' C ' + [a.x + dx * .32 + cx, a.y + dy * .32 + cy,
          a.x + dx * .68 - cx, a.y + dy * .68 - cy, b.x, b.y].join(' ');
      }
      for (const stroke of route.querySelectorAll('.vein path')) stroke.setAttribute('d', line);
    }
    resize = new ResizeObserver(traceVein);
    resize.observe(route);
    document.fonts.ready.then(() => { if (route.isConnected) traceVein(); });
    arrival = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        route.classList.add('in-view');
        arrival.disconnect();
      }
    });
    arrival.observe(route.querySelector('.finish'));
  }
  connect();
  const app = document.getElementById('app');
  if (app) new MutationObserver(connect).observe(app, {childList:true});
})();
