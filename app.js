// SVG Color Analyzer & Reducer
class SVGColorAnalyzer {
    constructor() {
        this.originalSVG = null;
        this.currentSVG = null;
        this.colorData = [];
        this.originalColorCount = 0;
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const colorCount = document.getElementById('colorCount');
        const reduceBtn = document.getElementById('reduceBtn');
        const resetBtn = document.getElementById('resetBtn');
        const downloadBtn = document.getElementById('downloadBtn');

        // Upload area click
        uploadArea.addEventListener('click', () => fileInput.click());

        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file && file.type === 'image/svg+xml') {
                this.loadSVGFile(file);
            }
        });

        // File input
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.loadSVGFile(file);
            }
        });

        // Color count slider
        colorCount.addEventListener('input', (e) => {
            document.getElementById('colorCountValue').textContent = e.target.value;
        });

        // Reduce button
        reduceBtn.addEventListener('click', () => {
            const targetColors = parseInt(colorCount.value);
            this.reduceColors(targetColors);
        });

        // Reset button
        resetBtn.addEventListener('click', () => {
            this.resetToOriginal();
        });

        // Download button
        downloadBtn.addEventListener('click', () => {
            this.downloadSVG();
        });
    }

    async loadSVGFile(file) {
        const text = await file.text();
        this.originalSVG = text;
        this.currentSVG = text;
        
        await this.analyzeSVG(text);
        this.displaySVG(text);
        this.updateUI();
    }

    async analyzeSVG(svgText) {
        // Parse SVG
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
        const svgElement = svgDoc.documentElement;

        // Render SVG to canvas for pixel-accurate color analysis
        const bbox = this.getSVGBoundingBox(svgElement);
        const scale = Math.min(800 / bbox.width, 800 / bbox.height, 2);
        
        this.canvas.width = bbox.width * scale;
        this.canvas.height = bbox.height * scale;

        // Create image from SVG
        const img = new Image();
        const svgBlob = new Blob([svgText], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(svgBlob);

        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = url;
        });

        // Draw to canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
        URL.revokeObjectURL(url);

        // Analyze pixels
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        this.colorData = this.analyzePixels(imageData);
        this.originalColorCount = this.colorData.length;
    }

    analyzePixels(imageData) {
        const pixels = imageData.data;
        const colorMap = new Map();
        let totalPixels = 0;

        // Count colors
        for (let i = 0; i < pixels.length; i += 4) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];
            const a = pixels[i + 3];

            // Skip transparent pixels
            if (a < 10) continue;

            totalPixels++;
            const hex = this.rgbToHex(r, g, b);
            
            if (colorMap.has(hex)) {
                colorMap.set(hex, colorMap.get(hex) + 1);
            } else {
                colorMap.set(hex, 1);
            }
        }

        // Convert to array and calculate percentages
        const colors = Array.from(colorMap.entries()).map(([hex, count]) => ({
            hex,
            count,
            percentage: (count / totalPixels) * 100,
            rgb: this.hexToRgb(hex)
        }));

        // Sort by percentage (highest first)
        colors.sort((a, b) => b.percentage - a.percentage);

        return colors;
    }

    getSVGBoundingBox(svgElement) {
        const viewBox = svgElement.getAttribute('viewBox');
        if (viewBox) {
            const [x, y, width, height] = viewBox.split(' ').map(Number);
            return { x, y, width, height };
        }
        
        const width = parseFloat(svgElement.getAttribute('width')) || 500;
        const height = parseFloat(svgElement.getAttribute('height')) || 500;
        return { x: 0, y: 0, width, height };
    }

    displaySVG(svgText) {
        const preview = document.getElementById('svgPreview');
        preview.innerHTML = svgText;
        document.getElementById('mainContent').classList.add('active');
    }

    updateUI() {
        document.getElementById('originalColors').textContent = this.originalColorCount;
        document.getElementById('currentColors').textContent = this.colorData.length;
        
        this.renderColorList();
    }

    renderColorList() {
        const colorList = document.getElementById('colorList');
        colorList.innerHTML = '';

        this.colorData.forEach((color, index) => {
            const item = document.createElement('div');
            item.className = 'color-item';
            
            item.innerHTML = `
                <input type="color" class="color-swatch" value="${color.hex}" data-index="${index}">
                <div class="color-info">
                    <div class="color-hex">${color.hex.toUpperCase()}</div>
                    <div class="color-percentage">${color.percentage.toFixed(2)}%</div>
                    <div class="percentage-bar">
                        <div class="percentage-fill" style="width: ${Math.min(color.percentage, 100)}%"></div>
                    </div>
                </div>
            `;

            // Color picker change event
            const colorPicker = item.querySelector('.color-swatch');
            colorPicker.addEventListener('change', (e) => {
                this.updateColor(index, e.target.value);
            });

            colorList.appendChild(item);
        });
    }

    updateColor(index, newHex) {
        const oldHex = this.colorData[index].hex;
        this.colorData[index].hex = newHex;
        this.colorData[index].rgb = this.hexToRgb(newHex);

        // Update SVG
        this.currentSVG = this.replaceColorInSVG(this.currentSVG, oldHex, newHex);
        this.displaySVG(this.currentSVG);
    }

    replaceColorInSVG(svgText, oldColor, newColor) {
        // Replace in various formats
        const oldLower = oldColor.toLowerCase();
        const oldUpper = oldColor.toUpperCase();
        const oldRgb = this.hexToRgbString(oldColor);

        let result = svgText;
        result = result.replace(new RegExp(oldLower, 'g'), newColor.toLowerCase());
        result = result.replace(new RegExp(oldUpper, 'g'), newColor.toLowerCase());
        result = result.replace(new RegExp(oldRgb.replace(/[()]/g, '\\$&'), 'g'), this.hexToRgbString(newColor));

        return result;
    }

    async reduceColors(targetCount) {
        if (this.colorData.length <= targetCount) {
            alert('Current color count is already at or below target');
            return;
        }

        // Use k-means clustering to reduce colors
        const reducedColors = this.kMeansClustering(this.colorData, targetCount);
        
        // Create color mapping
        const colorMap = new Map();
        this.colorData.forEach(color => {
            const nearest = this.findNearestColor(color.rgb, reducedColors);
            colorMap.set(color.hex, nearest.hex);
        });

        // Apply color mapping to SVG
        let newSVG = this.currentSVG;
        colorMap.forEach((newColor, oldColor) => {
            if (oldColor !== newColor) {
                newSVG = this.replaceColorInSVG(newSVG, oldColor, newColor);
            }
        });

        this.currentSVG = newSVG;
        
        // Re-analyze to get new color distribution
        await this.analyzeSVG(newSVG);
        this.displaySVG(newSVG);
        this.updateUI();
    }

    kMeansClustering(colors, k) {
        // Initialize centroids with most common colors
        let centroids = colors.slice(0, k).map(c => ({ ...c.rgb }));

        // Iterate to find optimal centroids
        for (let iter = 0; iter < 10; iter++) {
            const clusters = Array(k).fill(null).map(() => []);

            // Assign colors to nearest centroid
            colors.forEach(color => {
                const nearest = this.findNearestCentroidIndex(color.rgb, centroids);
                clusters[nearest].push(color);
            });

            // Update centroids
            centroids = clusters.map(cluster => {
                if (cluster.length === 0) return centroids[0];
                
                const totalWeight = cluster.reduce((sum, c) => sum + c.count, 0);
                const r = cluster.reduce((sum, c) => sum + c.rgb.r * c.count, 0) / totalWeight;
                const g = cluster.reduce((sum, c) => sum + c.rgb.g * c.count, 0) / totalWeight;
                const b = cluster.reduce((sum, c) => sum + c.rgb.b * c.count, 0) / totalWeight;
                
                return { r: Math.round(r), g: Math.round(g), b: Math.round(b) };
            });
        }

        return centroids.map(rgb => ({
            hex: this.rgbToHex(rgb.r, rgb.g, rgb.b),
            rgb
        }));
    }

    findNearestColor(rgb, colorList) {
        let minDist = Infinity;
        let nearest = colorList[0];

        colorList.forEach(color => {
            const dist = this.colorDistance(rgb, color.rgb);
            if (dist < minDist) {
                minDist = dist;
                nearest = color;
            }
        });

        return nearest;
    }

    findNearestCentroidIndex(rgb, centroids) {
        let minDist = Infinity;
        let index = 0;

        centroids.forEach((centroid, i) => {
            const dist = this.colorDistance(rgb, centroid);
            if (dist < minDist) {
                minDist = dist;
                index = i;
            }
        });

        return index;
    }

    colorDistance(rgb1, rgb2) {
        // Euclidean distance in RGB space
        const dr = rgb1.r - rgb2.r;
        const dg = rgb1.g - rgb2.g;
        const db = rgb1.b - rgb2.b;
        return Math.sqrt(dr * dr + dg * dg + db * db);
    }

    resetToOriginal() {
        this.currentSVG = this.originalSVG;
        this.analyzeSVG(this.originalSVG).then(() => {
            this.displaySVG(this.originalSVG);
            this.updateUI();
        });
    }

    downloadSVG() {
        const blob = new Blob([this.currentSVG], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'optimized.svg';
        a.click();
        URL.revokeObjectURL(url);
    }

    // Utility functions
    rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    hexToRgbString(hex) {
        const rgb = this.hexToRgb(hex);
        return `rgb(${rgb.r},${rgb.g},${rgb.b})`;
    }
}

// Initialize the app
const app = new SVGColorAnalyzer();
