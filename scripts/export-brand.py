"""从本站 SVG 母版导出图标；仅维护图形时运行，需要 Pillow。"""

from pathlib import Path
import re
import xml.etree.ElementTree as ET

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
BRAND = ROOT / "public" / "brand"
RENDER_SIZE = 1024


def path_points(data):
    """仅解析母版使用的绝对 M/L/C/Z 指令，三次曲线采样后进行超采样绘制。"""
    if re.sub(r"[MLCZ\d\s.,-]", "", data):
        raise ValueError("母版包含未支持的路径指令，请同步更新导出器")
    tokens = iter(re.findall(r"[MLCZ]|-?\d+(?:\.\d+)?", data))
    points = []

    def point():
        return float(next(tokens)), float(next(tokens))

    for command in tokens:
        if command in ("M", "L"):
            points.append(point())
        elif command == "C":
            start = points[-1]
            control1, control2, end = point(), point(), point()
            for step in range(1, 65):
                t = step / 64
                points.append(tuple(
                    (1 - t) ** 3 * start[axis]
                    + 3 * (1 - t) ** 2 * t * control1[axis]
                    + 3 * (1 - t) * t ** 2 * control2[axis]
                    + t ** 3 * end[axis]
                    for axis in (0, 1)
                ))
        elif command != "Z":
            raise ValueError(f"不支持的路径指令：{command}")
    return points


def render_mark():
    """读取同一份 SVG 路径导出透明图标，避免矢量和位图轮廓分离维护。"""
    root = ET.parse(BRAND / "knowstack-mark.svg").getroot()
    x, y, width, height = map(float, root.attrib["viewBox"].split())
    if width != height:
        raise ValueError("图标母版必须使用正方形 viewBox")
    scale = RENDER_SIZE / width
    image = Image.new("RGBA", (RENDER_SIZE, RENDER_SIZE))
    draw = ImageDraw.Draw(image)
    for shape in root:
        kind = shape.tag.rsplit("}", 1)[-1]
        if kind == "path":
            points = [
                ((px - x) * scale, (py - y) * scale)
                for px, py in path_points(shape.attrib["d"])
            ]
            draw.polygon(points, fill=shape.attrib["fill"])
        else:
            raise ValueError(f"新增 SVG 图元 {kind} 后，请同步更新导出器")
    return image


mark = render_mark()
mark.resize((512, 512), Image.Resampling.LANCZOS).save(BRAND / "knowstack-mark.png")
mark.save(ROOT / "public" / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
# iOS 要求不透明底色；底色不属于标志，其他导出仍保持透明。
touch = Image.new("RGB", (180, 180), "#f3f2ed")
small = mark.resize((144, 144), Image.Resampling.LANCZOS)
touch.paste(small, (18, 18), small)
touch.save(ROOT / "public" / "apple-touch-icon.png")
print("已导出 PNG、ICO 与 Apple Touch 图标")
