$ErrorActionPreference = 'Stop'
$project = Split-Path $PSScriptRoot -Parent
$account = [Security.Principal.WindowsIdentity]::GetCurrent().Name
$node = (Get-Command node.exe -ErrorAction Stop).Source
$action = New-ScheduledTaskAction -Execute $node -Argument '--import tsx server/index.ts' -WorkingDirectory $project
$logon = New-ScheduledTaskTrigger -AtLogOn -User $account
$periodic = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Minutes 5) -RepetitionDuration (New-TimeSpan -Days 3650)
$principal = New-ScheduledTaskPrincipal -UserId $account -LogonType Interactive -RunLevel Limited
$settings = New-ScheduledTaskSettingsSet -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1) -ExecutionTimeLimit ([TimeSpan]::Zero) -MultipleInstances IgnoreNew -StartWhenAvailable
Register-ScheduledTask -TaskName 'Kingdom2676Dashboard' -Description 'Run Kingdom 2676 and sync ROKStats at Windows logon.' -Action $action -Trigger @($logon, $periodic) -Principal $principal -Settings $settings -Force | Out-Null
Write-Output 'Installed Kingdom2676Dashboard startup task.'
