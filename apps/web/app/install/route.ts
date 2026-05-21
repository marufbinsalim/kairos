import { NextResponse } from 'next/server';

const REPO = 'marufbinsalim/kairos';

const SCRIPT = `#!/bin/sh
set -e

OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

case $ARCH in
  x86_64) ARCH="x64" ;;
  aarch64|arm64) ARCH="arm64" ;;
  *) echo "Unsupported architecture: $ARCH" && exit 1 ;;
esac

case $OS in
  linux|darwin) ;;
  *) echo "Unsupported OS: $OS" && exit 1 ;;
esac

LATEST=$(curl -sL https://api.github.com/repos/${REPO}/releases/latest | grep '"tag_name"' | cut -d'"' -f4)

if [ -z "$LATEST" ]; then
  echo "Failed to fetch latest version" && exit 1
fi

CURRENT=""
if command -v kairos > /dev/null 2>&1; then
  CURRENT=$(kairos --version 2>/dev/null | grep -o 'v[0-9]*\\.[0-9]*\\.[0-9]*' | head -1)
fi

if [ "\$CURRENT" = "\$LATEST" ]; then
  echo "kairos \${LATEST} is already installed and up to date"
  exit 0
fi

URL="https://github.com/${REPO}/releases/download/\${LATEST}/kairos-\${OS}-\${ARCH}.tar.gz"

if [ -n "\$CURRENT" ]; then
  echo "Updating kairos \${CURRENT} -> \${LATEST} (\${OS}-\${ARCH})..."
else
  echo "Installing kairos \${LATEST} (\${OS}-\${ARCH})..."
fi

curl -sL "\$URL" | tar xz -C /usr/local/bin --strip-components=1

echo "Done. Run 'kairos --help' to get started"
`;

export async function GET() {
  return new NextResponse(SCRIPT, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'no-cache',
    },
  });
}
