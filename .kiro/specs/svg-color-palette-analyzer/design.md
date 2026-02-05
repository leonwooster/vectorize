# SVG Color Palette Analyzer - Design Document

## Overview

The SVG Color Palette Analyzer is a client-side web application that provides pixel-accurate color analysis of image files (SVG, JPEG, PNG). The system renders image content to an HTML5 Canvas, analyzes pixel data to extract color information, and provides interactive features including color highlighting, palette reduction via k-means clustering, individual color editing, and SVG export.

For raster images (JPEG/PNG), the application automatically converts them to SVG format using pixel-to-rectangle conversion with color quantization, enabling the same analysis and editing capabilities as native SVG files.

The application follows a single-page architecture with no server dependencies, ensuring user privacy and immediate responsiveness. All processing occurs in the browser using jQuery for DOM manipulation and event handling, combined with native Web APIs (Canvas API, File API, DOM Parser) for image processing.

**Technology Stack:**
- **jQuery 3.7.1** (latest stable) - DOM manipulation, event handling, AJAX utilities
- **HTML5** - Semantic markup and Canvas API
- **CSS3** - Modern styling with flexbox/grid layouts
- **Vanilla JavaScript** - Core algorithms (k-means, color analysis, image conversion)
- **Browser APIs** - Canvas API, File API, DOM Parser, Blob API, URL API

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        User Interface                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Upload Area  │  │   Preview    │  │  Control Panel   │  │
│  │ (Drag/Drop)  │  │   Section    │  │  (Sidebar)       │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   SVGColorAnalyzer Class                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  File Processing → Image Conversion → Canvas Render  │  │
│  │  → Pixel Analysis                                     │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Color Reduction (k-means) → Color Editing → Export  │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Highlight Overlay → Interactive Visualization       │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Browser APIs                            │
│  Canvas API │ File API │ DOM Parser │ Blob API │ URL API    │
└─────────────────────────────────────────────────────────────┘
```

### Component Separation

The system is organized into three logical layers:

1. **Presentation Layer**: HTML/CSS for UI structure and styling
2. **Application Layer**: jQuery + JavaScript class managing state, DOM manipulation, and business logic
3. **Browser API Layer**: Native browser capabilities for file handling, rendering, and data processing

**jQuery Usage:**
- Event handling (click, change, drag/drop, keyboard events)
- DOM manipulation (element creation, updates, class management)
- Element selection and traversal
- Animation and transitions (optional for smooth UI updates)
- Utility functions ($.each, $.extend, etc.)

## Components and Interfaces

### 1. SVGColorAnalyzer Class

The main application controller that manages all functionality. Uses jQuery for DOM operations and vanilla JavaScript for computational algorithms.

**State Properties:**
```javascript
{
  originalSVG: string | null,        // Original SVG text content
  currentSVG: string | null,         // Current (possibly modified) SVG text
  colorData: ColorInfo[],            // Array of analyzed colors
  originalColorCount: number,        // Count of colors in original SVG
  canvas: HTMLCanvasElement,         // Hidden canvas for analysis
  ctx: CanvasRenderingContext2D,     // Canvas 2D context
  highlightCanvas: HTMLCanvasElement, // Overlay canvas for highlighting
  highlightCtx: CanvasRenderingContext2D, // Highlight canvas context
  selectedColor: string | null,      // Currently highlighted color (hex)
  svgImageData: ImageData | null,    // Cached pixel data for highlighting
  $elements: {                       // Cached jQuery selectors
    uploadArea: jQuery,
    fileInput: jQuery,
    svgPreview: jQuery,
    colorPaletteTop: jQuery,
    colorList: jQuery,
    // ... other frequently accessed elements
  }
}
```

**Public Methods:**
- `initializeEventListeners()`: Set up all DOM event handlers using jQuery
- `handleFileUpload(file: File)`: Route file to appropriate handler based on type
- `loadSVGFile(file: File)`: Load and process an SVG file
- `convertImageToSVG(file: File)`: Convert JPEG/PNG to SVG format
- `loadImage(file: File)`: Load raster image to Image object
- `imageDataToSVG(imageData: ImageData, width: number, height: number)`: Convert pixel data to SVG
- `quantizeImageData(imageData: ImageData, colorCount: number)`: Reduce colors using k-means
- `kMeansColors(colors: ColorInfo[], k: number)`: K-means clustering for color quantization
- `analyzeSVG(svgText: string)`: Analyze colors in SVG content
- `displaySVG(svgText: string)`: Render SVG to preview area using jQuery
- `updateUI()`: Refresh all UI elements with current state using jQuery
- `highlightColor(colorHex: string, $swatchElement: jQuery)`: Activate color highlighting
- `clearHighlight()`: Remove color highlighting overlay
- `reduceColors(targetCount: number)`: Apply k-means color reduction
- `updateColor(index: number, newHex: string)`: Edit individual color
- `resetToOriginal()`: Restore original SVG state
- `downloadSVG()`: Export current SVG as file

**jQuery Integration:**
- Use `$()` for all DOM selections
- Use `.on()` for event binding
- Use `.html()`, `.text()`, `.css()` for DOM updates
- Use `.addClass()`, `.removeClass()`, `.toggleClass()` for styling
- Use `.fadeIn()`, `.fadeOut()` for smooth transitions (optional)

### 2. File Upload Component

**Interface:**
- Drag-and-drop zone
- Click-to-browse file input
- File type validation (.svg, .jpg, .jpeg, .png and their MIME types)

**Behavior:**
- Visual feedback on drag-over using jQuery `.addClass()/.removeClass()`
- Error handling for invalid file types with jQuery alerts or custom modals
- Automatic routing to appropriate handler (SVG or image conversion)
- Automatic processing on file selection

**jQuery Implementation:**
```javascript
// Event binding
$('#uploadArea').on('click', () => $('#fileInput').trigger('click'));
$('#uploadArea').on('dragover', (e) => {
  e.preventDefault();
  $(e.currentTarget).addClass('dragover');
});
$('#uploadArea').on('dragleave', (e) => {
  $(e.currentTarget).removeClass('dragover');
});
$('#uploadArea').on('drop', (e) => {
  e.preventDefault();
  $(e.currentTarget).removeClass('dragover');
  const file = e.originalEvent.dataTransfer.files[0];
  if (file) this.handleFileUpload(file);
});
```

### 2a. Image to SVG Conversion Engine

**Input:** JPEG or PNG file
**Output:** SVG text content

**Process:**
1. Load image file to Image object via FileReader/Blob URL
2. Create temporary canvas and draw image
3. Scale down if dimensions exceed 800px (maintain aspect ratio)
4. Extract ImageData from canvas
5. Apply color quantization (k-means, target: 16 colors)
6. Convert quantized pixels to SVG rectangles
7. Optimize by grouping consecutive same-color pixels in rows
8. Generate SVG XML with proper structure and viewBox

**Quantization Algorithm:**
```
Input: ImageData, target color count (16)
Output: Quantized ImageData

