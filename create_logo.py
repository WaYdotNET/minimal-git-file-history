#!/usr/bin/env python3
"""
Script per generare il logo FZ Git History basato su FiscoZen
Design moderno con elementi Git e FZ
"""

from PIL import Image, ImageDraw, ImageFont
import os
import math

# Dimensioni e colori
SIZE = 512
BG_COLOR = (30, 30, 30)  # Dark background
PRIMARY_COLOR = (0, 122, 204)  # VS Code blue
ACCENT_COLOR = (100, 200, 100)  # Green for Git
TEXT_COLOR = (255, 255, 255)  # White
FZ_COLOR = (255, 200, 0)  # Gold/Yellow for FZ

def create_logo_icon():
    """Crea un'icona quadrata per l'estensione con design FiscoZen"""
    img = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    center_x, center_y = SIZE // 2, SIZE // 2

    # Background circle with gradient effect
    margin = 20
    draw.ellipse([margin, margin, SIZE - margin, SIZE - margin],
                 fill=PRIMARY_COLOR, outline=None)

    # Inner circle for depth
    inner_margin = 40
    draw.ellipse([inner_margin, inner_margin, SIZE - inner_margin, SIZE - inner_margin],
                 fill=(20, 80, 150), outline=None)

    # Git branch symbol (simplified)
    branch_size = 150
    branch_x = center_x
    branch_y = center_y - 30

    # Main horizontal branch
    draw.line([branch_x - branch_size, branch_y,
               branch_x + branch_size, branch_y],
              fill=TEXT_COLOR, width=12)

    # Vertical branch
    branch_start_x = branch_x - branch_size // 3
    draw.line([branch_start_x, branch_y - branch_size // 2,
               branch_start_x, branch_y],
              fill=TEXT_COLOR, width=12)

    # Branch node (circle)
    node_radius = 8
    draw.ellipse([branch_start_x - node_radius, branch_y - node_radius,
                  branch_start_x + node_radius, branch_y + node_radius],
                 fill=ACCENT_COLOR, outline=None)

    # "FZ" text at bottom
    try:
        # Try different fonts
        font_paths = [
            "/System/Library/Fonts/Helvetica.ttc",
            "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
        ]
        font = None
        for font_path in font_paths:
            try:
                font = ImageFont.truetype(font_path, 90)
                break
            except:
                continue
        if font is None:
            font = ImageFont.load_default()
    except:
        font = ImageFont.load_default()

    text = "FZ"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]

    text_x = center_x - text_width // 2
    text_y = SIZE - margin - text_height - 40

    # Text with shadow effect
    draw.text((text_x + 2, text_y + 2), text, fill=(0, 0, 0, 150), font=font)
    draw.text((text_x, text_y), text, fill=FZ_COLOR, font=font)

    return img

def create_logo_banner():
    """Crea un banner orizzontale per il README"""
    width = 1200
    height = 300
    img = Image.new('RGB', (width, height), BG_COLOR)
    draw = ImageDraw.Draw(img)

    # Icon on left
    icon_size = 200
    icon_img = create_logo_icon()
    icon_resized = icon_img.resize((icon_size, icon_size), Image.Resampling.LANCZOS)
    img.paste(icon_resized, (50, (height - icon_size) // 2), icon_resized)

    # Text on right
    try:
        font_paths = [
            "/System/Library/Fonts/Helvetica.ttc",
            "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
        ]
        title_font = None
        subtitle_font = None
        for font_path in font_paths:
            try:
                title_font = ImageFont.truetype(font_path, 72)
                subtitle_font = ImageFont.truetype(font_path, 36)
                break
            except:
                continue
        if title_font is None:
            title_font = ImageFont.load_default()
            subtitle_font = ImageFont.load_default()
    except:
        title_font = ImageFont.load_default()
        subtitle_font = ImageFont.load_default()

    title = "FZ Git History"
    subtitle = "Navigate Git file history like JetBrains"

    x_offset = 300
    y_offset = height // 2 - 60

    # Title with shadow
    draw.text((x_offset + 2, y_offset + 2), title, fill=(0, 0, 0, 100), font=title_font)
    draw.text((x_offset, y_offset), title, fill=PRIMARY_COLOR, font=title_font)

    bbox = draw.textbbox((x_offset, y_offset), title, font=title_font)
    subtitle_y = bbox[3] + 20

    draw.text((x_offset, subtitle_y), subtitle, fill=TEXT_COLOR, font=subtitle_font)

    return img

def main():
    print("Generating FZ Git History logos (FiscoZen style)...")

    os.makedirs('media', exist_ok=True)

    # Create icon (for extension)
    icon = create_logo_icon()
    icon.save('media/logo.png', 'PNG')
    print("✓ Created: media/logo.png")

    # Create banner (for README)
    banner = create_logo_banner()
    banner.save('media/banner.png', 'PNG')
    print("✓ Created: media/banner.png")

    # Create smaller icon for package.json (128x128)
    icon_128 = icon.resize((128, 128), Image.Resampling.LANCZOS)
    icon_128.save('media/icon.png', 'PNG')
    print("✓ Created: media/icon.png")

    # Create 64x64 for activity bar
    icon_64 = icon.resize((64, 64), Image.Resampling.LANCZOS)
    icon_64.save('media/icon-64.png', 'PNG')
    print("✓ Created: media/icon-64.png")

    print("\n✅ All logos generated!")
    print("📝 Add to package.json:")
    print('   "icon": "media/icon.png"')

if __name__ == '__main__':
    try:
        main()
    except ImportError:
        print("Error: Pillow library not installed.")
        print("Install it with: pip install pillow")
    except Exception as e:
        print(f"Error generating logos: {e}")
        import traceback
        traceback.print_exc()
