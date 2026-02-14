window.App = window.App || {};

window.App.State = (function () {
    let files = []; // Array of File objects with metadata
    let primaryFileId = null; // ID of the file selected for naming
    let isMerging = false;
    let listeners = [];

    function notify() {
        listeners.forEach(listener => listener({ files, isMerging, primaryFileId }));
    }

    return {
        getFiles: function () {
            return files;
        },

        getPrimaryFileId: function () {
            return primaryFileId;
        },

        setPrimaryFile: function (id) {
            primaryFileId = id;
            notify();
        },

        addFiles: function (newFiles) {
            // Filter out duplicates based on name + size + lastModified
            const uniqueNewFiles = newFiles.filter(nf =>
                !files.some(ef =>
                    ef.file.name === nf.name &&
                    ef.file.size === nf.size &&
                    ef.file.lastModified === nf.lastModified
                )
            );

            if (uniqueNewFiles.length === 0) return false;

            const processedFiles = uniqueNewFiles.map(f => ({
                id: Date.now() + Math.random().toString(36).substr(2, 9),
                file: f,
                objectUrl: URL.createObjectURL(f)
            }));

            files = [...files, ...processedFiles];

            // Set default primary if none exists
            if (!primaryFileId && files.length > 0) {
                primaryFileId = files[0].id;
            }

            notify();
            return true;
        },

        removeFile: function (id) {
            const fileToRemove = files.find(f => f.id === id);
            if (fileToRemove && fileToRemove.objectUrl) {
                URL.revokeObjectURL(fileToRemove.objectUrl);
            }
            files = files.filter(f => f.id !== id);

            // Reset primary if removed
            if (primaryFileId === id) {
                primaryFileId = files.length > 0 ? files[0].id : null;
            }

            notify();
        },

        clearFiles: function () {
            files.forEach(f => {
                if (f.objectUrl) URL.revokeObjectURL(f.objectUrl);
            });
            files = [];
            primaryFileId = null;
            notify();
        },

        reorderFiles: function (fromIndex, toIndex) {
            const result = Array.from(files);
            const [removed] = result.splice(fromIndex, 1);
            result.splice(toIndex, 0, removed);
            files = result;
            notify();
        },

        setMerging: function (status) {
            isMerging = status;
            notify();
        },

        subscribe: function (listener) {
            listeners.push(listener);
            return () => {
                listeners = listeners.filter(l => l !== listener);
            };
        }
    };
})();
