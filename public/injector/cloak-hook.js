// public/injector/cloak-hook.js
// Lagos Life Secret Society Mod — In-page Model Interceptor
// Intercepts character GLB fetches and transforms clothes into a Gray Lodge Cloak

(function initLodgeCloakHook() {
  'use strict';

  if (window.__LODGE_CLOAK_HOOKED__) return;
  window.__LODGE_CLOAK_HOOKED__ = true;

  const CLOAK_STORAGE_KEY = 'lodge_cloak_active';

  // State: enabled by default if mod is active
  window.__lodge_cloak_enabled = localStorage.getItem(CLOAK_STORAGE_KEY) !== 'false';

  window.toggleLodgeCloak = function(enable) {
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
      if (magic !== 0x46546C67) return arrayBuffer; // Not a GLTF binary (glTF)

      const totalLen = view.getUint32(8, true);
      const jsonChunkLen = view.getUint32(12, true);
      const jsonChunkType = view.getUint32(16, true);
      if (jsonChunkType !== 0x4E4F534A) return arrayBuffer; // Not JSON

      const jsonBytes = new Uint8Array(arrayBuffer, 20, jsonChunkLen);
      const jsonString = new TextDecoder().decode(jsonBytes);
      const gltf = JSON.parse(jsonString);

      // Cloak Color Definitions (RGBA in linear 0.0 - 1.0)
      // Mystical Charcoal/Slate Gray cloak with subtle golden Lodge accents
      const CLOAK_DARK_GRAY  = [0.18, 0.19, 0.21, 1.0]; // Deep hooded cloak / robes
      const CLOAK_MID_GRAY   = [0.28, 0.30, 0.33, 1.0]; // Cloak folds / trim
      const CLOAK_SHADOW     = [0.10, 0.10, 0.12, 1.0]; // Hood interior / footwear

      // Target clothing & body materials for cloaking
      // ['White', 'Purple', 'LightBlue', 'Hair', 'Skin', etc.]
      if (Array.isArray(gltf.materials)) {
        gltf.materials.forEach(mat => {
          const name = (mat.name || '').toLowerCase();

          // Clothes (Shirt, Pants, Coat, etc.) -> Charcoal / Slate Gray Cloak
          if (name.includes('purple') || name.includes('lightblue') || name.includes('white') || name.includes('cloth') || name.includes('pant') || name.includes('shirt')) {
            mat.pbrMetallicRoughness = mat.pbrMetallicRoughness || {};
            mat.pbrMetallicRoughness.baseColorFactor = CLOAK_DARK_GRAY;
            mat.pbrMetallicRoughness.roughnessFactor = 0.85;
            mat.pbrMetallicRoughness.metallicFactor = 0.1;
          }

          // Hair -> Shrouded Hood Gray (or dark shadow under hood)
          if (name.includes('hair') || name.includes('hat')) {
            mat.pbrMetallicRoughness = mat.pbrMetallicRoughness || {};
            mat.pbrMetallicRoughness.baseColorFactor = CLOAK_MID_GRAY;
            mat.pbrMetallicRoughness.roughnessFactor = 0.9;
          }

          // Shoes / Feet -> Dark Leather / Ritual Boots
          if (name.includes('feet') || name.includes('shoe') || name.includes('boot')) {
            mat.pbrMetallicRoughness = mat.pbrMetallicRoughness || {};
            mat.pbrMetallicRoughness.baseColorFactor = CLOAK_SHADOW;
          }
        });
      }

      // Re-encode modified JSON chunk
      let newJsonString = JSON.stringify(gltf);
      // GLB requires 4-byte chunk alignment (pad with spaces)
      const unaligned = newJsonString.length % 4;
      if (unaligned !== 0) {
        newJsonString += ' '.repeat(4 - unaligned);
      }

      const encoder = new TextEncoder();
      const newJsonBytes = encoder.encode(newJsonString);

      // Binary chunk (everything after JSON chunk)
      const binChunkOffset = 20 + jsonChunkLen;
      const binChunkBytes = new Uint8Array(arrayBuffer, binChunkOffset);

      // Construct new GLB buffer
      const newTotalLen = 20 + newJsonBytes.byteLength + binChunkBytes.byteLength;
      const newBuffer = new ArrayBuffer(newTotalLen);
      const newView = new DataView(newBuffer);

      // Header
      newView.setUint32(0, 0x46546C67, true); // magic 'glTF'
      newView.setUint32(4, 2, true);          // version 2
      newView.setUint32(8, newTotalLen, true);

      // JSON Chunk header
      newView.setUint32(12, newJsonBytes.byteLength, true);
      newView.setUint32(16, 0x4E4F534A, true); // type 'JSON'

      // JSON Chunk data
      new Uint8Array(newBuffer, 20, newJsonBytes.byteLength).set(newJsonBytes);

      // Binary Chunk data
      new Uint8Array(newBuffer, 20 + newJsonBytes.byteLength).set(binChunkBytes);

      console.info('[Lodge Mod] Injected Secret Lodge Gray Cloak into character model!');
      return newBuffer;
    } catch (e) {
      console.warn('[Lodge Mod] Failed to apply cloak to GLB:', e);
      return arrayBuffer;
    }
  }

  // Hook window.fetch
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const url = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url) || '';

    // Check if character model is being fetched
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

  // Hook XMLHttpRequest in case the engine uses XHR
  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    this._url = url;
    return originalOpen.apply(this, [method, url, ...rest]);
  };

  XMLHttpRequest.prototype.send = function(...args) {
    if (window.__lodge_cloak_enabled && typeof this._url === 'string' && (this._url.includes('/models/chars/') || this._url.includes('m_casual') || this._url.includes('f_casual'))) {
      this.addEventListener('load', function() {
        if (this.responseType === 'arraybuffer' && this.response) {
          try {
            const modified = applyCloakToGLB(this.response);
            Object.defineProperty(this, 'response', { writable: true, value: modified });
          } catch (_) {}
        }
      });
    }
    return originalSend.apply(this, args);
  };

  // ── WebGL Shader Uniform & Draw Interceptor ───────────────────
  // Since Lagos Life overrides GLB colors dynamically in JS when applying
  // equipped clothing (e.g. red hoodie, blue shorts, sneakers), we intercept
  // the colors as they are passed to the WebGL shader uniforms!

  const CLOAK_COLOR_VEC3 = new Float32Array([0.18, 0.20, 0.22]); // Dark Slate / Charcoal Gray
  const CLOAK_TRIM_VEC3  = new Float32Array([0.28, 0.30, 0.33]); // Slate Trim
  const CLOAK_DARK_VEC3  = new Float32Array([0.11, 0.12, 0.13]); // Deep shadow / footwear

  function isClothingColor(r, g, b) {
    // Red hoodie (Dominant red, low green and blue)
    if (r > 0.55 && g < 0.35 && b < 0.35) return 'hoodie';
    // Blue shorts/pants (Dominant blue, lower red and green)
    if (b > 0.50 && r < 0.38) return 'pants';
    // Bright purple default clothes from m_casual2
    if (r > 0.4 && b > 0.4 && g < 0.3) return 'clothes';
    return null;
  }

  function hookWebGLContext(proto) {
    if (!proto || proto.__lodge_hooked) return;
    proto.__lodge_hooked = true;

    // 1. Hook uniform3fv (common for diffuse / baseColor uniforms)
    const origUniform3fv = proto.uniform3fv;
    proto.uniform3fv = function(location, value, ...rest) {
      if (window.__lodge_cloak_enabled && value && value.length >= 3) {
        const type = isClothingColor(value[0], value[1], value[2]);
        if (type === 'hoodie') {
          return origUniform3fv.call(this, location, CLOAK_COLOR_VEC3, ...rest);
        } else if (type === 'pants') {
          return origUniform3fv.call(this, location, CLOAK_TRIM_VEC3, ...rest);
        } else if (type === 'clothes') {
          return origUniform3fv.call(this, location, CLOAK_COLOR_VEC3, ...rest);
        }
      }
      return origUniform3fv.apply(this, [location, value, ...rest]);
    };

    // 2. Hook uniform4fv (for RGBA uniforms)
    const origUniform4fv = proto.uniform4fv;
    proto.uniform4fv = function(location, value, ...rest) {
      if (window.__lodge_cloak_enabled && value && value.length >= 4) {
        const type = isClothingColor(value[0], value[1], value[2]);
        if (type) {
          const replacement = new Float32Array([0.18, 0.20, 0.22, value[3] || 1.0]);
          return origUniform4fv.call(this, location, replacement, ...rest);
        }
      }
      return origUniform4fv.apply(this, [location, value, ...rest]);
    };
  }

  if (typeof WebGLRenderingContext !== 'undefined') {
    hookWebGLContext(WebGLRenderingContext.prototype);
  }
  if (typeof WebGL2RenderingContext !== 'undefined') {
    hookWebGLContext(WebGL2RenderingContext.prototype);
  }

  // ── Scene-Graph / Mesh Material Observer ───────────────────────
  // Watch for Three.js meshes added to the scene with character clothing names
  function applyCloakToMesh(mesh) {
    if (!mesh || !window.__lodge_cloak_enabled) return;
    const name = (mesh.name || '').toLowerCase();
    
    // Check if mesh is body or legs clothing
    if (name.includes('casual_body') || name.includes('casual_legs') || name.includes('cloth') || name.includes('shirt') || name.includes('hoodie')) {
      if (mesh.material) {
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        materials.forEach(mat => {
          if (mat && mat.color) {
            mat.color.setRGB(0.18, 0.20, 0.22);
            if (mat.roughness !== undefined) mat.roughness = 0.85;
            if (mat.metalness !== undefined) mat.metalness = 0.1;
            mat.needsUpdate = true;
          }
        });
      }
    }
  }

  // Periodically check scene if THREE is exposed, or watch canvas renderer
  setInterval(() => {
    if (!window.__lodge_cloak_enabled) return;
    if (window.THREE && window.THREE.Scene) {
      // If global THREE exists
      return;
    }
    // Check DOM for three.js canvas or inspect custom scene references
    const canvas = document.querySelector('canvas[data-engine*="three.js"]');
    if (canvas && canvas.__scene) {
      canvas.__scene.traverse(applyCloakToMesh);
    }
  }, 1000);

  console.info('[Lodge Mod] Cloak Interceptor & WebGL Pipeline Active.');
})();
