"""
Импорт фото/видео проектов из папки-выгрузки с Google Drive в src/assets/projects/.

Одна папка = одна карточка. Скрипт:
  * конвертирует фото (jpg/png/heic) в WebP, длинная сторона до MAX_SIDE px;
  * ставит обложкой файл, помеченный художницей «ОЦЮ ПЕРШУ» / «ПЕРША» / «ГЛАВНИЙ»,
    следом — остальные помеченные («ОЦЮ БЕРИ», «ОЦЮ ТЕЖ», ...), затем всё остальное;
  * перекодирует видео в MP4 (H.264, без звука, до 720p) через ffmpeg;
  * пишет manifest.json с порядком файлов и размерами обложки.

Запуск (нужны: pip install pillow pillow-heif; ffmpeg в PATH):
    python scripts/import_assets.py "C:/Users/youbo/Desktop/assets"
"""

import json
import re
import shutil
import subprocess
import sys
import unicodedata
from pathlib import Path

from PIL import Image, ImageOps
from pillow_heif import register_heif_opener

register_heif_opener()

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "src" / "assets" / "projects"
MAX_SIDE = 1400
QUALITY = 78

IMAGE_EXT = {".jpg", ".jpeg", ".png", ".heic", ".heif"}
VIDEO_EXT = {".mov", ".mp4"}

# Ключевое слово в названии папки -> slug карточки (совпадает с id в src/data/projects.ts).
SLUGS = {
    "Private Here": "dont-worry-its-private-here",
    "Sculptural lighting": "sculptural-lighting",
    "5-th Phase": "the-5th-phase",
    "Office Plankton": "office-plankton",
    "Vyshnevyi Viter": "vyshnevyi-viter",
    "Self": "self",
    "Architecture": "architecture",
    "My Life": "my-life",
    "ADRUM": "adrum",
    "Sketches": "sketches",
    "MEN": "men",
    "WOMEN": "women",
    "Photo scans": "photo-scans",
    "mixed media": "mixed-media",
}


def nfc(text: str) -> str:
    # Имена из архивов с macOS приходят в NFD («й» = «и» + знак) — приводим к обычному виду.
    return unicodedata.normalize("NFC", text)


def slug_for(folder: str) -> str | None:
    # Сверяем как отдельное слово: «Self» не цепляет «Selfportrait», «MEN» — «WOMEN».
    folder = nfc(folder)
    for key, slug in SLUGS.items():
        if re.search(rf"(?<![A-Za-z]){re.escape(key)}(?![A-Za-z])", folder, re.IGNORECASE):
            return slug
    return None


def rank(name: str) -> int:
    """0 — обложка, 1 — помечено художницей, 2 — остальное."""
    upper = nfc(name).upper()
    if any(word in upper for word in ("ПЕРШ", "ГЛАВН")):
        return 0
    if upper.startswith(("ОЦ", "I ОЦ")) or "ОЦЮ" in upper:
        return 1
    return 2


def convert_image(src: Path, dst: Path) -> tuple[int, int]:
    with Image.open(src) as im:
        im = ImageOps.exif_transpose(im)
        if im.mode not in ("RGB", "RGBA"):
            im = im.convert("RGB")
        im.thumbnail((MAX_SIDE, MAX_SIDE), Image.Resampling.LANCZOS)
        im.save(dst, "WEBP", quality=QUALITY, method=6)
        return im.size


def convert_video(src: Path, dst: Path) -> None:
    subprocess.run(
        [
            "ffmpeg", "-y", "-loglevel", "error", "-i", str(src),
            # Длинная сторона до 960px — и для горизонтальных, и для вертикальных роликов.
            "-an", "-vf",
            "scale='if(gt(iw,ih),min(960,iw),-2)':'if(gt(iw,ih),-2,min(960,ih))',fps=30",
            "-c:v", "libx264",
            "-preset", "slow", "-crf", "32", "-pix_fmt", "yuv420p",
            "-movflags", "+faststart", str(dst),
        ],
        check=True,
    )


def video_size(path: Path) -> tuple[int, int]:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0",
         "-show_entries", "stream=width,height", "-of", "csv=p=0", str(path)],
        check=True, capture_output=True, text=True,
    ).stdout.strip()
    width, height = out.split(",")[:2]
    return int(width), int(height)


def main(source: Path) -> None:
    # Чистим содержимое, а не саму папку: её может держать открытой dev-сервер.
    OUT.mkdir(parents=True, exist_ok=True)
    for child in OUT.iterdir():
        shutil.rmtree(child) if child.is_dir() else child.unlink()
    manifest: dict[str, dict] = {}

    for folder in sorted(p for p in source.iterdir() if p.is_dir()):
        slug = slug_for(folder.name)
        if not slug:
            print(f"!! пропускаю папку без соответствия: {folder.name}")
            continue
        dest = OUT / slug
        dest.mkdir()

        files = [f for f in folder.iterdir() if f.is_file()]
        images = sorted(
            (f for f in files if f.suffix.lower() in IMAGE_EXT),
            key=lambda f: (rank(f.stem), f.stem.lower()),
        )
        entry: dict = {"images": [], "video": None}

        for i, img in enumerate(images, start=1):
            name = f"{i:02d}.webp"
            size = convert_image(img, dest / name)
            entry["images"].append(name)
            if i == 1:
                entry["width"], entry["height"] = size

        # Одно видео на карточку: помеченное художницей, иначе первое по имени.
        videos = sorted(
            (f for f in files if f.suffix.lower() in VIDEO_EXT),
            key=lambda f: (rank(f.stem), f.stem.lower()),
        )
        video = videos[0] if videos else None
        if video:
            convert_video(video, dest / "video.mp4")
            entry["video"] = "video.mp4"
            entry["videoWidth"], entry["videoHeight"] = video_size(dest / "video.mp4")

        manifest[slug] = entry
        print(f"{slug}: {len(entry['images'])} фото, видео: {'да' if video else 'нет'}")

    (OUT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main(Path(sys.argv[1]))
