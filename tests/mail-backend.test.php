<?php
declare(strict_types=1);
require __DIR__ . '/../api/mail-lib.php';
function check(bool $condition, string $message): void { if (!$condition) throw new RuntimeException($message); }
function reject(callable $action, string $message): void {
    try { $action(); } catch (InvalidArgumentException $error) { return; }
    throw new RuntimeException($message);
}
$contact = ['name' => ' Test Visitor ', 'email' => 'visitor@example.com', 'mobile' => '9876543210', 'pin' => '122001', 'product' => 'Home Inverter'];
$fields = validateFields('enquiryForm', $contact + ['to_email' => 'attacker@example.com']);
check($fields['name'] === 'Test Visitor', 'Trim names');
check(!isset($fields['to_email']), 'Ignore forged recipient');
foreach (['name' => '   ', 'email' => "visitor@example.com\r\nBcc: attacker@example.com", 'mobile' => '123', 'pin' => '012345', 'product' => 'Forged product'] as $key => $value) {
    $bad = $contact; $bad[$key] = $value;
    reject(fn() => validateFields('enquiryForm', $bad), 'Reject invalid ' . $key);
}
reject(fn() => validateFields('unknown', $contact), 'Reject unknown form');
reject(fn() => validateFields('enquiryForm', $contact + ['message' => str_repeat('x', 2001)]), 'Reject oversized message');
$calculator = ['name' => 'आरव कुमार', 'email' => 'visitor@example.com', 'phone' => '9876543210', 'pincode' => '122001', 'state' => 'Haryana', 'district' => 'Gurugram'];
check(validateFields('calculatorForm', $calculator)['name'] === 'आरव कुमार', 'Unicode names');
$partner = ['name' => 'Partner Visitor', 'email' => 'visitor@example.com', 'phone' => '9876543210', 'pincode' => '122001', 'state' => 'Haryana', 'city' => 'Gurugram', 'company' => 'Example Pvt Ltd', 'existingDistributor' => 'Yes', 'experience' => '0', 'companyType' => 'Company', 'distributorship' => 'LithTec Combo', 'turnover' => '10 Lakh – 30 Lakh', 'dealers' => '5–20 Dealers', 'team' => 'Both', 'warehouse' => 'More than 1,000 sq. ft.'];
check(validateFields('partnerForm', $partner)['experience'] === '0', 'Zero experience allowed');
$bad = $partner; unset($bad['warehouse']); reject(fn() => validateFields('partnerForm', $bad), 'Required partner field');
$selection = ['quantities' => ['ceiling-fan' => 2, 'tv-led' => 1, 'router' => 1], 'hours' => 3, 'wave' => 'Sine Wave', 'battery' => 'Tubular'];
$result = calculatorResult($selection);
check($result['Calculated load'] === '255 W' && $result['VA required'] === '319 VA', 'Load calculation');
check($result['Recommended Home UPS'] === 'SINO 900VA-12V' && $result['Recommended battery'] === '1 × EMSS100048TT', 'Product selection');
check($result['Estimated backup'] === '3 hrs', 'Backup calculation');
$multi = $selection; $multi['quantities'] = ['geyser' => 1]; $multi['hours'] = 12;
check(calculatorResult($multi)['Recommended battery'] === '2 × EMSS4200120TT', 'Largest battery fallback');
foreach ([['quantities' => []], ['hours' => 13], ['quantities' => ['fake' => 1]], ['quantities' => ['ceiling-fan' => -1]]] as $change) {
    reject(fn() => calculatorResult(array_replace($selection, $change)), 'Reject invalid selection');
}
$challenges = [];
$challenge = issueChallenge($challenges, 1000);
check(!isset($challenge['answer']), 'Never expose captcha answer');
$token = $challenge['token']; $answer = (string) $challenges[$token]['answer'];
check(verifyChallenge($challenges, $token, '99', 1001) === 'captcha_incorrect', 'Wrong captcha');
check(verifyChallenge($challenges, $token, $answer, 1002) === 'correct', 'Correct captcha');
unset($challenges[$token]);
check(verifyChallenge($challenges, $token, $answer, 1003) === 'captcha_expired', 'Replay rejected');
$challenge = issueChallenge($challenges, 1000);
check(verifyChallenge($challenges, $challenge['token'], '1', 1600) === 'captcha_expired', 'Expiry');
$challenge = issueChallenge($challenges, 1000);
for ($i = 0; $i < 5; $i++) verifyChallenge($challenges, $challenge['token'], '99', 1001);
check(verifyChallenge($challenges, $challenge['token'], '1', 1002) === 'captcha_expired', 'Attempt limit');
for ($i = 0; $i < 20; $i++) issueChallenge($challenges, 1000);
check(count($challenges) === 10, 'Bounded challenge storage');
$message = buildEnquiryMessage('Home enquiry form', ['name' => 'आरव कुमार', 'email' => 'visitor@example.com', 'message' => "Line one\n.Line two"]);
check(str_contains($message, 'From: Eastman Website <no-reply@eastmanpowersolutions.in>'), 'SMTP sender');
check(str_contains($message, 'To: marketing@eaplworld.com'), 'Fixed recipient');
check(str_contains($message, 'Reply-To: visitor@example.com'), 'Visitor reply address');
check(str_contains($message, 'Content-Transfer-Encoding: quoted-printable'), 'UTF-8 MIME encoding');
$body = explode("\r\n\r\n", $message, 2)[1];
check(str_contains(quoted_printable_decode($body), 'आरव कुमार'), 'Unicode preserved');
reject(fn() => buildEnquiryMessage('Home enquiry form', ['email' => "visitor@example.com\r\nBcc: attacker@example.com"]), 'Header injection blocked');
echo "Backend validation, calculator sizing, captcha expiry/replay/attempt tests passed.\n";
