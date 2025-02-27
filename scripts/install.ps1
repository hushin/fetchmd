#!/usr/bin/env pwsh
$BinaryName = "fetchmd"
$BinDir = "${Home}\bin"
Write-Output "${BinaryName} will be installed in ${BinDir}"
# Detect system architecture
$SystemType = Get-ComputerInfo -Property CsSystemType
if ($SystemType.CsSystemType.Contains("ARM64")) {
    Write-Host "❌ ARM64 is not supported yet"
    exit 1
}
# Get latest release version from GitHub API
$LatestVersion = (Invoke-RestMethod -Uri "https://api.github.com/repos/hushin/fetchmd/releases/latest").tag_name
Write-Output "⬇️  Downloading ${BinaryName} ${LatestVersion} for windows-x64..."
$DownloadUrl = "https://github.com/hushin/fetchmd/releases/download/${LatestVersion}/${BinaryName}-windows-x64.exe"
# Create bin directory if it doesn't exist
if (!(Test-Path $BinDir)) {
    New-Item $BinDir -ItemType Directory | Out-Null
}
# Download binary directly to BinDir
try {
    Invoke-WebRequest -Uri $DownloadUrl -OutFile (Join-Path $BinDir "${BinaryName}.exe")
}
catch {
    Write-Host "❌ Failed to download from $DownloadUrl"
    exit 1
}
# Add to PATH if not already present
$User = [System.EnvironmentVariableTarget]::User
$Path = [System.Environment]::GetEnvironmentVariable('Path', $User)
if (!(";${Path};".ToLower() -like "*;${BinDir};*".ToLower())) {
    [System.Environment]::SetEnvironmentVariable('Path', "${Path};${BinDir}", $User)
    $Env:Path += ";${BinDir}"
}
Write-Output "✅ ${BinaryName} ${LatestVersion} was installed successfully to ${BinDir}"
