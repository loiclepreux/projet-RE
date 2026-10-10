<?php

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Session PHP : c'est elle qui retient qui est connecté.
// Un nom à part pour ne pas se mélanger avec le portfolio (même nom de domaine).
session_name('RE_SESSION');
session_set_cookie_params([
    'lifetime' => 0,                       // le cookie disparaît à la fermeture du navigateur
    'path' => '/',
    'httponly' => true,                    // le JavaScript ne peut pas lire le cookie
    'secure' => !empty($_SERVER['HTTPS']), // envoyé uniquement en HTTPS quand le site est en ligne
    'samesite' => 'Lax',
]);
session_start();

require_once __DIR__ . '/vendor/autoload.php';

use monApp\core\app;

app::page();

echo app::getHtml();
