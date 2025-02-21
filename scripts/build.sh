#!/usr/bin/env bash

set -e

# build directory
mkdir -p dist

# build for each platform
PLATFORMS=("linux" "darwin" "win")
ARCHS=("x64" "arm64")

for platform in "${PLATFORMS[@]}"; do
  for arch in "${ARCHS[@]}"; do
    echo "Building for $platform-$arch..."
    OUTPUT="dist/mdfetcher-$platform-$arch"
    if [ "$platform" = "win" ]; then
      OUTPUT="$OUTPUT.exe"
    fi

    BUN_TARGET="$platform-$arch" bun build ./index.ts --compile --outfile "$OUTPUT"
  done
done
