<?php

// API Routes
$app->group('/api', function () use ($app) {
    // Form submission endpoint
    $app->post('/submit', 'FormController:submit');

    // Health check
    $app->get('/health', function ($request, $response, $args) {
        return $response->withJson([
            'status' => 'ok',
            'timestamp' => date('Y-m-d H:i:s')
        ]);
    });
});
