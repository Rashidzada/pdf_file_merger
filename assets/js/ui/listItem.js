window.App = window.App || {};
window.App.UI = window.App.UI || {};

window.App.UI.ListItem = {
    create: function (fileItem, index, onRemove, isPrimary, onSetPrimary) {
        const formatBytes = window.App.Utils.Format.formatBytes;

        const li = document.createElement('li');
        li.className = 'file-item';
        li.dataset.id = fileItem.id;
        li.dataset.index = index;
        li.draggable = true;

        // Determine icon/preview based on file type
        let visualContent = '';
        if (fileItem.file.type === 'application/pdf') {
            visualContent = `
                <a href="${fileItem.objectUrl}" target="_blank" title="Preview PDF" style="display: block; width: 32px; height: 32px; color: #e74c3c;">
                    <svg class="icon pdf-icon" viewBox="0 0 24 24" width="32" height="32">
                        <path fill="currentColor" d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h2v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z"/>
                    </svg>
                </a>`;
        } else {
            // Image thumbnail
            visualContent = `
                <a href="${fileItem.objectUrl}" target="_blank" title="Preview Image" style="display: block; width: 40px; height: 40px; border-radius: 4px; overflow: hidden; border: 1px solid #ddd;">
                    <img src="${fileItem.objectUrl}" style="width: 100%; height: 100%; object-fit: cover;" alt="Preview">
                </a>`;
        }

        // Icon
        li.innerHTML = `
            <div class="drag-handle" style="cursor: grab; color: #ccc;">
                <svg viewBox="0 0 24 24" width="20" height="20">
                    <path fill="currentColor" d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
                </svg>
            </div>
            <div class="file-icon" style="flex-shrink: 0;">
                 ${visualContent}
            </div>
            <div class="file-info" style="min-width: 0;">
                <span class="file-name" title="${fileItem.file.name}" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block;">${fileItem.file.name}</span>
                <span class="file-meta">${formatBytes(fileItem.file.size)}</span>
            </div>
            <div class="file-actions" style="display: flex; align-items: center; gap: 5px;">
                <button class="btn btn-sm primary-btn" title="Use as Filename Source" style="background: ${isPrimary ? '#2ecc71' : '#eee'}; color: ${isPrimary ? 'white' : '#666'}; border: 1px solid #ddd; padding: 2px 8px; font-size: 0.75rem; border-radius: 4px; cursor: pointer;">
                    ${isPrimary ? '★ Name Source' : '☆ Use Name'}
                </button>
                <button class="btn btn-danger btn-sm remove-btn" title="Remove" style="margin-left: 5px;">
                    &times;
                </button>
            </div>
        `;

        const removeBtn = li.querySelector('.remove-btn');
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            onRemove(fileItem.id);
        });

        const primaryBtn = li.querySelector('.primary-btn');
        primaryBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            onSetPrimary(fileItem.id);
        });

        // Drag Events for list item
        li.addEventListener('dragstart', (e) => {
            e.target.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            // Store index
            e.dataTransfer.setData('text/plain', index);
        });

        li.addEventListener('dragend', (e) => {
            e.target.classList.remove('dragging');
        });

        return li;
    }
};
