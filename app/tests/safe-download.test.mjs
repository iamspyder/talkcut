import test from 'node:test';
import assert from 'node:assert/strict';
import {providerMediaURL} from '../safe-download.mjs';
test('generated-media downloads accept provider storage and reject arbitrary hosts/credentials',()=>{assert.equal(providerMediaURL('https://v3.fal.media/files/a.mp4').hostname,'v3.fal.media');assert.equal(providerMediaURL('https://storage.googleapis.com/falserverless/a.mp4').protocol,'https:');for(const u of ['http://127.0.0.1/a','https://fal.media.evil.example/a','https://storage.googleapis.com/another-bucket/a','https://user:secret@fal.media/a','https://fal.media:8443/a'])assert.throws(()=>providerMediaURL(u));});
