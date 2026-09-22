/**
 * Loading a manifest from an address the viewer typed.
 *
 * Worth testing hard because the input is untrusted and the failure messages
 * are the product here: a viewer with a remote cannot open a console, so the
 * only debugging they will ever get is the sentence on screen.
 */
import { loadManifest } from '../src/stm/remoteManifest';

const valid = {
  stmVersion: '0.1',
  id: 'x',
  title: 'A title',
  durationMs: 1000,
  source: {},
  video: { main: { url: 'https://example.test/main.mp4' }, poster: '' },
  signLanguage: [{ language: 'bfi', track: { url: 'https://example.test/s.mp4' } }],
  captions: [],
};

function mockFetch(impl: () => Promise<unknown>): void {
  (globalThis as { fetch: unknown }).fetch = impl as unknown;
}

const respond = (body: unknown, status = 200) => async () => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});

describe('addresses that cannot work', () => {
  it('asks for an address when given nothing', async () => {
    expect(await loadManifest('   ')).toEqual({ ok: false, reason: 'Enter an address first.' });
  });

  it('refuses plain HTTP before spending a request on it', async () => {
    mockFetch(async () => {
      throw new Error('should not have been called');
    });
    const r = await loadManifest('http://example.test/m.json');
    expect(r).toEqual({ ok: false, reason: 'The address must start with https://' });
  });

  it('reports the status code when the server refuses', async () => {
    mockFetch(respond(null, 404) as unknown as () => Promise<unknown>);
    const r = await loadManifest('https://example.test/missing.json');
    expect(r).toEqual({ ok: false, reason: 'That address returned 404.' });
  });

  it('says so when the network is unreachable rather than throwing', async () => {
    mockFetch(async () => {
      throw new Error('offline');
    });
    const r = await loadManifest('https://example.test/m.json');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/Could not reach/);
  });

  it('says so when the body is not JSON', async () => {
    mockFetch((async () => ({
      ok: true,
      status: 200,
      json: async () => {
        throw new Error('not json');
      },
    })) as unknown as () => Promise<unknown>);
    const r = await loadManifest('https://example.test/page.html');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/not a manifest/);
  });
});

describe('files that are not our manifest', () => {
  it('rejects JSON that is not a manifest at all', async () => {
    mockFetch(respond({ hello: 'world' }) as unknown as () => Promise<unknown>);
    const r = await loadManifest('https://example.test/other.json');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/not a Signed Track Manifest/);
  });

  it('names the version when it is a manifest we cannot read', async () => {
    mockFetch(respond({ ...valid, stmVersion: '0.9' }) as unknown as () => Promise<unknown>);
    const r = await loadManifest('https://example.test/future.json');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/version 0\.9.*reads 0\.1/);
  });

  it('rejects a manifest with no sign language track', async () => {
    mockFetch(respond({ ...valid, signLanguage: [] }) as unknown as () => Promise<unknown>);
    const r = await loadManifest('https://example.test/nosigner.json');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/no sign language track/);
  });

  it('calls out HTTP media specifically, because the media error hides it', async () => {
    // A valid manifest whose media is HTTP fails inside the player with
    // MEDIA_ERR_SRC_NOT_SUPPORTED, which reads like a codec problem. Say it here.
    const http = { ...valid, video: { main: { url: 'http://example.test/main.mp4' }, poster: '' } };
    mockFetch(respond(http) as unknown as () => Promise<unknown>);
    const r = await loadManifest('https://example.test/httpmedia.json');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/plain HTTP.*HTTPS/);
  });
});

describe('a manifest that works', () => {
  it('returns it', async () => {
    mockFetch(respond(valid) as unknown as () => Promise<unknown>);
    const r = await loadManifest('https://example.test/good.json');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.manifest.title).toBe('A title');
  });

  it('tolerates surrounding whitespace, which a pasted address often has', async () => {
    mockFetch(respond(valid) as unknown as () => Promise<unknown>);
    expect((await loadManifest('  https://example.test/good.json  ')).ok).toBe(true);
  });
});
