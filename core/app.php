<?php 

namespace monApp\core;

use monApp\core\rooter;
use monApp\core\dispatcher;

class app{

    public static $rw=false;
    private static $html;

    public static $db;

    public static $rooter;
    public static $dispatcher;

    public static function db(){
        try {
            self::$db = new database(
                "mysql-loic.alwaysdata.net", //IP
                "loic_residentevil",       // Nom base de donnée
                "loic",      // User
                "Loic1983.",      // Mot de passe
            );
        } catch (\Exception $e) {
            echo "<!-- " . $e->getMessage() . " -->";
        }
    }

    public static function section($section){
        require "controllers/sections/".$section.".php";
    }

    public static function page(){
        // Initialiser la connexion à la base de données
        self::db();

        self::$rooter = new rooter();
        self::$rooter->addRoute("","monApp\controllers\pages\pageHomeController@index");
        self::$rooter->addRoute("quiz","monApp\controllers\pages\pageQuizController@index");
        self::$rooter->addRoute("memory","monApp\controllers\pages\pageMemoryController@index");
        self::$rooter->addRoute("score","monApp\controllers\pages\pageScoreController@index");
        self::$rooter->addRoute("forum","monApp\controllers\pages\pageForumController@index");
        self::$rooter->addRoute("contact","monApp\controllers\pages\pageContactController@index");
        self::$rooter->addRoute("api/quiz","monApp\\controllers\\api\\quizController@getQuestions");

        $p = tools::get("p");

        $route = self::$rooter->getRoute($p);
        self::$dispatcher = new dispatcher();
        ob_start();
            self::$dispatcher->dispatch($route);
            self::$html = ob_get_contents();
        ob_end_clean();
    }

    public static function getHtml(){
        return self::$html;
    }

    public static function redirection($url) {
        header("Location: " . $url);
        exit();
    }
}

?>