window.App = window.App || {};
window.App.Utils = window.App.Utils || {};

window.App.Utils.Validate = {
    isValidFile: function (file) {
        if (!file) return false;
        const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
        return validTypes.includes(file.type);
    },

    generateMergedFilename: function (ownerName, firstFileName) {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hour = String(now.getHours()).padStart(2, '0');
        const minute = String(now.getMinutes()).padStart(2, '0');

        let baseName = `merged-${year}-${month}-${day}_${hour}-${minute}`;

        if (ownerName && ownerName.trim()) {
            // Sanitize name
            const safeName = ownerName.trim().replace(/[^a-zA-Z0-9\s-_]/g, '').replace(/\s+/g, '_');
            if (safeName) baseName = `${safeName}_merged_${year}-${month}-${day}`;
        } else if (firstFileName) {
            // Use first file name, remove extension
            const safeFileName = firstFileName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9\s-_]/g, '').replace(/\s+/g, '_');
            if (safeFileName) baseName = `${safeFileName}_merged`;
        }

        return `${baseName}.pdf`;
    }
};
