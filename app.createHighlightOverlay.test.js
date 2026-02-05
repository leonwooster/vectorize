/**
 * Unit tests for createHighlightOverlay() method
 * Task 7.2: Implement createHighlightOverlay() method
 * Task 7.3: Implement colorsMatch() helper method
 */

// Mock jQuery for Node.js environment
if (typeof $ === 'undefined') {
    global.$ = require('jquery');
    global.jQuery = global.$;
}

const SVGColorAnalyzer = require('./app.js');

// Mock ImageData for testing (not available in jsdom)
if (typeof ImageData === 'undefined') {
    global.ImageData = class ImageData {
        constructor(width, height) {
            this.width = width;
            this.height = height;
            this.data = new Uint8ClampedArray(width * height * 4);
        }
    };
}

describe('SVGColorAnalyzer - createHighlightOverlay() method', () => {
    let app;
    
    beforeEach(() => {
        // Set up DOM elements
        document.body.innerHTML = `
            <div id="uploadArea"></div>
            <input type="file" id="fileInput" />
            <div id="mainContent" style="display: none;">
                <div id="svgPreview"></div>
                <canvas id="highlightCanvas"></canvas>
                <div id="colorPaletteTop"></div>
                <div id="colorList"></div>
                <button id="clearHighlightBtn" style="display: none;"></button>
            </div>
            <canvas id="analysisCanvas"></canvas>
            <div id="loadingIndicator" style="display: none;"></div>
            <div id="errorMessage" style="display: none;"></div>
            <span id="originalColorCount">0</span>
            <span id="currentColorCount">0</span>
            <input type="range" id="colorCountSlider" value="8" />
            <span id="colorCountValue">8</span>
            <button id="reduceBtn">Reduce</button>
            <button id="resetBtn">Reset</button>
            <button id="downloadBtn">Download</button>
        `;
        
        app = new SVGColorAnalyzer();
    });
    
    describe('Task 7.2.1: Set canvas dimensions to match SVG', () => {
        test('should set highlight canvas dimensions to match cached image data', () => {
            // Create mock image data
            const width = 100;
            const height = 50;
            app.svgImageData = new ImageData(width, height);
            app.selectedColor = '#ff0000';
            
            app.createHighlightOverlay();
            
            expect(app.highlightCanvas.width).toBe(width);
            expect(app.highlightCanvas.height).toBe(height);
        });
        
        test('should handle different canvas dimensions', () => {
            const testCases = [
                { width: 200, height: 100 },
                { width: 50, height: 50 },
                { width: 800, height: 600 }
            ];
            
            testCases.forEach(({ width, height }) => {
                app.svgImageData = new ImageData(width, height);
                app.selectedColor = '#00ff00';
                
                app.createHighlightOverlay();
                
                expect(app.highlightCanvas.width).toBe(width);
                expect(app.highlightCanvas.height).toBe(height);
            });
        });
    });
    
    describe('Task 7.2.2: Create new ImageData for overlay', () => {
        test('should create ImageData with correct dimensions', () => {
            const width = 100;
            const height = 50;
            
            // Create source image data with some pixels
            const sourceData = new ImageData(width, height);
            // Set a red pixel at position (0, 0)
            sourceData.data[0] = 255; // R
            sourceData.data[1] = 0;   // G
            sourceData.data[2] = 0;   // B
            sourceData.data[3] = 255; // A
            
            app.svgImageData = sourceData;
            app.selectedColor = '#ff0000';
            
            app.createHighlightOverlay();
            
            // Verify overlay was created by checking canvas has data
            const overlayData = app.highlightCtx.getImageData(0, 0, width, height);
            expect(overlayData.width).toBe(width);
            expect(overlayData.height).toBe(height);
            expect(overlayData.data.length).toBe(width * height * 4);
        });
    });
    
    describe('Task 7.2.3: Process each pixel with color matching', () => {
        test('should process all pixels in the image data', () => {
            const width = 10;
            const height = 10;
            const sourceData = new ImageData(width, height);
            
            // Fill with red pixels
            for (let i = 0; i < sourceData.data.length; i += 4) {
                sourceData.data[i] = 255;     // R
                sourceData.data[i + 1] = 0;   // G
                sourceData.data[i + 2] = 0;   // B
                sourceData.data[i + 3] = 255; // A
            }
            
            app.svgImageData = sourceData;
            app.selectedColor = '#ff0000';
            
            app.createHighlightOverlay();
            
            // Verify all pixels were processed
            const overlayData = app.highlightCtx.getImageData(0, 0, width, height);
            
            // All pixels should be processed (not all zeros)
            let processedPixels = 0;
            for (let i = 0; i < overlayData.data.length; i += 4) {
                if (overlayData.data[i] !== 0 || overlayData.data[i + 1] !== 0 || 
                    overlayData.data[i + 2] !== 0 || overlayData.data[i + 3] !== 0) {
                    processedPixels++;
                }
            }
            
            expect(processedPixels).toBe(width * height);
        });
        
        test('should skip transparent pixels', () => {
            const width = 10;
            const height = 10;
            const sourceData = new ImageData(width, height);
            
            // Set first pixel as transparent (alpha < 10)
            sourceData.data[0] = 255;  // R
            sourceData.data[1] = 0;    // G
            sourceData.data[2] = 0;    // B
            sourceData.data[3] = 5;    // A (transparent)
            
            // Set second pixel as opaque
            sourceData.data[4] = 255;  // R
            sourceData.data[5] = 0;    // G
            sourceData.data[6] = 0;    // B
            sourceData.data[7] = 255;  // A (opaque)
            
            app.svgImageData = sourceData;
            app.selectedColor = '#ff0000';
            
            app.createHighlightOverlay();
            
            const overlayData = app.highlightCtx.getImageData(0, 0, width, height);
            
            // First pixel should be transparent in overlay
            expect(overlayData.data[0]).toBe(0);
            expect(overlayData.data[1]).toBe(0);
            expect(overlayData.data[2]).toBe(0);
            expect(overlayData.data[3]).toBe(0);
            
            // Second pixel should be processed (not all zeros)
            const secondPixelProcessed = overlayData.data[4] !== 0 || 
                                        overlayData.data[5] !== 0 || 
                                        overlayData.data[6] !== 0 || 
                                        overlayData.data[7] !== 0;
            expect(secondPixelProcessed).toBe(true);
        });
    });
    
    describe('Task 7.2.4: Brighten matching pixels (multiply by 1.1)', () => {
        test('should brighten pixels that match selected color', () => {
            const width = 10;
            const height = 10;
            const sourceData = new ImageData(width, height);
            
            // Set a red pixel
            sourceData.data[0] = 200;  // R
            sourceData.data[1] = 0;    // G
            sourceData.data[2] = 0;    // B
            sourceData.data[3] = 255;  // A
            
            app.svgImageData = sourceData;
            app.selectedColor = '#c80000'; // #c80000 = rgb(200, 0, 0)
            
            app.createHighlightOverlay();
            
            const overlayData = app.highlightCtx.getImageData(0, 0, width, height);
            
            // Pixel should be brightened (200 * 1.1 = 220)
            expect(overlayData.data[0]).toBe(220); // R brightened
            expect(overlayData.data[1]).toBe(0);   // G stays 0
            expect(overlayData.data[2]).toBe(0);   // B stays 0
            expect(overlayData.data[3]).toBe(255); // A fully opaque
        });
        
        test('should cap brightened values at 255', () => {
            const width = 10;
            const height = 10;
            const sourceData = new ImageData(width, height);
            
            // Set a bright red pixel that would exceed 255 when multiplied by 1.1
            sourceData.data[0] = 240;  // R (240 * 1.1 = 264, should cap at 255)
            sourceData.data[1] = 0;    // G
            sourceData.data[2] = 0;    // B
            sourceData.data[3] = 255;  // A
            
            app.svgImageData = sourceData;
            app.selectedColor = '#f00000'; // #f00000 = rgb(240, 0, 0)
            
            app.createHighlightOverlay();
            
            const overlayData = app.highlightCtx.getImageData(0, 0, width, height);
            
            // Pixel should be capped at 255
            expect(overlayData.data[0]).toBe(255); // R capped at 255
            expect(overlayData.data[3]).toBe(255); // A fully opaque
        });
        
        test('should match colors within tolerance', () => {
            const width = 10;
            const height = 10;
            const sourceData = new ImageData(width, height);
            
            // Set a red pixel
            sourceData.data[0] = 200;  // R
            sourceData.data[1] = 10;   // G (within tolerance of 0)
            sourceData.data[2] = 5;    // B (within tolerance of 0)
            sourceData.data[3] = 255;  // A
            
            app.svgImageData = sourceData;
            app.selectedColor = '#c80000'; // rgb(200, 0, 0)
            
            app.createHighlightOverlay();
            
            const overlayData = app.highlightCtx.getImageData(0, 0, width, height);
            
            // Pixel should be brightened (matches within tolerance of ±15)
            expect(overlayData.data[0]).toBe(220); // R brightened (200 * 1.1)
            expect(overlayData.data[1]).toBe(11);  // G brightened (10 * 1.1)
            expect(overlayData.data[2]).toBe(6);   // B brightened (5 * 1.1, rounded)
            expect(overlayData.data[3]).toBe(255); // A fully opaque
        });
    });
    
    describe('Task 7.2.5: Darken non-matching pixels (multiply by 0.2)', () => {
        test('should darken pixels that do not match selected color', () => {
            const width = 10;
            const height = 10;
            const sourceData = new ImageData(width, height);
            
            // Set a blue pixel (does not match red)
            sourceData.data[0] = 0;    // R
            sourceData.data[1] = 0;    // G
            sourceData.data[2] = 200;  // B
            sourceData.data[3] = 255;  // A
            
            app.svgImageData = sourceData;
            app.selectedColor = '#ff0000'; // Red
            
            app.createHighlightOverlay();
            
            const overlayData = app.highlightCtx.getImageData(0, 0, width, height);
            
            // Pixel should be darkened (200 * 0.2 = 40)
            expect(overlayData.data[0]).toBe(0);   // R stays 0
            expect(overlayData.data[1]).toBe(0);   // G stays 0
            expect(overlayData.data[2]).toBe(40);  // B darkened
            expect(overlayData.data[3]).toBe(230); // A reduced (255 * 0.9, rounded)
        });
        
        test('should reduce alpha for non-matching pixels', () => {
            const width = 10;
            const height = 10;
            const sourceData = new ImageData(width, height);
            
            // Set a green pixel
            sourceData.data[0] = 0;    // R
            sourceData.data[1] = 200;  // G
            sourceData.data[2] = 0;    // B
            sourceData.data[3] = 255;  // A
            
            app.svgImageData = sourceData;
            app.selectedColor = '#ff0000'; // Red (does not match)
            
            app.createHighlightOverlay();
            
            const overlayData = app.highlightCtx.getImageData(0, 0, width, height);
            
            // Alpha should be reduced (255 * 0.9 = 229.5, rounded to 230)
            expect(overlayData.data[3]).toBe(230);
        });
    });
    
    describe('Task 7.2.6: Draw overlay to highlight canvas', () => {
        test('should draw overlay to highlight canvas', () => {
            const width = 10;
            const height = 10;
            const sourceData = new ImageData(width, height);
            
            // Fill with red pixels
            for (let i = 0; i < sourceData.data.length; i += 4) {
                sourceData.data[i] = 255;     // R
                sourceData.data[i + 1] = 0;   // G
                sourceData.data[i + 2] = 0;   // B
                sourceData.data[i + 3] = 255; // A
            }
            
            app.svgImageData = sourceData;
            app.selectedColor = '#ff0000';
            
            app.createHighlightOverlay();
            
            // Verify canvas has data
            const overlayData = app.highlightCtx.getImageData(0, 0, width, height);
            
            // Check that canvas is not empty
            let hasData = false;
            for (let i = 0; i < overlayData.data.length; i++) {
                if (overlayData.data[i] !== 0) {
                    hasData = true;
                    break;
                }
            }
            
            expect(hasData).toBe(true);
        });
        
        test('should clear canvas before drawing', () => {
            const width = 10;
            const height = 10;
            
            // First overlay
            const sourceData1 = new ImageData(width, height);
            for (let i = 0; i < sourceData1.data.length; i += 4) {
                sourceData1.data[i] = 255;     // R
                sourceData1.data[i + 3] = 255; // A
            }
            
            app.svgImageData = sourceData1;
            app.selectedColor = '#ff0000';
            app.createHighlightOverlay();
            
            // Second overlay with different color
            const sourceData2 = new ImageData(width, height);
            for (let i = 0; i < sourceData2.data.length; i += 4) {
                sourceData2.data[i + 1] = 255; // G
                sourceData2.data[i + 3] = 255; // A
            }
            
            app.svgImageData = sourceData2;
            app.selectedColor = '#00ff00';
            app.createHighlightOverlay();
            
            // Verify second overlay replaced first
            const overlayData = app.highlightCtx.getImageData(0, 0, width, height);
            
            // Should have green brightened pixels, not red
            expect(overlayData.data[1]).toBeGreaterThan(0); // G channel has data
        });
    });
    
    describe('Task 7.3: colorsMatch() helper method', () => {
        describe('Task 7.3.1: Compare RGB values with tolerance', () => {
            test('should return true for identical colors', () => {
                const rgb1 = { r: 100, g: 100, b: 100 };
                const rgb2 = { r: 100, g: 100, b: 100 };
                
                expect(app.colorsMatch(rgb1, rgb2, 15)).toBe(true);
            });
            
            test('should return true for colors within tolerance', () => {
                const rgb1 = { r: 100, g: 100, b: 100 };
                const rgb2 = { r: 110, g: 105, b: 95 };
                
                expect(app.colorsMatch(rgb1, rgb2, 15)).toBe(true);
            });
            
            test('should return false for colors outside tolerance', () => {
                const rgb1 = { r: 100, g: 100, b: 100 };
                const rgb2 = { r: 120, g: 120, b: 120 };
                
                expect(app.colorsMatch(rgb1, rgb2, 15)).toBe(false);
            });
            
            test('should handle edge case at exact tolerance boundary', () => {
                const rgb1 = { r: 100, g: 100, b: 100 };
                const rgb2 = { r: 115, g: 115, b: 115 };
                
                // Exactly at tolerance (difference of 15)
                expect(app.colorsMatch(rgb1, rgb2, 15)).toBe(true);
            });
            
            test('should handle edge case just outside tolerance', () => {
                const rgb1 = { r: 100, g: 100, b: 100 };
                const rgb2 = { r: 116, g: 100, b: 100 };
                
                // Just outside tolerance (difference of 16)
                expect(app.colorsMatch(rgb1, rgb2, 15)).toBe(false);
            });
            
            test('should work with different tolerance values', () => {
                const rgb1 = { r: 100, g: 100, b: 100 };
                const rgb2 = { r: 125, g: 100, b: 100 };
                
                expect(app.colorsMatch(rgb1, rgb2, 10)).toBe(false);
                expect(app.colorsMatch(rgb1, rgb2, 25)).toBe(true);
                expect(app.colorsMatch(rgb1, rgb2, 30)).toBe(true);
            });
        });
        
        describe('Task 7.3.2: Return boolean result', () => {
            test('should return boolean type', () => {
                const rgb1 = { r: 100, g: 100, b: 100 };
                const rgb2 = { r: 100, g: 100, b: 100 };
                
                const result = app.colorsMatch(rgb1, rgb2, 15);
                expect(typeof result).toBe('boolean');
            });
            
            test('should require all channels to match', () => {
                const rgb1 = { r: 100, g: 100, b: 100 };
                
                // Only R matches
                expect(app.colorsMatch(rgb1, { r: 100, g: 120, b: 120 }, 15)).toBe(false);
                
                // Only G matches
                expect(app.colorsMatch(rgb1, { r: 120, g: 100, b: 120 }, 15)).toBe(false);
                
                // Only B matches
                expect(app.colorsMatch(rgb1, { r: 120, g: 120, b: 100 }, 15)).toBe(false);
                
                // All match
                expect(app.colorsMatch(rgb1, { r: 100, g: 100, b: 100 }, 15)).toBe(true);
            });
        });
        
        test('should use default tolerance of 15', () => {
            const rgb1 = { r: 100, g: 100, b: 100 };
            const rgb2 = { r: 110, g: 110, b: 110 };
            
            // Should use default tolerance of 15
            expect(app.colorsMatch(rgb1, rgb2)).toBe(true);
        });
        
        test('should be symmetric', () => {
            const rgb1 = { r: 100, g: 100, b: 100 };
            const rgb2 = { r: 110, g: 105, b: 95 };
            
            // colorsMatch should be symmetric
            expect(app.colorsMatch(rgb1, rgb2, 15)).toBe(app.colorsMatch(rgb2, rgb1, 15));
        });
    });
    
    describe('Error handling', () => {
        test('should handle missing svgImageData gracefully', () => {
            app.svgImageData = null;
            app.selectedColor = '#ff0000';
            
            // Should not throw
            expect(() => app.createHighlightOverlay()).not.toThrow();
        });
        
        test('should handle missing selectedColor gracefully', () => {
            app.svgImageData = new ImageData(10, 10);
            app.selectedColor = null;
            
            // Should not throw
            expect(() => app.createHighlightOverlay()).not.toThrow();
        });
        
        test('should handle invalid hex color gracefully', () => {
            app.svgImageData = new ImageData(10, 10);
            app.selectedColor = 'invalid';
            
            // Should not throw
            expect(() => app.createHighlightOverlay()).not.toThrow();
        });
    });
    
    describe('Integration tests', () => {
        test('should create correct overlay for mixed colors', () => {
            const width = 3;
            const height = 1;
            const sourceData = new ImageData(width, height);
            
            // Pixel 0: Red (matches)
            sourceData.data[0] = 255;
            sourceData.data[1] = 0;
            sourceData.data[2] = 0;
            sourceData.data[3] = 255;
            
            // Pixel 1: Green (does not match)
            sourceData.data[4] = 0;
            sourceData.data[5] = 255;
            sourceData.data[6] = 0;
            sourceData.data[7] = 255;
            
            // Pixel 2: Blue (does not match)
            sourceData.data[8] = 0;
            sourceData.data[9] = 0;
            sourceData.data[10] = 255;
            sourceData.data[11] = 255;
            
            app.svgImageData = sourceData;
            app.selectedColor = '#ff0000'; // Red
            
            app.createHighlightOverlay();
            
            const overlayData = app.highlightCtx.getImageData(0, 0, width, height);
            
            // Pixel 0 should be brightened (red matches)
            expect(overlayData.data[0]).toBe(255); // R brightened and capped
            expect(overlayData.data[3]).toBe(255); // A fully opaque
            
            // Pixel 1 should be darkened (green does not match)
            expect(overlayData.data[5]).toBe(51); // G darkened (255 * 0.2)
            expect(overlayData.data[7]).toBe(230); // A reduced (255 * 0.9, rounded)
            
            // Pixel 2 should be darkened (blue does not match)
            expect(overlayData.data[10]).toBe(51); // B darkened (255 * 0.2)
            expect(overlayData.data[11]).toBe(230); // A reduced
        });
    });
});
