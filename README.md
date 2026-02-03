# SVG Color Analyzer & Reducer

A web-based tool to analyze, reduce, and optimize SVG color palettes.

## Features

✅ **Accurate Color Analysis**
- Renders SVG to canvas for pixel-perfect color detection
- Calculates actual visual percentage of each color
- Sorts colors by usage (highest first)

✅ **Smart Color Reduction**
- K-means clustering algorithm for optimal color grouping
- Reduce to any number of colors (2-16)
- Preserves visual quality while minimizing palette

✅ **Interactive Color Editing**
- Click any color swatch to change it
- Real-time preview of changes
- Individual color adjustments

✅ **Export Options**
- Download optimized SVG
- Reset to original anytime
- Clean, optimized output

## How to Use

1. **Open `index.html` in a web browser**

2. **Upload an SVG file**
   - Drag and drop, or click to browse
   - Use the included `sample.svg` for testing

3. **Analyze Colors**
   - View all colors sorted by percentage
   - See visual representation of color distribution

4. **Reduce Colors**
   - Use the slider to select target color count
   - Click "Apply Reduction" to optimize
   - Colors are intelligently merged using k-means clustering

5. **Adjust Colors**
   - Click any color swatch to open color picker
   - Change colors individually
   - Preview updates in real-time

6. **Export**
   - Click "Download SVG" to save optimized file
   - Click "Reset" to restore original

## Technical Details

### Color Analysis Method
- **Render-based**: SVG is rendered to canvas for accurate pixel counting
- **Percentage calculation**: Based on actual pixel coverage, not element count
- **Transparent handling**: Ignores transparent/semi-transparent pixels

### Color Reduction Algorithm
- **K-means clustering**: Groups similar colors together
- **Weighted centroids**: Considers color frequency in clustering
- **10 iterations**: Ensures convergence to optimal palette

### Browser Compatibility
- Modern browsers with Canvas API support
- Chrome, Firefox, Safari, Edge (latest versions)

## File Structure

```
├── index.html      # Main HTML interface
├── app.js          # Core application logic
├── sample.svg      # Test SVG file
└── README.md       # This file
```

## Example Workflow

1. Load `sample.svg` (contains ~20 colors)
2. View color distribution in sidebar
3. Reduce to 8 colors using slider
4. Adjust specific colors if needed
5. Download optimized SVG

## Future Enhancements

- [ ] Color harmony suggestions
- [ ] Batch processing multiple SVGs
- [ ] Export color palette as JSON/CSS
- [ ] Undo/redo functionality
- [ ] Advanced clustering options (median cut, octree)
- [ ] Color blindness simulation
- [ ] Integration with design tools

## License

MIT License - Feel free to use and modify!
