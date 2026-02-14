window.App = window.App || {};
window.App.UI = window.App.UI || {};

window.App.UI.Toaster = (function () {
    let container = null;

    function init() {
        container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
    }

    function show(message, type = 'info', duration = 3000) {
        if (!container) init();

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        toast.innerHTML = `
            <span class="toast-message">${message}</span>
            <button class="btn btn-text text-white" onclick="this.parentElement.remove()">&times;</button>
        `;

        container.appendChild(toast);

        // Auto remove
        setTimeout(() => {
            if (toast.parentElement) {
                toast.style.opacity = '0';
                setTimeout(() => toast.remove(), 300);
            }
        }, duration);
    }

    return {
        info: (msg) => show(msg, 'info'),
        success: (msg) => show(msg, 'success'),
        error: (msg) => show(msg, 'error')
    };
})();
