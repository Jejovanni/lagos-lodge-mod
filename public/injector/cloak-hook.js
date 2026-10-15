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

  // 1. Helper: modify GLB arrayBuffer
  function applyCloakToGLB(arrayBuffer) {
    try {
      const view = new DataView(arrayBuffer);
      if (view.getUint32(0, true) !== 0x46546C67) return arrayBuffer;

      const totalLen = view.getUint32(8, true);
      const jsonChunkLen = view.getUint32(12, true);
      if (view.getUint32(16, true) !== 0x4E4F534A) return arrayBuffer;

      const jsonBytes = new Uint8Array(arrayBuffer, 20, jsonChunkLen);
      const gltf = JSON.parse(new TextDecoder().decode(jsonBytes));

      const CLOAK_DARK_GRAY = [0.18, 0.19, 0.21, 1.0];
      const CLOAK_MID_GRAY = [0.28, 0.30, 0.33, 1.0];
      const CLOAK_SHADOW = [0.10, 0.10, 0.12, 1.0];

      if (Array.isArray(gltf.materials)) {
        gltf.materials.forEach(mat => {
          const name = (mat.name || '').toLowerCase();
          if (name.includes('purple') || name.includes('lightblue') || name.includes('white') || name.includes('cloth') || name.includes('pant') || name.includes('shirt')) {
            mat.pbrMetallicRoughness = mat.pbrMetallicRoughness || {};
            mat.pbrMetallicRoughness.baseColorFactor = CLOAK_DARK_GRAY;
            mat.pbrMetallicRoughness.roughnessFactor = 0.85;
            mat.pbrMetallicRoughness.metallicFactor = 0.1;
          }
          if (name.includes('hair') || name.includes('hat')) {
            mat.pbrMetallicRoughness = mat.pbrMetallicRoughness || {};
            mat.pbrMetallicRoughness.baseColorFactor = CLOAK_MID_GRAY;
            mat.pbrMetallicRoughness.roughnessFactor = 0.9;
          }
          if (name.includes('feet') || name.includes('shoe') || name.includes('boot')) {
            mat.pbrMetallicRoughness = mat.pbrMetallicRoughness || {};
            mat.pbrMetallicRoughness.baseColorFactor = CLOAK_SHADOW;
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

  // 2. Network & Cache Interceptors
  async function interceptModelFetch(request, originalMethod, ...args) {
    const url = typeof request === 'string' ? request : (request && request.url) || '';
    if (window.__lodge_cloak_enabled && (url.includes('/models/chars/') || url.includes('m_casual') || url.includes('f_casual'))) {
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
    if (window.__lodge_cloak_enabled && typeof this._url === 'string' && (this._url.includes('/models/chars/') || this._url.includes('m_casual') || this._url.includes('f_casual'))) {
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

  // 3. SAFE Scene-Graph Mesh Observer
  function applyCloakToMesh(mesh) {
    if (!mesh || !window.__lodge_cloak_enabled) return;

    const meshName = (mesh.name || '').toLowerCase();

    // STRICT FILTER: Only target character geometry
    const isCharacter = meshName.includes('casual_body') ||
      meshName.includes('casual_legs') ||
      meshName.includes('cloth') ||
      meshName.includes('shirt') ||
      meshName.includes('pant') ||
      meshName.includes('hoodie');

    if (!isCharacter) return;

    if (mesh.material) {
      const applyLodgeGray = (mat) => {
        if (!mat || !mat.color) return mat;

        const matName = (mat.name || '').toLowerCase();

        // Protect body parts
        if (matName.includes('skin') || matName.includes('eye') || matName.includes('face') || matName.includes('hair') || matName.includes('head')) {
          return mat;
        }

        if (Math.abs(mat.color.r - 0.18) < 0.02) return mat;

        // Clone the material to decouple it from the rest of the world
        const newMat = mat.clone();
        newMat.color.setRGB(0.18, 0.20, 0.22);
        if (newMat.roughness !== undefined) newMat.roughness = 0.85;
        if (newMat.metalness !== undefined) newMat.metalness = 0.1;
        newMat.needsUpdate = true;

        return newMat;
      };

      if (Array.isArray(mesh.material)) {
        mesh.material = mesh.material.map(applyLodgeGray);
      } else {
        mesh.material = applyLodgeGray(mesh.material);
      }
    }
  }

  setInterval(() => {
    if (!window.__lodge_cloak_enabled) return;
    if (window.THREE && window.THREE.Scene) return;
    const canvas = document.querySelector('canvas[data-engine*="three.js"]');
    if (canvas && canvas.__scene) canvas.__scene.traverse(applyCloakToMesh);
  }, 1000);

  console.info('[Lodge Mod] Cloak Interceptor Active.');
})();