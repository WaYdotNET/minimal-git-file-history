#!/bin/bash
# Script per installare l'estensione Git File History

set -e

echo "=========================================="
echo "FZ Git History - Installation Script"
echo "=========================================="
echo ""

# Compila il progetto
echo "📦 Compiling TypeScript..."
npm run compile

# Crea il pacchetto VSIX
echo "📦 Creating VSIX package..."
vsce package --no-yarn

# Trova il file VSIX più recente
VSIX_FILE=$(ls -t fz-git-file-histrory-*.vsix | head -1)

if [ -z "$VSIX_FILE" ]; then
    echo "❌ Error: VSIX file not found!"
    exit 1
fi

echo "✅ Package created: $VSIX_FILE"
echo ""

# Prova ad installare in VSCode o Cursor
if command -v code &> /dev/null; then
    echo "🔌 Installing in VS Code..."
    code --install-extension "$VSIX_FILE" --force
    echo "✅ Extension installed in VS Code!"
elif command -v cursor &> /dev/null; then
    echo "🔌 Installing in Cursor..."
    cursor --install-extension "$VSIX_FILE" --force
    echo "✅ Extension installed in Cursor!"
else
    echo "⚠️  VS Code or Cursor not found in PATH"
    echo "📋 Manual installation:"
    echo "   1. Open VS Code/Cursor"
    echo "   2. Go to Extensions (Ctrl+Shift+X / Cmd+Shift+X)"
    echo "   3. Click '...' menu → 'Install from VSIX...'"
    echo "   4. Select: $VSIX_FILE"
    exit 1
fi

echo ""
echo "=========================================="
echo "✅ Installation complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Reload VS Code/Cursor window (Ctrl+R / Cmd+R)"
echo "2. Open a Git repository"
echo "3. Right-click a file → 'Show FZ Git History'"
echo ""
