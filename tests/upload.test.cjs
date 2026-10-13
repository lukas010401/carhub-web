const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { File } = require('node:buffer');

function load(path, globals = {}, imports = {}) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
  }).outputText;
  vm.runInNewContext(code, {
    module, exports: module.exports,
    require: name => imports[name],
    process: { env: { NEXT_PUBLIC_API_BASE_URL: 'https://example.test' } },
    File, Blob, Map, WeakMap, ...globals
  });
  return module.exports;
}

function imageHarness(width, height, size = 300000) {
  let revocations = 0;
  let encodes = 0;
  const canvas = {
    width: 0, height: 0,
    getContext: () => ({ fillRect() {}, drawImage() {} }),
    toBlob: callback => { encodes++; callback(new Blob([new Uint8Array(size)], { type: 'image/jpeg' })); }
  };
  class Image {
    naturalWidth = width;
    naturalHeight = height;
    set src(value) { queueMicrotask(() => this.onload()); }
  }
  const api = load('lib/image-upload.ts', {
    Image, document: { createElement: () => canvas },
    URL: { createObjectURL: () => 'blob:test', revokeObjectURL: () => revocations++ }
  });
  return { api, canvas, stats: () => ({ revocations, encodes }) };
}

test('large photos are resized, encoded as JPEG and prepared only once', async () => {
  const h = imageHarness(4000, 3000);
  const photo = new File([new Uint8Array(5000000)], 'car.png');
  const result = await h.api.prepareListingPhoto(photo);
  assert.equal(h.canvas.width, 1920);
  assert.equal(h.canvas.height, 1440);
  assert.equal(result.type, 'image/jpeg');
  assert.equal(result.name, 'car.jpg');
  assert.equal(result.size, 300000);
  assert.equal(await h.api.prepareListingPhoto(photo), result);
  assert.equal(h.stats().encodes, 1);
  assert.equal(h.stats().revocations, 1);
});

test('small originals are preserved when conversion would make them larger', async () => {
  const h = imageHarness(800, 600);
  const photo = new File([new Uint8Array(100000)], 'car.webp');
  assert.equal(await h.api.prepareListingPhoto(photo), photo);
});

test('compression failure releases the preview URL and permits another attempt', async () => {
  const h = imageHarness(4000, 3000);
  h.canvas.toBlob = callback => callback(null);
  const photo = new File(['data'], 'car.jpg');
  await assert.rejects(h.api.prepareListingPhoto(photo), /Compression/);
  await assert.rejects(h.api.prepareListingPhoto(photo), /Compression/);
  assert.equal(h.stats().revocations, 2);
});

function uploadHarness(statuses) {
  const sent = [];
  let refreshes = 0;
  class XHR {
    upload = {};
    open(method, url) { this.url = url; }
    setRequestHeader() {}
    send(body) {
      sent.push({ url: this.url, file: body.file });
      this.status = statuses.shift();
      this.responseText = this.status === 200 ? '[{"id":"saved"}]' : 'failure';
      queueMicrotask(() => {
        this.upload.onprogress({ lengthComputable: true, loaded: 1, total: 2 });
        this.onload();
      });
    }
  }
  class FormData { append(name, file) { this.file = file; } }
  const api = load('lib/api.ts', {
    XMLHttpRequest: XHR, FormData,
    fetch: async () => { refreshes++; return { ok: true, json: async () => ({ accessToken: 'new' }) }; }
  }, {
    './auth': { getAccessToken: () => 'token', getRefreshToken: () => 'refresh', saveTokens() {}, clearTokens() {} },
    './image-upload': { prepareListingPhoto: async file => file }
  });
  return { api, sent, refreshes: () => refreshes };
}

test('partial failure retries only unconfirmed photos, preserving order and progress', async () => {
  const h = uploadHarness([200, 500, 200]);
  const photos = [new File(['a'], 'a.jpg'), new File(['b'], 'b.jpg')];
  await assert.rejects(h.api.uploadFiles('/images', photos));
  const progress = [];
  const result = await h.api.uploadFiles('/images', photos, value => progress.push(value));
  assert.equal(h.sent.length, 3);
  assert.equal(h.sent[2].file, photos[1]);
  assert.equal(result.length, 2);
  assert.ok(progress.some(p => p.photo === 2 && p.percent === 50));
});

test('401 renews the token and retries once', async () => {
  const h = uploadHarness([401, 200]);
  await h.api.uploadFiles('/images', [new File(['a'], 'a.jpg')]);
  assert.equal(h.refreshes(), 1);
  assert.equal(h.sent.length, 2);
});