# RMG Decal Preview Tool

This is a standalone browser MVP for previewing decals on uploaded car photos.

## Features

- Upload a car image
- Upload a decal PNG/JPG/WebP/SVG
- Placement presets:
  - Door
  - Front fender
  - Rear quarter panel
  - Rocker / side skirt
  - Hood
  - Windshield banner
  - Rear window
  - Custom
- Drag 4 green corner handles to match vehicle panel perspective
- Blend controls:
  - Opacity
  - Blend mode
  - Brightness
  - Contrast
  - Saturation
  - Shadow amount
  - Highlight amount
  - Curve warp
- Recolor decal
- Export preview PNG
- Copy/download placement JSON

## How to use

Open `index.html` in your browser.

No backend required for this MVP.

## Important note

This version uses a browser-friendly approximate perspective warp by slicing the decal into vertical strips. It is good for previewing decals before purchase.

For a production version, the next upgrade would be:

- OpenCV backend with real homography perspective warp
- Body panel segmentation
- Save customer projects
- Connect to product pages
- Add "Buy This Decal" button
