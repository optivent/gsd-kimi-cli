#!/bin/bash
set -e

REPO="optivent/gsd-kimi-cli"
BINARY_PREFIX="gsd-kimi-cli"

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║        GSD (Get Shit Done) for Kimi CLI Installer          ║"
echo "║         Spec-driven development workflow system              ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Detect platform
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

if [ "$OS" = "linux" ] || [ "$OS" = "darwin" ]; then
  PLATFORM="universal"
else
  echo "❌ Unsupported OS: $OS"
  echo "   GSD supports Linux and macOS"
  exit 1
fi

# Check for dry-run
DRY_RUN=false
if [ "$1" = "--dry-run" ]; then
  DRY_RUN=true
  echo "🔍 DRY RUN MODE - No changes will be made"
  echo ""
fi

# Get latest version
echo "📡 Fetching latest release..."
VERSION=$(curl -s "https://api.github.com/repos/${REPO}/releases/latest" | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')

if [ -z "$VERSION" ]; then
  echo "❌ Failed to fetch latest version"
  echo "   Trying fallback to v2.0.0..."
  VERSION="v2.0.0"
fi

VERSION_CLEAN=${VERSION#v}
echo "   Latest version: $VERSION"
echo ""

# Check for Node.js
if ! command -v node &> /dev/null; then
  echo "⚠️  Node.js not found"
  echo "   Please install Node.js 16+ first:"
  echo "   https://nodejs.org/"
  exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
  echo "⚠️  Node.js version is too old ($NODE_VERSION)"
  echo "   Please upgrade to Node.js 16+"
  exit 1
fi

echo "✅ Node.js $(node --version) detected"
echo ""

# Check for Kimi CLI
if ! command -v kimi &> /dev/null && ! command -v jim &> /dev/null; then
  echo "⚠️  Kimi CLI not found"
  echo "   Install with: pip install kimi-cli"
  echo ""
  read -p "Continue anyway? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
else
  echo "✅ Kimi CLI detected"
fi
echo ""

# Download
TARBALL="${BINARY_PREFIX}-${VERSION_CLEAN}.tar.gz"
URL="https://github.com/${REPO}/releases/download/${VERSION}/${TARBALL}"
TMP_DIR=$(mktemp -d)

echo "⬇️  Downloading ${TARBALL}..."
if [ "$DRY_RUN" = true ]; then
  echo "   [DRY RUN] Would download: $URL"
else
  if ! curl -L --progress-bar -o "${TMP_DIR}/${TARBALL}" "$URL"; then
    echo "❌ Download failed"
    echo "   URL: $URL"
    rm -rf "$TMP_DIR"
    exit 1
  fi
  echo "✅ Download complete"
fi
echo ""

# Extract
echo "📦 Extracting..."
if [ "$DRY_RUN" = true ]; then
  echo "   [DRY RUN] Would extract to: ${TMP_DIR}/gsd-kimi-cli/"
else
  mkdir -p "${TMP_DIR}/gsd-kimi-cli"
  tar -xzf "${TMP_DIR}/${TARBALL}" -C "${TMP_DIR}/gsd-kimi-cli/"
  echo "✅ Extraction complete"
fi
echo ""

# Install
if [ "$DRY_RUN" = true ]; then
  echo "🔍 [DRY RUN] Installation steps:"
  echo "   1. Detect Kimi CLI directory (~/.kimi/ or similar)"
  echo "   2. Copy skills/ to Kimi CLI skills directory"
  echo "   3. Copy agents/ to Kimi CLI agents directory"
  echo "   4. Copy gsd-agent.yaml to Kimi CLI config directory"
  echo ""
else
  echo "🚀 Running installer..."
  cd "${TMP_DIR}/gsd-kimi-cli"
  node scripts/install.js
fi

# Cleanup
if [ "$DRY_RUN" = false ]; then
  rm -rf "$TMP_DIR"
fi

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                   ✅ Installation Complete!                  ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo "  1. Apply UI patches: jim --patch"
echo "  2. Start using GSD:  jim"
echo "  3. Create a project: /skill:gsd-new-project"
echo ""
echo "Documentation: https://github.com/${REPO}#readme"
echo "Issues: https://github.com/${REPO}/issues"
echo ""
