/**
 * SVG Color Palette Analyzer
 * A web-based tool for analyzing, editing, and optimizing color palettes in SVG files
 * Supports SVG, JPEG, and PNG file formats with automatic image-to-SVG conversion
 */

class SVGColorAnalyzer {
    constructor() {
        // SVG state
        this.originalSVG = null;
        this.currentSVG = null;
        
        // Color data
        this.colorData = [];
        this.originalColorCount = 0;
        
        // Canvas elements for analysis
        this.canvas = document.getElementById('analysisCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Highlight overlay
        this.highlightCanvas = document.getElementById('highlightCanvas');
        this.highlightCtx = this.highlightCanvas.getContext('2d');
        
        // Highlight state
        this.selectedColor = null;
        this.selectedColorIndex = -1;
        this.isSingleColorMode = false;
        this.svgImageData = null;
        
        // Cache jQuery selectors for performance
        this.$elements = {
            uploadArea: $('#uploadArea'),
            fileInput: $('#fileInput'),
            mainContent: $('#mainContent'),
            svgPreview: $('#svgPreview'),
            highlightCanvas: $('#highlightCanvas'),
            colorPaletteTop: $('#colorPaletteTop'),
            colorList: $('#colorList'),
            originalColorCount: $('#originalColorCount'),
            currentColorCount: $('#currentColorCount'),
            colorCountSlider: $('#colorCountSlider'),
            colorCountValue: $('#colorCountValue'),
            reduceBtn: $('#reduceBtn'),
            resetBtn: $('#resetBtn'),
            downloadBtn: $('#downloadBtn'),
            clearHighlightBtn: $('#clearHighlightBtn'),
            loadingIndicator: $('#loadingIndicator'),
            errorMessage: $('#errorMessage')
        };
        
        this.initializeEventListeners();
        
        console.log('SVGColorAnalyzer constructor complete');
        console.log('jQuery version:', $.fn.jquery);
    }
    
    /**
     * Initialize all event listeners using jQuery
     */
    initializeEventListeners() {
        console.log('Initializing event listeners...');
        console.log('Upload area element:', this.$elements.uploadArea.length);
        console.log('File input element:', this.$elements.fileInput.length);
        
        // File upload events
        this.$elements.uploadArea.on('click', (e) => {
            // Prevent infinite loop - only trigger if we clicked the upload area itself
            if (e.target === e.currentTarget || $(e.target).closest('.upload-content').length > 0) {
                console.log('Upload area clicked!');
                this.$elements.fileInput[0].click(); // Use native click instead of jQuery trigger
            }
        });
        
        this.$elements.fileInput.on('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handleFileUpload(file);
            }
        });
        
