/**
 * The WebVTT parser.
 *
 * Tested against the shapes real broadcast captions actually take, not the
 * tidy examples in the specification. Every awkward case below was copied from
 * a Boston City TV file in the development corpus.
 */
import { activeCue, parseTimestamp, parseWebVtt, stripCueMarkup } from '../src/stm/webvtt';

describe('timestamps', () => {
  it.each<[string, number]>([
    ['00:00:00.000', 0],
    ['00:00:10.629', 10_629],
    ['01:02:03.004', 3_723_004],
    ['10:00.500', 600_500],
  ])('reads %s', (raw, ms) => {
    expect(parseTimestamp(raw)).toBe(ms);
  });

  it('accepts a comma as the decimal separator, which SRT-influenced files use', () => {
    expect(parseTimestamp('00:00:10,629')).toBe(10_629);
  });

  it('rejects what is not a timestamp rather than returning a plausible number', () => {
    expect(parseTimestamp('align:start')).toBeNull();
    expect(parseTimestamp('')).toBeNull();
    expect(parseTimestamp('00:00')).toBeNull();
  });
});

describe('cue markup', () => {
  it('keeps the words and drops the karaoke tags', () => {
    // Losing the text between the tags would lose most of the captions.
    expect(stripCueMarkup('i<00:00:10.719><c> have</c><00:00:10.960><c> no</c>')).toBe(
      'i have no',
    );
  });

  it('treats a cue that is only whitespace as empty', () => {
    expect(stripCueMarkup(' ')).toBe('');
    expect(stripCueMarkup('\n \n')).toBe('');
  });

  it('decodes the entities a caption body can carry', () => {
    expect(stripCueMarkup('Tom &amp; Jerry &lt;3')).toBe('Tom & Jerry <3');
  });
});

const REAL = `WEBVTT
Kind: captions
Language: en

00:00:00.000 --> 00:00:10.629 align:start position:0%


00:00:10.639 --> 00:00:11.509 align:start position:0%
[Music]
i<00:00:10.719><c> have</c><00:00:10.960><c> no</c>

00:00:11.519 --> 00:00:14.390 align:start position:0%
i have no
asl<00:00:12.160><c> interpreters</c><00:00:12.719><c> were</c>
`;

describe('a real file', () => {
  const cues = parseWebVtt(REAL);

  it('skips the header without turning it into a cue', () => {
    expect(cues).toHaveLength(2);
  });

  it('drops the spacer cue whose body is a single space', () => {
    // Rolling captions are full of these; rendering them blanks the plate
    // mid-sentence.
    expect(cues.every((c) => c.text.length > 0)).toBe(true);
  });

  it('ignores cue settings on the timing line', () => {
    expect(cues[0].startMs).toBe(10_639);
    expect(cues[0].endMs).toBe(11_509);
  });

  it('keeps multi-line bodies as multiple lines', () => {
    expect(cues[1].text).toBe('i have no\nasl interpreters were');
  });
});

describe('malformed input fails open, not closed', () => {
  it('skips a bad cue and still returns the good ones', () => {
    const cues = parseWebVtt(`WEBVTT

not:a:time --> also:not
broken

00:00:05.000 --> 00:00:06.000
fine
`);
    expect(cues).toHaveLength(1);
    expect(cues[0].text).toBe('fine');
  });

  it('skips a cue that ends before it starts', () => {
    expect(parseWebVtt('WEBVTT\n\n00:00:09.000 --> 00:00:03.000\nbackwards\n')).toHaveLength(0);
  });

  it('returns nothing for an empty or junk file rather than throwing', () => {
    expect(parseWebVtt('')).toEqual([]);
    expect(parseWebVtt('this is not a caption file')).toEqual([]);
  });

  it('handles CRLF line endings', () => {
    const cues = parseWebVtt('WEBVTT\r\n\r\n00:00:01.000 --> 00:00:02.000\r\nhello\r\n');
    expect(cues).toHaveLength(1);
    expect(cues[0].text).toBe('hello');
  });

  it('ignores a cue identifier line', () => {
    const cues = parseWebVtt('WEBVTT\n\ncue-7\n00:00:01.000 --> 00:00:02.000\nhello\n');
    expect(cues[0].text).toBe('hello');
  });

  it('skips NOTE blocks', () => {
    const cues = parseWebVtt('WEBVTT\n\nNOTE this is a comment\n\n00:00:01.000 --> 00:00:02.000\nx\n');
    expect(cues).toHaveLength(1);
  });
});

describe('finding the cue for a moment', () => {
  const cues = parseWebVtt(`WEBVTT

00:00:01.000 --> 00:00:02.000
first

00:00:02.000 --> 00:00:04.000
second

00:00:10.000 --> 00:00:11.000
third
`);

  it('finds nothing before the first cue or in a gap', () => {
    expect(activeCue(cues, 0)).toBeNull();
    expect(activeCue(cues, 5000)).toBeNull();
    expect(activeCue(cues, 60_000)).toBeNull();
  });

  it('finds the cue covering the moment', () => {
    expect(activeCue(cues, 1500)?.text).toBe('first');
    expect(activeCue(cues, 3000)?.text).toBe('second');
    expect(activeCue(cues, 10_500)?.text).toBe('third');
  });

  it('is inclusive of the start and exclusive of the end, so cues do not double up', () => {
    expect(activeCue(cues, 1000)?.text).toBe('first');
    expect(activeCue(cues, 2000)?.text).toBe('second');
  });

  it('prefers the later cue when rolling captions overlap', () => {
    const overlapping = parseWebVtt(`WEBVTT

00:00:01.000 --> 00:00:09.000
old line

00:00:02.000 --> 00:00:09.000
old line and new words
`);
    expect(activeCue(overlapping, 3000)?.text).toBe('old line and new words');
  });

  it('copes with an empty cue list', () => {
    expect(activeCue([], 1000)).toBeNull();
  });
});
