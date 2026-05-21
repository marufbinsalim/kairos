import { NextResponse } from 'next/server';

const REPO = 'marufbinsalim/kairos';

const SCRIPT = `$ErrorActionPreference = 'Stop'

$version = (Invoke-RestMethod "https://api.github.com/repos/${REPO}/releases/latest").tag_name

if (-not $version) {
  Write-Error "Failed to fetch latest version"
  exit 1
}

$url = "https://github.com/${REPO}/releases/download/$version/kairos-win32-x64.tar.gz"
$tmp = Join-Path $env:TEMP "kairos.tar.gz"
$dest = Join-Path $env:LOCALAPPDATA "kairos"

Write-Host "Installing kairos $version..."

Invoke-WebRequest -Uri $url -OutFile $tmp
New-Item -ItemType Directory -Force -Path $dest | Out-Null
tar -xzf $tmp -C $dest --strip-components=1
Remove-Item $tmp

$currentPath = [Environment]::GetEnvironmentVariable("PATH", "User")
if ($currentPath -notlike "*$dest\\bin*") {
  [Environment]::SetEnvironmentVariable("PATH", "$currentPath;$dest\\bin", "User")
  Write-Host "Added kairos to PATH (restart your terminal)"
}

Write-Host "kairos $version installed successfully"
Write-Host "Run 'kairos --help' to get started"
`;

export async function GET() {
  return new NextResponse(SCRIPT, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'no-cache',
    },
  });
}
