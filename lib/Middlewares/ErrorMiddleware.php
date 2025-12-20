<?php

namespace Lib\Middlewares;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class ErrorMiddleware
{
    /**
     * Middleware to handle errors
     */
    public function __invoke(Request $request, Response $response, callable $next): Response
    {
        try {
            return $next($request, $response);
        } catch (\Exception $e) {
            $errorResponse = [
                'success' => false,
                'message' => 'An error occurred',
                'error' => $e->getMessage()
            ];

            // Log the error
            error_log("Error: " . $e->getMessage() . " in " . $e->getFile() . ":" . $e->getLine());

            return $response
                ->withStatus(500)
                ->withHeader('Content-Type', 'application/json')
                ->write(json_encode($errorResponse, JSON_UNESCAPED_UNICODE));
        }
    }
}
