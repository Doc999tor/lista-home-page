<?php
require 'vendor/autoload.php';

$config['displayErrorDetails'] = true;
$config['determineRouteBeforeAppMiddleware'] = true;

// Create app
$app = new \Slim\App(["settings" => $config]);

$app->add(new \Lib\Middlewares\HeadersMiddleware())
    ->add(new \Lib\Middlewares\ErrorMiddleware())
    ->add(new \Tuupola\Middleware\CorsMiddleware([
        "origin" => ["*"],
        "methods" => ["GET", "POST", "OPTIONS"],
        "headers.allow" => ['X-Requested-With', 'Authorization'],
        "headers.expose" => ['Authorization'],
        "credentials" => true,
        "cache" => 86400,
    ]));

// Get container
$container = $app->getContainer();

// Register Twig view on container
$container['view'] = function ($c) {
    $view = new \Slim\Views\Twig('views', [
        'cache' => false
    ]);
    $view->addExtension(new \Slim\Views\TwigExtension(
        $c['router'],
        $c['request']->getUri()
    ));

    return $view;
};

// Register logger on container
$container['logger'] = function ($c) {
    $logger = new \Monolog\Logger('lista-api');
    $logger->pushHandler(new \Monolog\Handler\StreamHandler(__DIR__ . '/logs/submissions.log', \Monolog\Logger::INFO));
    return $logger;
};

// Register config on container
$container['config'] = function ($c) {
    $configFile = file_exists(__DIR__ . '/config.local.php')
        ? __DIR__ . '/config.local.php'
        : __DIR__ . '/config.php';
    return require $configFile;
};

require 'controllers.php';
require 'routes.php';
$app->run();
