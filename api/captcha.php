<?php
declare(strict_types=1);
require_once __DIR__ . '/mail-lib.php';
try {
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') { header('Allow: GET'); respond(405, ['message' => 'Method not allowed.']); }
    checkOrigin();
    rateLimit('captcha', 60, 600);
    startEnquirySession();
    $_SESSION['challenges'] = $_SESSION['challenges'] ?? [];
    $challenge = issueChallenge($_SESSION['challenges'], time());
    session_write_close();
    respond(200, $challenge);
} catch (Throwable $error) {
    error_log('EAPL captcha: ' . get_class($error));
    respond(503, ['message' => 'Verification is temporarily unavailable. Please try again.']);
}
