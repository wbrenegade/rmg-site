# Advanced PNG/JPG/WEBM to SVG Converter

This bundle includes:

- `main.py` - FastAPI backend
- `index.html` - browser UI
- `requirements.txt` - Python dependencies

## Install

```bash
pip install -r requirements.txt
```

You also need FFmpeg installed for WEBM frame extraction.

## Run backend

```bash
uvicorn main:app --reload
```

Backend runs at:

```text
http://127.0.0.1:8000
```

API docs:

```text
http://127.0.0.1:8000/docs
```

## Open UI

Open `index.html` in your browser.

## Notes

Raster-to-vector conversion can be very good, but no automatic converter can guarantee truly flawless output for every image. Clean, high-contrast source images produce the best SVGs.

For vinyl decals, start with:

- Preset: Vinyl Decal / Cut File
- Preprocess: Black / White
- Trace Mode: Binary
- Threshold: 160-210
- Filter Speckle: 5-15
