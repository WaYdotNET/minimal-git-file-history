#!/usr/bin/env python3
"""
Script per convertire SVG a PNG usando CairoSVG o Pillow
Fallback a creazione diretta PNG se necessario
"""

import os
import sys

try:
    # Try using cairosvg first (better quality)
    import cairosvg
    print("Using cairosvg for conversion...")

    def svg_to_png(svg_path, png_path, size=128):
        cairosvg.svg2png(url=svg_path, write_to=png_path, output_width=size, output_height=size)
        print(f"✓ Converted {svg_path} to {png_path} ({size}x{size})")

    # Convert icon.svg to icon.png (128x128)
    svg_to_png('media/icon.svg', 'media/icon.png', 128)

    # Convert logo.svg to logo.png (512x512)
    svg_to_png('media/logo.svg', 'media/logo.png', 512)

    print("\n✅ SVG to PNG conversion completed!")

except ImportError:
    print("cairosvg not available, trying Pillow...")
    try:
        from PIL import Image, ImageDraw, ImageFont

        def create_png_from_svg():
            """Create PNG logo directly"""
            SIZE = 128
            img = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
            draw = ImageDraw.Draw(img)

            center = SIZE // 2

            # Background circle
            margin = 4
            draw.ellipse([margin, margin, SIZE - margin, SIZE - margin],
                        fill=(0, 122, 204), outline=None)

            # Inner circle
            inner_margin = 8
            draw.ellipse([inner_margin, inner_margin, SIZE - inner_margin, SIZE - inner_margin],
                        fill=(20, 80, 150), outline=None)

            # Git branch
            branch_size = 38
            branch_x = center
            branch_y = center - 8

            # Horizontal branch
            draw.line([branch_x - branch_size, branch_y,
                      branch_x + branch_size, branch_y],
                     fill=(255, 255, 255), width=3)

            # Vertical branch
            branch_start_x = branch_x - branch_size // 3
            draw.line([branch_start_x, branch_y - branch_size // 2,
                      branch_start_x, branch_y],
                     fill=(255, 255, 255), width=3)

            # Branch node
            node_radius = 2
            draw.ellipse([branch_start_x - node_radius, branch_y - node_radius,
                         branch_start_x + node_radius, branch_y + node_radius],
                        fill=(100, 200, 100), outline=None)

            # FZ text
            try:
                font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 22)
            except:
                font = ImageFont.load_default()

            text = "FZ"
            bbox = draw.textbbox((0, 0), text, font=font)
            text_width = bbox[2] - bbox[0]

            text_x = center - text_width // 2
            text_y = SIZE - 12

            # Shadow
            draw.text((text_x + 1, text_y + 1), text, fill=(0, 0, 0, 100), font=font)
            # Text
            draw.text((text_x, text_y), text, fill=(255, 200, 0), font=font)

            return img

        # Create icon.png (128x128)
        icon = create_png_from_svg()
        icon.save('media/icon.png', 'PNG')
        print("✓ Created: media/icon.png (128x128)")

        # Create logo.png (512x512)
        logo = create_png_from_svg()
        logo_512 = logo.resize((512, 512), Image.Resampling.LANCZOS)
        logo_512.save('media/logo.png', 'PNG')
        print("✓ Created: media/logo.png (512x512)")

        print("\n✅ PNG logos created!")

    except ImportError:
        print("Error: Neither cairosvg nor Pillow available.")
        print("Install one with:")
        print("  pip install cairosvg")
        print("  OR")
        print("  pip install pillow")
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

except Exception as e:
    print(f"Error with cairosvg: {e}")
    print("Trying Pillow fallback...")
    # Fallback to Pillow
    try:
        from PIL import Image, ImageDraw
        # Same code as above...
        print("Please install Pillow: pip install pillow")
    except:
        print("Failed to convert SVG to PNG")
        sys.exit(1)
