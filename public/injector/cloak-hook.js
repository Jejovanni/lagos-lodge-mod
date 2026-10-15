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

  setInterval(() => {
    if (!window.__lodge_cloak_enabled) return;
    const canvas = document.querySelector('canvas[data-engine*="three.js"]') || document.querySelector('canvas');
    if (!canvas || !canvas.__scene) return;

    const characterMeshes = new Set();

    // 1. ISOLATE THE CHARACTER
    // Find any mesh with skin. If we find skin, add that mesh AND all its siblings 
    // (like the crown, shoes, and clothes) to our target list.
    canvas.__scene.traverse(node => {
      if (!node.isMesh || !node.material) return;

      const mats = Array.isArray(node.material) ? node.material : [node.material];
      const hasSkin = mats.some(mat => {
        if (mat.name && mat.name.toLowerCase().includes('skin')) return true;
        // Mathematical skin detection
        if (mat.color && mat.color.r > 0.35 && mat.color.g > 0.20 && mat.color.b < mat.color.g) return true;
        return false;
      });

      if (hasSkin) {
        characterMeshes.add(node);
        // Add all sibling meshes in the same group (this catches the crown and shoes)
        // We ensure node.parent is not 'Scene' so we don't accidentally grab the apartment
        if (node.parent && node.parent.type !== 'Scene') {
          node.parent.traverse(child => {
            if (child.isMesh) characterMeshes.add(child);
          });
        }
      }
    });

    // 2. PAINT THE CHARACTER AND CROWN
    characterMeshes.forEach(mesh => {
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

      const newMats = mats.map(mat => {
        if (!mat || !mat.color) return mat;

        const r = mat.color.r, g = mat.color.g, b = mat.color.b;
        const name = (mat.name || '').toLowerCase();

        // Protect explicitly named body parts
        if (name.includes('skin') || name.includes('hair') || name.includes('eye') || name.includes('face')) return mat;

        // Protect skin by color
        const isSkin = (r > 0.35 && g > 0.20 && b < g);
        if (isSkin) return mat;

        // Is it the Crown? (Target high-saturation gold)
        const isGoldCrown = name.includes('crown') || name.includes('gold') || (r > 0.6 && g > 0.4 && b < 0.25);
        if (isGoldCrown) {
          if (Math.abs(r - 0.28) < 0.02) return mat; // Already silver
          const newMat = mat.clone();
          newMat.color.setRGB(0.28, 0.30, 0.33); // Metallic Silver
          newMat.metalness = 0.9;
          newMat.roughness = 0.2;
          newMat.needsUpdate = true;
          return newMat;
        }

        // Protect hair by color (checked after crown so we don't accidentally protect the gold crown)
        const isBlondeBrownHair = (r > 0.45 && g > 0.35 && b < 0.3);
        const isBlackHair = (r < 0.15 && g < 0.15 && b < 0.15);
        if (isBlondeBrownHair || isBlackHair) return mat;

        // It must be clothing! Paint it Lodge Gray.
        if (Math.abs(r - 0.18) < 0.02) return mat; // Already gray
        const newMat = mat.clone();
        newMat.color.setRGB(0.18, 0.20, 0.22); // Charcoal Gray
        newMat.metalness = 0.1;
        newMat.roughness = 0.85;
        newMat.needsUpdate = true;
        return newMat;
      });

      mesh.material = Array.isArray(mesh.material) ? newMats : newMats[0];
    });

  }, 1000);

  console.info('[Lodge Mod] Advanced Sibling-Tagging Interceptor Active.');
})();