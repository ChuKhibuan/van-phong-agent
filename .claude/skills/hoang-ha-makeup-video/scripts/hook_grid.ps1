<#
Hoàng Hà Makeup — dựng HOOK lưới 2x2 (1080x1920).
  4 clip chuyển động ghép 2x2, dải trắng ngang giữa 2 hàng,
  dòng 1 chữ trắng (UTM Avo Bold Italic, bóng tối) nằm sát mép dưới hàng trên,
  dòng 2 chữ đỏ #E31B23 viền trắng nằm trên dải trắng.
  Dòng 1 trượt + hiện ở 0.3s, dòng 2 bật ở ~0.8s, cả hai rút sang phải trước khi hết hook,
  rồi lưới GIỮ THÊM một khoảng ngắn (-Gap, mặc định 0.6s) không chữ trước khi vào thân.

  hook_grid.ps1 -Clips a.mp4,b.mp4,c.mp4,d.mp4 -Line1 "CHỌN ĐƯỢC ẢNH RỒI" -Line2 "CẦN TEST NỮA KHÔNG?"
  hook_grid.ps1 ... -Starts 2,0,5.5,1 -Duration 4.5 -Gap 0.6 -AudioFrom 1 -Pop pop.wav -Whoosh whoosh.wav
#>
param(
  [Parameter(Mandatory=$true)][string[]]$Clips,       # đúng 4 clip: trên-trái, trên-phải, dưới-trái, dưới-phải
  [Parameter(Mandatory=$true)][string]$Line1,         # dòng trắng
  [Parameter(Mandatory=$true)][string]$Line2,         # dòng đỏ — ý đắt / câu hỏi
  [double[]]$Starts = @(0,0,0,0),                     # giây bắt đầu lấy trong từng clip
  [double]$Duration = 4.5,                            # thời gian có chữ
  [double]$Gap = 0.6,                                 # khoảng giữ lưới không chữ trước khi chuyển sang thân
  [int]$AudioFrom = 1,                                # lấy tiếng clip số mấy (0 = im lặng)
  [string]$Font = "UTM Avo",                          # họ font; file UTM AvoBold_Italic.ttf được ưu tiên
  [string]$FontFile = "",
  [int]$FontSize = 84,
  [string]$Red = "#E31B23",
  [string]$Band = "#F4F4F4",
  [string]$Pop = "",                                  # file tiếng pop (đặt ở lúc dòng 2 bật)
  [string]$Whoosh = "",                               # file tiếng whoosh (đặt ở lúc chữ rút)
  [double]$SfxDb = -25,
  [string]$Out
)
$ErrorActionPreference = 'Stop'
$inv = [Globalization.CultureInfo]::InvariantCulture
function F([double]$x) { $x.ToString('0.###', $inv) }
if ($Clips.Count -ne 4) { throw "Cần đúng 4 clip (-Clips a,b,c,d)" }
while ($Starts.Count -lt 4) { $Starts += 0 }

# ---------- ffmpeg ----------
$ff = (Get-Command ffmpeg -ErrorAction SilentlyContinue).Source
if (-not $ff) {
  $d = Get-ChildItem "$env:LOCALAPPDATA\CapCut\Apps" -Directory -ErrorAction SilentlyContinue |
       Where-Object { Test-Path (Join-Path $_.FullName 'ffmpeg.exe') } |
       Sort-Object { try { [version]$_.Name } catch { [version]'0.0' } } -Descending | Select-Object -First 1
  if (-not $d) { throw "Không thấy ffmpeg: cài CapCut hoặc đặt ffmpeg vào PATH" }
  $ff = Join-Path $d.FullName 'ffmpeg.exe'
}

# ---------- layout ----------
$W = 1080; $H = 1920
$topH = 940; $bandH = 150; $botY = $topH + $bandH; $botH = $H - $botY; $cw = $W / 2
$T = $Duration + $Gap
$t1 = 0.30; $t2 = 0.80; $tOut = [Math]::Max($t2 + 1.0, $Duration - 0.35)

$tmp = Join-Path $env:TEMP ("hh_hook_" + [guid]::NewGuid().ToString('N').Substring(0,8))
New-Item -ItemType Directory -Force $tmp | Out-Null

# ---------- title PNGs (System.Drawing) ----------
Add-Type -AssemblyName System.Drawing
$pfc = New-Object System.Drawing.Text.PrivateFontCollection
if (-not $FontFile) {
  foreach ($c in @("$env:LOCALAPPDATA\Microsoft\Windows\Fonts\UTM AvoBold_Italic.ttf", "C:\Windows\Fonts\UTM AvoBold_Italic.ttf")) {
    if (Test-Path -LiteralPath $c) { $FontFile = $c; break }
  }
}
if ($FontFile) { $pfc.AddFontFile($FontFile); $fam = $pfc.Families[0]; $style = [Drawing.FontStyle]::Bold -bor [Drawing.FontStyle]::Italic }
else { $fam = New-Object Drawing.FontFamily($Font); $style = [Drawing.FontStyle]::Bold -bor [Drawing.FontStyle]::Italic }
if (-not $fam.IsStyleAvailable($style)) { foreach ($s in @([Drawing.FontStyle]::Italic, [Drawing.FontStyle]::Bold, [Drawing.FontStyle]::Regular)) { if ($fam.IsStyleAvailable($s)) { $style = $s; break } } }

