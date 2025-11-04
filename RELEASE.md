# Release Process

This document describes how to release a new version of the extension.

## Prerequisites

1. Ensure you have the necessary tokens set up as GitHub Secrets:
   - `VSCE_PAT`: Personal Access Token for VS Code Marketplace
   - `OVSX_PAT`: Personal Access Token for Open VSX Registry

### Getting VS Code Marketplace Token

1. Go to https://marketplace.visualstudio.com/manage
2. Click "Create" to create a new Personal Access Token
3. Copy the token and add it as a GitHub Secret named `VSCE_PAT`

### Getting Open VSX Registry Token

**IMPORTANT:** You must create the namespace before publishing for the first time.

1. Go to https://open-vsx.org/user-settings/namespaces
2. **Create the namespace** `waydotnet` if you haven't already:
   - Click "Create Namespace"
   - Enter `waydotnet` as the namespace name
   - This must match your publisher name exactly
3. Go to https://open-vsx.org/user-settings/tokens
4. Create a new token and copy it
5. Add it as a GitHub Secret named `OVSX_PAT`

**Note:** The GitHub Actions workflow will attempt to create the namespace automatically if it doesn't exist, but it's recommended to create it manually first to avoid any issues.

## Release Steps

1. **Update version in package.json**
   ```bash
   # Edit package.json and update the version field
   # Example: "version": "0.1.2"
   ```

2. **Commit and push changes**
   ```bash
   git add package.json
   git commit -m "Bump version to 0.1.2"
   git push
   ```

3. **Create and push a tag**
   ```bash
   git tag v0.1.2
   git push origin v0.1.2
   ```

4. **Automatic publishing**
   - The GitHub Actions workflow will automatically:
     - Build the extension
     - Create a VSIX package
     - Publish to VS Code Marketplace
     - Publish to Open VSX Registry (for Cursor)

5. **Verify publication**
   - Check VS Code Marketplace: https://marketplace.visualstudio.com/manage/publishers/waydotnet
   - Check Open VSX Registry: https://open-vsx.org/extension/waydotnet/minimal-git-file-history

## Manual Release (Alternative)

If you prefer to publish manually:

```bash
# Install dependencies
npm ci

# Compile
npm run compile

# Install vsce
npm install -g @vscode/vsce

# Package
vsce package --no-yarn

# Publish to VS Code Marketplace
vsce publish --pat YOUR_VSCE_TOKEN

# Install ovsx and publish to Open VSX
npm install -g @openvsx/cli
ovsx publish minimal-git-file-history-X.X.X.vsix --pat YOUR_OVSX_TOKEN
```

## Using GitHub Actions

The workflow uses the official `HaaLeo/publish-vscode-extension@v2` action which handles:
- Building the extension
- Packaging as VSIX
- Publishing to both registries automatically

This is the recommended approach as it's more reliable and maintainable.
