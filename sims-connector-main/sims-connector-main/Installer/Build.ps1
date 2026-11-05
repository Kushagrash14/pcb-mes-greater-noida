param(
    [ValidateSet("x64", "x86")]
    [string]$Platform = "x64"
)

Write-Host "Platform received: [$Platform]"

$ErrorActionPreference = "Stop"

$Root = Split-Path $PSScriptRoot -Parent

$Runtime = switch ($Platform) {
    "x64" { "win-x64" }
    "x86" { "win-x86" }
}

Write-Host ""
Write-Host "========================================"
Write-Host " Building MachineConnector ($Platform)"
Write-Host "========================================"

$PublishFolder = Join-Path $Root "Publish"
$InstallerFiles = Join-Path $Root "InstallerFiles"

Write-Host ""
Write-Host "Cleaning previous output..."

Remove-Item $PublishFolder -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item $InstallerFiles -Recurse -Force -ErrorAction SilentlyContinue

New-Item $PublishFolder -ItemType Directory | Out-Null
New-Item $InstallerFiles -ItemType Directory | Out-Null

# -----------------------------
# Publish Windows Service
# -----------------------------
Write-Host ""
Write-Host "Publishing MachineConnector..."

dotnet publish "$Root\MachineConnector\MachineConnector.csproj" `
    -c Release `
    -r $Runtime `
    --self-contained true `
    -o "$PublishFolder\Service"

if ($LASTEXITCODE -ne 0) {
    throw "MachineConnector publish failed."
}

# -----------------------------
# Publish Installer Helper
# -----------------------------
Write-Host ""
Write-Host "Publishing Installer Helper..."

dotnet publish "$Root\MachineConnector.InstallerHelper\MachineConnector.InstallerHelper.csproj" `
    -c Release `
    -r $Runtime `
    --self-contained true `
    -p:PublishSingleFile=true `
    -o "$PublishFolder\Helper"

if ($LASTEXITCODE -ne 0) {
    throw "Installer Helper publish failed."
}

# -----------------------------
# Copy Files
# -----------------------------
Write-Host ""
Write-Host "Copying files..."

Copy-Item "$PublishFolder\Service\*" "$InstallerFiles" -Recurse
Copy-Item "$PublishFolder\Helper\MachineConnector.InstallerHelper.exe" "$InstallerFiles"

# -----------------------------
# Build Installer
# -----------------------------

$ISCC = "C:\Program Files\Inno Setup 7\ISCC.exe"

if (!(Test-Path $ISCC)) {
    throw "Inno Setup Compiler not found: $ISCC"
}

Write-Host ""
Write-Host "Compiling Installer..."

$env:BUILD_ARCH = $Platform

& $ISCC "$Root\Installer\Setup.iss"

if ($LASTEXITCODE -ne 0) {
    throw "Installer compilation failed."
}

Write-Host ""
Write-Host "========================================"
Write-Host " MachineConnector Build Completed!"
Write-Host "========================================"