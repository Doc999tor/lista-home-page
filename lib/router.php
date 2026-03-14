<?php
/**
 * Router script for PHP's built-in development server
 *
 * Usage: php -S localhost:8080 router.php
 */

// Get the requested URI
$uri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));

// If the request is for a real file (not directory), serve it directly
if ($uri !== '/' && is_file(__DIR__ . $uri)) {
    // Check if it's a PHP file that should be executed
    if (pathinfo($uri, PATHINFO_EXTENSION) === 'php') {
        require __DIR__ . $uri;
        return true;
    }
    // Let the server handle static files
    return false;
}

// Route all other requests through index.php (Slim app)
require __DIR__ . '/index.php';
