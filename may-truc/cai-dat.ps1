# Cài "máy trực" chạy ẩn mỗi khi đăng nhập Windows (thư mục Startup của bạn), rồi bật luôn.
# Gỡ: powershell -ExecutionPolicy Bypass -File may-truc\cai-dat.ps1 -Go
param([switch]$Go)
$startup = [Environment]::GetFolderPath('Startup')
$lnk = Join-Path $startup 'Van phong agent - may truc.lnk'
$script = Join-Path $PSScriptRoot 'tra-loi-ngay.ps1'
if ($Go) {
  Remove-Item $lnk -ErrorAction SilentlyContinue
  Get-CimInstance Win32_Process -Filter "Name = 'powershell.exe'" | Where-Object { $_.CommandLine -like '*tra-loi-ngay.ps1*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
  'Đã gỡ máy trực.'
  return
}
$sh = New-Object -ComObject WScript.Shell
$s = $sh.CreateShortcut($lnk)
$s.TargetPath = "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe"
$s.Arguments = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$script`""
$s.WorkingDirectory = $PSScriptRoot
$s.WindowStyle = 7
$s.Save()
Start-Process -FilePath $s.TargetPath -ArgumentList $s.Arguments -WindowStyle Hidden
"Đã cài và bật máy trực. Nhật ký: $env:LOCALAPPDATA\van-phong-agent\may-truc.log"
