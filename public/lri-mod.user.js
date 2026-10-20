// ==UserScript==
// @name         LRI Syndicate Mod for Lagos Life
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Injects LRI syndicate interface into Lagos Life
// @match        https://lagoslife.app/*
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    const LOADER_URL = 'https://lagos-lodge-mod.netlify.app/injector/loader.js';

    const script = document.createElement('script');
    script.src = LOADER_URL;
    script.type = 'text/javascript';
    script.async = true;

    // Optional cache-busting or error logging
    script.onerror = function () {
        console.error('[LRI Mod] Failed to load remote injector script from:', LOADER_URL);
    };

    (document.head || document.documentElement).appendChild(script);
})();