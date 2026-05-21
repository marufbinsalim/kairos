import { NextResponse } from 'next/server';

const REPO = 'marufbinsalim/kairos';

const SCRIPT = `$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$latest = (Invoke-RestMethod "https://api.github.com/repos/${REPO}/releases/latest").tag_name

if (-not $latest) {
  Write-Error "Failed to fetch latest version"
  exit 1
}

$current = ""
if (Get-Command kairos -ErrorAction SilentlyContinue) {
  $current = (kairos --version 2>$null) -replace '.*?(v[\\d.]+).*', '$1'
}

if ($current -eq $latest) {
  Write-Host "kairos $latest is already installed and up to date"
  exit 0
}

if ($current) {
  Write-Host "Updating kairos $current -> $latest..."
} else {
  Write-Host "Installing kairos $latest..."
}

$url = "https://github.com/${REPO}/releases/download/$latest/kairos-win32-x64.tar.gz"
$tmp = Join-Path $env:TEMP "kairos.tar.gz"
$installDir = Join-Path $env:LOCALAPPDATA "kairos"

Invoke-WebRequest -Uri $url -OutFile $tmp -UseBasicParsing
Remove-Item $installDir -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path $installDir | Out-Null
tar -xzf $tmp -C $installDir --strip-components=1 --exclude='kairos/node_modules/.bin' --exclude='node_modules/.bin'
Remove-Item $tmp

$binDir = Join-Path $installDir "bin"
$currentPath = [Environment]::GetEnvironmentVariable("PATH", "User")
if ($currentPath -notlike "*$binDir*") {
  [Environment]::SetEnvironmentVariable("PATH", "$currentPath;$binDir", "User")
}
if ($env:PATH -notlike "*$binDir*") {
  $env:PATH = "$env:PATH;$binDir"
}

Write-Host "kairos $latest installed. Run 'kairos --help' to get started"
`;

export async function GET() {
  return new NextResponse(SCRIPT, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'no-cache',
    },
  });
}