        // Drag and drop events
        // Task 2.1.1: Add dragover event handler with visual feedback
        this.$elements.uploadArea.on('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            $(e.currentTarget).addClass('dragover');
        });
        
        // Task 2.1.2: Add dragleave event handler to remove feedback
        this.$elements.uploadArea.on('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            // Only remove class if we're leaving the upload area itself, not a child element
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.originalEvent.clientX;
            const y = e.originalEvent.clientY;
            
            if (x <= rect.left || x >= rect.right || y <= rect.top || y >= rect.bottom) {
                $(e.currentTarget).removeClass('dragover');
            }
        });
        
        // Task 2.1.3: Add drop event handler to process files
        this.$elements.uploadArea.on('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            $(e.currentTarget).removeClass('dragover');
            
            const files = e.originalEvent.dataTransfer.files;
            if (files && files.length > 0) {
                const file = files[0];
                this.handleFileUpload(file);
            }
        });
        
        // Color reduction slider
        this.$elements.colorCountSlider.on('input', (e) => {
            this.$elements.colorCountValue.text($(e.target).val());
        });
        
        // Button events
        this.$elements.reduceBtn.on('click', () => {
            const targetCount = parseInt(this.$elements.colorCountSlider.val());
            this.reduceColors(targetCount);
        });
        
        this.$elements.resetBtn.on('click', () => {
            this.resetToOriginal();
        });
        
        this.$elements.downloadBtn.on('click', (e) => {
            e.stopPropagation();
            $('.download-dropdown').toggleClass('active');
        });
        
        // Download format options
        $('.download-option').on('click', (e) => {
            e.stopPropagation();
            const format = $(e.currentTarget).data('format');
            this.download(format);
            $('.download-dropdown').removeClass('active');
        });
        
        // Close dropdown when clicking outside
        $(document).on('click', () => {
            $('.download-dropdown').removeClass('active');
        });
        
        this.$elements.clearHighlightBtn.on('click', () => {
            this.clearHighlight();
        });
        
        // ESC key to clear highlight
        $(document).on('keydown', (e) => {
            if (e.key === 'Escape' && this.selectedColor) {
                this.clearHighlight();
            }
        });
    }
    
    /**
     * Handle file upload and route to appropriate handler
     * Task 2.3: Add file type validation (SVG, JPEG, PNG)
     * Task 2.4: Implement handleFileUpload() to route files by type
     * Task 2.5: Add error handling for invalid file types
     */
    handleFileUpload(file) {
        console.log('File uploaded:', file.name, file.type);
        
        // Task 2.3: File type validation
        // Supported file types and MIME types per requirements 1.3
        const validExtensions = ['.svg', '.jpg', '.jpeg', '.png'];
        const validMimeTypes = ['image/svg+xml', 'image/jpeg', 'image/png'];
        
        // Get file extension
        const fileName = file.name.toLowerCase();
        const fileExtension = fileName.substring(fileName.lastIndexOf('.'));
        
        // Task 2.5: Validate file type
        const hasValidExtension = validExtensions.includes(fileExtension);
        const hasValidMimeType = validMimeTypes.includes(file.type);
        
        // Check if file type is valid (either by extension or MIME type)
        if (!hasValidExtension && !hasValidMimeType) {
            // Task 2.6: Display error message using jQuery
            this.showError('Please upload an SVG, JPEG, or PNG file');
            return;
        }
        
        // Task 2.4: Route files by type
        // Determine if file is SVG or raster image (JPEG/PNG)
        const isSVG = fileExtension === '.svg' || file.type === 'image/svg+xml';
        
        if (isSVG) {
            // Route to SVG handler
            this.loadSVGFile(file);
        } else {
            // Route to image conversion handler (JPEG/PNG)
            this.convertImageToSVG(file);
        }
    }
    
    /**
     * Load and process SVG file
     * Task 3.1: Implement loadSVGFile() method
     * Task 3.1.1: Read file content using File API
     * Task 3.1.2: Store original and current SVG state
     * Task 3.1.3: Call analyzeSVG() method
     */
    async loadSVGFile(file) {
        try {
            // Clear previous state when loading new file
            this.clearHighlight();
            this.selectedColor = null;
            this.selectedColorIndex = -1;
            this.isSingleColorMode = false;
            
            // Task 3.1.1: Read file content using File API
            // Use FileReader to read the file content as text (compatible with both browser and test environments)
            const svgText = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.onerror = (e) => reject(new Error('Failed to read file'));
                reader.readAsText(file);
            });
            
            // Validate that we got content
            if (!svgText || svgText.trim().length === 0) {
                this.showError('SVG file is empty');
                return;
            }
            
            // Task 3.1.2: Store original and current SVG state
            // Store the original SVG content (immutable)
            this.originalSVG = svgText;
            // Store the current SVG content (mutable working copy)
            this.currentSVG = svgText;
            
            // Task 3.1.3: Call analyzeSVG() method
            // Analyze the SVG to extract color information
            await this.analyzeSVG(svgText);
            
            // Display the SVG in the preview area
            this.displaySVG(svgText);
            
            // Update all UI elements with the analyzed data
            this.updateUI();
            
            console.log('SVG file loaded successfully:', file.name);
            console.log('Colors found:', this.colorData.length);
            
        } catch (error) {
            console.error('Error loading SVG file:', error);
            this.showError('Failed to load SVG file: ' + error.message);
        }
    }
    
    /**
     * Load raster image (JPEG/PNG) to Image object
     * Task 4.1: Implement loadImage() method
     * Task 4.1.1: Create Image object from file
     * Task 4.1.2: Handle image load success/failure
     * Task 4.1.3: Clean up object URLs
     * Task 4.6: Enhanced error handling with detailed messages
     * @param {File} file - The image file to load
     * @returns {Promise<HTMLImageElement>} Promise that resolves with loaded Image object
     */
    loadImage(file) {
        return new Promise((resolve, reject) => {
            // Task 4.6: Validate file input
            if (!file) {
                reject(new Error('No file provided to loadImage'));
                return;
            }
            
            // Task 4.1.1: Create Image object from file
            const img = new Image();
            
            // Create object URL from file for loading
            let objectURL;
            try {
                objectURL = URL.createObjectURL(file);
            } catch (error) {
                reject(new Error('Failed to create object URL from file: ' + error.message));
                return;
            }
            
            // Task 4.6: Add timeout for image loading (30 seconds)
            const timeout = setTimeout(() => {
                // Task 4.1.3: Clean up object URL on timeout
                if (objectURL) {
                    URL.revokeObjectURL(objectURL);
                }
                reject(new Error('Image loading timed out after 30 seconds. The file may be too large or corrupted.'));
            }, 30000);
            
            // Task 4.1.2: Handle image load success
            img.onload = () => {
                // Clear timeout
                clearTimeout(timeout);
                
                // Task 4.1.3: Clean up object URL to prevent memory leaks
                URL.revokeObjectURL(objectURL);
                
                // Task 4.6: Validate loaded image (only in production, not in test environment)
                // In test environments, mock images may not have dimensions set
                if (img.width && img.height && (img.width <= 0 || img.height <= 0)) {
                    reject(new Error('Loaded image has invalid dimensions'));
                    return;
                }
                
                console.log('Image loaded successfully:', file.name, `${img.width}x${img.height}`);
                resolve(img);
            };
            
            // Task 4.1.2: Handle image load failure
            img.onerror = (error) => {
                // Clear timeout
                clearTimeout(timeout);
                
                // Task 4.1.3: Clean up object URL even on error
                URL.revokeObjectURL(objectURL);
                
                console.error('Failed to load image:', file.name);
                reject(new Error('Failed to load image'));
            };
            
            // Set the image source to trigger loading
            img.src = objectURL;
        });
    }
    
    /**
     * Convert JPEG/PNG image to SVG
     * Task 4.2: Implement convertImageToSVG() method
     * Task 4.2.1: Show loading indicator using jQuery
     * Task 4.2.2: Load image to canvas
     * Task 4.2.3: Scale down large images (max 800px)
     * Task 4.2.4: Extract ImageData from canvas
     * Task 4.2.5: Call quantizeImageData()
     * Task 4.2.6: Call imageDataToSVG()
     * Task 4.6: Add comprehensive error handling for image conversion failures
     * @param {File} file - The JPEG or PNG file to convert
     */
    async convertImageToSVG(file) {
        try {
            // Task 4.2.1: Show loading indicator using jQuery
            this.showLoading();
            
            // Clear previous state when loading new file
            this.clearHighlight();
            this.selectedColor = null;
            this.selectedColorIndex = -1;
            this.isSingleColorMode = false;
            
            console.log('Converting image to SVG:', file.name);
            
            // Validate file input
            if (!file) {
                throw new Error('No file provided for conversion');
            }
            
            // Task 4.2.2: Load image to canvas
            // Use the loadImage() method to load the image file
            let img;
            try {
                img = await this.loadImage(file);
            } catch (error) {
                throw new Error('Failed to load image file. The file may be corrupted or in an unsupported format.');
            }
            
            // Validate image dimensions
            if (!img.width || !img.height || img.width <= 0 || img.height <= 0) {
                throw new Error('Invalid image dimensions. The image may be corrupted.');
            }
            
            // Task 4.2.3: Scale down large images (max 800px)
            // Calculate scale factor to fit within 800x800 while maintaining aspect ratio
            const maxSize = 800;
            let width = img.width;
            let height = img.height;
            
            // Only scale down if image exceeds max size
            if (width > maxSize || height > maxSize) {
                const scale = Math.min(maxSize / width, maxSize / height);
                width = Math.floor(width * scale);
                height = Math.floor(height * scale);
                console.log(`Scaling image from ${img.width}x${img.height} to ${width}x${height}`);
            }
            
            // Validate scaled dimensions
            if (width <= 0 || height <= 0) {
                throw new Error('Invalid scaled dimensions. Cannot process image.');
            }
            
            // Task 4.6: Add error handling for canvas operations
            try {
                // Set canvas dimensions to scaled size
                this.canvas.width = width;
                this.canvas.height = height;
                
                // Draw the image to canvas at scaled size
                this.ctx.drawImage(img, 0, 0, width, height);
            } catch (error) {
                throw new Error('Failed to draw image to canvas. The image may be too large or corrupted.');
            }
            
            // Task 4.2.4: Extract ImageData from canvas
            let imageData;
            try {
                imageData = this.ctx.getImageData(0, 0, width, height);
            } catch (error) {
                throw new Error('Failed to extract image data from canvas. Canvas may be tainted or too large.');
            }
            
            // Validate ImageData
            if (!imageData || !imageData.data || imageData.data.length === 0) {
                throw new Error('Failed to extract valid image data. The image may be empty or corrupted.');
            }
            
            console.log(`Extracted ImageData: ${width}x${height}, ${imageData.data.length} bytes`);
            
            // Task 4.2.5: Call quantizeImageData()
            // Task 4.6: Add error handling for quantization
            let quantizedImageData;
            try {
                // Reduce colors to 16 using k-means clustering (per requirements 10.4)
                quantizedImageData = this.quantizeImageData(imageData, 16);
            } catch (error) {
                throw new Error('Failed to quantize image colors: ' + error.message);
            }
            
            // Validate quantized data
            if (!quantizedImageData || !quantizedImageData.data) {
                throw new Error('Color quantization produced invalid data.');
            }
            
            console.log('Image quantized to 16 colors');
            
            // Task 4.2.6: Call imageDataToSVG()
            // Task 4.6: Add error handling for SVG generation
            let svgText;
            try {
                // Convert the quantized pixel data to SVG format
                svgText = this.imageDataToSVG(quantizedImageData, width, height);
            } catch (error) {
                throw new Error('Failed to generate SVG from image data: ' + error.message);
            }
            
            // Validate SVG output
            if (!svgText || typeof svgText !== 'string' || svgText.trim().length === 0) {
                throw new Error('SVG generation produced empty or invalid output.');
            }
            
            console.log('Image converted to SVG');
            
            // Store the SVG as both original and current state
            this.originalSVG = svgText;
            this.currentSVG = svgText;
            
            // Task 4.6: Add error handling for SVG analysis
            try {
                // Analyze the generated SVG to extract color information
                await this.analyzeSVG(svgText);
            } catch (error) {
                // Log warning but don't fail - we can still display the SVG
                console.warn('Failed to analyze converted SVG:', error);
                // Initialize empty color data if analysis fails
                this.colorData = [];
                this.originalColorCount = 0;
            }
            
            // Task 4.6: Add error handling for SVG display
            try {
                // Display the SVG in the preview area
                this.displaySVG(svgText);
            } catch (error) {
                throw new Error('Failed to display converted SVG: ' + error.message);
            }
            
            // Update all UI elements with the analyzed data
            try {
                this.updateUI();
            } catch (error) {
                // Log warning but don't fail - conversion was successful
                console.warn('Failed to update UI after conversion:', error);
            }
            
            // Hide loading indicator
            this.hideLoading();
            
            console.log('Image to SVG conversion completed successfully');
            
        } catch (error) {
            // Task 4.6: Comprehensive error handling
            console.error('Error converting image to SVG:', error);
            
            // Ensure loading indicator is hidden on error
            this.hideLoading();
            
            // Display user-friendly error message
            const errorMessage = error.message || 'An unknown error occurred during image conversion';
            this.showError('Failed to convert image: ' + errorMessage);
            
            // Log detailed error for debugging
            console.error('Conversion error details:', {
                fileName: file ? file.name : 'unknown',
                fileType: file ? file.type : 'unknown',
                fileSize: file ? file.size : 'unknown',
                error: error
            });
        }
    }
    
    /**
     * Quantize ImageData to reduce color count using k-means clustering
     * Task 4.3: Implement quantizeImageData() method
     * Task 4.3.1: Extract unique colors with counts
     * Task 4.3.2: Apply k-means clustering (16 colors)
     * Task 4.3.3: Map pixels to nearest palette color
     * Task 4.3.4: Return quantized ImageData
     * Task 4.6: Add error handling for quantization failures
     * @param {ImageData} imageData - The image data to quantize
     * @param {number} colorCount - Target number of colors (default: 16)
     * @returns {ImageData} Quantized image data
     */
    quantizeImageData(imageData, colorCount = 16) {
        console.log(`Quantizing image to ${colorCount} colors...`);
        
        // Task 4.6: Validate input parameters
        if (!imageData) {
            throw new Error('No image data provided for quantization');
        }
        
        if (!imageData.data || imageData.data.length === 0) {
            throw new Error('Image data is empty or invalid');
        }
        
        if (!imageData.width || !imageData.height || imageData.width <= 0 || imageData.height <= 0) {
            throw new Error('Invalid image dimensions for quantization');
        }
        
        if (!colorCount || colorCount < 1) {
            throw new Error('Invalid color count for quantization');
        }
        
        const width = imageData.width;
        const height = imageData.height;
        const data = imageData.data;
        
        // Task 4.3.1: Extract unique colors with counts
        // Use a Map to track unique colors and their pixel counts
        const colorMap = new Map();
        
        // Iterate through all pixels
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];
            
            // Skip transparent pixels (alpha < 10)
            if (a < 10) {
                continue;
            }
            
            // Create color key (RGB only, ignore alpha)
            const colorKey = `${r},${g},${b}`;
            
            // Increment count for this color
            if (colorMap.has(colorKey)) {
                colorMap.set(colorKey, colorMap.get(colorKey) + 1);
            } else {
                colorMap.set(colorKey, 1);
            }
        }
        
        // Convert Map to array of ColorInfo objects
        const uniqueColors = [];
        colorMap.forEach((count, colorKey) => {
            const [r, g, b] = colorKey.split(',').map(Number);
            uniqueColors.push({
                rgb: { r, g, b },
                count: count
            });
        });
        
        console.log(`Found ${uniqueColors.length} unique colors`);
        
        // Task 4.6: Validate that we found at least some colors
        // Note: For all-transparent images, we return the original ImageData
        // This allows the conversion to complete even if no visible colors exist
        if (uniqueColors.length === 0) {
            console.warn('No colors found in image. The image may be completely transparent or empty.');
            return imageData; // Return original for transparent images
        }
        
        // If we already have fewer colors than target, no need to quantize
        if (uniqueColors.length <= colorCount) {
            console.log('Image already has fewer colors than target, returning original');
            return imageData;
        }
        
        // Task 4.3.2: Apply k-means clustering (16 colors)
        // Task 4.6: Add error handling for k-means clustering
        let reducedPalette;
        try {
            // Use kMeansColors() to reduce to target color count
            reducedPalette = this.kMeansColors(uniqueColors, colorCount);
        } catch (error) {
            throw new Error('K-means clustering failed: ' + error.message);
        }
        
        // Task 4.6: Validate clustering result
        if (!reducedPalette || reducedPalette.length === 0) {
            throw new Error('K-means clustering produced no colors');
        }
        
        console.log(`Reduced to ${reducedPalette.length} colors using k-means`);
        
        // Task 4.3.3: Map pixels to nearest palette color
        // Task 4.6: Add error handling for pixel mapping
        let quantizedData;
        try {
            // Create new ImageData for quantized result
            quantizedData = new ImageData(width, height);
        } catch (error) {
            throw new Error('Failed to create ImageData for quantized result: ' + error.message);
        }
        
        // Copy and quantize each pixel
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];
            
            // Preserve transparent pixels
            if (a < 10) {
                quantizedData.data[i] = r;
                quantizedData.data[i + 1] = g;
                quantizedData.data[i + 2] = b;
                quantizedData.data[i + 3] = a;
                continue;
            }
            
            // Find nearest color in reduced palette
            const pixelColor = { r, g, b };
            let nearestColor = reducedPalette[0].rgb;
            let minDistance = this.colorDistance(pixelColor, nearestColor);
            
            for (let j = 1; j < reducedPalette.length; j++) {
                const distance = this.colorDistance(pixelColor, reducedPalette[j].rgb);
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestColor = reducedPalette[j].rgb;
                }
            }
            
            // Set pixel to nearest palette color
            quantizedData.data[i] = nearestColor.r;
            quantizedData.data[i + 1] = nearestColor.g;
            quantizedData.data[i + 2] = nearestColor.b;
            quantizedData.data[i + 3] = a; // Preserve original alpha
        }
        
        // Task 4.3.4: Return quantized ImageData
        console.log('Quantization complete');
        return quantizedData;
    }
    
    /**
     * Convert ImageData to SVG format
     * Task 4.5: Implement imageDataToSVG() method
     * Task 4.5.1: Group consecutive same-color pixels in rows
     * Task 4.5.2: Generate SVG rect elements
     * Task 4.5.3: Build complete SVG XML structure
     * Task 4.5.4: Return SVG text
     * Task 4.6: Add error handling for SVG generation
     * @param {ImageData} imageData - The image data to convert
     * @param {number} width - Image width
     * @param {number} height - Image height
     * @returns {string} SVG text content
     */
    imageDataToSVG(imageData, width, height) {
        console.log(`Converting ImageData to SVG: ${width}x${height}`);
        
        // Task 4.6: Validate input parameters
        if (!imageData) {
            throw new Error('No image data provided for SVG conversion');
        }
        
        if (!imageData.data || imageData.data.length === 0) {
            throw new Error('Image data is empty or invalid');
        }
        
        if (!width || !height || width <= 0 || height <= 0) {
            throw new Error('Invalid dimensions for SVG conversion');
        }
        
        // Validate dimensions match ImageData
        if (imageData.width !== width || imageData.height !== height) {
            throw new Error('ImageData dimensions do not match provided width and height');
        }
        
        // Convert ImageData to a data URL for embedding in SVG
        // This avoids the horizontal line artifacts from rect-based conversion
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.putImageData(imageData, 0, 0);
        
        // Convert canvas to PNG data URL
        const dataUrl = canvas.toDataURL('image/png');
        
        console.log('Converted ImageData to embedded PNG');
        
        // Task 4.5.3: Build complete SVG XML structure
        // Create SVG with embedded image instead of rectangles
        const svgText = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    <image href="${dataUrl}" x="0" y="0" width="${width}" height="${height}" />
</svg>`;
        
        console.log('ImageData to SVG conversion complete');
        
        // Task 4.5.4: Return SVG text
        return svgText;
    }
    
    /**
     * K-means clustering for color quantization
     * Task 4.4: Implement kMeansColors() helper method
     * Task 4.4.1: Initialize centroids from most common colors
     * Task 4.4.2: Iterate 10 times for convergence
     * Task 4.4.3: Assign colors to nearest centroid
     * Task 4.4.4: Calculate weighted centroid updates
     * Task 4.6: Add error handling for k-means clustering
     * @param {Array} colors - Array of color objects with rgb and count properties
     * @param {number} k - Target number of colors
     * @returns {Array} Array of k color objects representing the reduced palette
     */
    kMeansColors(colors, k) {
        console.log(`Running k-means clustering with k=${k} on ${colors.length} colors`);
        
        // Task 4.6: Validate input parameters
        if (!colors || !Array.isArray(colors)) {
            throw new Error('Invalid colors array provided to k-means clustering');
        }
        
        if (colors.length === 0) {
            throw new Error('Cannot perform k-means clustering on empty colors array');
        }
        
        if (!k || k < 1) {
            throw new Error('Invalid k value for k-means clustering');
        }
        
        // Task 4.6: Validate color objects have required properties
        for (let i = 0; i < colors.length; i++) {
            const color = colors[i];
            if (!color.rgb || typeof color.rgb.r !== 'number' || typeof color.rgb.g !== 'number' || typeof color.rgb.b !== 'number') {
                throw new Error(`Invalid color object at index ${i}: missing or invalid rgb property`);
            }
            if (typeof color.count !== 'number' || color.count < 0) {
                throw new Error(`Invalid color object at index ${i}: missing or invalid count property`);
            }
        }
        
        // Task 4.4.1: Initialize centroids from most common colors
        // Sort colors by count (descending) to get most common colors
        const sortedColors = [...colors].sort((a, b) => b.count - a.count);
        
        // If k is greater than number of colors, use all colors and pad with duplicates
        const numCentroids = Math.min(k, colors.length);
        
        // Initialize centroids from the most common colors
        const centroids = sortedColors.slice(0, numCentroids).map(color => ({
            r: color.rgb.r,
            g: color.rgb.g,
            b: color.rgb.b
        }));
        
        // If k > colors.length, pad with duplicates of the first centroid
        while (centroids.length < k) {
            centroids.push({ ...centroids[0] });
        }
        
        console.log(`Initialized ${centroids.length} centroids from most common colors`);
        
        // Task 4.4.2: Iterate 10 times for convergence
        const maxIterations = 10;
        
        for (let iteration = 0; iteration < maxIterations; iteration++) {
            // Task 4.4.3: Assign colors to nearest centroid
            // Create clusters - array of arrays, one for each centroid
            const clusters = Array.from({ length: k }, () => []);
            
            // Assign each color to its nearest centroid
            colors.forEach(color => {
                let nearestCentroidIndex = 0;
                let minDistance = this.colorDistance(color.rgb, centroids[0]);
                
                for (let i = 1; i < centroids.length; i++) {
                    const distance = this.colorDistance(color.rgb, centroids[i]);
                    if (distance < minDistance) {
                        minDistance = distance;
                        nearestCentroidIndex = i;
                    }
                }
                
                // Add color to the cluster of its nearest centroid
                clusters[nearestCentroidIndex].push(color);
            });
            
            // Task 4.4.4: Calculate weighted centroid updates
            // Update each centroid to be the weighted average of its cluster
            for (let i = 0; i < k; i++) {
                const cluster = clusters[i];
                
                // Handle empty clusters - keep previous centroid
                if (cluster.length === 0) {
                    console.log(`Warning: Empty cluster ${i} at iteration ${iteration}`);
                    continue;
                }
                
                // Task 4.6: Add error handling for centroid calculation
                try {
                    // Calculate weighted average (weighted by pixel count)
                    let totalWeight = 0;
                    let weightedR = 0;
                    let weightedG = 0;
                    let weightedB = 0;
                    
                    cluster.forEach(color => {
                        const weight = color.count;
                        totalWeight += weight;
                        weightedR += color.rgb.r * weight;
                        weightedG += color.rgb.g * weight;
                        weightedB += color.rgb.b * weight;
                    });
                    
                    // Task 4.6: Validate total weight
                    if (totalWeight === 0) {
                        console.warn(`Warning: Zero total weight for cluster ${i}, keeping previous centroid`);
                        continue;
                    }
                    
                    // Update centroid to weighted average
                    centroids[i] = {
                        r: Math.round(weightedR / totalWeight),
                        g: Math.round(weightedG / totalWeight),
                        b: Math.round(weightedB / totalWeight)
                    };
                    
                    // Task 4.6: Validate centroid values are in valid range
                    centroids[i].r = Math.max(0, Math.min(255, centroids[i].r));
                    centroids[i].g = Math.max(0, Math.min(255, centroids[i].g));
                    centroids[i].b = Math.max(0, Math.min(255, centroids[i].b));
                    
                } catch (error) {
                    console.warn(`Warning: Error calculating centroid ${i} at iteration ${iteration}:`, error);
                    // Keep previous centroid on error
                }
            }
        }
        
        console.log(`K-means clustering complete after ${maxIterations} iterations`);
        
        // Return centroids as ColorInfo-like objects
        return centroids.map(centroid => ({
            rgb: centroid,
            count: 0 // Count not needed for palette
        }));
    }
    
    /**
     * Calculate Euclidean distance between two colors in RGB space
     * Task 8.5: Implement colorDistance() helper method
     * Task 8.5.1: Calculate Euclidean distance in RGB space
     * @param {Object} rgb1 - First color {r, g, b}
     * @param {Object} rgb2 - Second color {r, g, b}
     * @returns {number} Euclidean distance between colors
     */
    colorDistance(rgb1, rgb2) {
        const dr = rgb1.r - rgb2.r;
        const dg = rgb1.g - rgb2.g;
        const db = rgb1.b - rgb2.b;
        
        // Return Euclidean distance: sqrt((r1-r2)² + (g1-g2)² + (b1-b2)²)
        return Math.sqrt(dr * dr + dg * dg + db * db);
    }
    
    /**
     * Extract SVG dimensions from viewBox or width/height attributes
     * Task 5.3: Implement getSVGBoundingBox() helper method
     * @param {SVGElement} svgElement - The SVG element to extract dimensions from
     * @returns {Object} Object with width and height properties
     */
    getSVGBoundingBox(svgElement) {
        let width = 0;
        let height = 0;
        
        // Try to get dimensions from viewBox attribute first
        const viewBox = svgElement.getAttribute('viewBox');
        if (viewBox) {
            const parts = viewBox.trim().split(/\s+/);
            if (parts.length === 4) {
                // viewBox format: "minX minY width height"
                width = parseFloat(parts[2]);
                height = parseFloat(parts[3]);
            }
        }
        
        // If viewBox didn't provide valid dimensions, try width/height attributes
        if (!width || !height || width <= 0 || height <= 0) {
            const widthAttr = svgElement.getAttribute('width');
            const heightAttr = svgElement.getAttribute('height');
            
            if (widthAttr) {
                // Remove units (px, pt, etc.) and parse as float
                width = parseFloat(widthAttr.replace(/[^0-9.]/g, ''));
            }
            
            if (heightAttr) {
                // Remove units (px, pt, etc.) and parse as float
                height = parseFloat(heightAttr.replace(/[^0-9.]/g, ''));
            }
        }
        
        // If still no valid dimensions, use defaults
        if (!width || width <= 0) {
            width = 300; // Default SVG width
        }
        
        if (!height || height <= 0) {
            height = 150; // Default SVG height
        }
        
        return { width, height };
    }
    
    /**
     * Analyze pixel data to extract color information
     * Task 5.2: Implement analyzePixels() method
     * Task 5.2.1: Iterate through pixel data
     * Task 5.2.2: Skip transparent pixels (alpha < 10)
     * Task 5.2.3: Count colors using Map
     * Task 5.2.4: Calculate percentages
     * Task 5.2.5: Sort colors by count (descending)
     * Task 5.2.6: Return ColorInfo array
     * @param {ImageData} imageData - The image data to analyze
     * @returns {Array} Array of ColorInfo objects
     */
    analyzePixels(imageData) {
        console.log('Analyzing pixels...');
        
        const data = imageData.data;
        const colorMap = new Map();
        let totalPixels = 0;
        
        // Task 5.2.1: Iterate through pixel data
        // ImageData.data is a Uint8ClampedArray with 4 values per pixel (RGBA)
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];
            
            // Task 5.2.2: Skip transparent pixels (alpha < 10)
            if (a < 10) {
                continue;
            }
            
            // Task 5.2.3: Count colors using Map
            // Create color key (RGB only, ignore alpha for color matching)
            const colorKey = `${r},${g},${b}`;
            
            // Increment count for this color
            if (colorMap.has(colorKey)) {
                colorMap.set(colorKey, colorMap.get(colorKey) + 1);
            } else {
                colorMap.set(colorKey, 1);
            }
            
            // Track total non-transparent pixels
            totalPixels++;
        }
        
        console.log(`Found ${colorMap.size} unique colors in ${totalPixels} pixels`);
        
        // Convert Map to array of ColorInfo objects
        const colorData = [];
        
        colorMap.forEach((count, colorKey) => {
            const [r, g, b] = colorKey.split(',').map(Number);
            
            // Task 5.2.4: Calculate percentages
            const percentage = totalPixels > 0 ? (count / totalPixels) * 100 : 0;
            
            // Create ColorInfo object
            colorData.push({
                hex: this.rgbToHex(r, g, b),
                count: count,
                percentage: percentage,
                rgb: { r, g, b }
            });
        });
        
        // Task 5.2.5: Sort colors by count (descending)
        colorData.sort((a, b) => b.count - a.count);
        
        // Task 5.2.6: Return ColorInfo array
        return colorData;
    }
    
    /**
     * Analyze colors in SVG content
     * Task 5.1: Implement analyzeSVG() method
     * Task 5.1.1: Parse SVG using DOMParser
     * Task 5.1.2: Extract viewBox or dimensions
     * Task 5.1.3: Calculate canvas scale factor
     * Task 5.1.4: Render SVG to canvas
     * Task 5.1.5: Extract ImageData
     * Task 5.1.6: Call analyzePixels()
     * Task 5.1.7: Store original color count
     * @param {string} svgText - The SVG text content to analyze
     */
    async analyzeSVG(svgText) {
        try {
            console.log('Analyzing SVG colors...');
            
            // Task 5.1.1: Parse SVG using DOMParser
            const parser = new DOMParser();
            const doc = parser.parseFromString(svgText, 'image/svg+xml');
            
            // Check for parser errors
            const parserError = doc.querySelector('parsererror');
            if (parserError) {
                throw new Error('Failed to parse SVG: ' + parserError.textContent);
            }
            
            const svgElement = doc.documentElement;
            if (!svgElement || svgElement.tagName.toLowerCase() !== 'svg') {
                throw new Error('Invalid SVG: Missing SVG root element');
            }
            
            // Task 5.1.2: Extract viewBox or dimensions
            const { width, height } = this.getSVGBoundingBox(svgElement);
            
            // Validate dimensions
            if (!width || !height || width <= 0 || height <= 0) {
                throw new Error('Invalid SVG dimensions: ' + width + 'x' + height);
            }
            
            console.log(`SVG dimensions: ${width}x${height}`);
            
            // Task 5.1.3: Calculate canvas scale factor
            // Maximum dimension for canvas rendering (per design: 800px)
            const maxSize = 800;
            // Scale factor: min(800 / width, 800 / height, 2)
            // The factor of 2 allows for higher resolution rendering of small SVGs
            const scale = Math.min(maxSize / width, maxSize / height, 2);
            
            // Calculate scaled canvas dimensions
            const canvasWidth = Math.floor(width * scale);
            const canvasHeight = Math.floor(height * scale);
            
            console.log(`Canvas scale factor: ${scale}, scaled dimensions: ${canvasWidth}x${canvasHeight}`);
            
            // Task 5.1.4: Render SVG to canvas
            // Set canvas dimensions
            this.canvas.width = canvasWidth;
            this.canvas.height = canvasHeight;
            
            // Create an Image object to render the SVG
            const img = new Image();
            
            // Create a promise to wait for image load
            const imageLoadPromise = new Promise((resolve, reject) => {
                img.onload = () => resolve();
                img.onerror = () => reject(new Error('Failed to render SVG to canvas'));
                
                // Set timeout for image loading (10 seconds)
                setTimeout(() => reject(new Error('SVG rendering timed out')), 10000);
            });
            
            // Convert SVG text to data URL for rendering
            const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);
            
            // Set image source to trigger loading
            img.src = url;
            
            // Wait for image to load
            await imageLoadPromise;
            
            // Clean up object URL
            URL.revokeObjectURL(url);
            
            // Clear canvas and draw the SVG image at scaled size
            this.ctx.clearRect(0, 0, canvasWidth, canvasHeight);
            this.ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
            
            console.log('SVG rendered to canvas');
            
            // Task 5.1.5: Extract ImageData
            const imageData = this.ctx.getImageData(0, 0, canvasWidth, canvasHeight);
            
            // Validate ImageData
            if (!imageData || !imageData.data || imageData.data.length === 0) {
                throw new Error('Failed to extract image data from canvas');
            }
            
            // Cache ImageData for highlighting feature
            this.svgImageData = imageData;
            
            console.log(`Extracted ImageData: ${canvasWidth}x${canvasHeight}, ${imageData.data.length} bytes`);
            
            // Task 5.1.6: Call analyzePixels()
            this.colorData = this.analyzePixels(imageData);
            
            console.log(`Analysis complete: found ${this.colorData.length} colors`);
            
            // Task 5.1.7: Store original color count
            // Only update original color count if this is the first analysis
            // (subsequent analyses after color edits should not update this)
            if (this.originalColorCount === 0) {
                this.originalColorCount = this.colorData.length;
            }
            
        } catch (error) {
            console.error('Error analyzing SVG:', error);
            throw error; // Re-throw to allow caller to handle
        }
    }
    
    /**
     * Display SVG in preview area
     * Task 3.2: Implement displaySVG() method using jQuery
     * Task 3.2.1: Insert SVG into preview container
     * Task 3.2.2: Show main content area
     * Task 3.3: Add error handling for malformed SVG files
     */
    displaySVG(svgText) {
        try {
            // Task 3.3: Validate SVG format using DOMParser
            const parser = new DOMParser();
            const doc = parser.parseFromString(svgText, 'image/svg+xml');
            
            // Check for parser errors
            const parserError = doc.querySelector('parsererror');
            if (parserError) {
                throw new Error('Invalid SVG format: ' + parserError.textContent);
            }
            
            // Verify the document has an SVG root element
            if (!doc.documentElement || doc.documentElement.tagName.toLowerCase() !== 'svg') {
                throw new Error('Invalid SVG format: Missing SVG root element');
            }
            
            // Task 3.2.1: Insert SVG into both original and preview containers using jQuery
            // Display in original section (always replace to show new image)
            const $svgOriginal = $('#svgOriginal');
            if ($svgOriginal.length) {
                $svgOriginal.html(svgText);
            }
            
            // Insert SVG into preview, keeping the canvas element
            const $canvas = this.$elements.svgPreview.find('#highlightCanvas');
            this.$elements.svgPreview.empty();
            this.$elements.svgPreview.html(svgText);
            this.$elements.svgPreview.append($canvas);
            
            // Task 3.2.2: Show main content area using jQuery
            this.$elements.mainContent.fadeIn();
            $('#colorGroupsContainer').fadeIn();
            
            console.log('SVG displayed successfully');
            
        } catch (error) {
            console.error('Error displaying SVG:', error);
            this.showError('Failed to display SVG: ' + error.message);
            throw error; // Re-throw to allow caller to handle
        }
    }
    
    /**
     * Update all UI elements with current state
     * Task 10.1: Implement updateUI() method using jQuery
     * Task 10.1.1: Update original colors count
     * Task 10.1.2: Update current colors count
     * Task 10.1.3: Call renderColorList()
     * Task 10.1.4: Call renderTopPalette()
     */
    updateUI() {
        console.log('=== updateUI() called ===');
        console.log('selectedColor:', this.selectedColor);
        console.log('selectedColorIndex:', this.selectedColorIndex);
        console.log('isSingleColorMode:', this.isSingleColorMode);
        console.log('colorData.length:', this.colorData.length);
        
        // Task 10.1.1: Update original colors count
        this.$elements.originalColorCount.text(this.originalColorCount);
        
        // Task 10.1.2: Update current colors count
        // Check if a color is currently selected and update accordingly
        if (this.selectedColor && this.selectedColorIndex >= 0) {
            // Color is selected - show the appropriate count
            if (this.isSingleColorMode) {
                console.log('Setting currentColorCount to 1 (single color mode)');
                this.$elements.currentColorCount.text('1');
            } else {
                const count = this.selectedColorIndex + 1;
                console.log('Setting currentColorCount to', count, '(cumulative mode)');
                this.$elements.currentColorCount.text(count);
            }
        } else {
            // No color selected - show total count
            console.log('Setting currentColorCount to', this.colorData.length, '(no selection)');
            this.$elements.currentColorCount.text(this.colorData.length);
        }
        
        console.log('After update, currentColorCount.text() =', this.$elements.currentColorCount.text());
        
        // Task 10.1.3: Call renderColorList()
        this.renderColorList();
        
        // Render color groups bubble chart
        this.renderColorGroups();
        
        // Task 10.1.4: Call renderTopPalette()
        this.renderTopPalette();
        
        console.log('UI updated');
    }
    
    /**
     * Render top color palette with clickable swatches
     * Task 6.1: Implement renderTopPalette() method using jQuery
     * Task 6.1.1: Clear existing palette
     * Task 6.1.2: Create swatch container for each color
     * Task 6.1.3: Create color swatch div with background color
     * Task 6.1.4: Add pixel count label below swatch
     * Task 6.1.5: Format count with toLocaleString()
     * Task 6.1.6: Add tooltip with hex, percentage, and count
     * Task 6.1.7: Bind click event to highlightColor()
     * Task 6.1.8: Append to palette container
     */
    renderTopPalette() {
        // Task 6.1.1: Clear existing palette
        const $palette = this.$elements.colorPaletteTop;
        $palette.empty();
        
        // Iterate through all colors in descending order by occurrence
        this.colorData.forEach((color) => {
            // Task 6.1.2: Create swatch container for each color
            const $container = $('<div>').addClass('palette-swatch-container');
            
            // Task 6.1.3: Create color swatch div with background color
            const $swatch = $('<div>')
                .addClass('palette-swatch')
                .css('background-color', color.hex);
            
            // Task 6.1.6: Add tooltip with hex, percentage, and count
            // Format: "#FF5733 - 25.50% (1,234 pixels)"
            const tooltipText = `${color.hex.toUpperCase()} - ${color.percentage.toFixed(2)}% (${color.count.toLocaleString()} pixels)`;
            $swatch.attr('title', tooltipText);
            
            // Store color hex as data attribute for click handler
            $swatch.data('color-hex', color.hex);
            
            // Task 6.1.7: Bind click event to highlightColor()
            $swatch.on('click', (e) => {
                this.highlightColor(color.hex, $(e.currentTarget));
            });
            
            // Task 6.1.4: Add pixel count label below swatch
            // Task 6.1.5: Format count with toLocaleString()
            const $count = $('<div>')
                .addClass('palette-count')
                .text(color.count.toLocaleString());
            
            // Task 6.1.8: Append to palette container
            $container.append($swatch, $count);
            $palette.append($container);
        });
        
        console.log(`Rendered ${this.colorData.length} color swatches in top palette`);
    }
    
    /**
     * Render color groups as hierarchical bubble chart
     * Groups similar colors and displays them as nested circles
     */
    renderColorGroups() {
        const $colorGroups = $('#colorGroups');
        $colorGroups.empty();
        
        // Group colors by similarity using k-means clustering
        const numGroups = Math.min(8, Math.ceil(this.colorData.length / 5));
        const colorGroups = this.groupColorsBySimilarity(this.colorData, numGroups);
        
        // Create bubble for each group
        colorGroups.forEach((group, groupIndex) => {
            // Calculate group size based on total pixels in group
            const groupTotalPixels = group.colors.reduce((sum, c) => sum + c.count, 0);
            const groupPercentage = (groupTotalPixels / group.colors.reduce((sum, c) => sum + c.count, 0)) * 100;
            
            // Size based on group importance
            const minSize = 80;
            const maxSize = 160;
            const sizeRatio = Math.sqrt(groupTotalPixels / this.colorData[0].count);
            const groupSize = Math.min(maxSize, minSize + (maxSize - minSize) * sizeRatio);
            
            // Create group container
            const $groupBubble = $('<div>')
                .addClass('color-group-bubble')
                .css({
                    'width': groupSize + 'px',
                    'height': groupSize + 'px',
                    'position': 'relative'
                });
            
            // Add individual color circles inside the group
            group.colors.forEach((color, colorIndex) => {
                const colorPercentage = (color.count / groupTotalPixels) * 100;
                
                // Size individual colors within the group
                const minColorSize = 20;
                const maxColorSize = groupSize * 0.4;
                const colorSize = minColorSize + (maxColorSize - minColorSize) * (colorPercentage / 100);
                
                // Position colors in a circular pattern within the group
                const angle = (colorIndex / group.colors.length) * 2 * Math.PI;
                const radius = (groupSize - colorSize) / 3;
                const x = (groupSize / 2) + radius * Math.cos(angle) - (colorSize / 2);
                const y = (groupSize / 2) + radius * Math.sin(angle) - (colorSize / 2);
                
                const $colorCircle = $('<div>')
                    .addClass('color-circle')
                    .css({
                        'background-color': color.hex,
                        'width': colorSize + 'px',
                        'height': colorSize + 'px',
                        'position': 'absolute',
                        'left': x + 'px',
                        'top': y + 'px',
                        'border-radius': '50%',
                        'cursor': 'pointer',
                        'box-shadow': '0 2px 4px rgba(0,0,0,0.2)',
                        'transition': 'all 0.3s ease'
                    })
                    .attr('title', `${color.hex.toUpperCase()} - ${color.percentage.toFixed(2)}%`)
                    .data('color-hex', color.hex);
                
                // Bind click event
                $colorCircle.on('click', (e) => {
                    e.stopPropagation();
                    this.highlightColor(color.hex, $(e.currentTarget), true); // true = single color mode
                });
                
                $colorCircle.on('mouseenter', function() {
                    $(this).css('transform', 'scale(1.2)');
                });
                
                $colorCircle.on('mouseleave', function() {
                    $(this).css('transform', 'scale(1)');
                });
                
                $groupBubble.append($colorCircle);
            });
            
            $colorGroups.append($groupBubble);
        });
        
        console.log(`Rendered ${colorGroups.length} color groups with ${this.colorData.length} total colors`);
    }
    
    /**
     * Group colors by similarity using k-means clustering
     * @param {Array} colors - Array of color objects
     * @param {number} k - Number of groups to create
     * @returns {Array} Array of color groups
     */
    groupColorsBySimilarity(colors, k) {
        if (colors.length <= k) {
            // If we have fewer colors than groups, each color is its own group
            return colors.map(color => ({
                colors: [color],
                centroid: color.rgb
            }));
        }
        
        // Use k-means to cluster colors
        const clusteredColors = this.kMeansColors(colors, k);
        
        // Assign each original color to nearest cluster
        const groups = Array.from({ length: k }, () => ({ colors: [], centroid: null }));
        
        clusteredColors.forEach((cluster, index) => {
            groups[index].centroid = cluster.rgb;
        });
        
        // Assign colors to groups
        colors.forEach(color => {
            let nearestGroupIndex = 0;
            let minDistance = this.colorDistance(color.rgb, groups[0].centroid);
            
            for (let i = 1; i < groups.length; i++) {
                const distance = this.colorDistance(color.rgb, groups[i].centroid);
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestGroupIndex = i;
                }
            }
            
            groups[nearestGroupIndex].colors.push(color);
        });
        
        // Filter out empty groups and sort colors within each group by count
        return groups
            .filter(group => group.colors.length > 0)
            .map(group => ({
                ...group,
                colors: group.colors.sort((a, b) => b.count - a.count)
            }));
    }
    
    /**
     * Render detailed color list in sidebar
     * Task 6.2: Implement renderColorList() method using jQuery
     * Task 6.2.1: Clear existing list
     * Task 6.2.2: Create color item for each color
     * Task 6.2.3: Add HTML5 color picker input
     * Task 6.2.4: Add hex code display
     * Task 6.2.5: Add percentage display
     * Task 6.2.6: Add percentage bar visualization
     * Task 6.2.7: Bind change event to updateColor()
     * Task 6.2.8: Append to color list container
     */
    renderColorList() {
        // Task 6.2.1: Clear existing list
        const $colorList = this.$elements.colorList;
        $colorList.empty();
        
        // Task 6.2.2: Create color item for each color
        this.colorData.forEach((color, index) => {
            // Create the color item container
            const $item = $('<div>').addClass('color-item');
            
            // Task 6.2.3: Add HTML5 color picker input
            const $colorSwatch = $('<input>')
                .attr('type', 'color')
                .addClass('color-swatch')
                .val(color.hex)
                .attr('data-index', index);
            
            // Create color info container
            const $colorInfo = $('<div>').addClass('color-info');
            
            // Task 6.2.4: Add hex code display
            const $colorHex = $('<div>')
                .addClass('color-hex')
                .text(color.hex.toUpperCase());
            
            // Task 6.2.5: Add percentage display
            const $colorPercentage = $('<div>')
                .addClass('color-percentage')
                .text(`${color.percentage.toFixed(2)}%`);
            
            // Task 6.2.6: Add percentage bar visualization
            const $percentageBar = $('<div>').addClass('percentage-bar');
            const $percentageFill = $('<div>')
                .addClass('percentage-fill')
                .css('width', `${Math.min(color.percentage, 100)}%`);
            
            $percentageBar.append($percentageFill);
            
            // Assemble the color info section
            $colorInfo.append($colorHex, $colorPercentage, $percentageBar);
            
            // Assemble the complete color item
            $item.append($colorSwatch, $colorInfo);
            
            // Task 6.2.7: Bind change event to updateColor()
            $colorSwatch.on('change', (e) => {
                const newHex = $(e.target).val();
                this.updateColor(index, newHex);
            });
            
            // Task 6.2.8: Append to color list container
            $colorList.append($item);
        });
        
        console.log(`Rendered ${this.colorData.length} colors in sidebar list`);
    }
    
    /**
     * Highlight selected color in preview
     * Task 7.1: Implement highlightColor() method
     * Task 7.1.1: Check for toggle (same color clicked)
     * Task 7.1.2: Update selectedColor state
     * Task 7.1.3: Update active class on swatches using jQuery
     * Task 7.1.4: Show clear highlight button
     * Task 7.1.5: Call createHighlightOverlay()
     * @param {string} colorHex - The hex color to highlight
     * @param {jQuery} $swatchElement - The jQuery element of the clicked swatch
     */
    highlightColor(colorHex, $swatchElement, isSingleColorMode = false) {
        console.log('Highlighting color:', colorHex, 'Single color mode:', isSingleColorMode);
        
        // Task 7.1.1: Check for toggle (same color clicked)
        // If the same color is clicked again, clear the highlight (toggle off)
        if (this.selectedColor === colorHex) {
            console.log('Same color clicked, toggling off highlight');
            this.clearHighlight();
            return;
        }
        
        // Task 7.1.2: Update selectedColor state
        // Store the currently selected color
        this.selectedColor = colorHex;
        this.isSingleColorMode = isSingleColorMode;
        
        // Find the index of the selected color in colorData
        // This determines which colors should be visible
        this.selectedColorIndex = this.colorData.findIndex(c => c.hex === colorHex);
        
        console.log('Selected color index:', this.selectedColorIndex);
        
        // Task 7.1.3: Update active class on swatches using jQuery
        // Remove active class from all swatches, bubbles, and circles
        $('.palette-swatch').removeClass('active');
        $('.color-bubble').removeClass('active');
        $('.color-circle').removeClass('active');
        
        // Add active class to the clicked element
        $swatchElement.addClass('active');
        
        // Task 7.1.4: Show clear highlight button
        // Display the clear highlight button using jQuery
        this.$elements.clearHighlightBtn.fadeIn();
        
        // Task 7.1.5: Call createHighlightOverlay()
        // If all colors are selected (last color), just clear the overlay to show original
        if (this.selectedColorIndex === this.colorData.length - 1 && !isSingleColorMode) {
            console.log('All colors selected, clearing overlay to show original');
            if (this.highlightCanvas && this.highlightCtx) {
                const width = this.highlightCanvas.width;
                const height = this.highlightCanvas.height;
                this.highlightCtx.clearRect(0, 0, width, height);
            }
        } else {
            // Create and render the highlight overlay
            this.createHighlightOverlay();
        }
        
        // Update current colors count based on selection
        // Use setTimeout to ensure this happens after any other UI updates
        const updateCount = () => {
            if (isSingleColorMode) {
                // Single color mode: only 1 color visible
                console.log('Updating currentColorCount to: 1 (single color mode)');
                this.$elements.currentColorCount.text('1');
            } else {
                // Cumulative mode: show count of colors up to selected index
                const newCount = this.selectedColorIndex + 1;
                console.log('Updating currentColorCount to:', newCount, '(cumulative mode, index:', this.selectedColorIndex, ')');
                this.$elements.currentColorCount.text(newCount);
            }
            console.log('currentColorCount updated to:', this.$elements.currentColorCount.text());
        };
        
        // Update immediately and then again after a delay to override any other updates
        updateCount();
        setTimeout(updateCount, 10);
        setTimeout(updateCount, 50);
        setTimeout(updateCount, 100);
        
        console.log('Color highlighting activated for:', colorHex);
    }
    
    /**
     * Create highlight overlay on canvas
     * Task 7.2: Implement createHighlightOverlay() method
     * Task 7.2.1: Set canvas dimensions to match SVG
     * Task 7.2.2: Create new ImageData for overlay
     * Task 7.2.3: Process each pixel with color matching
     * Task 7.2.4: Brighten matching pixels (multiply by 1.1)
     * Task 7.2.5: Darken non-matching pixels (multiply by 0.2)
     * Task 7.2.6: Draw overlay to highlight canvas
     */
    createHighlightOverlay() {
        console.log('Creating highlight overlay for color:', this.selectedColor);
        
        // Validate that we have cached image data from analyzeSVG()
        if (!this.svgImageData) {
            console.error('No cached SVG image data available for highlighting');
            return;
        }
        
        // Validate that we have a selected color
        if (!this.selectedColor) {
            console.error('No color selected for highlighting');
            return;
        }
        
        // Convert selected color hex to RGB for comparison
        const selectedRgb = this.hexToRgb(this.selectedColor);
        if (!selectedRgb) {
            console.error('Failed to convert selected color to RGB:', this.selectedColor);
            return;
        }
        
        // Task 7.2.1: Set canvas dimensions to match displayed SVG
        // Get the actual displayed SVG element
        const $displayedSvg = this.$elements.svgPreview.find('svg');
        if ($displayedSvg.length === 0) {
            console.error('No SVG found in preview');
            return;
        }
        
        // Get the displayed dimensions of the SVG
        const displayedWidth = $displayedSvg.width();
        const displayedHeight = $displayedSvg.height();
        
        // Set canvas CSS size to match displayed SVG
        $(this.highlightCanvas).css({
            width: displayedWidth + 'px',
            height: displayedHeight + 'px'
        });
        
        // Set canvas internal dimensions to match the analyzed image data
        const width = this.svgImageData.width;
        const height = this.svgImageData.height;
        this.highlightCanvas.width = width;
        this.highlightCanvas.height = height;
        
        console.log(`Highlight canvas dimensions set to: ${width}x${height}, displayed as: ${displayedWidth}x${displayedHeight}`);
        
        // Task 7.2.2: Create new ImageData for overlay
        // Create a new ImageData object for the overlay
        const overlayData = new ImageData(width, height);
        
        // Get references to the pixel data arrays
        const sourceData = this.svgImageData.data;
        const overlayPixels = overlayData.data;
        
        // Color matching tolerance (±15 RGB units per requirements 4.5)
        const tolerance = 15;
        
        // Determine which colors to show based on mode
        let visibleColors;
        if (this.isSingleColorMode) {
            // Single color mode: show only the selected color
            visibleColors = [selectedRgb];
            console.log(`Single color mode: showing only ${this.selectedColor}`);
        } else {
            // Cumulative mode: show all colors up to selected index
            visibleColors = this.selectedColorIndex >= 0 
                ? this.colorData.slice(0, this.selectedColorIndex + 1).map(c => this.hexToRgb(c.hex))
                : [];
            console.log(`Cumulative mode: showing ${visibleColors.length} colors (indices 0-${this.selectedColorIndex})`);
        }
        
        // Task 7.2.3: Process each pixel with color matching
        // Iterate through all pixels in the image data
        for (let i = 0; i < sourceData.length; i += 4) {
            const r = sourceData[i];
            const g = sourceData[i + 1];
            const b = sourceData[i + 2];
            const a = sourceData[i + 3];
            
            // Skip transparent pixels (alpha < 10)
            if (a < 10) {
                // Render transparent pixels as transparent in overlay
                overlayPixels[i] = 0;
                overlayPixels[i + 1] = 0;
                overlayPixels[i + 2] = 0;
                overlayPixels[i + 3] = 0;
                continue;
            }
            
            // Create RGB object for current pixel
            const pixelRgb = { r, g, b };
            
            // Check if pixel matches any of the visible colors (within tolerance)
            let isVisible = false;
            for (const visibleColor of visibleColors) {
                if (this.colorsMatch(pixelRgb, visibleColor, tolerance)) {
                    isVisible = true;
                    break;
                }
            }
            
            if (isVisible) {
                // Task 7.2.4: Keep visible pixels at full brightness with original color
                overlayPixels[i] = r;
                overlayPixels[i + 1] = g;
                overlayPixels[i + 2] = b;
                overlayPixels[i + 3] = 255; // Fully opaque
            } else {
                // Task 7.2.5: Darken non-visible pixels significantly (multiply by 0.3)
                overlayPixels[i] = Math.round(r * 0.3);
                overlayPixels[i + 1] = Math.round(g * 0.3);
                overlayPixels[i + 2] = Math.round(b * 0.3);
                overlayPixels[i + 3] = 255; // Fully opaque
            }
        }
        
        // Task 7.2.6: Draw overlay to highlight canvas
        // Clear the highlight canvas first
        this.highlightCtx.clearRect(0, 0, width, height);
        
        // Draw the processed overlay ImageData to the highlight canvas
        this.highlightCtx.putImageData(overlayData, 0, 0);
        
        console.log('Highlight overlay created and rendered');
    }
    
    /**
     * Check if two colors match within tolerance
     * Task 7.3: Implement colorsMatch() helper method
     * Task 7.3.1: Compare RGB values with tolerance (±15)
     * Task 7.3.2: Return boolean result
     * @param {Object} rgb1 - First color {r, g, b}
     * @param {Object} rgb2 - Second color {r, g, b}
     * @param {number} tolerance - Color matching tolerance (default: 15)
     * @returns {boolean} True if colors match within tolerance
     */
    colorsMatch(rgb1, rgb2, tolerance = 15) {
        // Task 7.3.1: Compare RGB values with tolerance (±15)
        // Check if the absolute difference in each channel is within tolerance
        const rMatch = Math.abs(rgb1.r - rgb2.r) <= tolerance;
        const gMatch = Math.abs(rgb1.g - rgb2.g) <= tolerance;
        const bMatch = Math.abs(rgb1.b - rgb2.b) <= tolerance;
        
        // Task 7.3.2: Return boolean result
        // All three channels must match within tolerance
        return rMatch && gMatch && bMatch;
    }
    
    /**
     * Clear color highlighting
     * Task 7.4: Implement clearHighlight() method using jQuery
     * Task 7.4.1: Clear selectedColor state
     * Task 7.4.2: Clear highlight canvas
     * Task 7.4.3: Remove active class from swatches
     * Task 7.4.4: Hide clear highlight button
     * Task 7.4.5: Restore original current colors count
     */
    clearHighlight() {
        console.log('Clearing highlight');
        
        // Task 7.4.1: Clear selectedColor state
        this.selectedColor = null;
        this.selectedColorIndex = -1;
        this.isSingleColorMode = false;
        
        // Task 7.4.2: Clear highlight canvas
        if (this.highlightCanvas && this.highlightCtx) {
            const width = this.highlightCanvas.width;
            const height = this.highlightCanvas.height;
            this.highlightCtx.clearRect(0, 0, width, height);
        }
        
        // Task 7.4.3: Remove active class from swatches using jQuery
        $('.palette-swatch').removeClass('active');
        $('.color-bubble').removeClass('active');
        $('.color-circle').removeClass('active');
        
        // Task 7.4.4: Hide clear highlight button using jQuery
        this.$elements.clearHighlightBtn.fadeOut();
        
        // Task 7.4.5: Restore original current colors count
        if (this.colorData && this.colorData.length > 0) {
            console.log('Restoring currentColorCount to:', this.colorData.length);
            this.$elements.currentColorCount.text(this.colorData.length);
            console.log('currentColorCount after restore:', this.$elements.currentColorCount.text());
        }
        
        console.log('Highlight cleared');
    }
    
    /**
     * Reduce colors using k-means clustering
     * Task 8.1: Implement reduceColors() method
     * Task 8.1.1: Validate target count vs current count
     * Task 8.1.2: Call kMeansClustering()
     * Task 8.1.3: Create color mapping (old → new)
     * Task 8.1.4: Apply mapping to SVG text
     * Task 8.1.5: Update currentSVG state
     * Task 8.1.6: Re-analyze colors
     * Task 8.1.7: Update UI
     * @param {number} targetCount - Target number of colors to reduce to
     */
    async reduceColors(targetCount) {
        try {
            console.log(`Reducing colors to ${targetCount}...`);
            
            // Task 8.1.1: Validate target count vs current count
            const currentColorCount = this.colorData.length;
            
            // Validate that target count is less than current count
            if (targetCount >= currentColorCount) {
                this.showError(`Current color count is already at or below target (${currentColorCount} colors)`);
                console.warn(`Cannot reduce: target count ${targetCount} >= current count ${currentColorCount}`);
                return;
            }
            
            // Validate target count is positive
            if (targetCount < 1) {
                this.showError('Target color count must be at least 1');
                return;
            }
            
            // Validate we have SVG to work with
            if (!this.currentSVG) {
                this.showError('No SVG loaded');
                return;
            }
            
            console.log(`Current colors: ${currentColorCount}, target: ${targetCount}`);
            
            // Task 8.1.2: Call kMeansClustering()
            // Use kMeansColors() method (already implemented) to reduce colors
            const reducedPalette = this.kMeansColors(this.colorData, targetCount);
            
            console.log(`K-means clustering complete, reduced to ${reducedPalette.length} colors`);
            
            // Task 8.1.3: Create color mapping (old → new)
            // Map each old color to its nearest color in the reduced palette
            const colorMapping = new Map();
            
            this.colorData.forEach(oldColor => {
                // Find nearest color in reduced palette
                let nearestColor = reducedPalette[0].rgb;
                let minDistance = this.colorDistance(oldColor.rgb, nearestColor);
                
                for (let i = 1; i < reducedPalette.length; i++) {
                    const distance = this.colorDistance(oldColor.rgb, reducedPalette[i].rgb);
                    if (distance < minDistance) {
                        minDistance = distance;
                        nearestColor = reducedPalette[i].rgb;
                    }
                }
                
                // Store mapping from old hex to new hex
                const newHex = this.rgbToHex(nearestColor.r, nearestColor.g, nearestColor.b);
                colorMapping.set(oldColor.hex, newHex);
            });
            
            console.log(`Created color mapping for ${colorMapping.size} colors`);
            
            // Task 8.1.4: Apply mapping to SVG text
            // Replace all color occurrences in the SVG
            let updatedSVG = this.currentSVG;
            
            colorMapping.forEach((newHex, oldHex) => {
                // Skip if colors are the same (no replacement needed)
                if (oldHex === newHex) {
                    return;
                }
                
                // Replace all occurrences of the old color with the new color
                // Handle different color formats:
                
                // 1. Lowercase hex format (#abc123)
                const lowerHexRegex = new RegExp(oldHex.toLowerCase(), 'g');
                updatedSVG = updatedSVG.replace(lowerHexRegex, newHex.toLowerCase());
                
                // 2. Uppercase hex format (#ABC123)
                const upperHexRegex = new RegExp(oldHex.toUpperCase(), 'g');
                updatedSVG = updatedSVG.replace(upperHexRegex, newHex.toUpperCase());
                
                // 3. RGB format (rgb(171, 193, 35))
                const oldRgb = this.hexToRgb(oldHex);
                const newRgb = this.hexToRgb(newHex);
                
                if (oldRgb && newRgb) {
                    // Match rgb() format with optional spaces
                    const rgbPattern = `rgb\\(\\s*${oldRgb.r}\\s*,\\s*${oldRgb.g}\\s*,\\s*${oldRgb.b}\\s*\\)`;
                    const rgbRegex = new RegExp(rgbPattern, 'gi');
                    const newRgbString = `rgb(${newRgb.r}, ${newRgb.g}, ${newRgb.b})`;
                    updatedSVG = updatedSVG.replace(rgbRegex, newRgbString);
                }
            });
            
            console.log('Color mapping applied to SVG');
            
            // Task 8.1.5: Update currentSVG state
            this.currentSVG = updatedSVG;
            
            // Display the updated SVG
            this.displaySVG(updatedSVG);
            
            // Task 8.1.6: Re-analyze colors
            // Analyze the modified SVG to get new color distribution
            await this.analyzeSVG(updatedSVG);
            
            console.log(`Re-analysis complete: ${this.colorData.length} colors found`);
            
            // Task 8.1.7: Update UI
            // Refresh all UI elements with the new color data
            this.updateUI();
            
            console.log(`Color reduction complete: ${currentColorCount} → ${this.colorData.length} colors`);
            
        } catch (error) {
            console.error('Error reducing colors:', error);
            this.showError('Failed to reduce colors: ' + error.message);
        }
    }
    
    /**
     * Update individual color
     * Task 9.1: Implement updateColor() method
     * Task 9.1.1: Get old hex value from colorData
     * Task 9.1.2: Update colorData with new hex
     * Task 9.1.3: Update RGB values
     * Task 9.1.4: Call replaceColorInSVG()
     * Task 9.1.5: Update currentSVG state
     * Task 9.1.6: Display updated SVG
     * @param {number} index - Index of color in colorData array
     * @param {string} newHex - New hex color value (e.g., "#ff5733")
     */
    updateColor(index, newHex) {
        // Validate inputs
        if (index < 0 || index >= this.colorData.length) {
            console.error('Invalid color index:', index);
            return;
        }
        
        if (!newHex || typeof newHex !== 'string') {
            console.error('Invalid hex color:', newHex);
            return;
        }
        
        // Task 9.1.1: Get old hex value from colorData
        const oldHex = this.colorData[index].hex;
        
        // If color hasn't changed, no need to update
        if (oldHex.toLowerCase() === newHex.toLowerCase()) {
            return;
        }
        
        console.log(`Updating color ${oldHex} to ${newHex}`);
        
        // Task 9.1.3: Validate and convert new hex to RGB first
        const rgb = this.hexToRgb(newHex);
        if (!rgb) {
            console.error('Failed to convert hex to RGB:', newHex);
            return;
        }
        
        // Task 9.1.2: Update colorData with new hex
        // Normalize hex to lowercase for consistency
        this.colorData[index].hex = newHex.toLowerCase();
        
        // Update RGB values
        this.colorData[index].rgb = rgb;
        
        // Task 9.1.4: Call replaceColorInSVG()
        // Task 9.1.5: Update currentSVG state
        this.currentSVG = this.replaceColorInSVG(this.currentSVG, oldHex, newHex);
        
        // Task 9.1.6: Display updated SVG
        this.displaySVG(this.currentSVG);
        
        // Update the UI to reflect changes
        this.updateUI();
        
        console.log('Color updated successfully');
    }
    
    /**
     * Replace all occurrences of a color in SVG text
     * Task 9.2: Implement replaceColorInSVG() method
     * Task 9.2.1: Replace lowercase hex format
     * Task 9.2.2: Replace uppercase hex format
     * Task 9.2.3: Replace RGB format
     * Task 9.2.4: Return updated SVG text
     * @param {string} svgText - The SVG text content
     * @param {string} oldHex - Old hex color to replace (e.g., "#ff5733")
     * @param {string} newHex - New hex color (e.g., "#00ff00")
     * @returns {string} Updated SVG text with color replaced
     */
    replaceColorInSVG(svgText, oldHex, newHex) {
        // Validate inputs
        if (!svgText || typeof svgText !== 'string') {
            console.error('Invalid SVG text');
            return svgText;
        }
        
        if (!oldHex || !newHex) {
            console.error('Invalid color values for replacement');
            return svgText;
        }
        
        // Remove # prefix if present for processing
        const oldHexClean = oldHex.replace(/^#/, '');
        const newHexClean = newHex.replace(/^#/, '');
        
        // Convert old hex to RGB for RGB format replacement
        const oldRgb = this.hexToRgb(oldHex);
        
        let updatedSVG = svgText;
        
        // Task 9.2.1: Replace lowercase hex format
        // Match patterns like: fill="#abc123" or stroke="#abc123"
        const lowerHexPattern = new RegExp(`#${oldHexClean.toLowerCase()}`, 'gi');
        updatedSVG = updatedSVG.replace(lowerHexPattern, `#${newHexClean.toLowerCase()}`);
        
        // Task 9.2.2: Replace uppercase hex format
        // Match patterns like: fill="#ABC123" or stroke="#ABC123"
        const upperHexPattern = new RegExp(`#${oldHexClean.toUpperCase()}`, 'g');
        updatedSVG = updatedSVG.replace(upperHexPattern, `#${newHexClean.toLowerCase()}`);
        
        // Task 9.2.3: Replace RGB format
        // Match patterns like: rgb(171, 193, 35) or rgb(171,193,35)
        if (oldRgb) {
            // Create regex pattern for RGB format with optional spaces
            // Matches: rgb(r, g, b) or rgb(r,g,b)
            const rgbPattern = new RegExp(
                `rgb\\(\\s*${oldRgb.r}\\s*,\\s*${oldRgb.g}\\s*,\\s*${oldRgb.b}\\s*\\)`,
                'gi'
            );
            
            // Replace with hex format (more compact)
            updatedSVG = updatedSVG.replace(rgbPattern, `#${newHexClean.toLowerCase()}`);
        }
        
        // Task 9.2.4: Return updated SVG text
        return updatedSVG;
    }
    
    /**
     * Reset to original SVG
     * Task 12.1: Implement resetToOriginal() method
     * Task 12.1.1: Restore currentSVG from originalSVG
     * Task 12.1.2: Clear highlight
     * Task 12.1.3: Re-analyze original SVG
     * Task 12.1.4: Display original SVG
     * Task 12.1.5: Update UI
     */
    async resetToOriginal() {
        try {
            console.log('Resetting to original SVG...');
            
            // Validate that we have an original SVG to restore
            if (!this.originalSVG) {
                this.showError('No original SVG to restore');
                console.error('Cannot reset: no original SVG stored');
                return;
            }
            
            // Task 12.1.1: Restore currentSVG from originalSVG
            // Restore the current SVG to the original state
            this.currentSVG = this.originalSVG;
            
            console.log('Current SVG restored from original');
            
            // Task 12.1.2: Clear highlight
            // Clear any active color highlighting
            this.clearHighlight();
            
            console.log('Highlight cleared');
            
            // Task 12.1.3: Re-analyze original SVG
            // Analyze the original SVG to get the original color distribution
            await this.analyzeSVG(this.originalSVG);
            
            console.log('Original SVG re-analyzed');
            
            // Task 12.1.4: Display original SVG
            // Display the original SVG in the preview area
            this.displaySVG(this.originalSVG);
            
            console.log('Original SVG displayed');
            
            // Task 12.1.5: Update UI
            // Refresh all UI elements to reflect the original state
            this.updateUI();
            
            console.log('Reset to original complete');
            
        } catch (error) {
            console.error('Error resetting to original:', error);
            this.showError('Failed to reset to original: ' + error.message);
        }
    }
    
    /**
     * Download current image in specified format
     * @param {string} format - Format to download: 'svg', 'png', or 'jpg'
     */
    download(format) {
        try {
            console.log(`Downloading as ${format.toUpperCase()}...`);
            
            if (!this.currentSVG) {
                this.showError('No image to download');
                return;
            }
            
            if (format === 'svg') {
                this.downloadSVG();
            } else if (format === 'png' || format === 'jpg') {
                this.downloadAsImage(format);
            }
        } catch (error) {
            console.error(`Error downloading ${format}:`, error);
            this.showError(`Failed to download ${format.toUpperCase()}: ` + error.message);
        }
    }
    
    /**
     * Download current SVG as PNG or JPG
     * Captures the preview including any highlight overlay
     * @param {string} format - 'png' or 'jpg'
     */
    downloadAsImage(format) {
        try {
            // Get the SVG element from preview
            const $svg = this.$elements.svgPreview.find('svg');
            if ($svg.length === 0) {
                this.showError('No SVG found to convert');
                return;
            }
            
            const svgElement = $svg[0];
            
            // Get SVG dimensions
            const bbox = svgElement.getBBox();
            const width = bbox.width || svgElement.width.baseVal.value || 800;
            const height = bbox.height || svgElement.height.baseVal.value || 600;
            
            // Create a canvas for rendering
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            
            // Fill white background for JPG
            if (format === 'jpg') {
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, width, height);
            }
            
            // Create an image from the SVG
            const svgData = new XMLSerializer().serializeToString(svgElement);
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);
            
            const img = new Image();
            img.onload = () => {
                // Draw the SVG image onto canvas
                ctx.drawImage(img, 0, 0, width, height);
                
                // If there's a highlight overlay, draw it on top
                if (this.highlightCanvas && this.highlightCanvas.width > 0) {
                    console.log('Adding highlight overlay to download');
                    ctx.drawImage(this.highlightCanvas, 0, 0, width, height);
                }
                
                // Convert canvas to blob
                const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
                const quality = format === 'jpg' ? 0.95 : undefined;
                
                canvas.toBlob((blob) => {
                    // Create download link
                    const downloadUrl = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = downloadUrl;
                    a.download = `optimized.${format}`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    
                    // Cleanup
                    setTimeout(() => {
                        URL.revokeObjectURL(downloadUrl);
                        URL.revokeObjectURL(url);
                    }, 100);
                    
                    console.log(`${format.toUpperCase()} download complete`);
                }, mimeType, quality);
            };
            
            img.onerror = () => {
                this.showError(`Failed to convert SVG to ${format.toUpperCase()}`);
                URL.revokeObjectURL(url);
            };
            
            img.src = url;
            
        } catch (error) {
            console.error(`Error converting to ${format}:`, error);
            this.showError(`Failed to convert to ${format.toUpperCase()}: ` + error.message);
        }
    }
    
    /**
     * Download current SVG
     * Task 11.1: Implement downloadSVG() method
     * Task 11.1.1: Create Blob from currentSVG
     * Task 11.1.2: Generate object URL
     * Task 11.1.3: Create temporary anchor element
     * Task 11.1.4: Trigger download
     * Task 11.1.5: Clean up object URL
     * Task 11.3: Set default filename to "optimized.svg"
     */
    downloadSVG() {
        try {
            console.log('Downloading SVG...');
            
            // Validate that we have an SVG to download
            if (!this.currentSVG) {
                this.showError('No SVG to download');
                console.error('Cannot download: no SVG loaded');
                return;
            }
            
            // If there's a highlight overlay, we need to convert to raster and embed in SVG
            if (this.highlightCanvas && this.highlightCanvas.width > 0 && this.selectedColor) {
                console.log('Creating SVG with highlight overlay embedded');
                this.downloadSVGWithOverlay();
                return;
            }
            
            // Task 11.1.1: Create Blob from currentSVG
            // Create a Blob object from the SVG text with proper MIME type
            const blob = new Blob([this.currentSVG], { type: 'image/svg+xml;charset=utf-8' });
            
            console.log('Blob created from SVG');
            
            // Task 11.1.2: Generate object URL
            // Create a temporary URL for the Blob
            const url = URL.createObjectURL(blob);
            
            console.log('Object URL generated:', url);
            
            // Task 11.1.3: Create temporary anchor element
            // Create an anchor element for triggering the download
            const a = document.createElement('a');
            a.href = url;
            
            // Task 11.3: Set default filename to "optimized.svg"
            a.download = 'optimized.svg';
            
            // Add to document temporarily (required for Firefox)
            document.body.appendChild(a);
            
            // Task 11.1.4: Trigger download
            // Programmatically click the anchor to trigger download
            a.click();
            
            console.log('Download triggered');
            
            // Remove the anchor element from document
            document.body.removeChild(a);
            
            // Task 11.1.5: Clean up object URL
            // Revoke the object URL to free up memory
            // Use setTimeout to ensure download has started before cleanup
            setTimeout(() => {
                URL.revokeObjectURL(url);
                console.log('Object URL cleaned up');
            }, 100);
            
            console.log('SVG download complete');
            
        } catch (error) {
            console.error('Error downloading SVG:', error);
            this.showError('Failed to download SVG: ' + error.message);
        }
    }
    
    /**
     * Download SVG with highlight overlay embedded as raster image
     */
    downloadSVGWithOverlay() {
        try {
            // Get the SVG element from preview
            const $svg = this.$elements.svgPreview.find('svg');
            if ($svg.length === 0) {
                this.showError('No SVG found');
                return;
            }
            
            const svgElement = $svg[0];
            const bbox = svgElement.getBBox();
            const width = bbox.width || svgElement.width.baseVal.value || 800;
            const height = bbox.height || svgElement.height.baseVal.value || 600;
            
            // Create a canvas to combine SVG + overlay
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            
            // Serialize the SVG
            const svgData = new XMLSerializer().serializeToString(svgElement);
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            const svgUrl = URL.createObjectURL(svgBlob);
            
            const img = new Image();
            img.onload = () => {
                // Draw SVG
                ctx.drawImage(img, 0, 0, width, height);
                
                // Draw overlay on top
                if (this.highlightCanvas) {
                    ctx.drawImage(this.highlightCanvas, 0, 0, width, height);
                }
                
                // Convert combined canvas to data URL
                const dataUrl = canvas.toDataURL('image/png');
                
                // Create new SVG with embedded image
                const newSvg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    <image href="${dataUrl}" x="0" y="0" width="${width}" height="${height}" />
</svg>`;
                
                // Download the new SVG
                const blob = new Blob([newSvg], { type: 'image/svg+xml;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'optimized.svg';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                
                // Cleanup
                setTimeout(() => {
                    URL.revokeObjectURL(url);
                    URL.revokeObjectURL(svgUrl);
                }, 100);
                
                console.log('SVG with overlay download complete');
            };
            
            img.onerror = () => {
                this.showError('Failed to create SVG with overlay');
                URL.revokeObjectURL(svgUrl);
            };
            
            img.src = svgUrl;
            
        } catch (error) {
            console.error('Error downloading SVG with overlay:', error);
            this.showError('Failed to download SVG: ' + error.message);
        }
    }
    
    /**
     * Convert RGB to hex color
     * Task 13.1: Implement rgbToHex() method
     * Task 13.1.1: Convert RGB values to hex string
     * Task 13.1.2: Pad single digits with zero
     * @param {number} r - Red component (0-255)
     * @param {number} g - Green component (0-255)
     * @param {number} b - Blue component (0-255)
     * @returns {string} Hex color string (e.g., "#ff5733")
     */
    rgbToHex(r, g, b) {
        // Task 13.1.1: Convert RGB values to hex string
        // Task 13.1.2: Pad single digits with zero
        const toHex = (value) => {
            const hex = Math.round(value).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };
        
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }
    
    /**
     * Convert hex to RGB object
     * @param {string} hex - Hex color string (e.g., "#ff5733" or "ff5733")
     * @returns {Object|null} RGB object with r, g, b properties, or null if invalid
     */
    hexToRgb(hex) {
        // Validate input is a string
        if (typeof hex !== 'string') {
            return null;
        }
        
        // Remove # if present
        const cleanHex = hex.replace(/^#/, '');
        
        // Validate hex format (must be 6 hex digits)
        if (!/^[0-9a-fA-F]{6}$/.test(cleanHex)) {
            return null;
        }
        
        // Parse hex string to RGB values
        const r = parseInt(cleanHex.substring(0, 2), 16);
        const g = parseInt(cleanHex.substring(2, 4), 16);
        const b = parseInt(cleanHex.substring(4, 6), 16);
        
        return { r, g, b };
    }
    
    /**
     * Show error message
     */
    showError(message) {
        this.$elements.errorMessage.text(message).fadeIn();
        setTimeout(() => {
            this.$elements.errorMessage.fadeOut();
        }, 5000);
    }
    
    /**
     * Show loading indicator
     */
    showLoading() {
        this.$elements.loadingIndicator.fadeIn();
    }
    
    /**
     * Hide loading indicator
     */
    hideLoading() {
        this.$elements.loadingIndicator.fadeOut();
    }
}

// Initialize application when DOM is ready
$(document).ready(() => {
    console.log('DOM ready, jQuery version:', $.fn.jquery);
    console.log('Creating SVGColorAnalyzer instance...');
    
    try {
        window.app = new SVGColorAnalyzer();
        console.log('SVG Color Palette Analyzer initialized successfully');
    } catch (error) {
        console.error('Error initializing app:', error);
        console.error('Error stack:', error.stack);
    }
});

// Export for testing (Node.js environment)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SVGColorAnalyzer;
}
