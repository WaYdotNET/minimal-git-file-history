#!/usr/bin/env python3
"""
Crea logo PNG per FZ Git History ispirato a FiscoZen
Versione che usa uv per le dipendenze
"""

import os
import sys

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    print("Error: Pillow non installato.")
    print("Esegui: ./generate_logo.sh")
    print("Oppure: uv pip install pillow")
    sys.exit(1)


def create_logo(size=128):
    """Crea logo PNG ispirato a Fiscozen"""
    # Sfondo nero (come nel logo originale)
    img = Image.new("RGBA", (size, size), (0, 0, 0, 255))
    draw = ImageDraw.Draw(img)
    center_x = size // 2
    center_y = size // 2

    # Colori Fiscozen: blu scuro o bianco su nero
    # Usiamo bianco per migliore visibilità su icona piccola
    logo_color = (255, 255, 255)  # Bianco per contrasto

    # Stilizzato "F" - tre barre orizzontali parallele
    # Dimensioni proporzionali
    bar_height = max(3, size // 25)
    bar_radius = max(2, size // 60)  # Radius per estremità arrotondate
    left_margin = int(size * 0.2)

    # Calcola posizione verticale
    f_height = int(size * 0.4)  # Altezza totale dello "F"
    top_bar_y = center_y - int(f_height * 0.25)
    middle_bar_y = center_y
    bottom_bar_y = center_y + int(f_height * 0.25)

    # Barre orizzontali (da più lunga a più corta: top > middle > bottom)
    top_bar_width = int(size * 0.35)
    middle_bar_width = int(size * 0.25)
    bottom_bar_width = int(size * 0.2)

    # Disegna le tre barre arrotondate
    def draw_rounded_bar(x, y, width, height):
        """Disegna una barra con estremità arrotondate"""
        # Corpo rettangolare
        draw.rectangle(
            [x, y - height // 2, x + width, y + height // 2], fill=logo_color
        )
        # Estremità arrotondata destra
        draw.ellipse(
            [x + width - height, y - height // 2, x + width, y + height // 2],
            fill=logo_color,
        )

    # Barra superiore (più lunga)
    draw_rounded_bar(left_margin, top_bar_y, top_bar_width, bar_height)

    # Barra centrale (media)
    draw_rounded_bar(left_margin, middle_bar_y, middle_bar_width, bar_height)

    # Barra inferiore (più corta)
    draw_rounded_bar(left_margin, bottom_bar_y, bottom_bar_width, bar_height)

    # Barra verticale sinistra che collega le tre barre
    vertical_bar_x = left_margin
    vertical_bar_width = bar_height
    draw.rectangle(
        [
            vertical_bar_x,
            top_bar_y - bar_height // 2,
            vertical_bar_x + vertical_bar_width,
            bottom_bar_y + bar_height // 2,
        ],
        fill=logo_color,
    )

    # Testo "Z" sotto lo "F" stilizzato
    font_size = int(size * 0.16)
    try:
        font_paths = [
            "/System/Library/Fonts/Helvetica.ttc",
            "/System/Library/Fonts/Supplemental/Arial.ttf",
            "/Library/Fonts/Arial.ttf",
        ]
        font = None
        for font_path in font_paths:
            try:
                font = ImageFont.truetype(font_path, font_size)
                break
            except:
                continue
        if font is None:
            font = ImageFont.load_default()
    except:
        font = ImageFont.load_default()

    text = "Z"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    text_x = center_x - text_width // 2
    text_y = bottom_bar_y + int(size * 0.12)

    # Testo "Z"
    draw.text((text_x, text_y), text, fill=logo_color, font=font)

    return img


if __name__ == "__main__":
    os.makedirs("media", exist_ok=True)

    print("Creating logo PNG files...")

    icon = create_logo(128)
    icon.save("media/icon.png", "PNG")
    print("✓ Created: media/icon.png (128x128)")

    logo = create_logo(512)
    logo.save("media/logo.png", "PNG")
    print("✓ Created: media/logo.png (512x512)")

    print("\n✅ All logos created successfully!")