function TitlePng([string]$text, [string]$path, $fill, $stroke, [int]$strokeW, [bool]$shadow) {
  $text = $text.ToUpper()
  $size = [single]$FontSize
  $sf = [Drawing.StringFormat]::GenericTypographic
  do {
    $gp = New-Object Drawing.Drawing2D.GraphicsPath
    $gp.AddString($text, $fam, [int]$style, $size, (New-Object Drawing.PointF(0,0)), $sf)
    $b = $gp.GetBounds(); $size -= 2
  } while ($b.Width -gt 1010 -and $size -gt 30)
  $pad = 30
  $bw = [int]($b.Width + 2*$pad); $bh = [int]($b.Height + 2*$pad)
  $bmp = New-Object Drawing.Bitmap($bw, $bh, [Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = 'AntiAlias'; $g.Clear([Drawing.Color]::Transparent)
  $m = New-Object Drawing.Drawing2D.Matrix; $m.Translate($pad - $b.X, $pad - $b.Y); $gp.Transform($m)
  if ($shadow) {
    $sp = $gp.Clone(); $m2 = New-Object Drawing.Drawing2D.Matrix; $m2.Translate(4, 5); $sp.Transform($m2)
    $pen0 = New-Object Drawing.Pen([Drawing.Color]::FromArgb(110,0,0,0), 10); $pen0.LineJoin = 'Round'
    $g.DrawPath($pen0, $sp); $g.FillPath((New-Object Drawing.SolidBrush([Drawing.Color]::FromArgb(150,0,0,0))), $sp)
  }
  if ($strokeW -gt 0) { $pen = [Drawing.Pen]::new([Drawing.Color]$stroke, [single]$strokeW); $pen.LineJoin = 'Round'; $g.DrawPath($pen, $gp) }
  $g.FillPath([Drawing.SolidBrush]::new([Drawing.Color]$fill), $gp)
  $bmp.Save($path, [Drawing.Imaging.ImageFormat]::Png); $g.Dispose(); $bmp.Dispose()
  return @($bw, $bh)
}
$hx = $Red.TrimStart('#'); $redC = [Drawing.Color]::FromArgb(255, [Convert]::ToInt32($hx.Substring(0,2),16), [Convert]::ToInt32($hx.Substring(2,2),16), [Convert]::ToInt32($hx.Substring(4,2),16))
$p1 = Join-Path $tmp 'l1.png'; $s1 = TitlePng $Line1 $p1 ([Drawing.Color]::White) ([Drawing.Color]::FromArgb(160,20,20,20)) 6 $true
$p2 = Join-Path $tmp 'l2.png'; $s2 = TitlePng $Line2 $p2 $redC ([Drawing.Color]::White) 10 $false

# line 1: bottom edge sits on the top row's lower edge; line 2 centred on the white band
$y1 = [int]($topH - $s1[1] + 34)
$y2 = [int]($topH + ($bandH - $s2[1]) / 2)

# ---------- filter graph ----------
$cells = @(@(0,0,$cw,$topH), @($cw,0,$cw,$topH), @(0,$botY,$cw,$botH), @($cw,$botY,$cw,$botH))
$fg = New-Object System.Collections.Generic.List[string]
$fg.Add("color=c=$($Band.Replace('#','0x')):s=${W}x${H}:r=30:d=$(F $T)[bg]")
for ($i = 0; $i -lt 4; $i++) {
  $c = $cells[$i]
  $fg.Add("[$i`:v]scale=$($c[2]):$($c[3]):force_original_aspect_ratio=increase,crop=$($c[2]):$($c[3]),setsar=1,fps=30,trim=duration=$(F $T),setpts=PTS-STARTPTS[c$i]")
}
$fg.Add("[bg][c0]overlay=0:0[g0]")
$fg.Add("[g0][c1]overlay=${cw}:0[g1]")
$fg.Add("[g1][c2]overlay=0:${botY}[g2]")
$fg.Add("[g2][c3]overlay=${cw}:${botY}:shortest=0[grid]")
# light-streak flash before line 1 (thin white bar sweeping left→right)
$fg.Add("color=c=white@0.75:s=14x260:r=30:d=$(F $T),format=rgba[fl]")
$fg.Add("[grid][fl]overlay=x='-40+(t-$(F ($t1-0.1)))*2600':y=$($topH-250):enable='between(t,$(F ($t1-0.1)),$(F ($t1+0.35)))'[g3]")
$fadeIn = 0.22; $fadeOut = 0.28
$fg.Add("[4:v]format=rgba,fade=t=in:st=$(F $t1):d=$(F $fadeIn):alpha=1,fade=t=out:st=$(F $tOut):d=$(F $fadeOut):alpha=1[l1]")
$fg.Add("[5:v]format=rgba,fade=t=in:st=$(F $t2):d=0.12:alpha=1,fade=t=out:st=$(F ($tOut+0.05)):d=$(F $fadeOut):alpha=1[l2]")
$x1 = "($W-w)/2 - if(lt(t,$(F ($t1+$fadeIn))), ($(F ($t1+$fadeIn))-t)*900, 0) + if(gt(t,$(F $tOut)), (t-$(F $tOut))*1800, 0)"
$x2 = "($W-w)/2 + if(gt(t,$(F ($tOut+0.05))), (t-$(F ($tOut+0.05)))*1800, 0)"
# line 2 "pop": rises 14px in the first 0.12s
$y2e = "$y2 + if(lt(t,$(F ($t2+0.12))), max(0,($(F ($t2+0.12))-t))*120, 0)"
$fg.Add("[g3][l1]overlay=x='$x1':y=${y1}:shortest=0[g4]")
$fg.Add("[g4][l2]overlay=x='$x2':y='$y2e':shortest=0,format=yuv420p,trim=duration=$(F $T)[vout]")

# audio: chosen clip voice + optional SFX
$ins = @(); for ($i=0;$i -lt 4;$i++) { $ins += @('-ss', (F $Starts[$i]), '-i', $Clips[$i]) }
$ins += @('-loop','1','-t',(F $T),'-i',$p1,'-loop','1','-t',(F $T),'-i',$p2)
$aParts = @(); $n = 6
if ($AudioFrom -ge 1 -and $AudioFrom -le 4) { $fg.Add("[$($AudioFrom-1):a]atrim=duration=$(F $T),asetpts=PTS-STARTPTS,aresample=44100[av]"); $aParts += '[av]' }
else { $fg.Add("anullsrc=r=44100:cl=stereo,atrim=duration=$(F $T)[av]"); $aParts += '[av]' }
$vol = [Math]::Pow(10, $SfxDb/20)
if ($Pop -and (Test-Path -LiteralPath $Pop))       { $ins += @('-i',$Pop);    $fg.Add("[$n`:a]volume=$(F $vol),adelay=$([int]($t2*1000))|$([int]($t2*1000)),aresample=44100[sp]"); $aParts += '[sp]'; $n++ }
if ($Whoosh -and (Test-Path -LiteralPath $Whoosh)) { $ins += @('-i',$Whoosh); $fg.Add("[$n`:a]volume=$(F $vol),adelay=$([int]($tOut*1000))|$([int]($tOut*1000)),aresample=44100[sw]"); $aParts += '[sw]'; $n++ }
if ($aParts.Count -gt 1) { $fg.Add("$($aParts -join '')amix=inputs=$($aParts.Count):duration=first:normalize=0[aout]") } else { $fg.Add("[av]anull[aout]") }

$fs = Join-Path $tmp 'graph.txt'
[IO.File]::WriteAllText($fs, ($fg -join ";`n"), (New-Object Text.UTF8Encoding($false)))

if (-not $Out) {
  $base = Join-Path (Split-Path $Clips[0] -Parent) 'hook_grid'
  $Out = "$base.mp4"; $k = 2; while (Test-Path -LiteralPath $Out) { $Out = "${base}_$k.mp4"; $k++ }
}
$encList = (& $ff -hide_banner -encoders 2>$null) -join "`n"
$cands = @(
  @('libx264',    @('-c:v','libx264','-preset','medium','-crf','19')),
  @('h264_nvenc', @('-c:v','h264_nvenc','-preset','p6','-rc','vbr','-cq','21','-b:v','10M','-maxrate','14M')),
  @('h264_qsv',   @('-c:v','h264_qsv','-global_quality','21','-b:v','10M')),
  @('h264_amf',   @('-c:v','h264_amf','-quality','quality','-b:v','10M')),
  @('h264_mf',    @('-c:v','h264_mf','-b:v','10M'))
)
$used = $null
foreach ($c in $cands) {
  if ($encList -notmatch " $($c[0]) ") { continue }
  $a = @('-hide_banner','-v','error','-y') + $ins + @('-filter_complex_script',$fs,'-map','[vout]','-map','[aout]') + $c[1] +
       @('-c:a','aac','-b:a','192k','-ar','44100','-movflags','+faststart','-t',(F $T),$Out)
  & $ff @a
  if ($LASTEXITCODE -eq 0) { $used = $c[0]; break }
}
if (-not $used) { throw "Encode lỗi với mọi encoder; xem graph: $fs" }

$sheet = Join-Path $tmp 'check.jpg'
& $ff -v error -y -i $Out -vf "fps=4,scale=216:384,tile=$([int][Math]::Ceiling($T*4/2))x2" -frames:v 1 $sheet
"OUT     $Out"
"LENGTH  $(F $T)s  (chữ $(F $Duration)s + giữ lưới $(F $Gap)s)   font: $($fam.Name)   encoder: $used"
"CHECK   $sheet"
