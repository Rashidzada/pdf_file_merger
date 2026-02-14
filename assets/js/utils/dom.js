window.App = window.App || {};
window.App.Utils = window.App.Utils || {};

window.App.Utils.Dom = {
    createElement: function (tag, className, text) {
        const el = document.createElement(tag);
        if (className) el.className = className;
        if (text) el.textContent = text;
        return el;
    },

    getElement: function (selector) {
        return document.querySelector(selector);
    },

    getAllElements: function (selector) {
        return document.querySelectorAll(selector);
    }
};
