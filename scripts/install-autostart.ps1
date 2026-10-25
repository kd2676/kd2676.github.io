$ErrorActionPreference = 'Stop'
$project = Split-Path $PSScriptRoot -Parent
$account = [Security.Principal.WindowsIdentity]::GetCurrent().Name
$powershell = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
$npm = (Get-Command npm.cmd -ErrorAction Stop).Source
$argument = '-NoProfile -WindowStyle Hidden -Command "& ''' + $npm + ''' start"'
$action = New-ScheduledTaskAction -Execute $powershell -Argument $argument -WorkingDirectory $project
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $account
$principal = New-ScheduledTaskPrincipal -UserId $account -LogonType Interactive -RunLevel Limited
$settings = New-ScheduledTaskSettingsSet -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1) -ExecutionTimeLimit ([TimeSpan]::Zero)
Register-ScheduledTask -TaskName 'Kingdom2676Dashboard' -Description 'Run Kingdom 2676 and sync ROKStats at Windows logon.' -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Force | Out-Null
Write-Output 'Installed Kingdom2676Dashboard startup task.'
