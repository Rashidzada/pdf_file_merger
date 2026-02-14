window.App = window.App || {};
window.App.Services = window.App.Services || {};

// Wrapper around pdf-lib for merging
// Assumes pdf-lib is loaded globally via script tag in index.html (window.PDFLib)

window.App.Services.Pdf = {
    init: async function () {
        if (!window.PDFLib) {
            throw new Error("PDFLib library not loaded");
        }
    },

    mergePdfs: async function (fileItems, onProgress, pageSizeKey = 'a4') {
        try {
            const { PDFDocument } = window.PDFLib;
            const mergedPdf = await PDFDocument.create();
            const totalFiles = fileItems.length;

            const PAGE_SIZES = {
                'a4': [595.28, 841.89],
                'letter': [612.00, 792.00],
                'legal': [612.00, 1008.00],
                'a3': [841.89, 1190.55],
                'a5': [419.53, 595.28]
            };

            const [targetWidth, targetHeight] = PAGE_SIZES[pageSizeKey] || PAGE_SIZES['a4'];

            for (let i = 0; i < totalFiles; i++) {
                const fileItem = fileItems[i];
                if (onProgress) onProgress(`Processing file ${i + 1} of ${totalFiles}: ${fileItem.file.name}`, ((i / totalFiles) * 100));

                const arrayBuffer = await fileItem.file.arrayBuffer();

                if (fileItem.file.type === 'application/pdf') {
                    // Load and Merge PDF
                    const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
                    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                    copiedPages.forEach((page) => mergedPdf.addPage(page));
                }
                else if (fileItem.file.type === 'image/jpeg' || fileItem.file.type === 'image/png') {
                    // Embed Image
                    let image;
                    if (fileItem.file.type === 'image/jpeg') {
                        image = await mergedPdf.embedJpg(arrayBuffer);
                    } else {
                        image = await mergedPdf.embedPng(arrayBuffer);
                    }

                    const page = mergedPdf.addPage([targetWidth, targetHeight]);

                    const { width: imgWidth, height: imgHeight } = image.scale(1);

                    // Calculation to fit image within margin
                    // Add a small margin (e.g. 20pt)
                    const margin = 20;
                    const maxWidth = targetWidth - (margin * 2);
                    const maxHeight = targetHeight - (margin * 2);

                    let dims = image.scale(1);
                    let scaleFactor = 1;

                    // Scale down if too big
                    if (imgWidth > maxWidth || imgHeight > maxHeight) {
                        const widthRatio = maxWidth / imgWidth;
                        const heightRatio = maxHeight / imgHeight;
                        scaleFactor = Math.min(widthRatio, heightRatio);
                        dims = image.scale(scaleFactor);
                    }

                    // Center on page
                    page.drawImage(image, {
                        x: (targetWidth / 2) - (dims.width / 2),
                        y: (targetHeight / 2) - (dims.height / 2),
                        width: dims.width,
                        height: dims.height,
                    });
                }
            }

            if (onProgress) onProgress("Finalizing PDF...", 90);

            // Serialize the PDFDocument to bytes (a Uint8Array)
            const mergedPdfBytes = await mergedPdf.save();

            if (onProgress) onProgress("Done!", 100);

            return mergedPdfBytes;
        } catch (error) {
            console.error("Merge error:", error);
            throw error;
        }
    }
};
