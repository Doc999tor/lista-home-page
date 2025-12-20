<?php

namespace Lib\Middlewares;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class HeadersMiddleware
{
    /**
     * Middleware to set response headers
     */
    public function __invoke(Request $request, Response $response, callable $next): Response
    {
        $response = $next($request, $response);

        return $response
            ->withHeader('Content-Type', 'application/json; charset=utf-8')
            ->withHeader('X-Content-Type-Options', 'nosniff')
            ->withHeader('X-Frame-Options', 'DENY')
            ->withHeader('X-XSS-Protection', '1; mode=block');
    }
}
