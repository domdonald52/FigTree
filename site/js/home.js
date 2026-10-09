// Homepage: fills the "Next clay workshop" block from the same list as the Workshops page.
// The block's HTML is a complete "dates coming soon" version, so the page reads fine
// if there's no upcoming workshop or the sheet can't be reached.

import { loadUpcoming, dayLabel, bookingOf } from './workshops.js';

const block = document.querySelector('[data-next-workshop]');
if (block) {
  const upcoming = await loadUpcoming();
  const w = upcoming[0];
  if (w) {
    const set = (name, text) => {
      const node = block.querySelector(`[data-nw="${name}"]`);
      if (node) node.textContent = text;
    };
    set('eyebrow', 'Next clay workshop');
    set('title', w.name);
    set('when', [dayLabel(w.date), w.time].filter(Boolean).join(' · '));
    set('where', [w.venue, w.price].filter(Boolean).join(' · '));
    set('blurb', w.blurb || 'Small, friendly classes. All clay, tools and firing included. No experience needed.');
    block.querySelector('[data-nw="when"]').hidden = false;
    block.querySelector('[data-nw="where"]').hidden = false;

    const book = block.querySelector('[data-nw="book"]');
    const note = block.querySelector('[data-nw="provider"]');
    const b = bookingOf(w);
    if (b.kind === 'sold') {
      book.textContent = b.label;
      book.removeAttribute('href');
      book.classList.add('is-disabled');
    } else if (b.kind === 'none') {
      book.hidden = true;
    } else {
      book.href = b.href;
      book.textContent = b.label;
    }
    if (b.note) {
      note.textContent = b.note;
      note.hidden = false;
    }
    const more = upcoming.length - 1;
    set('all', more > 0 ? `${more} more date${more === 1 ? '' : 's'}` : 'All workshop details');
  }
}
