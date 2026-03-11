$ErrorActionPreference = 'SilentlyContinue'

$workspace = 'C:\Users\joao lucas\Desktop\ecommerce'

Get-CimInstance Win32_Process |
  Where-Object {
    $_.Name -eq 'node.exe' -and
    $_.CommandLine -match [regex]::Escape($workspace)
  } |
  ForEach-Object {
    Stop-Process -Id $_.ProcessId -Force
  }

Set-Location $workspace

if (Test-Path '.next\dev') {
  Remove-Item '.next\dev' -Recurse -Force
}

npm.cmd run dev:raw