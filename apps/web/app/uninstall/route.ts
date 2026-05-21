import { NextResponse } from 'next/server';

const SCRIPT = `#!/bin/sh
set -e

INSTALL_DIR="${HOME}/.local/share/kairos"
BIN_DIR="${HOME}/.local/bin"

if [ ! -d "$INSTALL_DIR" ]; then
  echo "kairos is not installed"
  exit 0
fi

rm -rf "$INSTALL_DIR"
rm -f "$BIN_DIR/kairos"

for RC in "${HOME}/.bashrc" "${HOME}/.zshrc"; do
  if [ -f "$RC" ]; then
    grep -v '.local/bin.*PATH\\|PATH.*\.local/bin' "$RC" > "${RC}.tmp" && mv "${RC}.tmp" "$RC"
  fi
done

echo "kairos uninstalled"
`;

export async function GET() {
  return new NextResponse(SCRIPT, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'no-cache',
    },
  });
}
