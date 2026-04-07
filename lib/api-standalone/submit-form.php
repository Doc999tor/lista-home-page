<?php
/**
 * Form Submission Handler
 * - Logs incoming requests
 * - Sends Telegram notifications
 * - Forwards to Lista CRM backend
 */

// Enable CORS for local development
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');
header('Content-Type: application/json; charset=utf-8');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

// Load configuration
$configFile = file_exists(__DIR__ . '/config.local.php')
    ? __DIR__ . '/config.local.php'
    : __DIR__ . '/config.php';
$config = require $configFile;

// Configuration from config file
define('TELEGRAM_BOT_TOKEN', $config['telegram']['bot_token'] ?? '');
define('TELEGRAM_CHAT_ID', $config['telegram']['chat_id'] ?? '');
define('LOG_FILE', $config['logging']['file'] ?? __DIR__ . '/submissions.log');
define('LOG_ENABLED', $config['logging']['enabled'] ?? true);
define('LISTA_CRM_ENDPOINT', $config['lista_crm']['endpoint'] ?? 'https://lista-crm.com/wp-admin/admin-ajax.php');
define('LISTA_POST_ID', $config['lista_crm']['post_id'] ?? '1618');
define('LISTA_FORM_ID', $config['lista_crm']['form_id'] ?? '5c0b923');
define('LISTA_REFERER_TITLE', $config['lista_crm']['referer_title'] ?? 'הצטרפות והשארת פרטים');

/**
 * Log the incoming request
 */
function logRequest($data) {
    if (!LOG_ENABLED) {
        return true;
    }

    $timestamp = date('Y-m-d H:i:s');
    $logEntry = [
        'timestamp' => $timestamp,
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
        'data' => $data
    ];

    $logLine = json_encode($logEntry, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . "\n" . str_repeat('-', 80) . "\n";
    file_put_contents(LOG_FILE, $logLine, FILE_APPEND | LOCK_EX);

    return true;
}

/**
 * Send Telegram notification
 */
function sendTelegramMessage($fullname, $phone) {
    if (empty(TELEGRAM_BOT_TOKEN) || empty(TELEGRAM_CHAT_ID)) {
        return ['success' => false, 'message' => 'Telegram credentials not configured'];
    }

    $message = "📋 *New Contact Form Submission*\n\n";
    $message .= "👤 *Name:* " . escapeMarkdown($fullname) . "\n";
    $message .= "📞 *Phone:* " . escapeMarkdown($phone) . "\n";
    $message .= "🕐 *Time:* " . date('Y-m-d H:i:s') . "\n";

    $url = "https://api.telegram.org/bot" . TELEGRAM_BOT_TOKEN . "/sendMessage";

    $postData = [
        'chat_id' => TELEGRAM_CHAT_ID,
        'text' => $message,
        'parse_mode' => 'Markdown'
    ];

    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => http_build_query($postData),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return [
        'success' => $httpCode === 200,
        'response' => json_decode($response, true)
    ];
}

/**
 * Escape special characters for Telegram Markdown
 */
function escapeMarkdown($text) {
    return str_replace(['_', '*', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!'],
                       ['\_', '\*', '\[', '\]', '\(', '\)', '\~', '\`', '\>', '\#', '\+', '\-', '\=', '\|', '\{', '\}', '\.', '\!'],
                       $text);
}

/**
 * Forward request to Lista CRM
 */
function forwardToListaCRM($fullname, $phone) {
    $boundary = '----geckoformboundary' . bin2hex(random_bytes(16));

    $fields = [
        'post_id' => LISTA_POST_ID,
        'form_id' => LISTA_FORM_ID,
        'referer_title' => LISTA_REFERER_TITLE,
        'queried_id' => LISTA_POST_ID,
        'form_fields[fullname]' => $fullname,
        'form_fields[phone_num]' => $phone,
        'action' => 'elementor_pro_forms_send_form',
        'referrer' => 'https://lista-crm.com/%d7%94%d7%a6%d7%98%d7%a8%d7%a4%d7%95%d7%aa-%d7%95%d7%94%d7%a9%d7%90%d7%a8%d7%aa-%d7%a4%d7%a8%d7%98%d7%99%d7%9d/'
    ];

    // Build multipart form data
    $body = '';
    foreach ($fields as $name => $value) {
        $body .= "--{$boundary}\r\n";
        $body .= "Content-Disposition: form-data; name=\"{$name}\"\r\n\r\n";
        $body .= "{$value}\r\n";
    }
    $body .= "--{$boundary}--\r\n";

    $headers = [
        'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:145.0) Gecko/20100101 Firefox/145.0',
        'X-Requested-With: XMLHttpRequest',
        'Content-Type: multipart/form-data; boundary=' . $boundary,
        'Origin: https://lista-crm.com',
        'Referer: https://lista-crm.com/%d7%94%d7%a6%d7%98%d7%a8%d7%a4%d7%95%d7%aa-%d7%95%d7%94%d7%a9%d7%90%d7%a8%d7%aa-%d7%a4%d7%a8%d7%98%d7%99%d7%9d/'
    ];

    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => LISTA_CRM_ENDPOINT,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $body,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_SSL_VERIFYPEER => true
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    if ($error) {
        return [
            'success' => false,
            'error' => $error,
            'http_code' => $httpCode
        ];
    }

    return [
        'success' => $httpCode === 200,
        'http_code' => $httpCode,
        'response' => json_decode($response, true) ?? $response
    ];
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

// Get form data
$fullname = trim($_POST['form_fields']['fullname'] ?? $_POST['fullname'] ?? '');
$phone = trim($_POST['form_fields']['phone_num'] ?? $_POST['phone_num'] ?? '');

// Validate input
if (empty($phone)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Phone number is required']);
    exit();
}

// Validate phone format (Israeli phone: 9-10 digits)
if (!preg_match('/^[0-9]{9,10}$/', $phone)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid phone number format']);
    exit();
}

// Prepare data for logging
$submissionData = [
    'fullname' => $fullname,
    'phone' => $phone,
    'raw_post' => $_POST
];

// 1. Log the request
logRequest($submissionData);

// 2. Send Telegram notification
$telegramResult = sendTelegramMessage($fullname, $phone);

// 3. Forward to Lista CRM
$crmResult = forwardToListaCRM($fullname, $phone);

// Prepare response
$response = [
    'success' => $crmResult['success'],
    'message' => $crmResult['success'] ? 'Form submitted successfully' : 'Failed to submit form',
    'data' => [
        'telegram' => $telegramResult['success'] ? 'sent' : 'not configured or failed',
        'crm_forwarded' => $crmResult['success']
    ]
];

// Return the CRM response if available
if (isset($crmResult['response'])) {
    $response['crm_response'] = $crmResult['response'];
}

http_response_code($crmResult['success'] ? 200 : 500);
echo json_encode($response, JSON_UNESCAPED_UNICODE);
