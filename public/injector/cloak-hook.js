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

  // 1. SAFE Scene-Graph Mesh Observer (The Skin-Tagging Algorithm)
  setInterval(() => {
    if (!window.__lodge_cloak_enabled) return;

    // Support multiple possible access points to the Three.js scene
    const canvas = document.querySelector('canvas[data-engine*="three.js"]') || document.querySelector('canvas');
    if (!canvas || !canvas.__scene) return;

    const characterGroups = new Set();

    // Step A: Find the character by looking for Skin
    canvas.__scene.traverse(node => {
      if (!node.isMesh || !node.material) return;

      const mats = Array.isArray(node.material) ? node.material : [node.material];
      const hasSkin = mats.some(mat => {
        const name = (mat.name || '').toLowerCase();
        if (name.includes('skin') || name.includes('face') || name.includes('head')) return true;

        // Mathematical skin tone detection (High red, moderate green, lower blue)
        if (mat.color && mat.color.r > 0.35 && mat.color.g > 0.20 && mat.color.b < mat.color.g) return true;
        return false;
      });

      // If this mesh has skin, its parent group is the Character!
      if (hasSkin && node.parent) {
        characterGroups.add(node.parent);
      }
    });

    // Step B: Cloak everything attached to the Character Group (except the skin/hair)
    characterGroups.forEach(group => {
      group.traverse(mesh => {
        if (!mesh.isMesh || !mesh.material) return;

        const applyLodgeGray = (mat) => {
          if (!mat || !mat.color) return mat;

          const matName = (mat.name || '').toLowerCase();

          // Protect body parts by name
          if (matName.includes('skin') || matName.includes('eye') || matName.includes('face') || matName.includes('hair') || matName.includes('head')) {
            return mat;
          }

          const r = mat.color.r, g = mat.color.g, b = mat.color.b;

          // Protect body parts by color
          const isSkin = (r > 0.35 && g > 0.20 && b < g);
          const isBlondeBrownHair = (r > 0.45 && g > 0.35 && b < 0.3);
          const isBlackHair = (r < 0.15 && g < 0.15 && b < 0.15);

          if (isSkin || isBlondeBrownHair || isBlackHair) return mat;

          // If already Lodge Gray, skip to prevent infinite cloning
          if (Math.abs(mat.color.r - 0.18) < 0.02) return mat;

          // CLONE the material so we don't accidentally paint the apartment
          const newMat = mat.clone();
          newMat.color.setRGB(0.18, 0.20, 0.22);
          if (newMat.roughness !== undefined) newMat.roughness = 0.85;
          if (newMat.metalness !== undefined) newMat.metalness = 0.1;
          newMat.name = mat.name;
          newMat.needsUpdate = true;

          return newMat;
        };

        if (Array.isArray(mesh.material)) {
          mesh.material = mesh.material.map(applyLodgeGray);
        } else {
          mesh.material = applyLodgeGray(mesh.material);
        }
      });
    });

  }, 1000);

  console.info('[Lodge Mod] Skin-Tagging Cloak Interceptor Active.');
})();