1. Extract all unique colors with pixel counts
2. If colors <= target, return original
3. Apply k-means clustering to reduce to target colors
4. Map each pixel to nearest palette color
5. Return new ImageData with quantized colors
```

**SVG Generation:**
```
For each row y in image:
  Track current color and start position
  For each pixel x in row:
    If color changes or row ends:
      Output: <rect x="startX" y="y" width="length" height="1" fill="color"/>
      Update current color and start position
```

### 3. Color Analysis Engine

**Input:** SVG text content
**Output:** Array of ColorInfo objects

**Process:**
1. Parse SVG using DOMParser
2. Extract viewBox or dimensions
3. Render SVG to canvas at appropriate scale
4. Extract ImageData from canvas
5. Iterate through pixels, counting colors
6. Calculate percentages based on pixel counts
7. Sort colors by usage (descending)

**Color Matching:**
- RGB color space
- Transparency threshold: alpha < 10 (skip transparent pixels)
- Color tolerance for highlighting: ±15 RGB units

### 4. Interactive Color Palette

**Top Palette (Preview Section):**
- Display all colors as clickable swatches in descending order by occurrence
- Show pixel count number below each swatch
- Show color hex, percentage, and pixel count on hover tooltip
- Visual feedback on selection (border, shadow)
- Click to activate highlighting
- Wraps to multiple rows as needed

**jQuery Implementation:**
```javascript
renderTopPalette() {
  const $palette = $('#colorPaletteTop');
  $palette.empty();
  
  this.colorData.forEach((color) => {
    const $container = $('<div>').addClass('palette-swatch-container');
    const $swatch = $('<div>')
      .addClass('palette-swatch')
      .css('background-color', color.hex)
      .attr('title', `${color.hex.toUpperCase()} - ${color.percentage.toFixed(2)}% (${color.count.toLocaleString()} pixels)`)
      .data('color-hex', color.hex)
      .on('click', (e) => this.highlightColor(color.hex, $(e.currentTarget)));
    
    const $count = $('<div>')
      .addClass('palette-count')
      .text(color.count.toLocaleString());
    
    $container.append($swatch, $count);
    $palette.append($container);
  });
}
```

**Sidebar Palette (Control Panel):**
- Display all colors with detailed information
- Color swatch (HTML5 color picker)
- Hex code display
- Percentage value
- Visual percentage bar
- Scrollable list for many colors

**jQuery Implementation:**
```javascript
renderColorList() {
  const $colorList = $('#colorList');
  $colorList.empty();
  
  this.colorData.forEach((color, index) => {
    const $item = $('<div>').addClass('color-item').html(`
      <input type="color" class="color-swatch" value="${color.hex}" data-index="${index}">
      <div class="color-info">
        <div class="color-hex">${color.hex.toUpperCase()}</div>
        <div class="color-percentage">${color.percentage.toFixed(2)}%</div>
        <div class="percentage-bar">
          <div class="percentage-fill" style="width: ${Math.min(color.percentage, 100)}%"></div>
        </div>
      </div>
    `);
    
    $item.find('.color-swatch').on('change', (e) => {
      this.updateColor(index, $(e.target).val());
    });
    
    $colorList.append($item);
  });
}
```

### 5. Color Highlighting System

**Overlay Mechanism:**
- Separate canvas positioned absolutely over SVG preview
- Canvas dimensions match rendered SVG size
- Pixel-by-pixel processing of cached ImageData

**Highlighting Algorithm:**
```
For each pixel in ImageData:
  If pixel is transparent (alpha < 10):
    Skip (render as transparent)
  Else if pixel matches selected color (within tolerance):
    Brighten slightly (multiply by 1.1, cap at 255)
    Set alpha to 255 (fully opaque)
  Else:
    Darken significantly (multiply by 0.2)
    Reduce alpha (multiply by 0.9)
