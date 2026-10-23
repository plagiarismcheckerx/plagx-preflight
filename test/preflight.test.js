import test from 'node:test';
import assert from 'node:assert/strict';
import {
  checkDraft, countWords, splitSentences, findCitations, VERSION, CHECKS, DEFAULT_CHECKS,
} from '../src/index.js';
import { syllables, paragraphs, structure } from '../src/text.js';

const codes = (text, options) => checkDraft(text, options).issues.map((i) => i.code);
const has = (text, code, options) => codes(text, options).includes(code);
const only = (checks) => ({ checks });
const issue = (text, code, options) => checkDraft(text, options).issues.find((i) => i.code === code);

// ------------------------------------------------------------ helpers

test('VERSION and CHECKS are exported', () => {
  assert.equal(VERSION, '0.1.1');
  assert.deepEqual(CHECKS, ['length', 'references', 'punctuation', 'grammar', 'passive-voice']);
  assert.ok(!DEFAULT_CHECKS.includes('passive-voice'));
});

test('countWords counts words, numbers, contractions and hyphenated words once', () => {
  assert.equal(countWords('Hello world'), 2);
  assert.equal(countWords("It's a well-known fact, 42 times."), 6);
  assert.equal(countWords(''), 0);
  assert.equal(countWords('Café naïve 🎉 résumé'), 3);
});

test('splitSentences splits on terminal punctuation', () => {
  assert.deepEqual(splitSentences('One. Two! Three?').map((s) => s.text), ['One.', 'Two!', 'Three?']);
});

test('splitSentences keeps abbreviations, initials and decimals together', () => {
  const s = splitSentences('Dr. Smith met J. Lee at 3.5 p.m. on Fig. 2 vs. Fig. 3. Then left.');
  assert.equal(s.length, 2);
});

test('splitSentences keeps dotted forms such as U.S. and e.g. together', () => {
  assert.equal(splitSentences('The U.S. team, e.g. Lee, won. Done.').length, 2);
});

test('splitSentences treats an ellipsis as part of the sentence', () => {
  assert.equal(splitSentences('Wait... then go. Done.').length, 2);
});

test('splitSentences gives UTF-16 offsets', () => {
  const s = splitSentences('🎉 Hi. Bye.');
  assert.equal(s[1].start, 7);
  assert.equal(s[1].text, 'Bye.');
});

test('syllables estimates English syllables', () => {
  assert.equal(syllables('cat'), 1);
  assert.equal(syllables('cake'), 1);
  assert.equal(syllables('education'), 4);
  assert.equal(syllables('123'), 0);
});

test('paragraphs detect headings', () => {
  const p = paragraphs('# Title\n\nIntroduction\n\nA normal sentence.\n\nShort line without period');
  assert.deepEqual(p.map((x) => x.heading), [true, true, false, true]);
});

test('structure finds the reference list and its entries', () => {
  const s = structure('Body text.\n\nReferences\n\nA, B. (2020). T.\n\nC, D. (2019). U.\n');
  assert.equal(s.entries.length, 2);
  assert.equal(s.body.length, 1);
});

test('Works Cited and Bibliography headings start the reference list', () => {
  assert.ok(structure('Text.\n\nWorks Cited\n\nA. B.').referenceHeading);
  assert.ok(structure('Text.\n\n## Bibliography:\n\nA. B.').referenceHeading);
});

// ------------------------------------------------------------ citations

test('findCitations finds APA parenthetical citations', () => {
  const c = findCitations('As shown (Smith, 2020).');
  assert.equal(c.length, 1);
  assert.equal(c[0].key, 'smith');
  assert.equal(c[0].year, '2020');
  assert.equal(c[0].text, 'Smith, 2020');
});

test('findCitations splits multiple citations and years', () => {
  const c = findCitations('(Moore, 2011; Nash & Owen, 2014; Price, 2016, 2018)');
  assert.deepEqual(c.map((x) => `${x.key}:${x.year}`), ['moore:2011', 'nash:2014', 'price:2016', 'price:2018']);
});

test('findCitations finds narrative citations with et al. and page numbers', () => {
  const c = findCitations('Smith et al. (2019, p. 4) and Lee and Kim (2020) agree.');
  assert.deepEqual(c.map((x) => x.key), ['smith', 'lee']);
});

test('findCitations accepts n.d. and year suffixes', () => {
  const c = findCitations('(Dunn, n.d.) and Baker (2015a)');
  assert.deepEqual(c.map((x) => x.year), ['n.d.', '2015a']);
});

