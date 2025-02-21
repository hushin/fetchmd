#!/usr/bin/env bash

set -e

# build directory
mkdir -p dist

# First, bundle the application
echo "Bundling application..."
bun build ./index.ts --target=node --outfile=dist/bundle.js

# Define targets
targets=(
  "linux-x64-baseline"
  "linux-arm64"
  "windows-x64-baseline"
  "darwin-x64"
  "darwin-arm64"
)

# Build for all targets
for target in "${targets[@]}"; do
  echo "Building for ${target}..."
  outfile="dist/mdfetcher-${target%-baseline}"  # Remove -baseline from output filename

  # Add .exe extension for Windows
  if [[ $target == "windows-x64"* ]]; then
    outfile="${outfile}.exe"
  fi

  bun build ./index.ts ./node_modules/jsdom/lib/jsdom/living/xhr/xhr-sync-worker.js --compile --minify --bytecode --target="bun-${target}" --outfile "${outfile}"
done

# Clean up bundle
rm dist/bundle.js
