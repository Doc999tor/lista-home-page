<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

/**
 * Form Controller - Handles contact form submissions
 */
$container['FormController'] = function ($c) {
    return new class($c) {
        private $container;
        private $logger;
        private $config;

        public function __construct($container) {
            $this->container = $container;
            $this->logger = $container->get('logger');
            $this->config = $container->get('config');
        }

        /**
         * Handle form submission
         */
        public function submit(Request $request, Response $response, array $args): Response {
            $data = $request->getParsedBody();

            // Extract form fields (support both nested and flat structure)
            $fullname = trim($data['form_fields']['fullname'] ?? $data['fullname'] ?? '');
            $phone = trim($data['form_fields']['phone_num'] ?? $data['phone_num'] ?? '');

            // Validate phone
            if (empty($phone)) {
                return $response->withStatus(400)->withJson([
                    'success' => false,
                    'message' => 'Phone number is required'
                ]);
            }

            // Normalize phone by stripping non-digits, then validate (Israeli phone: 9-10 digits)
            $phone = preg_replace('/\D+/', '', $phone);
            if (!preg_match('/^[0-9]{9,10}$/', $phone)) {
                return $response->withStatus(400)->withJson([
                    'success' => false,
                    'message' => 'Invalid phone number format'
                ]);
            }

            // 1. Log the request
            $this->logSubmission($fullname, $phone, $data);

            // 2. Send Telegram notification
            $telegramResult = $this->sendTelegramMessage($fullname, $phone);

            // 3. Forward to Lista CRM
            // $crmResult = $this->forwardToListaCRM($fullname, $phone);
            $crmResult = ['success' => true, 'response' => 'success'];

            // Prepare response - message must be inside data for Elementor form JS
            $responseData = [
                'success' => $crmResult['success'],
                'data' => [
                    'message' => $crmResult['success'] ? 'נשלח בהצלחה' : 'אירעה שגיאה בשליחת הטופס. נסה שנית.',
                    'telegram' => $telegramResult['success'] ? 'sent' : 'not configured or failed',
                    'crm_forwarded' => $crmResult['success']
                ]
            ];

            // Include CRM response if available
            if (isset($crmResult['response'])) {
                $responseData['crm_response'] = $crmResult['response'];
            }

            $statusCode = $crmResult['success'] ? 200 : 500;
            return $response->withStatus($statusCode)->withJson($responseData);
        }

        /**
         * Log the submission
         */
        private function logSubmission(string $fullname, string $phone, array $rawData): void {
            if (!($this->config['logging']['enabled'] ?? true)) {
                return;
            }

            $logEntry = [
                'timestamp' => date('Y-m-d H:i:s'),
                'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
                'fullname' => $fullname,
                'phone' => $phone,
                'raw_post' => $rawData
            ];

            $this->logger->info('Form submission', $logEntry);
        }

        /**
         * Send Telegram notification
         */
        private function sendTelegramMessage(string $fullname, string $phone): array {
            $botToken = $this->config['telegram']['bot_token'] ?? '';
            $chatId = $this->config['telegram']['chat_id'] ?? '';

            if (empty($botToken) || empty($chatId)) {
                return ['success' => false, 'message' => 'Telegram credentials not configured'];
            }

            $message = "📋 *New Contact Form Submission*\n\n";
            $message .= "👤 *Name:* " . $this->escapeMarkdown($fullname) . "\n";
            $message .= "📞 *Phone:* " . $this->escapeMarkdown($phone) . "\n";
            $message .= "🕐 *Time:* " . date('Y-m-d H:i:s') . "\n";

            $url = "https://api.telegram.org/bot{$botToken}/sendMessage";

            $postData = [
                'chat_id' => $chatId,
                'text' => $message,
                'parse_mode' => 'Markdown'
            ];

            $ch = curl_init();
            curl_setopt_array($ch, [
                CURLOPT_URL => $url,
                CURLOPT_POST => true,
                CURLOPT_POSTFIELDS => http_build_query($postData),
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 10,
                CURLOPT_SSL_VERIFYPEER => false,
                CURLOPT_SSL_VERIFYHOST => false
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
        private function escapeMarkdown(string $text): string {
            return str_replace(
                ['_', '*', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!'],
                ['\_', '\*', '\[', '\]', '\(', '\)', '\~', '\`', '\>', '\#', '\+', '\-', '\=', '\|', '\{', '\}', '\.', '\!'],
                $text
            );
        }

        /**
         * Forward request to Lista CRM
         */
        private function forwardToListaCRM(string $fullname, string $phone): array {
            $endpoint = $this->config['lista_crm']['endpoint'] ?? 'https://lista-crm.com/wp-admin/admin-ajax.php';
            $postId = $this->config['lista_crm']['post_id'] ?? '1618';
            $formId = $this->config['lista_crm']['form_id'] ?? '5c0b923';
            $refererTitle = $this->config['lista_crm']['referer_title'] ?? 'הצטרפות והשארת פרטים';

            $boundary = '----geckoformboundary' . bin2hex(random_bytes(16));

            $fields = [
                'post_id' => $postId,
                'form_id' => $formId,
                'referer_title' => $refererTitle,
                'queried_id' => $postId,
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
                CURLOPT_URL => $endpoint,
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
                $this->logger->error('CRM forwarding error', ['error' => $error, 'http_code' => $httpCode]);
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
    };
};
