import uuid
import shutil
import subprocess
import os
from pathlib import Path

import cv2
import numpy as np
import vtracer
from PIL import Image
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware

try:
    from rembg import remove
    REMBG_AVAILABLE = True
except Exception:
    REMBG_AVAILABLE = False


app = FastAPI(title="Advanced PNG/JPG/WEBM to SVG Converter")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

WORK_DIR = Path(os.getenv("SVG_CONVERTER_WORK_DIR", "/tmp/rmg-img-svg-converter"))
BASE_DIR = WORK_DIR / "uploads"
OUT_DIR = WORK_DIR / "outputs"
BASE_DIR.mkdir(parents=True, exist_ok=True)
OUT_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".webm"}

MAX_PIXELS = 1_500_000
MAX_COLORS = 12


def save_upload(upload: UploadFile) -> Path:
    ext = Path(upload.filename).suffix.lower()

    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError("Unsupported file type. Use PNG, JPG, JPEG, WEBP, or WEBM.")

    file_id = str(uuid.uuid4())
    path = BASE_DIR / f"{file_id}{ext}"

    with open(path, "wb") as f:
        shutil.copyfileobj(upload.file, f)

    return path


def resize_large_image(path: Path) -> Path:
    img = Image.open(path)
    w, h = img.size

    if w * h <= MAX_PIXELS:
        return path

    scale = (MAX_PIXELS / (w * h)) ** 0.5
    new_size = (max(1, int(w * scale)), max(1, int(h * scale)))

    img = img.convert("RGBA")
    img = img.resize(new_size, Image.LANCZOS)

    out_path = BASE_DIR / f"{path.stem}_resized.png"
    img.save(out_path)

    return out_path


def extract_webm_frame(video_path: Path) -> Path:
    frame_path = BASE_DIR / f"{video_path.stem}_frame.png"

    command = [
        "ffmpeg",
        "-y",
        "-i", str(video_path),
        "-vf", "select=eq(n\\,0)",
        "-vframes", "1",
        str(frame_path)
    ]

    subprocess.run(command, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    if not frame_path.exists():
        raise RuntimeError("Could not extract frame from WEBM. Make sure FFmpeg is installed.")

    return frame_path


def remove_background(input_path: Path) -> Path:
    if not REMBG_AVAILABLE:
        return input_path

    image = Image.open(input_path).convert("RGBA")
    output = remove(image)

    out_path = BASE_DIR / f"{input_path.stem}_nobg.png"
    output.save(out_path)

    return out_path


def flatten_transparency_to_white(img):
    if len(img.shape) == 3 and img.shape[-1] == 4:
        alpha = img[:, :, 3] / 255.0
        bgr = cv2.cvtColor(img, cv2.COLOR_BGRA2BGR)

        white = np.ones_like(bgr, dtype=np.uint8) * 255
        blended = (bgr * alpha[..., None] + white * (1 - alpha[..., None])).astype(np.uint8)

        return blended

    return img


def preprocess_image(
    input_path: Path,
    mode: str = "black_white",
    colors: int = 6,
    threshold: int = 180,
    blur: int = 1,
    invert: bool = False
) -> Path:
    colors = max(2, min(int(colors), MAX_COLORS))

    img = cv2.imread(str(input_path), cv2.IMREAD_UNCHANGED)

    if img is None:
        raise RuntimeError("Could not read image")

    bgr = flatten_transparency_to_white(img)

    if mode in ["black_white", "decal"]:
        gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)

        if blur > 0:
            gray = cv2.GaussianBlur(gray, (blur * 2 + 1, blur * 2 + 1), 0)

        # Auto contrast
        gray = cv2.normalize(gray, None, 0, 255, cv2.NORM_MINMAX)

        threshold_type = cv2.THRESH_BINARY_INV if invert else cv2.THRESH_BINARY

        # Safer than fixed threshold for mixed images
        if threshold <= 0:
            _, bw = cv2.threshold(gray, 0, 255, threshold_type + cv2.THRESH_OTSU)
        else:
            _, bw = cv2.threshold(gray, threshold, 255, threshold_type)

        kernel = np.ones((2, 2), np.uint8)
        bw = cv2.morphologyEx(bw, cv2.MORPH_OPEN, kernel, iterations=1)
        bw = cv2.morphologyEx(bw, cv2.MORPH_CLOSE, kernel, iterations=1)

        result = cv2.cvtColor(bw, cv2.COLOR_GRAY2BGR)

    elif mode == "color":
        if blur > 0:
            bgr = cv2.GaussianBlur(bgr, (blur * 2 + 1, blur * 2 + 1), 0)

        data = bgr.reshape((-1, 3))
        data = np.float32(data)

        criteria = (
            cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER,
            20,
            0.5
        )

        _, labels, centers = cv2.kmeans(
            data,
            colors,
            None,
            criteria,
            5,
            cv2.KMEANS_PP_CENTERS
        )

        centers = np.uint8(centers)
        quantized = centers[labels.flatten()]
        result = quantized.reshape(bgr.shape)

    else:
        result = bgr

    out_path = BASE_DIR / f"{input_path.stem}_processed.png"
    cv2.imwrite(str(out_path), result)

    return out_path


