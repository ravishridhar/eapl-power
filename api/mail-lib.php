<?php
declare(strict_types=1);

function respond(int $status, array $body): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    exit;
}

function startEnquirySession(): void {
    ini_set('display_errors', '0');
    ini_set('session.use_strict_mode', '1');
    session_name('eapl_forms');
    session_set_cookie_params(['lifetime' => 0, 'path' => '/', 'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off', 'httponly' => true, 'samesite' => 'Strict']);
    if (!session_start()) throw new RuntimeException('Session storage unavailable');
}

function rateLimit(string $bucket, int $limit, int $seconds): void {
    // Use the web server's client IP, never a visitor-controlled forwarding header.
    $key = hash('sha256', __DIR__ . $bucket . ($_SERVER['REMOTE_ADDR'] ?? 'unknown'));
    $directory = sys_get_temp_dir() . '/eapl-mail-' . substr(hash('sha256', __DIR__), 0, 12);
    if (!is_dir($directory) && !mkdir($directory, 0700, true) && !is_dir($directory)) throw new RuntimeException('Rate limit storage unavailable');
    $file = fopen($directory . '/' . $key, 'c+');
    if (!$file || !flock($file, LOCK_EX)) throw new RuntimeException('Rate limit lock unavailable');
    $entries = json_decode(stream_get_contents($file), true) ?: [];
    $entries = array_values(array_filter($entries, fn($time) => is_int($time) && $time > time() - $seconds));
    if (count($entries) >= $limit) {
        flock($file, LOCK_UN); fclose($file);
        header('Retry-After: ' . $seconds);
        respond(429, ['message' => 'Too many attempts. Please wait and try again.']);
    }
    $entries[] = time();
    rewind($file); ftruncate($file, 0); fwrite($file, json_encode($entries)); fflush($file);
    flock($file, LOCK_UN); fclose($file);
}

function checkOrigin(): void {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if ($origin !== '' && (!in_array(parse_url($origin, PHP_URL_HOST), ['eastmanpowersolutions.in', 'www.eastmanpowersolutions.in', 'localhost', '127.0.0.1'], true) || !in_array(parse_url($origin, PHP_URL_SCHEME), ['https', 'http'], true))) {
        respond(403, ['message' => 'This submission is not allowed.']);
    }
}

function issueChallenge(array &$challenges, int $now): array {
    $challenges = array_filter($challenges, fn($item) => $item['expires'] > $now);
    while (count($challenges) >= 10) array_shift($challenges);
    $left = random_int(1, 9); $right = random_int(1, 9);
    $token = bin2hex(random_bytes(32));
    $challenges[$token] = ['answer' => $left + $right, 'expires' => $now + 600, 'attempts' => 0];
    return ['token' => $token, 'question' => "$left + $right = ?"];
}

function verifyChallenge(array &$challenges, string $token, $answer, int $now): string {
    $challenge = $challenges[$token] ?? null;
    if (!$challenge || $challenge['expires'] <= $now || $challenge['attempts'] >= 5) {
        unset($challenges[$token]);
        return 'captcha_expired';
    }
    $challenges[$token]['attempts']++;
    if (!is_string($answer) || !preg_match('/^[0-9]{1,2}$/D', $answer) || (int) $answer !== $challenge['answer']) return 'captcha_incorrect';
    return 'correct';
}