test('findCitations drops e.g. and see also prefixes', () => {
  const c = findCitations('(see also Evans, 2012)');
  assert.equal(c[0].text, 'Evans, 2012');
});

test('findCitations ignores bare years and figures', () => {
  assert.equal(findCitations('in (2020) and (Figure 2, 2020)').length, 0);
});

test('findCitations finds MLA author-page citations', () => {
  const c = findCitations('(Greenblatt 45) and (Bloom and Hart 102-110; Garber 12)', 'mla');
  assert.deepEqual(c.map((x) => x.key), ['greenblatt', 'bloom', 'garber']);
  assert.equal(c[0].year, null);
});

test('findCitations MLA ignores figures, tables and years', () => {
  assert.equal(findCitations('(Figure 2) (Table 3) (Smith 2020)', 'mla').length, 0);
});

test('findCitations rejects an unknown style', () => {
  assert.throws(() => findCitations('x', 'chicago'), TypeError);
});

// ------------------------------------------------------------ result shape

test('checkDraft returns stats, counts and issues', () => {
  const r = checkDraft('The the cat sat.');
  assert.deepEqual(Object.keys(r), ['stats', 'errors', 'warnings', 'infos', 'issues']);
  assert.deepEqual(Object.keys(r.stats), ['words', 'sentences', 'paragraphs', 'characters', 'readingTimeMinutes', 'fleschReadingEase']);
  assert.deepEqual(Object.keys(r.issues[0]), ['level', 'code', 'message', 'start', 'end', 'line', 'column', 'text', 'suggestion']);
});

test('issues are sorted by start then code', () => {
  const r = checkDraft('i went.  the end');
  const keys = r.issues.map((i) => [i.start, i.code]);
  const sorted = [...keys].sort((a, b) => a[0] - b[0] || (a[1] < b[1] ? -1 : 1));
  assert.deepEqual(keys, sorted);
});

test('line and column are 1-based', () => {
  const i = issue('First line.\nSecond the the.', 'repeated-word');
  assert.equal(i.line, 2);
  assert.equal(i.column, 8);
});

test('offsets are UTF-16 code units after emoji', () => {
  const i = issue('😀 the the end.', 'repeated-word');
  assert.equal(i.start, 3);
  assert.equal(i.text, 'the the');
});

test('counts match the issue levels', () => {
  const r = checkDraft('Text (Smith, 2020). the the. ', { minWords: 100 });
  assert.equal(r.errors, r.issues.filter((i) => i.level === 'error').length);
  assert.equal(r.warnings, r.issues.filter((i) => i.level === 'warning').length);
  assert.equal(r.infos, r.issues.filter((i) => i.level === 'info').length);
});

test('every message starts with "Suggestion:"', () => {
  const r = checkDraft('i saw a apple ,,  the the (Smith, 2020)', { minWords: 99, requiredHeadings: ['Intro'] });
  assert.ok(r.issues.length > 5);
  for (const i of r.issues) assert.match(i.message, /^Suggestion: /);
});

test('empty text gives zero stats and no issues', () => {
  const r = checkDraft('');
  assert.equal(r.stats.words, 0);
  assert.equal(r.stats.fleschReadingEase, 0);
  assert.equal(r.issues.length, 0);
});

test('invalid options throw TypeError', () => {
  assert.throws(() => checkDraft('x', { style: 'chicago' }), TypeError);
  assert.throws(() => checkDraft('x', { checks: ['magic'] }), TypeError);
  assert.throws(() => checkDraft('x', { minWords: -1 }), TypeError);
  assert.throws(() => checkDraft(42), TypeError);
});

// ------------------------------------------------------------ stats

test('stats count words, sentences and paragraphs', () => {
  const s = checkDraft('Title\n\nOne two three. Four five.\n\nSix seven.').stats;
  assert.equal(s.words, 8);
  assert.equal(s.sentences, 3);
  assert.equal(s.paragraphs, 2);
});

test('stats exclude the reference list from the word count', () => {
  const s = checkDraft('One two three.\n\nReferences\n\nSmith, J. (2020). A long title here. Press.').stats;
  assert.equal(s.words, 3);
});

test('characters counts code points', () => {
  assert.equal(checkDraft('a😀b').stats.characters, 3);
});

test('reading time rounds up at 200 words per minute', () => {
  assert.equal(checkDraft('word '.repeat(201)).stats.readingTimeMinutes, 2);
});

test('Flesch reading ease has one decimal place', () => {
  const f = checkDraft('The cat sat on the mat. It was happy.').stats.fleschReadingEase;
  assert.equal(Math.round(f * 10) / 10, f);
  assert.ok(f > 90);
});

