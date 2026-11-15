# Máy trực · Văn phòng agent
# Chạy nền trên máy của chủ: cứ ~20 giây xem tab Inbox; có tin mới (status = new, hoặc cho_may:
# việc Routine trên cloud để lại vì cần Chrome / file trên máy) thì gọi
# Claude Code trên máy trả lời ngay theo brain/TRA-LOI-NGAY.md. Chờ tin thì không tốn gì.
# Cài chạy cùng Windows: may-truc\cai-dat.ps1 · Gỡ: may-truc\cai-dat.ps1 -Go
param(
  [int]$Giay = 20,
  [int]$PhutToiDa = 45
)
$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
$sheet = '1oiuUuNbyVBbLuhJmtOhiCTnqZyTxu1c0OexZSOs1EWw'
$url = "https://docs.google.com/spreadsheets/d/$sheet/gviz/tq?tqx=out:csv&sheet=Inbox&tq=" + [uri]::EscapeDataString("select A where F = 'new' or F = 'cho_may'")
$dir = Join-Path $env:LOCALAPPDATA 'van-phong-agent'
New-Item -ItemType Directory -Force $dir | Out-Null
$log = Join-Path $dir 'may-truc.log'
function Ghi($s) {
  $line = (Get-Date -Format 'yyyy-MM-dd HH:mm:ss') + '  ' + $s
  Add-Content -Path $log -Value $line -Encoding UTF8
  if ((Get-Item $log).Length -gt 1MB) { Move-Item $log "$log.cu" -Force }
}

# chỉ một bản chạy
$mutex = New-Object System.Threading.Mutex($false, 'Local\VanPhongAgentMayTruc')
if (-not $mutex.WaitOne(0)) { exit 0 }

$claude = (Get-Command claude -ErrorAction SilentlyContinue).Source
if (-not $claude) {
  $claude = Get-ChildItem "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\Anthropic.ClaudeCode*\claude.exe" -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty FullName
}
if (-not $claude) { Ghi 'Không tìm thấy claude.exe. Cài Claude Code rồi chạy lại.'; exit 1 }

$tools = 'Read,Write,Edit,Glob,Grep,Bash,Agent,Skill,ToolSearch,mcp__claude_ai_Google_Sheets,mcp__claude_ai_Google_Drive,mcp__claude_ai_Google_Docs,mcp__claude_ai_Canva,mcp__claude-in-chrome'
$prompt = 'Mo file brain/TRA-LOI-NGAY.md trong repo nay va lam dung toan bo phan prompt nam sau dong --- dau tien.'
$wc = New-Object System.Net.WebClient
$wc.Encoding = [System.Text.Encoding]::UTF8
Ghi "Máy trực bắt đầu (mỗi $Giay giây). claude: $claude"

while ($true) {
  try {
    $csv = $wc.DownloadString($url + '&_ts=' + [DateTime]::UtcNow.Ticks)
    $moi = @($csv -split "`n" | Select-Object -Skip 1 | Where-Object { $_.Trim() -ne '' })
    if ($moi.Count -gt 0) {
      Ghi "Có $($moi.Count) tin mới → gọi Bộ não."
      Push-Location $repo
      try { git pull -q --rebase origin main 2>&1 | Out-Null } catch { }
      $out = Join-Path $dir 'lan-cuoi.txt'
      $p = Start-Process -FilePath $claude -ArgumentList @('-p', "`"$prompt`"", '--model', 'sonnet', '--chrome', '--allowedTools', $tools) `
        -WorkingDirectory $repo -NoNewWindow -PassThru -RedirectStandardOutput $out -RedirectStandardError "$out.loi"
      if (-not $p.WaitForExit($PhutToiDa * 60000)) { $p.Kill(); Ghi "Quá $PhutToiDa phút, đã dừng lượt này." }
      else { Ghi ('Xong: ' + ((Get-Content $out -Encoding UTF8 -ErrorAction SilentlyContinue | Select-Object -Last 1) -join '')) }
      Pop-Location
    }
  } catch {
    Ghi ('Lỗi: ' + $_.Exception.Message)
  }
  Start-Sleep -Seconds $Giay
}
