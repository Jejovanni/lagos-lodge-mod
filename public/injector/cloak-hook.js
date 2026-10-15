// Location: public/injector/cloak-hook.js
// Lagos Life Secret Society Mod — Direct Crown Override

(function initLodgeCloakHook() {
  'use strict';

  if (window.__LODGE_CLOAK_HOOKED__) return;
  window.__LODGE_CLOAK_HOOKED__ = true;

  const CLOAK_STORAGE_KEY = 'lodge_cloak_active';

  // Aggressively scan the 3D canvas every half second
  setInterval(() => {
    const isEnabled = localStorage.getItem(CLOAK_STORAGE_KEY) !== 'false';
    if (!isEnabled) return;

    // Find the game's canvas and internal scene
    const canvas = document.querySelector('canvas');
    if (!canvas || !canvas.__scene) return;

    // Traverse every object currently rendered in the world
    canvas.__scene.traverse(mesh => {
      if (!mesh.isMesh || !mesh.material) return;

      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

      mats.forEach(mat => {
        if (!mat.color) return;

        const r = mat.color.r, g = mat.color.g, b = mat.color.b;
        const name = (mat.name || '').toLowerCase();

        // IDENTIFY THE CROWN: Target it by name OR by its specific gold RGB color
        // Gold has high red, moderate green, and very low blue
        const isCrown = name.includes('crown') || (r > 0.5 && g > 0.35 && b < 0.25);

        // If we found the gold crown, instantly convert it to Lodge Silver
        if (isCrown && Math.abs(mat.color.r - 0.28) > 0.05) {
          mat.color.setRGB(0.28, 0.30, 0.33); // Metallic Silver
          if (mat.metalness !== undefined) mat.metalness = 0.9;
          if (mat.roughness !== undefined) mat.roughness = 0.2;
          mat.needsUpdate = true;
        }
      });
    });
  }, 500);

  console.info('[Lodge Mod] Crown Override Active.');
})();