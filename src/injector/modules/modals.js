export function initModalSystem(shadow) {
    return function showLriModal(title, message, icon = '🏛️') {
        const backdrop = shadow.getElementById('lri-modal-backdrop');
        const titleEl = shadow.getElementById('lri-modal-title');
        const msgEl = shadow.getElementById('lri-modal-message');
        const iconEl = shadow.getElementById('lri-modal-icon');

        if (!backdrop) return;

        titleEl.textContent = title;
        msgEl.textContent = message;
        iconEl.textContent = icon;
        backdrop.classList.add('visible');

        const dismissBtn = shadow.getElementById('lri-modal-dismiss');
        const closeHandler = () => {
            backdrop.classList.remove('visible');
            dismissBtn.removeEventListener('click', closeHandler);
        };
        dismissBtn.onclick = closeHandler;
    };
}