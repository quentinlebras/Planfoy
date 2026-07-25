/**
 * The photo pipeline depends on the exact shape of the Commons API response, and
 * a mismatch there fails silently (empty covers everywhere, no error). These
 * tests pin the shape down.
 *
 * Run: npm test
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadPhotos, photosFromResponse, stripHtml, toPhoto } from '../src/lib/images.ts';

/** Minimal browser surface loadPhotos touches. */
function stubBrowser(handler) {
  const store = new Map();
  globalThis.window = {
    localStorage: {
      getItem: (key) => store.get(key) ?? null,
      setItem: (key, value) => store.set(key, value),
    },
  };
  const urls = [];
  globalThis.fetch = async (url) => {
    urls.push(url);
    return { ok: true, json: async () => handler(url) };
  };
  return urls;
}

const page = (title, overrides = {}) => ({
  title,
  imageinfo: [
    {
      url: `https://upload.wikimedia.org/${encodeURIComponent(title)}`,
      thumburl: `https://upload.wikimedia.org/thumb/${encodeURIComponent(title)}`,
      descriptionurl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(title)}`,
      mime: 'image/jpeg',
      extmetadata: {
        Artist: { value: '<a href="/wiki/User:Someone">Someone</a>' },
        LicenseShortName: { value: 'CC BY-SA 4.0' },
      },
      ...overrides,
    },
  ],
});

test('formatversion=2 responses yield photos', () => {
  const photos = photosFromResponse({
    batchcomplete: true,
    query: { pages: [page('File:Couriot.jpg'), page('File:Puits Couriot.jpg')] },
  });
  assert.equal(photos.length, 2);
  assert.equal(photos[0].title, 'Couriot');
  assert.equal(photos[0].author, 'Someone');
  assert.equal(photos[0].license, 'CC BY-SA 4.0');
  assert.match(photos[0].thumb, /^https:\/\/upload\.wikimedia\.org\/thumb\//);
});

test('formatversion=1 responses (pages keyed by id) degrade instead of throwing', () => {
  const photos = photosFromResponse({
    query: { pages: { 12345: page('File:Couriot.jpg') } },
  });
  assert.deepEqual(photos, []);
});

test('empty and malformed responses yield no photos', () => {
  assert.deepEqual(photosFromResponse({}), []);
  assert.deepEqual(photosFromResponse({ query: {} }), []);
  assert.deepEqual(photosFromResponse({ query: { pages: [] } }), []);
  assert.equal(toPhoto({ title: 'File:X.jpg' }), null);
});

test('venue names containing a filtered word are still kept', () => {
  // "design" must not be caught by the signage filter.
  for (const title of [
    'File:Cité du design Saint-Étienne.jpg',
    'File:Designers at La Platine.jpg',
    'File:Plan d_eau de Saint-Victor.jpg',
  ]) {
    assert.notEqual(toPhoto(page(title)), null, title);
  }
});

test('maps, coats of arms and non-photo files are dropped', () => {
  for (const title of [
    'File:Carte de Planfoy.jpg',
    'File:Blason de Planfoy.jpg',
    'File:Location map France.jpg',
    'File:Panneau du parc.jpg',
    'File:Logo du Pilat.jpg',
    'File:Something.svg',
    'File:Scan.pdf',
  ]) {
    assert.equal(toPhoto(page(title)), null, title);
  }
  assert.equal(toPhoto(page('File:Clip.jpg', { mime: 'video/webm' })), null);
});

test('requests ask Commons for the array response shape', async () => {
  const urls = stubBrowser(() => ({ query: { pages: [page('File:Couriot.jpg')] } }));
  const place = {
    id: 'test01',
    lat: 45.4343,
    lon: 4.3738,
    precise: true,
    imageQuery: 'Couriot Saint-Étienne',
  };
  const photos = await loadPhotos(place);

  assert.equal(urls.length, 2, 'one name lookup and one geosearch');
  for (const url of urls) {
    const params = new URL(url).searchParams;
    // formatversion=2 is what makes query.pages an array; version 1 broke this
    // pipeline silently.
    assert.equal(params.get('formatversion'), '2', url);
    // Anonymous CORS on the MediaWiki API requires origin=*.
    assert.equal(params.get('origin'), '*', url);
    assert.equal(params.get('prop'), 'imageinfo');
    assert.ok(params.get('iiurlwidth'), 'thumburl needs a requested width');
  }
  const byName = new URL(urls[0]).searchParams;
  assert.equal(byName.get('generator'), 'search');
  assert.match(byName.get('gsrsearch'), /^filetype:bitmap Couriot/);
  assert.equal(byName.get('gsrnamespace'), '6');

  const byLocation = new URL(urls[1]).searchParams;
  assert.equal(byLocation.get('generator'), 'geosearch');
  assert.equal(byLocation.get('ggscoord'), '45.4343|4.3738');
  assert.equal(byLocation.get('ggsnamespace'), '6');

  assert.equal(photos.length, 1);
});

test('a total lookup failure is reported, not cached as empty', async () => {
  stubBrowser(() => ({}));
  globalThis.fetch = async () => ({ ok: false, status: 503 });
  await assert.rejects(
    loadPhotos({ id: 'test02', lat: 45, lon: 4, precise: false, imageQuery: 'Nowhere' }),
    /unreachable/,
  );
});

test('credit HTML is flattened to text', () => {
  assert.equal(stripHtml('<a href="#">Jean&nbsp;Dupont</a>'), 'Jean Dupont');
  assert.equal(stripHtml('Marie &amp; Paul<br/>2019'), 'Marie & Paul 2019');
  assert.equal(stripHtml('  spaced   out  '), 'spaced out');
});
