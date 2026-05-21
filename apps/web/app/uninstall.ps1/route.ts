import { NextResponse } from 'next/server';

const SCRIPT = `$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$installDir = Join-Path $env:LOCALAPPDATA "kairos"
$binDir = Join-Path $installDir "bin"

if (-not (Test-Path $installDir)) {
  Write-Host "kairos is not installed"
  exit 0
}

Remove-Item $installDir -Recurse -Force

$currentPath = [Environment]::GetEnvironmentVariable("PATH", "User")
$newPath = ($currentPath -split ';' | Where-Object { $_ -ne $binDir }) -join ';'
[Environment]::SetEnvironmentVariable("PATH", $newPath, "User")
$env:PATH = ($env:PATH -split ';' | Where-Object { $_ -ne $binDir }) -join ';'

Write-Host "kairos uninstalled"
`;

export async function GET() {
  return new NextResponse(SCRIPT, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'no-cache',
    },
  });
}
