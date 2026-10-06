<?php
declare(strict_types=1);
require_once __DIR__ . '/mail-lib.php';
try {
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') { header('Allow: POST'); respond(405, ['message' => 'Method not allowed.']); }
    checkOrigin();
    if (stripos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== 0) respond(415, ['message' => 'JSON submission required.']);
    rateLimit('submission', 10, 900);
    $raw = file_get_contents('php://input', false, null, 0, 16385);
    if (strlen($raw) > 16384) respond(413, ['message' => 'Submission is too large.']);
    try { $input = json_decode($raw, true, 32, JSON_THROW_ON_ERROR); }
    catch (JsonException $error) { respond(400, ['message' => 'Invalid submission.']); }
    if (!is_array($input)) respond(400, ['message' => 'Invalid submission.']);
    startEnquirySession();
    $captcha = $input['captcha'] ?? null;
    $token = is_array($captcha) && is_string($captcha['token'] ?? null) ? $captcha['token'] : '';
    $_SESSION['challenges'] = $_SESSION['challenges'] ?? [];
    $code = verifyChallenge($_SESSION['challenges'], $token, is_array($captcha) ? ($captcha['answer'] ?? null) : null, time());
    if ($code !== 'correct') respond(422, ['code' => $code, 'message' => $code === 'captcha_expired' ? 'Verification expired. Please answer the new question.' : 'That verification answer is incorrect. Please try again.']);
    $form = $input['form'] ?? '';
    if (!is_string($form) || !is_array($input['fields'] ?? null)) throw new InvalidArgumentException('Invalid form submission.');
    $fields = validateFields($form, $input['fields']);
    if ($form === 'calculatorForm') {
        if (!is_array($input['selection'] ?? null)) throw new InvalidArgumentException('Calculator selection is required.');
        $fields += calculatorResult($input['selection']);
    }
    $sources = ['enquiryForm' => 'Home enquiry form', 'calculatorForm' => 'Load calculator enquiry', 'partnerForm' => 'Partner application form'];
    // Consume before sending so retries cannot replay the same challenge.
    unset($_SESSION['challenges'][$token]);
    session_write_close();
    deliverEnquiry($sources[$form], $fields);
    respond(200, ['message' => 'Your enquiry has been accepted for sending.']);
} catch (InvalidArgumentException $error) {
    respond(422, ['message' => $error->getMessage()]);
} catch (Throwable $error) {
    // Never expose SMTP responses, credentials or enquiry contents to visitors/logs.
    error_log('EAPL mail: ' . get_class($error));
    respond(503, ['code' => 'mail_unavailable', 'message' => 'We could not send your enquiry. Please try again shortly.']);
}
