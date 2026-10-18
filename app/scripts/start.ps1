$ErrorActionPreference = 'Stop'
$taskAppRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$taskPackaged = Join-Path $taskAppRoot 'release\win-unpacked\TalkCut.exe'
if (Test-Path -LiteralPath $taskPackaged) {
    Start-Process -FilePath $taskPackaged -WorkingDirectory (Split-Path $taskPackaged) -WindowStyle Normal
} else {
    $taskElectron = Join-Path $taskAppRoot 'node_modules\electron\dist\electron.exe'
    if (-not (Test-Path -LiteralPath $taskElectron)) { throw 'Build or install TalkCut first. See README.md.' }
    Start-Process -FilePath $taskElectron -ArgumentList ('"{0}"' -f $taskAppRoot) -WorkingDirectory $taskAppRoot -WindowStyle Normal
}
