// Location: public/injector/cloak-hook.js
// Lagos Life Secret Society Mod — GLB Color Data Sabotage

(function initLodgeCloakHook() {
  'use strict';

  if (window.__LODGE_CLOAK_HOOKED__) return;
  window.__LODGE_CLOAK_HOOKED__ = true;

  const CLOAK_STORAGE_KEY = 'lodge_cloak_active';

  function applyCloakToGLB(arrayBuffer) {
    try {
      const view = new DataView(arrayBuffer);
      if (view.getUint32(0, true) !== 0x46546C67) return arrayBuffer; // Not glTF

      const jsonChunkLen = view.getUint32(12, true);
      const jsonBytes = new Uint8Array(arrayBuffer, 20, jsonChunkLen);
      const gltf = JSON.parse(new TextDecoder().decode(jsonBytes));

      if (Array.isArray(gltf.materials)) {
        gltf.materials.forEach(mat => {
          if (!mat.pbrMetallicRoughness || !mat.pbrMetallicRoughness.baseColorFactor) return;

          const color = mat.pbrMetallicRoughness.baseColorFactor;
          const r = color[0], g = color[1], b = color[2];

          // 1. Identify Gold/Yellow (The Crown)
          if (r > 0.45 && g > 0.35 && b < 0.25) {
            // Strip texture map to force the raw color
            delete mat.pbrMetallicRoughness.baseColorTexture;

            // Apply Metallic Silver
            mat.pbrMetallicRoughness.baseColorFactor = [0.28, 0.30, 0.33, color[3] || 1.0];
            mat.pbrMetallicRoughness.metallicFactor = 0.9;
            mat.pbrMetallicRoughness.roughnessFactor = 0.2;
            return;
          }

          // 2. Identify Red (Hoodie) or Blue (Shorts)
          if ((r > 0.5 && g < 0.3 && b < 0.3) || (b > 0.4 && r < 0.3 && g < 0.3)) {
            delete mat.pbrMetallicRoughness.baseColorTexture;

            // Apply Charcoal Gray
            mat.pbrMetallicRoughness.baseColorFactor = [0.18, 0.20, 0.22, color[3] || 1.0];
            mat.pbrMetallicRoughness.metallicFactor = 0.1;
            mat.pbrMetallicRoughness.roughnessFactor = 0.85;
          }
        });
      }

      let newJsonString = JSON.stringify(gltf);
      const unaligned = newJsonString.length % 4;
      if (unaligned !== 0) newJsonString += ' '.repeat(4 - unaligned);

      const newJsonBytes = new TextEncoder().encode(newJsonString);
      const binChunkBytes = new Uint8Array(arrayBuffer, 20 + jsonChunkLen);
      const newTotalLen = 20 + newJsonBytes.byteLength + binChunkBytes.byteLength;
      const newBuffer = new ArrayBuffer(newTotalLen);
      const newView = new DataView(newBuffer);

      newView.setUint32(0, 0x46546C67, true);
      newView.setUint32(4, 2, true);
      newView.setUint32(8, newTotalLen, true);
      newView.setUint32(12, newJsonBytes.byteLength, true);
      newView.setUint32(16, 0x4E4F534A, true);
      new Uint8Array(newBuffer, 20, newJsonBytes.byteLength).set(newJsonBytes);
      new Uint8Array(newBuffer, 20 + newJsonBytes.byteLength).set(binChunkBytes);

      return newBuffer;
    } catch (e) {
      return arrayBuffer;
    }
  }

  // Intercept GLB network requests
  async function interceptModelFetch(request, originalMethod, ...args) {
    const isEnabled = localStorage.getItem(CLOAK_STORAGE_KEY) !== 'false';
    const url = typeof request === 'string' ? request : (request && request.url) || '';

    if (isEnabled && url.includes('.glb')) {
      const response = await originalMethod.apply(this, args);
      try {
        const cloned = response.clone();
        const buffer = await cloned.arrayBuffer();
        return new Response(applyCloakToGLB(buffer), {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers
        });
      } catch (err) {
        return response;
      }
    }
    return originalMethod.apply(this, args);
  }

  const originalFetch = window.fetch;
  window.fetch = function (...args) { return interceptModelFetch.call(this, args[0], originalFetch, ...args); };

  const originalCacheMatch = Cache.prototype.match;
  Cache.prototype.match = function (request, options) { return interceptModelFetch.call(this, request, originalCacheMatch, request, options); };

  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this._url = url;
    return originalOpen.apply(this, [method, url, ...rest]);
  };
  XMLHttpRequest.prototype.send = function (...args) {
    const isEnabled = localStorage.getItem(CLOAK_STORAGE_KEY) !== 'false';
    if (isEnabled && typeof this._url === 'string' && this._url.includes('.glb')) {
      this.addEventListener('load', function () {
        if (this.responseType === 'arraybuffer' && this.response) {
          try {
            Object.defineProperty(this, 'response', { writable: true, value: applyCloakToGLB(this.response) });
          } catch (_) { }
        }
      });
    }
    return originalSend.apply(this, args);
  };

  console.info('[Lodge Mod] GLB Color Data Sabotage Active.');
})();