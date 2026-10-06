<?php
// Local preview only. Plesk runs the production endpoints directly.
declare(strict_types=1);
$root = realpath(__DIR__ . '/..');
$path = rawurldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/');
if (strpos($path, "\0") !== false || preg_match('#(?:^|/)\.#', $path)) { http_response_code(403); exit('Forbidden'); }
$file = realpath($root . $path);
if ($file !== false && $file !== $root && strpos($file, $root . DIRECTORY_SEPARATOR) !== 0) { http_response_code(403); exit('Forbidden'); }
if ($file !== false && is_dir($file)) $file = realpath($file . '/index.html');
if ($file !== false && is_file($file)) {
    $relative = substr($file, strlen($root));
    if (in_array($relative, ['/api/captcha.php', '/api/enquiry.php'], true)) { require $file; return true; }
    // Never expose private config, backend helpers, or source files through preview.
    if (!in_array(strtolower(pathinfo($file, PATHINFO_EXTENSION)), ['html','css','js','svg','webp','png','jpg','jpeg','ico','woff','woff2','ttf','otf','pdf'], true)) { http_response_code(403); exit('Forbidden'); }
    // Directory routes need an explicit index body; regular static files use PHP's MIME handling.
    if (is_dir($root . $path)) { header('Content-Type: text/html; charset=utf-8'); readfile($file); return true; }
    return false;
}
http_response_code(404);
header('Content-Type: text/html; charset=utf-8');
readfile($root . '/404.html');