// ------------------------------------------------------------ length

test('word-count-low and word-count-high', () => {
  assert.ok(has('one two three', 'word-count-low', { minWords: 5 }));
  assert.ok(has('one two three', 'word-count-high', { maxWords: 2 }));
  assert.ok(!has('one two three', 'word-count-low', { minWords: 3 }));
});

test('long-sentence flags sentences over 40 words', () => {
  assert.ok(has(`${'word '.repeat(41).trim()}.`, 'long-sentence'));
  assert.ok(!has(`${'word '.repeat(40).trim()}.`, 'long-sentence'));
});

test('long-paragraph flags paragraphs over 250 words', () => {
  const para = Array(26).fill('one two three four five six seven eight nine ten.').join(' ');
  assert.ok(has(para, 'long-paragraph'));
});

test('single-sentence-paragraph skips headings and list items', () => {
  assert.ok(has('Just one sentence here.', 'single-sentence-paragraph'));
  assert.ok(!has('Introduction', 'single-sentence-paragraph'));
  assert.ok(!has('- a list item.', 'single-sentence-paragraph'));
});

test('missing-heading compares normalised headings', () => {
  const text = '# 1. Introduction\n\nText. More.\n\nIII. Conclusion:\n\nEnd. Done.';
  assert.ok(!has(text, 'missing-heading', { requiredHeadings: ['introduction', 'Conclusion'] }));
  assert.equal(issue(text, 'missing-heading', { requiredHeadings: ['Methods'] }).message, 'Suggestion: add a "Methods" heading.');
});

// ------------------------------------------------------------ references

test('citation-no-reference when the reference list lacks the source', () => {
  const i = issue('Shown (Smith, 2020).\n\nReferences\n\nJones, A. (2020). T.', 'citation-no-reference');
  assert.equal(i.level, 'error');
  assert.equal(i.text, 'Smith, 2020');
});

test('APA matching needs the same year', () => {
  assert.ok(has('Shown (Smith, 2020).\n\nReferences\n\nSmith, A. (2019). T.', 'citation-no-reference'));
});

test('reference-not-cited flags unused entries', () => {
  const r = checkDraft('Shown (Smith, 2020).\n\nReferences\n\nSmith, A. (2020). T.\nBrown, B. (2018). U.', only(['references']));
  assert.deepEqual(r.issues.map((i) => i.code), ['reference-not-cited']);
  assert.equal(r.issues[0].text, 'Brown, B. (2018). U.');
});

test('missing-reference-section when citations have no list', () => {
  const i = issue('Shown (Smith, 2020).', 'missing-reference-section');
  assert.equal(i.start, 0);
  assert.equal(i.end, 0);
  assert.equal(i.text, '');
});

test('organisation authors match their entry', () => {
  assert.equal(codes('The American Psychological Association (2020) says so.\n\nReferences\n\nAmerican Psychological Association. (2020). Manual.', only(['references'])).length, 0);
});

test('numbered and bulleted reference entries are parsed', () => {
  assert.equal(codes('(Ali, 2012) (Bose, 2013)\n\nReferences\n\n1. Ali, S. (2012). A.\n- Bose, R. (2013). B.', only(['references'])).length, 0);
});

test('MLA style matches on surname only', () => {
  assert.equal(codes('Quoted (Bloom 45).\n\nWorks Cited\n\nBloom, Harold. Book. 1998.', { style: 'mla', checks: ['references'] }).length, 0);
});

test('et-al-format flags wrong et al. forms', () => {
  for (const bad of ['Smith et al (2020)', 'Smith et. al. (2020)', 'Smith etal (2020)', 'Smith et al.. (2020)']) {
    assert.ok(has(bad, 'et-al-format'), bad);
  }
  assert.ok(!has('Smith et al. (2020)', 'et-al-format'));
});

// ------------------------------------------------------------ punctuation

test('unmatched-quote for straight and curly quotes', () => {
  assert.ok(has('She said "hi.', 'unmatched-quote'));
  assert.ok(has('She said “hi.', 'unmatched-quote'));
  assert.ok(has('She said hi”.', 'unmatched-quote'));
  assert.ok(!has('She said "hi" and “bye”.', 'unmatched-quote'));
});

test('unmatched-bracket ignores list markers', () => {
  assert.ok(has('A (note here.', 'unmatched-bracket'));
  assert.ok(has('A note] here.', 'unmatched-bracket'));
  assert.ok(!has('Items: a) one b) two.', 'unmatched-bracket'));
  assert.ok(!has('A (note) [x] {y}.', 'unmatched-bracket'));
});

