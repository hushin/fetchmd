#!/usr/bin/env bash

set -e

# Detect OS and architecture
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

# Convert architecture names
case "$ARCH" in
  x86_64) ARCH="x64" ;;
  aarch64) ARCH="arm64" ;;
  arm64) ARCH="arm64" ;;
  *) echo "Unsupported architecture: $ARCH"; exit 1 ;;
esac

# Convert OS names
case "$OS" in
  linux) OS="linux" ;;
  darwin) OS="darwin" ;;
  *) echo "Unsupported OS: $OS"; exit 1 ;;
esac

# Get latest release version from GitHub API
LATEST_VERSION=$(curl -s https://api.github.com/repos/hushin-sandbox/mdfetcher/releases/latest | grep '"tag_name":' | cut -d'"' -f4)

# Download URL
DOWNLOAD_URL="https://github.com/hushin-sandbox/mdfetcher/releases/download/${LATEST_VERSION}/mdfetcher-${OS}-${ARCH}"
if [ "$OS" = "win" ]; then
  DOWNLOAD_URL="${DOWNLOAD_URL}.exe"
fi

# Installation directory
INSTALL_DIR="${HOME}/.local/bin"
mkdir -p "$INSTALL_DIR"

# Download and install
echo "Downloading mdfetcher..."
curl -L "$DOWNLOAD_URL" -o "$INSTALL_DIR/mdfetcher"
chmod +x "$INSTALL_DIR/mdfetcher"

echo "mdfetcher has been installed to $INSTALL_DIR/mdfetcher"
echo "Make sure $INSTALL_DIR is in your PATH"