function validateFields(string $form, array $input): array {
    $common = ['name', 'email'];
    $schemas = [
        'enquiryForm' => array_merge($common, ['mobile', 'pin', 'product']),
        'calculatorForm' => array_merge($common, ['phone', 'pincode', 'state', 'district']),
        'partnerForm' => array_merge($common, ['phone', 'pincode', 'state', 'city', 'existingDistributor', 'experience', 'company', 'companyType', 'distributorship', 'turnover', 'dealers', 'team', 'warehouse']),
    ];
    if (!isset($schemas[$form])) throw new InvalidArgumentException('Unknown form.');
    $fields = [];
    foreach (array_merge($schemas[$form], $form === 'partnerForm' ? [] : ['message']) as $key) {
        $value = $input[$key] ?? '';
        if (!is_string($value)) throw new InvalidArgumentException('Invalid field value.');
        $value = trim($value);
        $max = $key === 'message' ? 2000 : ($key === 'email' ? 254 : 150);
        if (preg_match('//u', $value) !== 1 || preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', $value) || preg_match_all('/./us', $value) > $max) throw new InvalidArgumentException('Invalid or oversized field: ' . $key);
        if (in_array($key, $schemas[$form], true) && $value === '') throw new InvalidArgumentException('Please complete all required fields.');
        $fields[$key] = $value;
    }
    if (!filter_var($fields['email'], FILTER_VALIDATE_EMAIL)) throw new InvalidArgumentException('Enter a valid email address.');
    if (!preg_match('/\p{L}/u', $fields['name'])) throw new InvalidArgumentException('Enter a valid name.');
    if (!preg_match('/^[0-9]{10}$/D', $fields['phone'] ?? $fields['mobile'])) throw new InvalidArgumentException('Enter a 10-digit mobile number.');
    if (!preg_match('/^[1-9][0-9]{5}$/D', $fields['pincode'] ?? $fields['pin'])) throw new InvalidArgumentException('Enter a valid 6-digit PIN code.');
    foreach (['district', 'city'] as $key) if (isset($fields[$key]) && !preg_match('/\p{L}/u', $fields[$key])) throw new InvalidArgumentException('Enter a valid ' . $key . '.');
    $products = ['Home Inverters', 'Inverter Batteries', 'Lithium Batteries', 'LithTec Combo'];
    $choices = [
        'product' => ['Home Inverter', 'Inverter Battery', 'Lithium Battery', 'LithTec Combo'],
        'existingDistributor' => ['Yes', 'No'], 'experience' => ['0', '1', '2', '3', '4+'],
        'companyType' => ['Proprietary', 'Partnership/LLP', 'Company'], 'distributorship' => $products,
        'turnover' => ['10 Lakh – 30 Lakh', '30 Lakh – 50 Lakh', '50 Lakh – 1 Crore', '1 Crore – 3 Crore', 'Above 3 Crore'],
        'dealers' => ['5–20 Dealers', '20–50 Dealers', 'Above 50 Dealers'], 'team' => ['Sales Team', 'Service Team', 'Both'],
        'warehouse' => ['More than 1,000 sq. ft.', 'More than 1,500 sq. ft. with service centre'],
        'state' => $form === 'calculatorForm' ? ['Haryana', 'Delhi', 'Uttar Pradesh'] : ['Andhra Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Odisha', 'Punjab', 'Rajasthan', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Other'],
    ];
    foreach ($choices as $key => $values) if (isset($fields[$key]) && !in_array($fields[$key], $values, true)) throw new InvalidArgumentException('Choose a valid ' . $key . '.');
    return $fields;
}

function calculatorResult(array $selection): array {
    $data = json_decode(file_get_contents(__DIR__ . '/calculator-data.json'), true, 512, JSON_THROW_ON_ERROR);
    $quantities = $selection['quantities'] ?? null;
    $hours = $selection['hours'] ?? null;
    $wave = $selection['wave'] ?? null;
    $chemistry = $selection['battery'] ?? null;
    if (!is_array($quantities) || count($quantities) > 29 || !is_int($hours) || $hours < 1 || $hours > 12 || !in_array($wave, ['Sine Wave', 'Square Wave'], true) || !in_array($chemistry, ['Tubular', 'Lithium'], true)) throw new InvalidArgumentException('Invalid calculator preferences.');
    $known = array_column($data['appliances'], null, 'id');
    foreach ($quantities as $id => $qty) if (!isset($known[$id]) || !is_int($qty) || $qty < 0 || $qty > 999) throw new InvalidArgumentException('Invalid appliance quantity.');
    $watts = 0; $items = [];
    foreach ($data['appliances'] as $item) {
        $qty = $quantities[$item['id']] ?? 0;
        if ($qty) { $watts += $qty * $item['watts']; $items[] = $item['name'] . ' × ' . $qty . ' (' . $qty * $item['watts'] . ' W)'; }
    }
    if (!$watts) throw new InvalidArgumentException('Add at least one appliance before sending your result.');
    $va = (int) round($watts / 0.8);
    $inverters = array_values(array_filter($data['inverters'], fn($item) => $item['wave'] === $wave && (($item['lithium'] ?? false) === ($chemistry === 'Lithium'))));
    usort($inverters, fn($a, $b) => $a['va'] <=> $b['va']);
    $inverter = null;
    foreach ($inverters as $item) if ($item['va'] >= $va) { $inverter = $item; break; }
    $result = ['Selected appliances' => implode(', ', $items), 'Calculated load' => $watts . ' W', 'VA required' => $va . ' VA', 'Backup target' => $hours . ' hrs', 'Waveform' => $wave, 'Battery preference' => $chemistry];
    if (!$inverter) return $result + ['Recommendation' => 'Load exceeds the selected Home UPS range.'];
    $voltage = $inverter['systemVoltage'];
    $ah = (int) ceil($watts * $hours / ($voltage * 0.8 * 0.8));
    $unit = fn($item) => $item['chemistry'] === 'Lithium' ? (int) round($item['unitVoltage'] / 12) * 12 : (int) round($item['unitVoltage']);
    $batteries = array_values(array_filter($data['batteries'], fn($item) => $item['chemistry'] === $chemistry && $unit($item) > 0 && $voltage % $unit($item) === 0));
    usort($batteries, fn($a, $b) => ($a['ah'] <=> $b['ah']) ?: ($b['warrantyMonths'] <=> $a['warrantyMonths']));
    $battery = null;
    foreach ($batteries as $item) if ($item['ah'] >= $ah) { $battery = $item; break; }
    $battery = $battery ?? (count($batteries) ? $batteries[count($batteries) - 1] : null);
    $result += ['Recommended Home UPS' => $inverter['name'], 'Required capacity' => $ah . ' Ah at ' . $voltage . ' V'];
    if ($battery) $result += ['Recommended battery' => (int) round($voltage / $unit($battery)) . ' × ' . $battery['name'], 'Battery capacity' => $battery['ah'] . ' Ah', 'Estimated backup' => round($battery['ah'] * $voltage * 0.8 * 0.8 / $watts, 1) . ' hrs'];
    return $result;
}

function mailConfig(): array {
    // Site lives in DOMAIN/httpdocs/web; config lives in DOMAIN/private.
    $path = getenv('EAPL_MAIL_CONFIG') ?: dirname(__DIR__, 3) . '/private/eapl-mail-config.php';
    if (!is_file($path)) throw new RuntimeException('Mail configuration missing');
    $config = require $path;
    if (!is_array($config) || !is_string($config['smtpPassword'] ?? null) || $config['smtpPassword'] === '' || $config['smtpPassword'] === 'YOUR_MAILBOX_PASSWORD') throw new RuntimeException('SMTP password not configured');
    return $config;
}

function buildEnquiryMessage(string $source, array $fields): string {
    $replyTo = $fields['email'] ?? '';
    if (!is_string($replyTo) || !filter_var($replyTo, FILTER_VALIDATE_EMAIL) || preg_match('/[\r\n]/', $replyTo)) throw new InvalidArgumentException('Invalid reply address.');
    $lines = [];
    foreach ($fields as $key => $value) $lines[] = ucfirst(preg_replace('/([A-Z])/', ' $1', $key)) . ': ' . ($value === '' ? '—' : $value);
    $body = preg_replace('/\r\n|\r|\n/', "\r\n", implode("\n", $lines));
    // Each encoded word stays below the RFC 2047 limit; fold long subjects.
    $subject = implode("\r\n ", array_map(fn($chunk) => '=?UTF-8?B?' . base64_encode($chunk) . '?=', str_split('EAPL website enquiry - ' . $source, 42)));
    $headers = [
        'Date: ' . gmdate('D, d M Y H:i:s O'),
        'From: Eastman Website <no-reply@eastmanpowersolutions.in>',
        'To: marketing@eaplworld.com',
        'Reply-To: ' . $replyTo,
        'Subject: ' . $subject,
        'Message-ID: <' . bin2hex(random_bytes(16)) . '@eastmanpowersolutions.in>',
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: quoted-printable',
    ];
    return implode("\r\n", $headers) . "\r\n\r\n" . quoted_printable_encode($body) . "\r\n";
}

function deliverEnquiry(string $source, array $fields): void {
    $config = mailConfig();
    if (!function_exists('curl_init') || !in_array('smtps', curl_version()['protocols'], true)) throw new RuntimeException('PHP cURL SMTPS support is required');
    $message = buildEnquiryMessage($source, $fields);
    $stream = fopen('php://temp', 'w+');
    if (!$stream) throw new RuntimeException('Mail buffer unavailable');
    fwrite($stream, $message); rewind($stream);
    $curl = curl_init('smtps://eastmanpowersolutions.in:465');
    try {
        curl_setopt_array($curl, [
            CURLOPT_USERNAME => 'no-reply@eastmanpowersolutions.in',
            CURLOPT_PASSWORD => $config['smtpPassword'],
            CURLOPT_MAIL_FROM => 'no-reply@eastmanpowersolutions.in',
            CURLOPT_MAIL_RCPT => ['marketing@eaplworld.com'],
            CURLOPT_UPLOAD => true,
            CURLOPT_INFILE => $stream,
            CURLOPT_INFILESIZE => strlen($message),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2,
        ]);
        $response = curl_exec($curl);
        $status = curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
        if ($response === false || $status < 200 || $status >= 300) throw new RuntimeException('SMTP delivery failed');
    } finally {
        curl_close($curl);
        fclose($stream);
    }
}
