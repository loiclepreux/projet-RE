<?php

namespace monApp\core;

use monApp\core\rooter;
use monApp\core\dispatcher;

class app
{

    public static $rw = false;
    private static $html;

    public static $db;

    public static $rooter;
    public static $dispatcher;

    public static function db()
    {
        $env = parse_ini_file(__DIR__ . '/../.env');

        if (!$env) {
            die("Erreur : fichier .env non lisible");
        }

        try {
            self::$db = new database(
                $env['DB_HOST'],
                $env['DB_NAME'],
                $env['DB_USER'],
                $env['DB_PASS']
            );
        } catch (\Exception $e) {
            // Le détail de l'erreur (qui peut contenir des infos sur la base) reste dans les logs
            error_log("Connexion BDD impossible : " . $e->getMessage());
        }
    }

    public static function section($section)
    {
        require "controllers/sections/" . $section . ".php";
    }

    public static function page()
    {
        // Initialiser la connexion à la base de données
        self::db();

        self::$rooter = new rooter();
        self::$rooter->addRoute("", "monApp\\controllers\\pages\\pageHomeController@index");
        self::$rooter->addRoute("quiz", "monApp\controllers\pages\pageQuizController@index");
        self::$rooter->addRoute("memory", "monApp\controllers\pages\pageMemoryController@index");
        self::$rooter->addRoute("score", "monApp\controllers\pages\pageScoreController@index");
        self::$rooter->addRoute("forum", "monApp\controllers\pages\pageForumController@index");
        self::$rooter->addRoute("contact", "monApp\controllers\pages\pageContactController@index");
        self::$rooter->addRoute("api/quiz", "monApp\controllers\api\quizController@getQuestions");
        self::$rooter->addRoute("404", "monApp\controllers\pages\page404Controller@index");
        self::$rooter->addRoute("api/score", "monApp\controllers\api\scoreController@saveScore");
        self::$rooter->addRoute("api/scores", "monApp\controllers\api\scoreController@getScores");
        self::$rooter->addRoute("api/quiz/answer", "monApp\controllers\api\quizController@answer");

        // Comptes
        self::$rooter->addRoute("api/register", "monApp\controllers\api\authController@register");
        self::$rooter->addRoute("api/login", "monApp\controllers\api\authController@login");
        self::$rooter->addRoute("api/logout", "monApp\controllers\api\authController@logout");
        self::$rooter->addRoute("api/me", "monApp\controllers\api\authController@me");

        // Forum (guillemets simples : dans des guillemets doubles, \f serait un caractère spécial)
        self::$rooter->addRoute('api/forum', 'monApp\controllers\api\forumController@listTopics');
        self::$rooter->addRoute('api/forum/topic', 'monApp\controllers\api\forumController@getTopic');
        self::$rooter->addRoute('api/forum/create', 'monApp\controllers\api\forumController@createTopic');
        self::$rooter->addRoute('api/forum/reply', 'monApp\controllers\api\forumController@reply');

        // Contact
        self::$rooter->addRoute('api/contact', 'monApp\controllers\api\contactController@send');

        tools::gets();
        $p = tools::get("p") ?? "";

        // sécurisation
        $p = trim($p);
        $p = strtolower($p);

        // autoriser uniquement lettres, chiffres, / et -
        if (!preg_match('/^[a-z0-9\/\-]*$/', $p)) {
            $p = "404";
        }

        $route = self::$rooter->getRoute($p);
        self::$dispatcher = new dispatcher();
        ob_start();

        try {
            self::$html = self::$dispatcher->dispatch($route);
        } catch (\Throwable $e) {

            // log erreur
            error_log($e->getMessage());

            // affichage différent selon environnement
            if (DEV) { // le détail de l'erreur seulement sur ton PC
                self::$html = "<h1>Erreur</h1><pre>" . $e->getMessage() . "</pre>";
            } else {
                self::$html = "<h1>Une erreur est survenue</h1>";
            }
        }

        ob_end_clean();
    }

    public static function getHtml()
    {
        return self::$html;
    }

    public static function redirection($url)
    {
        header("Location: " . $url);
        exit();
    }
}
