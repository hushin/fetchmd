#!/usr/bin/env bash

set -e

BINARY_NAME="mdfetcher"

# Detect OS and architecture
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

# Map architecture names
if [ "$ARCH" == "x86_64" ]; then
  ARCH="x64"
elif [ "$OS" == "linux" ] && ([[ "$ARCH" == "arm"* ]] || [ "$ARCH" == "aarch64" ]); then
  ARCH="arm64"
elif [ "$OS" == "darwin" ] && ([[ "$ARCH" == "arm"* ]] || [ "$ARCH" == "aarch64" ]); then
  ARCH="arm64"
else
  if [ "$OS" != "windows" ]; then
    echo "❌ Unsupported architecture: $ARCH for $OS"
    exit 1
  fi
  ARCH="x64"  # Windows only supports x64
fi

# Determine binary name based on OS
case "$OS" in
  "darwin")
    OS="darwin"
    ;;
  "linux")
    OS="linux"
    ;;
  "windows"* | "msys"* | "cygwin"*)
    OS="windows"
    ;;
  *)
    echo "❌ Unsupported OS: $OS"
    exit 1
    ;;
esac

# Get latest release version from GitHub API
LATEST_VERSION=$(curl -s https://api.github.com/repos/hushin-sandbox/mdfetcher/releases/latest | grep '"tag_name":' | cut -d'"' -f4)

# Create temp directory
TMP_DIR=$(mktemp -d)
cd "$TMP_DIR"

echo "⬇️  Downloading ${BINARY_NAME} ${LATEST_VERSION} for ${OS}-${ARCH}..."
DOWNLOAD_URL="https://github.com/hushin-sandbox/mdfetcher/releases/download/${LATEST_VERSION}/${BINARY_NAME}-${OS}-${ARCH}"
if [ "$OS" = "win" ]; then
  DOWNLOAD_URL="${DOWNLOAD_URL}.exe"
fi

# Download binary
if ! curl -L -s "$DOWNLOAD_URL" -o "$BINARY_NAME"; then
  echo "❌ Failed to download from $DOWNLOAD_URL"
  cd - > /dev/null
  rm -rf "$TMP_DIR"
  exit 1
fi

# Make binary executable
chmod +x "$BINARY_NAME"

# Install to ~/.local/bin, ~/bin or /usr/local/bin depending on permissions
if [ -d "$HOME/.local/bin" ] && [ -w "$HOME/.local/bin" ]; then
  INSTALL_DIR="$HOME/.local/bin"
elif [ -d "$HOME/bin" ] && [ -w "$HOME/bin" ]; then
  INSTALL_DIR="$HOME/bin"
elif [ -d "/usr/local/bin" ] && [ -w "/usr/local/bin" ]; then
  INSTALL_DIR="/usr/local/bin"
else
  echo "❌ Cannot detect writable exec dir, requires ~/.local/bin, ~/bin or /usr/local/bin"
  cd - > /dev/null
  rm -rf "$TMP_DIR"
  exit 1
fi

mkdir -p "$INSTALL_DIR"

# Move binary to install directory
mv "$BINARY_NAME" "$INSTALL_DIR/$BINARY_NAME"

# Clean up
cd - > /dev/null
rm -rf "$TMP_DIR"

echo "✅ ${BINARY_NAME} ${LATEST_VERSION} installed to ${INSTALL_DIR}/${BINARY_NAME}"
if [[ ":$PATH:" != *":$INSTALL_DIR:"* ]]; then
  echo "⚠️  NOTE: Make sure ${INSTALL_DIR} is in your PATH"
fi
