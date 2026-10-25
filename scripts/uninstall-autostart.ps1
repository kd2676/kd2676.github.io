$ErrorActionPreference = 'Stop'
Unregister-ScheduledTask -TaskName 'Kingdom2676Dashboard' -Confirm:$false
Write-Output 'Removed Kingdom2676Dashboard startup task.'