test('double-space ignores indentation', () => {
  assert.ok(has('One  two.', 'double-space'));
  assert.ok(!has('  Indented text.', 'double-space'));
});

test('space-before-punctuation', () => {
  const i = issue('Hello , world.', 'space-before-punctuation');
  assert.equal(i.text, ' ,');
  assert.equal(i.suggestion, ',');
  assert.ok(!has('Wait ... ok.', 'space-before-punctuation'));
});

test('missing-space-after-punctuation', () => {
  assert.ok(has('Hello,world.', 'missing-space-after-punctuation'));
  assert.ok(has('The end.Next one.', 'missing-space-after-punctuation'));
  assert.ok(!has('At 10:30 and 1,200 and e.g. ok.', 'missing-space-after-punctuation'));
});

test('repeated-punctuation but not ellipses', () => {
  assert.ok(has('Wow!!', 'repeated-punctuation'));
  assert.ok(has('Yes,, no.', 'repeated-punctuation'));
  assert.ok(has('End..', 'repeated-punctuation'));
  assert.ok(!has('Wait...', 'repeated-punctuation'));
});

test('mixed-quote-styles', () => {
  assert.ok(has('"a" and “b”.', 'mixed-quote-styles'));
  assert.ok(!has('"a" and "b".', 'mixed-quote-styles'));
});

test('URLs, emails and inline code are skipped', () => {
  assert.deepEqual(codes('Go https://a.com/x,y now. Mail a.b@c.org now. Run `x ,y` now.', only(['punctuation', 'grammar'])), []);
});

// ------------------------------------------------------------ grammar

test('repeated-word allows "had had" and "that that"', () => {
  assert.ok(has('The the end.', 'repeated-word'));
  assert.ok(!has('It had had an effect and that that is true.', 'repeated-word'));
  assert.ok(!has('The end. The start.', 'repeated-word'));
});

test('repeated-word message matches the spec', () => {
  assert.equal(issue('the the cat', 'repeated-word').message, 'Suggestion: "the the" looks like a repeated word.');
});

test('a-an handles vowel sounds', () => {
  assert.ok(has('a apple', 'a-an'));
  assert.ok(has('an banana', 'a-an'));
  assert.ok(has('a hour', 'a-an'));
  assert.ok(has('an university', 'a-an'));
  assert.ok(!has('an hour, a university, a European, an apple, a one-off', 'a-an'));
});

test('a-an keeps the case of the article', () => {
  assert.equal(issue('A apple.', 'a-an').suggestion, 'An');
});

test('a-an skips acronyms, numbers and uncertain words', () => {
  assert.ok(!has('an FBI report, a 1990 study, a herb, an historic day', 'a-an'));
});

test('sentence-capital flags lowercase sentence starts', () => {
  const i = issue('Fine. this is not.', 'sentence-capital');
  assert.equal(i.text, 'this');
  assert.equal(i.suggestion, 'This');
  assert.ok(!has('iPhones sell well.', 'sentence-capital'));
});

test('lowercase-i', () => {
  assert.ok(has('Then i left.', 'lowercase-i'));
  assert.ok(has("Then i'm here.", 'lowercase-i'));
  assert.ok(!has('Use i.e. here and item i) there.', 'lowercase-i'));
});

test('common-confusion stays conservative', () => {
  for (const bad of ['should of', 'its a', 'better then', 'their is', "it's own", 'the affect', 'can effect', 'loose track', 'alot']) {
    assert.ok(has(`We ${bad} x.`, 'common-confusion'), bad);
  }
  assert.ok(!has('Its own value and then they left and their work and the effect.', 'common-confusion'));
});

test('common-confusion keeps the original case', () => {
  assert.equal(issue('Its a test.', 'common-confusion').suggestion, "It's a");
});

test('passive-voice is off by default and info when enabled', () => {
  assert.ok(!has('The data were collected.', 'passive-voice'));
  assert.equal(issue('The data were collected.', 'passive-voice', only(['passive-voice'])).level, 'info');
});

// ------------------------------------------------------------ scope

test('reference list is not spell-checked or grammar-checked', () => {
  assert.deepEqual(codes('Shown (Smith, 2020).\n\nReferences\n\nSmith, J. (2020). the the ,, of  things.', { checks: ['punctuation', 'grammar'] }), []);
});

test('checks option limits the groups run', () => {
  assert.deepEqual(codes('the the ,,', only(['grammar'])), ['repeated-word', 'sentence-capital']);
  assert.deepEqual(codes('the the ,,', only([])), []);
});
