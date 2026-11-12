$port = if ($env:PORT) { [int]$env:PORT } else { 3000 }
$root = $PSScriptRoot

$csharpCode = @'
using System;
using System.IO;
using System.Net;
using System.Text;
using System.Threading;
using System.Collections.Generic;

public class SimpleWebServer
{
    private readonly HttpListener _listener = new HttpListener();
    private readonly string _rootDirectory;
    private static readonly Dictionary<string, string> _mimeTypes = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
    {
        { ".html", "text/html; charset=utf-8" },
        { ".htm", "text/html; charset=utf-8" },
        { ".js", "text/javascript; charset=utf-8" },
        { ".css", "text/css; charset=utf-8" },
        { ".svg", "image/svg+xml" },
        { ".png", "image/png" },
        { ".jpg", "image/jpeg" },
        { ".jpeg", "image/jpeg" },
        { ".gif", "image/gif" },
        { ".webp", "image/webp" },
        { ".ico", "image/x-icon" },
        { ".json", "application/json; charset=utf-8" },
        { ".woff", "font/woff" },
        { ".woff2", "font/woff2" },
        { ".ttf", "font/ttf" },
        { ".txt", "text/plain; charset=utf-8" },
        { ".xml", "application/xml; charset=utf-8" }
    };

    public SimpleWebServer(string rootDirectory, int port)
    {
        _rootDirectory = Path.GetFullPath(rootDirectory);
        _listener.Prefixes.Add(string.Format("http://localhost:{0}/", port));
        _listener.Prefixes.Add(string.Format("http://127.0.0.1:{0}/", port));
    }

    public void Start()
    {
        _listener.Start();
        ThreadPool.QueueUserWorkItem(ListenLoop);
    }

    public void Stop()
    {
        try
        {
            _listener.Stop();
            _listener.Close();
        }
        catch { }
    }

    private void ListenLoop(object state)
    {
        while (_listener.IsListening)
        {
            try
            {
                var context = _listener.GetContext();
                ThreadPool.QueueUserWorkItem(ProcessRequest, context);
            }
            catch
            {
                if (!_listener.IsListening) break;
            }
        }
    }

    private void ProcessRequest(object state)
    {
        var context = (HttpListenerContext)state;
        var response = context.Response;
        try
        {
            var rawPath = context.Request.Url.AbsolutePath;
            var decodedPath = Uri.UnescapeDataString(rawPath).TrimStart('/');
            if (string.IsNullOrEmpty(decodedPath))
            {
                decodedPath = "index.html";
            }

            var targetPath = Path.GetFullPath(Path.Combine(_rootDirectory, decodedPath));

            // Security check: ensure path is within root
            if (!targetPath.StartsWith(_rootDirectory, StringComparison.OrdinalIgnoreCase))
            {
                response.StatusCode = 403;
                byte[] forbiddenBytes = Encoding.UTF8.GetBytes("Forbidden");
                response.ContentType = "text/plain";
                response.OutputStream.Write(forbiddenBytes, 0, forbiddenBytes.Length);
                response.Close();
                return;
            }

            if (Directory.Exists(targetPath))
            {
                targetPath = Path.Combine(targetPath, "index.html");
            }

            if (!File.Exists(targetPath) && string.IsNullOrEmpty(Path.GetExtension(targetPath)))
            {
                string htmlCandidate = targetPath + ".html";
                if (File.Exists(htmlCandidate))
                {
                    targetPath = htmlCandidate;
                }
            }

            if (File.Exists(targetPath))
            {
                string ext = Path.GetExtension(targetPath);
                string contentType = _mimeTypes.ContainsKey(ext) ? _mimeTypes[ext] : "application/octet-stream";

                response.StatusCode = 200;
                response.ContentType = contentType;
                byte[] fileBytes = File.ReadAllBytes(targetPath);
                response.ContentLength64 = fileBytes.Length;
                response.OutputStream.Write(fileBytes, 0, fileBytes.Length);
            }
            else
            {
                response.StatusCode = 404;
                response.ContentType = "text/html; charset=utf-8";
                string notFoundPath = Path.Combine(_rootDirectory, "404.html");
                byte[] notFoundBytes = File.Exists(notFoundPath) 
                    ? File.ReadAllBytes(notFoundPath) 
                    : Encoding.UTF8.GetBytes("<h1>404 Not Found</h1>");
                response.ContentLength64 = notFoundBytes.Length;
                response.OutputStream.Write(notFoundBytes, 0, notFoundBytes.Length);
            }
        }
        catch (Exception ex)
        {
            try
            {
                response.StatusCode = 500;
                byte[] errBytes = Encoding.UTF8.GetBytes("500 Internal Server Error: " + ex.Message);
                response.OutputStream.Write(errBytes, 0, errBytes.Length);
            }
            catch { }
        }
        finally
        {
            try { response.Close(); } catch { }
        }
    }
}
'@

Add-Type -TypeDefinition $csharpCode -Language CSharp

$server = New-Object SimpleWebServer($root, $port)
$server.Start()

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host " Blink Beyond Server running at:" -ForegroundColor Green
Write-Host "   http://localhost:$port/" -ForegroundColor Yellow
Write-Host "=========================================" -ForegroundColor Cyan

try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
} finally {
    $server.Stop()
}
