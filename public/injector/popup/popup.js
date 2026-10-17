// public/popup/popup.js
document.addEventListener('DOMContentLoaded', function () {
  const keyInput = document.getElementById('key');
  const saveBtn = document.getElementById('saveBtn');
  const statusEl = document.getElementById('status');

  // Load existing key from storage
  if (chrome && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['lodge_license_key'], function (res) {
      if (res && res.lodge_license_key) {
        keyInput.value = res.lodge_license_key;
        statusEl.textContent = '✓ Mod Key is active';
      }
    });
  }

  saveBtn.addEventListener('click', function () {
    const val = keyInput.value.trim() || 'TEST-DEV-KEY-1234';

    statusEl.textContent = 'Activating...';
    statusEl.style.color = '#d4af37';

    // 1. Save to chrome.storage
    if (chrome && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ lodge_license_key: val }, function () {
        statusEl.textContent = '✓ Activated! Reloading game...';
        statusEl.style.color = '#81c784';

        // 2. Also inject into active tab's localStorage and reload it
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
          if (tabs && tabs[0] && tabs[0].id) {
            chrome.scripting.executeScript({
              target: { tabId: tabs[0].id },
              func: function (keyVal) {
                localStorage.setItem('lodge_license_key', keyVal);
                location.reload();
              },
              args: [val]
            }, function () {
              setTimeout(function () { window.close(); }, 800);
            });
          }
        });
      });
    } else {
      statusEl.textContent = '✓ Saved in local storage';
    }
  });
});
