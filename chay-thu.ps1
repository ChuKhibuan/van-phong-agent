# Chạy thử trang web tại máy, không cần cài gì (dùng PowerShell có sẵn của Windows).
# Cách dùng:  chuột phải file này → Run with PowerShell,  rồi mở http://localhost:8080
param([int]$Port = 8080)
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$types = @{ '.html'='text/html; charset=utf-8'; '.js'='text/javascript; charset=utf-8'; '.css'='text/css; charset=utf-8';
  '.json'='application/json'; '.svg'='image/svg+xml'; '.png'='image/png'; '.jpg'='image/jpeg'; '.webp'='image/webp'; '.glb'='model/gltf-binary'; '.md'='text/plain; charset=utf-8' }
$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Văn phòng agent đang chạy: http://localhost:$Port  (Ctrl+C để dừng)"
try {
  while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    try {
    $path = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath).TrimStart('/')
    if ($path -eq '') { $path = 'index.html' }
    $file = [System.IO.Path]::GetFullPath((Join-Path $root $path))
    if ($file.StartsWith($root) -and (Test-Path $file -PathType Leaf)) {
      $bytes = [System.IO.File]::ReadAllBytes($file)
      $ext = [System.IO.Path]::GetExtension($file).ToLower()
      $ctx.Response.ContentType = if ($types[$ext]) { $types[$ext] } else { 'application/octet-stream' }
      $ctx.Response.Headers.Add('Cache-Control', 'no-cache')
      $ctx.Response.ContentLength64 = $bytes.Length
      $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else { $ctx.Response.StatusCode = 404 }
    } catch { Write-Host "Lỗi: $($_.Exception.Message)" }
    try { $ctx.Response.Close() } catch {}
  }
} finally { $listener.Stop() }
