document.addEventListener('DOMContentLoaded', function() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const imageList = document.getElementById('imageList');
    const qualitySlider = document.getElementById('quality');
    const qualityValue = document.getElementById('qualityValue');
    const compressAllBtn = document.getElementById('compressAllBtn');
    const downloadAllBtn = document.getElementById('downloadAllBtn');
    const progressFill = document.getElementById('progressFill');
    const processedCount = document.getElementById('processedCount');
    const totalCount = document.getElementById('totalCount');
    const batchControls = document.querySelector('.batch-controls');
    
    let images = [];

    // 更新質量顯示
    qualitySlider.addEventListener('input', function() {
        qualityValue.textContent = this.value + '%';
    });

    // 檔案拖放處理
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#0071e3';
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#86868b';
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#86868b';
        handleFiles(e.dataTransfer.files);
    });

    // 點擊上傳
    dropZone.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    function handleFiles(files) {
        if (files.length > 100) {
            alert('最多只能選擇100張圖片');
            return;
        }

        images = Array.from(files).filter(file => file.type.startsWith('image/'));
        if (images.length === 0) return;

        displayImages(images);
        batchControls.style.display = 'block';
        imageList.style.display = 'grid';
        totalCount.textContent = images.length;
        processedCount.textContent = '0';
        progressFill.style.width = '0%';
        downloadAllBtn.style.display = 'none';
    }

    function displayImages(images) {
        imageList.innerHTML = '';
        images.forEach((image, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const div = document.createElement('div');
                div.style.position = 'relative';
                div.innerHTML = `
                    <img src="${e.target.result}" style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px;">
                    <div style="position: absolute; bottom: 5px; right: 5px; background: rgba(0,0,0,0.7); color: white; padding: 2px 6px; border-radius: 4px; font-size: 12px;">
                        ${formatFileSize(image.size)}
                    </div>
                `;
                imageList.appendChild(div);
            };
            reader.readAsDataURL(image);
        });
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    compressAllBtn.addEventListener('click', async function() {
        const quality = parseInt(qualitySlider.value) / 100;
        const format = document.querySelector('input[name="format"]:checked').value;
        let processed = 0;
        const compressedImages = [];

        for (let image of images) {
            const compressed = await compressImage(image, quality, format);
            compressedImages.push(compressed);
            processed++;
            processedCount.textContent = processed;
            progressFill.style.width = (processed / images.length * 100) + '%';
        }

        downloadAllBtn.style.display = 'block';
        downloadAllBtn.onclick = () => downloadAll(compressedImages);
    });

    async function compressImage(file, quality, format) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    
                    const blob = canvas.toBlob((blob) => {
                        resolve({
                            blob: blob,
                            name: file.name.split('.')[0] + '.' + format.split('/')[1]
                        });
                    }, format, quality);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    async function downloadAll(compressedImages) {
        const zip = new JSZip();
        compressedImages.forEach((image, i) => {
            zip.file(image.name, image.blob);
        });
        
        const content = await zip.generateAsync({type: 'blob'});
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = 'compressed_images.zip';
        link.click();
        URL.revokeObjectURL(link.href);
    }
}); 