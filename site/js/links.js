// Links to other websites (galleries, Instagram, Humanitix, Stripe…) open in a new tab, so
// visitors keep Cate's site open behind them. Works for links added later by other scripts too.
(function () {
  function external(a) {
    return /^https?:$/.test(a.protocol) && a.hostname !== location.hostname;
  }
  function mark(a) {
    if (!a.target) a.target = '_blank';
    var rel = (a.rel || '').split(/\s+/);
    if (rel.indexOf('noopener') < 0) a.rel = (a.rel ? a.rel + ' ' : '') + 'noopener';
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (a && external(a)) mark(a);
  }, true);
  document.querySelectorAll('a[href]').forEach(function (a) { if (external(a)) mark(a); });
})();
