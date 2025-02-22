#!/usr/bin/env bash

set -e

# build directory
mkdir -p dist

# Supported targets: bun-linux-x64, bun-linux-arm64, bun-windows-x64, bun-darwin-x64, bun-darwin-arm64

# Define targets
targets=(
  "linux-x64"
  "linux-arm64"
  "windows-x64"
  "darwin-x64"
  "darwin-arm64"
)

# Build for all targets
for target in "${targets[@]}"; do
  echo "Building for ${target}..."
  outfile="dist/mdfetcher-${target}"

  # Add .exe extension for Windows
  if [[ $target == "windows-x64" ]]; then
    outfile="${outfile}.exe"
  fi

  bun build ./src/index.ts --compile --target="bun-${target}" --outfile "${outfile}"
done
