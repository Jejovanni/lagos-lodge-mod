// Location: public/injector/cloak-hook.js
// Lagos Life Secret Society Mod — In-page Model Interceptor

(function initLodgeCloakHook() {
  'use strict';

  if (window.__LODGE_CLOAK_HOOKED__) return;
  window.__LODGE_CLOAK_HOOKED__ = true;

  const CLOAK_STORAGE_KEY = 'lodge_cloak_active';
  window.__lodge_cloak_enabled = localStorage.getItem(CLOAK_STORAGE_KEY) !== 'false';

  window.toggleLodgeCloak = function (enable) {
    window.__lodge_cloak_enabled = enable !== undefined ? !!enable : !window.__lodge_cloak_enabled;
    localStorage.setItem(CLOAK_STORAGE_KEY, window.__lodge_cloak_enabled ? 'true' : 'false');
    console.info(`[Lodge Mod] Gray Cloak is now ${window.__lodge_cloak_enabled ? 'ACTIVATED' : 'DEACTIVATED'}`);
    return window.__lodge_cloak_enabled;
  };

  // 1. GLB Sabotage: Paint the colors and scramble the names
  function applyCloakToGLB(arrayBuffer) {
    try {
      const view = new DataView(arrayBuffer);
      if (view.getUint32(0, true) !== 0x46546C67) return arrayBuffer; // Not glTF

      const totalLen = view.getUint32(8, true);
      const jsonChunkLen = view.getUint32(12, true);
      if (view.getUint32(16, true) !== 0x4E4F534A) return arrayBuffer; // Not JSON

      const jsonBytes = new Uint8Array(arrayBuffer, 20, jsonChunkLen);
      const gltf = JSON.parse(new TextDecoder().decode(jsonBytes));

      const CLOAK_DARK_GRAY = [0.18, 0.19, 0.21, 1.0];
      const CLOAK_SHADOW = [0.10, 0.10, 0.12, 1.0];
      const SILVER_METALLIC = [0.28, 0.30, 0.33, 1.0];

      if (Array.isArray(gltf.materials)) {
        gltf.materials.forEach(mat => {
          const name = (mat.name || '').toLowerCase();

          // Protect skin, hair, and face explicitly
          if (name.includes('skin') || name.includes('hair') || name.includes('eye') || name.includes('face') || name.includes('head')) {
            return;
          }

          // Catch the Crown/Gold accessories
          if (name.includes('crown') || name.includes('gold') || name.includes('yellow')) {
            mat.pbrMetallicRoughness = mat.pbrMetallicRoughness || {};
            mat.pbrMetallicRoughness.baseColorFactor = SILVER_METALLIC;
            mat.pbrMetallicRoughness.roughnessFactor = 0.2;
            mat.pbrMetallicRoughness.metallicFactor = 0.9;
            // Sabotage the name so the game engine cannot override it
            mat.name = "LODGE_LOCKED_" + mat.name;
            return;
          }

          // Catch all default clothing names
          if (name.includes('purple') || name.includes('lightblue') || name.includes('white') || name.includes('cloth') || name.includes('pant') || name.includes('shirt') || name.includes('shoe') || name.includes('boot') || name.includes('red') || name.includes('blue')) {
            mat.pbrMetallicRoughness = mat.pbrMetallicRoughness || {};
            mat.pbrMetallicRoughness.baseColorFactor = name.includes('shoe') ? CLOAK_SHADOW : CLOAK_DARK_GRAY;
            mat.pbrMetallicRoughness.roughnessFactor = 0.85;
            mat.pbrMetallicRoughness.metallicFactor = 0.1;
            // Sabotage the name so the game engine cannot override it
            mat.name = "LODGE_LOCKED_" + mat.name;
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

  // 2. Network & Cache Interceptors (Now catches ALL .glb files)
  async function interceptModelFetch(request, originalMethod, ...args) {
    const url = typeof request === 'string' ? request : (request && request.url) || '';
    if (window.__lodge_cloak_enabled && url.includes('.glb')) {
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
    if (window.__lodge_cloak_enabled && typeof this._url === 'string' && this._url.includes('.glb')) {
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

  console.info('[Lodge Mod] Material Sabotage Interceptor Active.');
})();