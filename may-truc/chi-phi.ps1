# Xem chi phí các lượt máy trực (ước tính theo giá API; gói Claude tính vào hạn mức, không trừ tiền riêng).
# Chạy: powershell -File may-truc\chi-phi.ps1  [-Ngay 7]
param([int]$Ngay = 7)
$f = Join-Path $env:LOCALAPPDATA 'van-phong-agent\chi-phi.csv'
if (-not (Test-Path $f)) { 'Chưa có lượt nào được ghi.'; exit }
$rows = Import-Csv $f | Where-Object { [datetime]$_.thoi_gian -ge (Get-Date).Date.AddDays(1 - $Ngay) }
$rows | Group-Object { ([datetime]$_.thoi_gian).ToString('yyyy-MM-dd') } | ForEach-Object {
  $g = $_.Group
  [pscustomobject]@{
    Ngay       = $_.Name
    So_luot    = $g.Count
    Haiku      = @($g | Where-Object model -eq 'haiku').Count
    Sonnet     = @($g | Where-Object model -eq 'sonnet').Count
    So_tin     = ($g | Measure-Object so_tin -Sum).Sum
    USD_uoc    = [math]::Round(($g | Measure-Object usd -Sum).Sum, 2)
    Phut       = [math]::Round(($g | Measure-Object giay -Sum).Sum / 60, 1)
  }
} | Format-Table -AutoSize
