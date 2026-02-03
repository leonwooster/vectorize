# SVG Color Palette Analyzer - Design Document

## Overview

The SVG Color Palette Analyzer is a client-side web application that provides pixel-accurate color analysis of SVG files. The system renders SVG content to an HTML5 Canvas, analyzes pixel data to extract color information, and provides interactive features including color highlighting, palette reduction via k-means clustering, individual color editing, and SVG export.

The application follows a single-page architecture with no server dependencies, ensuring user privacy and immediate responsiveness. All processing occurs in the browser using native Web APIs (Canvas API, File API, DOM Parser).

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
│  │  File Processing → Canvas Rendering → Pixel Analysis │  │
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
2. **Application Layer**: JavaScript class managing state and business logic
3. **Browser API Layer**: Native browser capabilities for file handling, rendering, and data processing

## Components and Interfaces

### 1. SVGColorAnalyzer Class

The main application controller that manages all functionality.

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
  svgImageData: ImageData | null     // Cached pixel data for highlighting
}
```

**Public Methods:**
- `initializeEventListeners()`: Set up all DOM event handlers
- `loadSVGFile(file: File)`: Load and process an SVG file
- `analyzeSVG(svgText: string)`: Analyze colors in SVG content
- `displaySVG(svgText: string)`: Render SVG to preview area
- `updateUI()`: Refresh all UI elements with current state
- `highlightColor(colorHex: string, swatchElement: HTMLElement)`: Activate color highlighting
- `clearHighlight()`: Remove color highlighting overlay
- `reduceColors(targetCount: number)`: Apply k-means color reduction
- `updateColor(index: number, newHex: string)`: Edit individual color
- `resetToOriginal()`: Restore original SVG state
- `downloadSVG()`: Export current SVG as file

### 2. File Upload Component

**Interface:**
- Drag-and-drop zone
- Click-to-browse file input
- File type validation (.svg, image/svg+xml)

**Behavior:**
- Visual feedback on drag-over
- Error handling for invalid file types
- Automatic processing on file selection

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
- Display top 12 colors as clickable swatches
- Show color hex and percentage on hover
- Visual feedback on selection (border, shadow)
- Click to activate highlighting

**Sidebar Palette (Control Panel):**
- Display all colors with detailed information
- Color swatch (HTML5 color picker)
- Hex code display
- Percentage value
- Visual percentage bar
- Scrollable list for many colors

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

### Property 5: Top Palette Size Limit
*For any* color analysis result, the top palette should display at most 12 colors, even if more colors exist.
**Validates: Requirements 3.1**

### Property 6: Color Highlighting Toggle
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
- Detection: Check file.type === 'image/svg+xml'
- Response: Display error message, prevent processing
- User Action: Select valid SVG file

**File Read Errors:**
- Detection: Catch exceptions in file.text()
- Response: Display "Failed to read file" message
- User Action: Try different file or check file permissions

**Malformed SVG:**
- Detection: DOMParser returns document with parsererror element
- Response: Display "Invalid SVG format" message
- User Action: Validate SVG file externally

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

**Property Test 7: Color Matching Symmetry**
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

### Integration Testing

**End-to-End Workflow Tests:**
1. Load SVG → Verify analysis → Edit color → Verify update → Export → Verify validity
2. Load SVG → Reduce colors → Verify count → Reset → Verify restoration
3. Load SVG → Highlight color → Clear highlight → Verify state

**Browser Compatibility Tests:**
- Test on Chrome, Firefox, Safari (latest 2 versions)
- Verify Canvas API support
- Verify File API support
- Verify HTML5 color input support

### Performance Testing

**Large File Handling:**
- Test with 5000x5000px SVG
- Verify analysis completes within 2 seconds
- Verify no browser freezing

**Real-time Updates:**
- Measure color edit preview update time (target: < 500ms)
- Measure highlight overlay rendering time (target: < 300ms)

**Memory Management:**
- Verify proper cleanup of object URLs
- Verify no memory leaks during repeated operations
- Monitor canvas memory usage

