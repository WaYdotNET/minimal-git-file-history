#!/usr/bin/env python3
"""
Script per generare screenshot placeholder per Git File History Extension
Questi sono placeholder testuali che possono essere sostituiti con screenshot reali
"""

import os

from PIL import Image, ImageDraw, ImageFont

# Colori e dimensioni
WIDTH = 1280
HEIGHT = 720
BG_COLOR = (45, 45, 45)  # Dark gray background
TEXT_COLOR = (255, 255, 255)  # White text
ACCENT_COLOR = (0, 122, 204)  # VS Code blue


def create_screenshot(filename, title, description, content_lines):
    """Crea uno screenshot placeholder"""
    img = Image.new("RGB", (WIDTH, HEIGHT), BG_COLOR)
    draw = ImageDraw.Draw(img)

    try:
        # Prova a usare un font migliore se disponibile
        title_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 36)
        text_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 24)
    except:
        # Fallback a font di default
        title_font = ImageFont.load_default()
        text_font = ImageFont.load_default()

    # Titolo
    y_offset = 40
    draw.text(
        (WIDTH // 2, y_offset), title, fill=ACCENT_COLOR, font=title_font, anchor="mm"
    )

    # Descrizione
    y_offset += 80
    draw.text(
        (WIDTH // 2, y_offset),
        description,
        fill=TEXT_COLOR,
        font=text_font,
        anchor="mm",
    )

    # Contenuto
    y_offset += 100
    for line in content_lines:
        if line.strip():
            draw.text((60, y_offset), f"• {line}", fill=TEXT_COLOR, font=text_font)
            y_offset += 40

    # Footer
    footer_text = "Placeholder - Replace with actual screenshot"
    draw.text(
        (WIDTH // 2, HEIGHT - 40),
        footer_text,
        fill=(150, 150, 150),
        font=text_font,
        anchor="mm",
    )

    # Salva
    os.makedirs("screenshots", exist_ok=True)
    img.save(f"screenshots/{filename}")
    print(f"✓ Created: screenshots/{filename}")


def main():
    print("Generating placeholder screenshots...\n")

    # Screenshot 1: File History Sidebar
    create_screenshot(
        "screenshot-file-history-sidebar.png",
        "File History Sidebar View",
        "Shows commit history in the sidebar",
        [
            "Git File History section expanded",
            "Commit list with messages, authors, dates",
            "File name displayed at top",
            "Refresh button visible",
        ],
    )

    # Screenshot 2: Git Blame Annotations
    create_screenshot(
        "screenshot-git-blame-annotations.png",
        "Git Blame Annotations",
        "Code Lens annotations showing commit info",
        [
            "Author name • Commit hash • Relative date",
            "Annotations above code lines",
            "Clickable to view commit",
            "Multiple annotations visible",
        ],
    )

    # Screenshot 3: Diff Viewer
    create_screenshot(
        "screenshot-diff-viewer.png",
        "Diff Viewer - Compare Versions",
        "Side-by-side comparison of commits",
        [
            "Left: Previous commit content",
            "Right: Current commit content",
            "Green: Added lines",
            "Red: Removed lines",
            "Hunk headers visible",
        ],
    )

    # Screenshot 4: Context Menu
    create_screenshot(
        "screenshot-context-menu.png",
        "Context Menu",
        "Right-click menu options",
        [
            "Show FZ Git History",
            "Compare with Working Directory",
            "Other Git File History options",
            "Menu highlighted/visible",
        ],
    )

    # Screenshot 5: Commit Details View
    create_screenshot(
        "screenshot-commit-details-view.png",
        "Commit Details View",
        "File content at specific commit",
        [
            "Editor tab shows git-file-history URI",
            "File content at commit state",
            "Line numbers visible",
            "Historical file view",
        ],
    )

    # Screenshot 6: Compare Dialog
    create_screenshot(
        "screenshot-compare-dialog.png",
        "Compare Two Commits Dialog",
        "Quick Pick dialog for commit selection",
        [
            "Select first commit prompt",
            "List of commits with messages",
            "Commit hash and author shown",
            "Highlighted selection",
        ],
    )

    print("\n✓ All placeholder screenshots generated!")
    print("📝 Note: Replace these with actual screenshots from the extension.")
    print("📖 See SCREENSHOT_INSTRUCTIONS.md for detailed capture instructions.")


if __name__ == "__main__":
    try:
        main()
    except ImportError:
        print("Error: Pillow library not installed.")
        print("Install it with: pip install pillow")
    except Exception as e:
        print(f"Error generating screenshots: {e}")
        print("Creating simple text-based placeholders instead...")

        # Fallback: crea file di testo
        os.makedirs("screenshots", exist_ok=True)
        screenshots = [
            "screenshot-file-history-sidebar.png",
            "screenshot-git-blame-annotations.png",
            "screenshot-diff-viewer.png",
            "screenshot-context-menu.png",
            "screenshot-commit-details-view.png",
            "screenshot-compare-dialog.png",
        ]

        for filename in screenshots:
            placeholder = f"# Placeholder for {filename}\n\nThis is a placeholder. Please capture an actual screenshot.\nSee SCREENSHOT_INSTRUCTIONS.md for details."
            with open(f"screenshots/{filename}.txt", "w") as f:
                f.write(placeholder)
            print(f"✓ Created placeholder: screenshots/{filename}.txt")
