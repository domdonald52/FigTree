// Sorts a piece into a type for the Gallery filter: house, vessel, creature or print
// ('other' shows under All only). Used in the browser and by the build scripts.
//
// Order of evidence: a Type typed in the sheet, then words in the title, then a gallery's
// own tags (ORA tags its products, e.g. "Vase", "House", "animal").

export const TYPES = [
  { key: 'house', label: 'Houses' },
  { key: 'vessel', label: 'Vessels' },
  { key: 'creature', label: 'Creatures' },
  { key: 'print', label: 'Prints' },
];

const WORDS = [
  ['print', /\b(prints?|drawings?|giclee|giclée|etchings?|linocuts?|illustrations?)\b/i],
  ['house', /\b(houses?|cottages?|huts?|cabins?|birdhouses?)\b/i],
  ['vessel', /\b(vessels?|vases?|jugs?|cups?|mugs?|bowls?|pots?|planters?|bottles?|jars?|beakers?|teapots?|tumblers?)\b/i],
  ['other', /\b(tiles?|wall hanging|wall art|hearts?|brooch(es)?|ornaments?)\b/i],
  ['creature', /\b(creatures?|animals?|fox(es)?|hares?|rabbits?|owls?|ruru|birds?|bluebirds?|ravens?|crows?|tui|tūī|kiwi|robins?|wrens?|doves?|cats?|dogs?|bears?|deer|mice|mouse|hedgehogs?|frogs?|badgers?)\b/i],
];

function match(text) {
  for (const [type, re] of WORDS) if (re.test(text)) return type;
  return '';
}

// A Type typed in the sheet: accepts "House", "houses", "Vase", "Animal", "Drawing" and so on.
function fromSheet(value) {
  const v = String(value || '').trim();
  if (!v) return '';
  if (/^(other|misc)/i.test(v)) return 'other';
  return match(v) || (/sculpture/i.test(v) ? 'creature' : '');
}

export function typeOf(title, tags = [], sheetType = '') {
  return fromSheet(sheetType) || match(title || '') || match((tags || []).join(', ')) || 'other';
}