```

**Color Matching Function:**
```javascript
colorsMatch(rgb1, rgb2, tolerance) {
  return abs(rgb1.r - rgb2.r) <= tolerance &&
         abs(rgb1.g - rgb2.g) <= tolerance &&
         abs(rgb1.b - rgb2.b) <= tolerance
}
```

### 6. Color Reduction Engine (k-means Clustering)

**Algorithm:**
```
Input: colorData array, target count k
Output: k representative colors

1. Initialize k centroids from most common colors
2. For 10 iterations:
   a. Assign each color to nearest centroid
   b. Calculate new centroids as weighted average of cluster
      (weighted by pixel count)
3. Return final centroids as reduced palette
4. Map all original colors to nearest centroid
5. Replace colors in SVG text
6. Re-analyze to get new distribution
```

**Distance Metric:**
- Euclidean distance in RGB space: `sqrt((r1-r2)² + (g1-g2)² + (b1-b2)²)`

### 7. Color Editing System

**Individual Color Replacement:**
1. User selects new color via HTML5 color picker
2. System identifies old color hex value
3. Replace all occurrences in SVG text:
   - Lowercase hex format (#abc123)
   - Uppercase hex format (#ABC123)
   - RGB format (rgb(171, 193, 35))
4. Update SVG preview
5. Update color data structure
6. Refresh UI

### 8. Export System

**SVG Download:**
- Create Blob from current SVG text
- Generate object URL
- Trigger download via temporary anchor element
- Clean up object URL
- Default filename: "optimized.svg"

## Data Models

### ColorInfo

Represents a single color found in the SVG.

```javascript
{
  hex: string,           // Hex color code (e.g., "#ff5733")
  count: number,         // Number of pixels with this color
  percentage: number,    // Percentage of total pixels (0-100)
  rgb: {                 // RGB components
    r: number,           // Red (0-255)
    g: number,           // Green (0-255)
    b: number            // Blue (0-255)
  }
}
```

**Invariants:**
- `hex` is always lowercase
- `hex` always starts with '#' and has 6 hex digits
- `count` is always >= 1
- `percentage` is always > 0 and <= 100
- `rgb` values are always integers in range [0, 255]
- `percentage = (count / totalPixels) * 100`

### SVG State

The application maintains two SVG states:

```javascript
{
  originalSVG: string,   // Immutable original content
  currentSVG: string     // Mutable working copy
}
```

**State Transitions:**
- Load: `originalSVG = currentSVG = fileContent`
- Edit Color: `currentSVG = replaceColor(currentSVG, old, new)`
- Reduce Colors: `currentSVG = applyColorMapping(currentSVG, colorMap)`
- Reset: `currentSVG = originalSVG`

### Canvas State

```javascript
{
  canvas: HTMLCanvasElement,         // Hidden analysis canvas
  ctx: CanvasRenderingContext2D,     // 2D rendering context
  svgImageData: ImageData            // Cached pixel data
}
```

**Canvas Sizing:**
- Maximum dimension: 800px
- Scale factor: `min(800 / width, 800 / height, 2)`
- Maintains aspect ratio

### Highlight State

```javascript
{
  selectedColor: string | null,      // Currently highlighted color
  highlightCanvas: HTMLCanvasElement, // Overlay canvas
  highlightCtx: CanvasRenderingContext2D
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Color Analysis Completeness
*For any* valid SVG file, the sum of all color percentages should equal 100% (within floating-point tolerance of 0.01%).
**Validates: Requirements 2.2, 2.3**

### Property 2: Color Sorting Invariant
*For any* analyzed color palette, colors should be sorted in descending order by percentage (colorData[i].percentage >= colorData[i+1].percentage for all valid i).
**Validates: Requirements 2.4**

### Property 3: Hex Format Consistency
*For any* color in colorData, the hex value should match the pattern /^#[0-9a-f]{6}$/ (lowercase, 6 hex digits).
**Validates: Requirements 2.5**

### Property 4: RGB-Hex Conversion Round Trip
*For any* RGB value (r, g, b) where each component is in [0, 255], converting to hex and back to RGB should produce the original values.
**Validates: Requirements 2.5**

### Property 5: All Colors Display
*For any* color analysis result, the top palette should display all colors found in the image, arranged in descending order by pixel count.
**Validates: Requirements 3.1, 3.2**

### Property 6: Pixel Count Display
*For any* color in the top palette, the displayed pixel count should match the count value in the colorData array, formatted with thousand separators.
**Validates: Requirements 3.2, 3.8**

### Property 7: Color Highlighting Toggle
*For any* selected color, clicking the same color swatch again should clear the highlighting (toggle behavior).
**Validates: Requirements 4.8**

### Property 7: Color Matching Symmetry
*For any* two colors rgb1 and rgb2, colorsMatch(rgb1, rgb2, tolerance) should equal colorsMatch(rgb2, rgb1, tolerance).
**Validates: Requirements 4.5**

### Property 8: Color Reduction Bound
*For any* color reduction operation with target count k, the resulting color palette should have at most k colors.
**Validates: Requirements 5.1, 5.2**

### Property 9: K-means Centroid Stability
*For any* k-means clustering result, running the algorithm again with the same input and initial centroids should produce the same final centroids.
**Validates: Requirements 5.3**

### Property 10: Color Replacement Completeness
*For any* color replacement operation (oldColor → newColor), the resulting SVG should contain zero occurrences of oldColor in any format (hex, rgb).
**Validates: Requirements 6.4**

### Property 11: Reset Idempotence
*For any* SVG state, calling reset() multiple times should produce the same result as calling it once (currentSVG === originalSVG).
**Validates: Requirements 8.1, 8.2**

### Property 12: Export Validity
*For any* exported SVG, parsing it with DOMParser should produce a valid SVG document with no parse errors.
**Validates: Requirements 7.5**

### Property 13: Percentage Bar Width Constraint
*For any* color percentage display, the percentage bar width should be min(percentage, 100)% to prevent overflow.
**Validates: Requirements 2.6**

### Property 14: Transparent Pixel Exclusion
*For any* pixel with alpha < 10, it should not contribute to color counting or percentage calculations.
**Validates: Requirements 2.8**

### Property 15: Color Distance Non-Negativity
*For any* two RGB colors, the color distance should always be >= 0, and equal to 0 if and only if the colors are identical.
**Validates: Requirements 5.3**

## Error Handling

### File Upload Errors

**Invalid File Type:**
- Detection: Check file.type against supported types (image/svg+xml, image/jpeg, image/png)
- Response: Display error message "Please upload an SVG, JPEG, or PNG file"
- User Action: Select valid file

**File Read Errors:**
- Detection: Catch exceptions in file.text() or FileReader operations
- Response: Display "Failed to read file" message
- User Action: Try different file or check file permissions

**Malformed SVG:**
- Detection: DOMParser returns document with parsererror element
- Response: Display "Invalid SVG format" message
- User Action: Validate SVG file externally

### Image Conversion Errors

**Image Load Failure:**
- Detection: img.onerror event during conversion
- Response: Display "Failed to load image" message
- User Action: Check image file integrity

**Unsupported Image Format:**
- Detection: File type not in supported list
- Response: Display "Unsupported image format" message
- User Action: Convert image to JPEG or PNG externally

**Image Too Large:**
- Detection: Image dimensions exceed reasonable limits
- Response: Automatic scaling to 800px max dimension
- User Action: None (automatic handling)

### Canvas Rendering Errors

**Image Load Failure:**
- Detection: img.onerror event
- Response: Display "Failed to render SVG" message
- User Action: Check SVG content for unsupported features

**Canvas Size Limits:**
- Detection: Canvas dimensions exceed browser limits
- Response: Scale down to maximum supported size
- User Action: None (automatic handling)

### Color Analysis Errors

**No Colors Found:**
- Detection: colorData.length === 0 after analysis
- Response: Display "No colors detected" message
- User Action: Check if SVG contains visible content

**Zero Total Pixels:**
- Detection: totalPixels === 0 after counting
- Response: Skip percentage calculation, display warning
- User Action: Verify SVG has non-transparent content

### Color Reduction Errors

**Target Count Too High:**
- Detection: targetCount >= currentColorCount
- Response: Display alert "Current color count is already at or below target"
- User Action: Select lower target count

**K-means Convergence Issues:**
- Detection: Empty clusters during iteration
- Response: Reuse previous centroid for empty cluster
- User Action: None (automatic handling)

### Export Errors

**Blob Creation Failure:**
- Detection: Catch exceptions in Blob constructor
- Response: Display "Failed to create download" message
- User Action: Try again or check browser compatibility

## Testing Strategy

### Unit Testing

Unit tests verify specific examples, edge cases, and error conditions. They complement property-based tests by validating concrete scenarios.

**Color Conversion Tests:**
- Test rgbToHex with known values: (255, 0, 0) → "#ff0000"
- Test hexToRgb with known values: "#00ff00" → {r: 0, g: 255, b: 0}
- Test edge cases: (0, 0, 0), (255, 255, 255)

**Color Matching Tests:**
- Test exact match: colorsMatch({r:100, g:100, b:100}, {r:100, g:100, b:100}, 10) → true
- Test within tolerance: colorsMatch({r:100, g:100, b:100}, {r:105, g:105, b:105}, 10) → true
- Test outside tolerance: colorsMatch({r:100, g:100, b:100}, {r:120, g:120, b:120}, 10) → false

**Color Distance Tests:**
- Test identical colors: colorDistance({r:50, g:50, b:50}, {r:50, g:50, b:50}) → 0
- Test known distance: colorDistance({r:0, g:0, b:0}, {r:3, g:4, b:0}) → 5

**SVG Parsing Tests:**
- Test valid SVG with viewBox
- Test valid SVG with width/height attributes
- Test SVG with missing dimensions (use defaults)

**Color Replacement Tests:**
- Test replacing hex color in fill attribute
- Test replacing RGB color in style attribute
- Test case-insensitive replacement

**Image Conversion Tests:**
- Test JPEG to SVG conversion with known image
- Test PNG to SVG conversion with transparency
- Test color quantization reduces to 16 colors
- Test image scaling for large images
- Test row-based rectangle optimization

### Property-Based Testing

Property-based tests verify universal properties across many generated inputs. Each test should run a minimum of 100 iterations.

**Test Configuration:**
- Library: fast-check (JavaScript property-based testing library)
- Iterations per test: 100 minimum
- Tag format: `// Feature: svg-color-palette-analyzer, Property {N}: {property text}`

**Property Test 1: Color Analysis Completeness**
```javascript
// Feature: svg-color-palette-analyzer, Property 1: Color Analysis Completeness
// For any valid SVG file, sum of percentages should equal 100%
fc.assert(
  fc.property(
    generateValidColorData(),
    (colorData) => {
      const sum = colorData.reduce((acc, c) => acc + c.percentage, 0);
      return Math.abs(sum - 100) < 0.01;
    }
  ),
  { numRuns: 100 }
);
```

**Property Test 2: Color Sorting Invariant**
```javascript
// Feature: svg-color-palette-analyzer, Property 2: Color Sorting Invariant
// For any analyzed palette, colors should be sorted descending by percentage
fc.assert(
  fc.property(
    generateColorData(),
    (colorData) => {
      for (let i = 0; i < colorData.length - 1; i++) {
        if (colorData[i].percentage < colorData[i + 1].percentage) {
          return false;
        }
      }
      return true;
    }
  ),
  { numRuns: 100 }
);
```

**Property Test 3: Hex Format Consistency**
```javascript
// Feature: svg-color-palette-analyzer, Property 3: Hex Format Consistency
// For any color in colorData, hex should match pattern /^#[0-9a-f]{6}$/
fc.assert(
  fc.property(
    generateColorData(),
    (colorData) => {
      return colorData.every(c => /^#[0-9a-f]{6}$/.test(c.hex));
    }
  ),
  { numRuns: 100 }
);
```

**Property Test 4: RGB-Hex Conversion Round Trip**
```javascript
// Feature: svg-color-palette-analyzer, Property 4: RGB-Hex Round Trip
// For any RGB value, converting to hex and back should preserve values
fc.assert(
  fc.property(
    fc.integer(0, 255),
    fc.integer(0, 255),
    fc.integer(0, 255),
    (r, g, b) => {
      const hex = app.rgbToHex(r, g, b);
      const rgb = app.hexToRgb(hex);
      return rgb.r === r && rgb.g === g && rgb.b === b;
    }
  ),
  { numRuns: 100 }
);
```

**Property Test 5: All Colors Display**
```javascript
// Feature: svg-color-palette-analyzer, Property 5: All Colors Display
// For any color analysis result, top palette should display all colors
fc.assert(
  fc.property(
    generateColorData(),
    (colorData) => {
      // Simulate rendering top palette
      const displayedColors = colorData.length;
      return displayedColors === colorData.length;
    }
  ),
  { numRuns: 100 }
);
```

**Property Test 6: Pixel Count Display**
```javascript
// Feature: svg-color-palette-analyzer, Property 6: Pixel Count Display
// For any color, displayed count should match colorData with formatting
fc.assert(
  fc.property(
    generateColorData(),
    (colorData) => {
      return colorData.every(color => {
        const formatted = color.count.toLocaleString();
        return formatted.length > 0 && !isNaN(color.count);
      });
    }
  ),
  { numRuns: 100 }
);
```

**Property Test 7: Color Highlighting Toggle**
```javascript
// Feature: svg-color-palette-analyzer, Property 7: Color Matching Symmetry
// For any two colors, colorsMatch should be symmetric
fc.assert(
  fc.property(
    generateRgbColor(),
    generateRgbColor(),
    fc.integer(0, 50),
    (rgb1, rgb2, tolerance) => {
      return app.colorsMatch(rgb1, rgb2, tolerance) === 
             app.colorsMatch(rgb2, rgb1, tolerance);
    }
  ),
  { numRuns: 100 }
);
```

**Property Test 8: Color Reduction Bound**
```javascript
// Feature: svg-color-palette-analyzer, Property 8: Color Reduction Bound
// For any reduction with target k, result should have at most k colors
fc.assert(
  fc.property(
    generateColorData(),
    fc.integer(2, 16),
    async (colorData, targetCount) => {
      const reduced = app.kMeansClustering(colorData, targetCount);
      return reduced.length <= targetCount;
    }
  ),
  { numRuns: 100 }
);
```

**Property Test 11: Reset Idempotence**
```javascript
// Feature: svg-color-palette-analyzer, Property 11: Reset Idempotence
// For any SVG state, reset() should be idempotent
fc.assert(
  fc.property(
    generateSvgContent(),
    async (svgContent) => {
      app.originalSVG = svgContent;
      app.currentSVG = modifySvg(svgContent);
      
      app.resetToOriginal();
      const firstReset = app.currentSVG;
      
      app.resetToOriginal();
      const secondReset = app.currentSVG;
      
      return firstReset === secondReset && firstReset === svgContent;
    }
  ),
  { numRuns: 100 }
);
```

**Property Test 15: Color Distance Non-Negativity**
```javascript
// Feature: svg-color-palette-analyzer, Property 15: Color Distance Non-Negativity
// For any two colors, distance >= 0, and = 0 iff colors identical
fc.assert(
  fc.property(
    generateRgbColor(),
    generateRgbColor(),
    (rgb1, rgb2) => {
      const dist = app.colorDistance(rgb1, rgb2);
      const isIdentical = rgb1.r === rgb2.r && rgb1.g === rgb2.g && rgb1.b === rgb2.b;
      return dist >= 0 && (isIdentical ? dist === 0 : dist > 0);
    }
  ),
  { numRuns: 100 }
);
```

**Property Test 16: Image Conversion Color Quantization**
```javascript
// Feature: svg-color-palette-analyzer, Property 16: Image Conversion Quantization
// For any JPEG/PNG conversion, result should have at most 16 colors
fc.assert(
  fc.property(
    generateImageData(),
    async (imageData) => {
      const quantized = app.quantizeImageData(imageData, 16);
      const colors = extractUniqueColors(quantized);
      return colors.length <= 16;
    }
  ),
  { numRuns: 100 }
);
```

**Property Test 17: Image Scaling Constraint**
```javascript
// Feature: svg-color-palette-analyzer, Property 17: Image Scaling Constraint
// For any large image, scaled dimensions should fit within 800x800
fc.assert(
  fc.property(
    fc.integer(801, 5000),
    fc.integer(801, 5000),
    (width, height) => {
      const maxSize = 800;
      const scale = Math.min(maxSize / width, maxSize / height, 1);
      const scaledWidth = width * scale;
      const scaledHeight = height * scale;
      return scaledWidth <= 800 && scaledHeight <= 800;
    }
  ),
  { numRuns: 100 }
);
```

**Property Test 18: Converted SVG Validity**
```javascript
// Feature: svg-color-palette-analyzer, Property 18: Converted SVG Validity
// For any converted image, resulting SVG should be valid and analyzable
fc.assert(
  fc.property(
    generateImageData(),
    async (imageData) => {
      const svgText = app.imageDataToSVG(imageData, imageData.width, imageData.height);
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgText, 'image/svg+xml');
      const hasError = doc.querySelector('parsererror');
      return !hasError && doc.documentElement.tagName === 'svg';
    }
  ),
  { numRuns: 100 }
);
```

### Integration Testing

**End-to-End Workflow Tests:**
1. Load SVG → Verify analysis → Edit color → Verify update → Export → Verify validity
2. Load SVG → Reduce colors → Verify count → Reset → Verify restoration
3. Load SVG → Highlight color → Clear highlight → Verify state
4. Load JPEG → Verify conversion → Verify analysis → Edit color → Export SVG
5. Load PNG → Verify conversion → Verify quantization → Reduce colors → Export

**Browser Compatibility Tests:**
- Test on Chrome, Firefox, Safari (latest 2 versions)
- Verify Canvas API support
- Verify File API support
- Verify HTML5 color input support
- Verify Image loading and Blob URL support

### Performance Testing

**Large File Handling:**
- Test with 5000x5000px SVG
- Test with 2000x2000px JPEG/PNG
- Verify SVG analysis completes within 2 seconds
- Verify image conversion completes within 5 seconds
- Verify no browser freezing

**Real-time Updates:**
- Measure color edit preview update time (target: < 500ms)
- Measure highlight overlay rendering time (target: < 300ms)
- Measure image conversion time for typical images (target: < 5s)

**Memory Management:**
- Verify proper cleanup of object URLs
- Verify no memory leaks during repeated operations
- Monitor canvas memory usage
- Verify proper cleanup after image conversion



## Dependencies

### Required Libraries
- **jQuery 3.7.1** (latest stable version)
  - CDN: `https://code.jquery.com/jquery-3.7.1.min.js`
  - Integrity: `sha256-/JqT3SQfawRcv/BIHPThkBvs0OEvtFFmqPF/lYI/Cxo=`
  - Crossorigin: `anonymous`
  - Size: ~30KB minified + gzipped
  - Used for: DOM manipulation, event handling, element selection, animations

### Browser APIs
- **Canvas API** - For rendering images and pixel-level analysis
- **File API** - For file upload handling and reading
- **DOM Parser** - For SVG parsing and validation
- **Blob API** - For file download generation
- **URL API** - For object URL creation and management
- **Image API** - For loading JPEG/PNG images

### Browser Compatibility
- Chrome/Edge 90+ (for modern JavaScript features)
- Firefox 88+
- Safari 14+
- Must support: ES6+, Canvas API, File API, HTML5 color input, jQuery 3.x

### Development Tools (Optional)
- Live Server or similar (for local development)
- Browser DevTools (for debugging)
- No build process required (plain HTML/CSS/JS with jQuery CDN)

### File Structure
```
project/
├── index.html          # Main HTML file (includes jQuery CDN)
├── app.js              # Application logic (jQuery + vanilla JS)
├── sample.svg          # Test SVG file
└── README.md           # Documentation
```

### jQuery Integration Notes
- Use jQuery for all DOM operations (selection, manipulation, events)
- Use vanilla JavaScript for computational algorithms (k-means, color analysis)
- Cache jQuery selectors in constructor for performance
- Use event delegation for dynamically created elements
- Prefer jQuery methods over native DOM methods for consistency