def trace_to_svg(
    input_path: Path,
    color_mode: str = "binary",
    hierarchical: str = "stacked",
    mode: str = "spline",
    filter_speckle: int = 8,
    color_precision: int = 6,
    layer_difference: int = 16,
    corner_threshold: int = 60,
    length_threshold: float = 4.0,
    splice_threshold: int = 45,
    path_precision: int = 3
) -> Path:
    svg_path = OUT_DIR / f"{input_path.stem}.svg"

    vtracer.convert_image_to_svg_py(
        str(input_path),
        str(svg_path),
        colormode=color_mode,
        hierarchical=hierarchical,
        mode=mode,
        filter_speckle=filter_speckle,
        color_precision=color_precision,
        layer_difference=layer_difference,
        corner_threshold=corner_threshold,
        length_threshold=length_threshold,
        splice_threshold=splice_threshold,
        path_precision=path_precision
    )

    return svg_path


@app.post("/convert")
async def convert(
    file: UploadFile = File(...),
    remove_bg: bool = Form(False),
    preprocess_mode: str = Form("black_white"),
    trace_mode: str = Form("binary"),
    colors: int = Form(6),
    threshold: int = Form(180),
    blur: int = Form(1),
    filter_speckle: int = Form(8),
    corner_threshold: int = Form(60),
    length_threshold: float = Form(4.0),
    splice_threshold: int = Form(45),
    path_precision: int = Form(3),
    invert_output: bool = Form(False),
):
    try:
        input_path = save_upload(file)
        ext = input_path.suffix.lower()

        if ext == ".webm":
            input_path = extract_webm_frame(input_path)
            ext = ".png"

        # Prevent huge car photos from locking up tracing
        input_path = resize_large_image(input_path)

        # Guard: don't let car JPEGs run in cut-file mode forever
        if ext in [".jpg", ".jpeg"] and preprocess_mode in ["black_white", "decal"] and trace_mode == "binary":
            return JSONResponse(
                status_code=400,
                content={
                    "error": "JPEG photos are too detailed for cut-ready binary SVG mode. Use Photo/Color mode instead: preprocess_mode=color and trace_mode=color."
                }
            )

        if remove_bg:
            input_path = remove_background(input_path)
            input_path = resize_large_image(input_path)

        processed_path = preprocess_image(
            input_path=input_path,
            mode=preprocess_mode,
            colors=colors,
            threshold=threshold,
            blur=blur,
            invert=invert_output
        )

        svg_path = trace_to_svg(
            input_path=processed_path,
            color_mode=trace_mode,
            filter_speckle=filter_speckle,
            corner_threshold=corner_threshold,
            length_threshold=length_threshold,
            splice_threshold=splice_threshold,
            path_precision=path_precision
        )

        return FileResponse(svg_path, media_type="image/svg+xml", filename=svg_path.name)

    except Exception as e:
        return JSONResponse(status_code=400, content={"error": str(e)})


@app.get("/")
def home():
    return {
        "message": "Advanced PNG/JPG/WEBM to SVG converter running",
        "ui": "Open index.html in your browser",
        "api_docs": "http://127.0.0.1:8000/docs",
        "endpoint": "/convert"
    }
