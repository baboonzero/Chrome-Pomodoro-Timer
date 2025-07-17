# Icon Generation Instructions

The Chrome extension requires PNG icons in three sizes: 16x16, 48x48, and 128x128 pixels.

## Option 1: Online SVG to PNG Converter

1. Open the `icon.svg` file in a web browser
2. Use an online SVG to PNG converter (like convertio.co, cloudconvert.com)
3. Convert to the required sizes: 16x16, 48x48, and 128x128
4. Save as:
   - `icon16.png` (16x16)
   - `icon48.png` (48x48)
   - `icon128.png` (128x128)

## Option 2: Using Image Editing Software

1. Open `icon.svg` in GIMP, Photoshop, or similar software
2. Export/resize to the required dimensions
3. Save as PNG files with the names above

## Option 3: Command Line (if you have ImageMagick)

```bash
convert icon.svg -resize 16x16 icon16.png
convert icon.svg -resize 48x48 icon48.png
convert icon.svg -resize 128x128 icon128.png
```

## Option 4: Simple Placeholder Icons

If you need quick placeholder icons for testing, you can create simple colored squares:

- Create 16x16, 48x48, and 128x128 pixel PNG files
- Fill with the gradient colors: #667eea to #764ba2
- Save with the appropriate names

## Icon Requirements

- Format: PNG
- Sizes: 16x16, 48x48, 128x128 pixels
- Names: icon16.png, icon48.png, icon128.png
- Location: icons/ folder

The icons will appear in:
- Chrome toolbar (16x16)
- Extensions page (48x48)
- Chrome Web Store (128x128) 