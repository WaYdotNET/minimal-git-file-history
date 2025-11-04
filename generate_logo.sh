#!/usr/bin/env bash
# Script per generare il logo usando uv e Pillow

set -euo pipefail

echo "=========================================="
echo "FZ Git History - Logo Generator"
echo "=========================================="
echo ""

# Controlla se uv è installato
if ! command -v uv &> /dev/null; then
    echo "⚠️  uv non trovato. Installazione..."
    curl -LsSf https://astral.sh/uv/install.sh | sh
    export PATH="$HOME/.cargo/bin:$PATH"
fi

echo "📦 Installing Pillow with uv..."
uv pip install pillow

echo ""
echo "🎨 Generating logo PNG files..."

# Esegui lo script Python (uv pip install ha già installato Pillow)
python3 create_logo_png.py

echo ""
if [ -f "media/icon.png" ]; then
    echo "=========================================="
    echo "✅ Logo generation complete!"
    echo "=========================================="
    echo ""
    echo "Files created:"
    ls -lh media/*.png
    echo ""
    echo "Next steps:"
    echo "1. Icon already configured in package.json"
    echo "2. Run: npm run compile && vsce package --no-yarn"
else
    echo "⚠️  Logo generation failed. Check errors above."
    exit 1
fi
