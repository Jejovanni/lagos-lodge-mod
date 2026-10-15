// Location: public/injector/cloak-hook.js
// Lagos Life Secret Society Mod — In-page Model Interceptor

(function initLodgeCloakHook() {
  'use strict';

  if (window.__LODGE_CLOAK_HOOKED__) return;
  window.__LODGE_CLOAK_HOOKED__ = true;

  const CLOAK_STORAGE_KEY = 'lodge_cloak_active';

  // State: enabled by default if mod is active
  window.__lodge_cloak_enabled = localStorage.getItem(CLOAK_STORAGE_KEY) !== 'false';

  window.toggleLodgeCloak = function (enable) {
    window.__lodge_cloak_enabled = enable !== undefined ? !!enable : !window.__lodge_cloak_enabled;
    localStorage.setItem(CLOAK_STORAGE_KEY, window.__lodge_cloak_enabled ? 'true' : 'false');
    console.info(`[Lodge Mod] Gray Cloak is now ${window.__lodge_cloak_enabled ? 'ACTIVATED' : 'DEACTIVATED'}`);
    return window.__lodge_cloak_enabled;
  };

  // Helper: modify GLB arrayBuffer to restyle clothing into gray cloak
  function applyCloakToGLB(arrayBuffer) {
    try {
      const view = new DataView(arrayBuffer);
      const magic = view.getUint32(0, true);
      if (magic !== 0x46546C67) return arrayBuffer; // Not glTF

      const totalLen = view.getUint32(8, true);
      const jsonChunkLen = view.getUint32(12, true);
      const jsonChunkType = view.getUint32(16, true);
      if (jsonChunkType !== 0x4E4F534A) return arrayBuffer; // Not JSON

      const jsonBytes = new Uint8Array(arrayBuffer, 20, jsonChunkLen);
      const jsonString = new TextDecoder().decode(jsonBytes);
      const gltf = JSON.parse(jsonString);

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

      const encoder = new TextEncoder();
      const newJsonBytes = encoder.encode(newJsonString);
      const binChunkOffset = 20 + jsonChunkLen;
      const binChunkBytes = new Uint8Array(arrayBuffer, binChunkOffset);
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

  // 1. Hook window.fetch
  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    const url = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url) || '';
    if (window.__lodge_cloak_enabled && (url.includes('/models/chars/') || url.includes('m_casual') || url.includes('f_casual'))) {
      const response = await originalFetch.apply(this, args);
      try {
        const cloned = response.clone();
        const buffer = await cloned.arrayBuffer();
        const modifiedBuffer = applyCloakToGLB(buffer);
        return new Response(modifiedBuffer, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers
        });
      } catch (err) {
        return response;
      }
    }
    return originalFetch.apply(this, args);
  };

  // 2. Hook XMLHttpRequest
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
            const modified = applyCloakToGLB(this.response);
            Object.defineProperty(this, 'response', { writable: true, value: modified });
          } catch (_) { }
        }
      });
    }
    return originalSend.apply(this, args);
  };

  // 3. Cache API Interceptor (Fixes ll-assets-v1 cache loading)
  const originalCacheMatch = Cache.prototype.match;
  Cache.prototype.match = async function (request, options) {
    const response = await originalCacheMatch.call(this, request, options);
    if (!response) return response;
    const url = typeof request === 'string' ? request : request.url;
    if (window.__lodge_cloak_enabled && url && (url.includes('/models/chars/') || url.includes('m_casual') || url.includes('f_casual'))) {
      try {
        const cloned = response.clone();
        const buffer = await cloned.arrayBuffer();
        const modifiedBuffer = applyCloakToGLB(buffer);
        return new Response(modifiedBuffer, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers
        });
      } catch (err) {
        return response;
      }
    }
    return response;
  };

  // 4. WebGL Shader Uniform & Draw Interceptor
  const CLOAK_COLOR_VEC3 = new Float32Array([0.18, 0.20, 0.22]);
  const CLOAK_TRIM_VEC3 = new Float32Array([0.28, 0.30, 0.33]);

  function isClothingColor(r, g, b) {
    // Broadly exclude skin tones (usually high red, moderate green, low blue)
    const isSkin = (r > 0.35 && g > 0.20 && b < g);

    // Broadly exclude blonde/brown hair (high red and green, low blue)
    const isHair = (r > 0.45 && g > 0.35 && b < 0.3);

    if (isSkin || isHair) return null;

    // If it is not skin or hair, classify it as clothing to be overridden
    return 'clothes';
  }

  function hookWebGLContext(proto) {
    if (!proto || proto.__lodge_hooked) return;
    proto.__lodge_hooked = true;

    const origUniform3fv = proto.uniform3fv;
    proto.uniform3fv = function (location, value, ...rest) {
      if (window.__lodge_cloak_enabled && value && value.length >= 3) {
        const type = isClothingColor(value[0], value[1], value[2]);
        if (type) return origUniform3fv.call(this, location, type === 'pants' ? CLOAK_TRIM_VEC3 : CLOAK_COLOR_VEC3, ...rest);
      }
      return origUniform3fv.apply(this, [location, value, ...rest]);
    };

    const origUniform3f = proto.uniform3f;
    proto.uniform3f = function (location, x, y, z) {
      if (window.__lodge_cloak_enabled) {
        const type = isClothingColor(x, y, z);
        if (type) {
          const rep = type === 'pants' ? CLOAK_TRIM_VEC3 : CLOAK_COLOR_VEC3;
          return origUniform3f.call(this, location, rep[0], rep[1], rep[2]);
        }
      }
      return origUniform3f.call(this, location, x, y, z);
    };

    const origUniform4fv = proto.uniform4fv;
    proto.uniform4fv = function (location, value, ...rest) {
      if (window.__lodge_cloak_enabled && value && value.length >= 4) {
        const type = isClothingColor(value[0], value[1], value[2]);
        if (type) {
          const replacement = new Float32Array([0.18, 0.20, 0.22, value[3] || 1.0]);
          return origUniform4fv.call(this, location, replacement, ...rest);
        }
      }
      return origUniform4fv.apply(this, [location, value, ...rest]);
    };

    const origUniform4f = proto.uniform4f;
    proto.uniform4f = function (location, r, g, b, a) {
      if (window.__lodge_cloak_enabled) {
        const type = isClothingColor(r, g, b);
        if (type) return origUniform4f.call(this, location, 0.18, 0.20, 0.22, a);
      }
      return origUniform4f.call(this, location, r, g, b, a);
    };
  }

  if (typeof WebGLRenderingContext !== 'undefined') hookWebGLContext(WebGLRenderingContext.prototype);
  if (typeof WebGL2RenderingContext !== 'undefined') hookWebGLContext(WebGL2RenderingContext.prototype);

  // 5. Scene-Graph Mesh Observer
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
      // Helper function to safely clone and paint materials
      const applyLodgeGray = (mat) => {
        if (!mat || !mat.color) return mat;

        const matName = (mat.name || '').toLowerCase();

        // Protect body parts
        if (matName.includes('skin') || matName.includes('eye') || matName.includes('face') || matName.includes('hair') || matName.includes('head')) {
          return mat;
        }

        // If it's already our exact gray, skip to prevent infinite cloning
        if (Math.abs(mat.color.r - 0.18) < 0.02) return mat;

        // CRITICAL FIX: Clone the material so we don't paint the entire world!
        const newMat = mat.clone();
        newMat.color.setRGB(0.18, 0.20, 0.22);
        if (newMat.roughness !== undefined) newMat.roughness = 0.85;
        if (newMat.metalness !== undefined) newMat.metalness = 0.1;
        newMat.needsUpdate = true;

        return newMat;
      };

      // Apply the safe clone function to the mesh's material(s)
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