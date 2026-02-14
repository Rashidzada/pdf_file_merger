window.App = window.App || {};

(function () {
    // Shortcuts
    const State = window.App.State;
    const UI = window.App.UI;
    const Utils = window.App.Utils;
    const Services = window.App.Services;

    async function initApp() {
        if (!Utils.Dom.getElement('#drop-zone')) return; // Guard

        // DOM Elements
        const dropZone = Utils.Dom.getElement('#drop-zone');
        const fileInput = Utils.Dom.getElement('#file-input');
        const browseBtn = Utils.Dom.getElement('#browse-btn');
        const fileListEl = Utils.Dom.getElement('#file-list');
        const fileCountEl = Utils.Dom.getElement('#file-count');
        const clearAllBtn = Utils.Dom.getElement('#clear-all-btn');
        const mergeBtn = Utils.Dom.getElement('#merge-btn');
        const statusArea = Utils.Dom.getElement('#status-area');
        const progressBar = Utils.Dom.getElement('#progress-bar');
        const statusText = Utils.Dom.getElement('#status-text');
        const downloadArea = Utils.Dom.getElement('#download-area');
        const downloadLink = Utils.Dom.getElement('#download-link');
        const fileInfo = Utils.Dom.getElement('#file-info');

        // Check if executed via file:// protocol
        const isFileProtocol = window.location.protocol === 'file:';

        // Register Service Worker (Only if not file://)
        if (!isFileProtocol && 'serviceWorker' in navigator) {
            try {
                await navigator.serviceWorker.register('./service-worker.js');
                console.log('Service Worker registered');
            } catch (e) {
                console.error('Service Worker registration failed:', e);
            }
        } else if (isFileProtocol) {
            console.warn('Running via file:// protocol. Service Worker (Offline PWA) disabled.');
        }

        // --- State Subscriptions ---
        State.subscribe((state) => {
            renderFileList(state.files);
            updateUIState(state);
        });

        // --- Event Listeners ---

        // Drag & Drop
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('drag-over');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            handleFiles(e.dataTransfer.files);
        });

        // File Input
        browseBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

        // Buttons
        clearAllBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all files?')) {
                State.clearFiles();
                resetMergeUI();
            }
        });

        mergeBtn.addEventListener('click', startMerge);

        // --- Functions ---

        function handleFiles(fileList) {
            const files = Array.from(fileList).filter(file => {
                if (!Utils.Validate.isValidFile(file)) {
                    UI.Toaster.error(`Skipped "${file.name}": Not a supported file (PDF, JPG, PNG).`);
                    return false;
                }
                return true;
            });

            if (files.length === 0) return;

            const added = State.addFiles(files);
            if (added) {
                UI.Toaster.info(`${files.length} file(s) added.`);
                resetMergeUI(); // Hide download if we add new files
            } else {
                UI.Toaster.info('No new files added (duplicates ignored).');
            }

            fileInput.value = ''; // Reset input
        }

        function renderFileList(files) {
            fileListEl.innerHTML = '';
            fileCountEl.textContent = files.length;

            if (files.length === 0) {
                fileListEl.innerHTML = '<li class="file-list-empty"><p>No files selected yet.</p></li>';
                return;
            }

            files.forEach((fileItem, index) => {
                const li = UI.ListItem.create(fileItem, index, (id) => {
                    State.removeFile(id);
                    resetMergeUI();
                });

                // Drag Start
                li.addEventListener('dragstart', (e) => {
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', index);
                    li.classList.add('dragging');
                });

                // Drag Over (for reordering)
                li.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    const draggingItem = document.querySelector('.dragging');
                    if (draggingItem !== li) {
                        const bounding = li.getBoundingClientRect();
                        const offset = bounding.y + (bounding.height / 2);
                        if (e.clientY - offset > 0) {
                            li.style.borderBottom = '2px solid var(--primary-color)';
                            li.style.borderTop = '';
                        } else {
                            li.style.borderTop = '2px solid var(--primary-color)';
                            li.style.borderBottom = '';
                        }
                    }
                });

                li.addEventListener('dragleave', () => {
                    li.style.borderTop = '';
                    li.style.borderBottom = '';
                });

                li.addEventListener('drop', (e) => {
                    e.preventDefault();
                    li.style.borderTop = '';
                    li.style.borderBottom = '';

                    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                    const toIndex = index; // The index of the item dropped onto

                    if (fromIndex !== toIndex) {
                        State.reorderFiles(fromIndex, toIndex);
                    }
                });

                li.addEventListener('dragend', () => {
                    li.classList.remove('dragging');
                    // cleanup styles just in case
                    Utils.Dom.getAllElements('.file-item').forEach(el => {
                        el.style.borderTop = '';
                        el.style.borderBottom = '';
                    });
                });

                fileListEl.appendChild(li);
            });
        }

        function updateUIState(state) {
            // Buttons
            const hasFiles = state.files.length > 0;
            clearAllBtn.disabled = !hasFiles;

            // Merge button only if > 1 file? Or allows 1 file (useless but technically a merge of 1)
            mergeBtn.disabled = state.files.length < 1 || state.isMerging;

            if (state.isMerging) {
                mergeBtn.textContent = 'Merging...';
            } else {
                mergeBtn.textContent = (state.files.length > 0) ? `Merge ${state.files.length} Files` : 'Merge Files';
            }
        }

        async function startMerge() {
            if (State.getFiles().length < 1) return;

            State.setMerging(true);
            statusArea.classList.remove('hidden');
            downloadArea.classList.add('hidden');
            progressBar.style.width = '0%';
            statusText.textContent = 'Preparing...';

            try {
                await Services.Pdf.init();

                const pageSizeSelect = Utils.Dom.getElement('#page-size');
                const selectedPageSize = pageSizeSelect ? pageSizeSelect.value : 'a4';

                const mergedPdfBytes = await Services.Pdf.mergePdfs(State.getFiles(), (msg, progress) => {
                    statusText.textContent = msg;
                    if (progress) progressBar.style.width = `${progress}%`;
                }, selectedPageSize);

                // Handle success
                const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);

                const ownerNameInput = Utils.Dom.getElement('#owner-name');
                const ownerName = ownerNameInput ? ownerNameInput.value : '';

                const files = State.getFiles();
                const firstFileName = files.length > 0 ? files[0].file.name : '';

                const filename = Utils.Validate.generateMergedFilename(ownerName, firstFileName);

                downloadLink.href = url;
                downloadLink.download = filename;
                fileInfo.textContent = `Size: ${Utils.Format.formatBytes(blob.size)}`;

                statusArea.classList.add('hidden');
                downloadArea.classList.remove('hidden');
                UI.Toaster.success('Files merged successfully!');

                // Auto download
                // downloadLink.click(); 

            } catch (error) {
                console.error(error);
                UI.Toaster.error('Merge failed. Check console for details.');
                statusArea.classList.add('hidden');
            } finally {
                State.setMerging(false);
            }
        }

        function resetMergeUI() {
            statusArea.classList.add('hidden');
            downloadArea.classList.add('hidden');
            if (downloadLink.href) {
                URL.revokeObjectURL(downloadLink.href);
                downloadLink.href = '#';
            }
        }
    }

    // Initialize Global App
    window.App.init = initApp;

    // Auto-start on load
    document.addEventListener('DOMContentLoaded', initApp);

})();
