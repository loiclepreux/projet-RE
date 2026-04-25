<?php

namespace monApp\core;

use monApp\controllers\pages\pageHomeController;
use monApp\controllers\pages\pageQuizController;
use monApp\controllers\pages\page404Controller;
use monApp\controllers\pages\pageScoreController;
use monApp\controllers\pages\pageForumController;
use monApp\controllers\pages\pageContactController;
use monApp\controllers\pages\pageMemoryController;

class dispatcher
{
    public function dispatch($route)
    {
        if (!$route) {
            $this->sendNotFound();
        } else {

            list($controllerName, $method) = explode("@", $route);
            if (!class_exists($controllerName)) {
                $class = str_replace("monApp\\", "", $controllerName);
                $class = str_replace("\\", "/", $class);
                $file = dirname(__DIR__) . "/" . $class . ".php";
                if (file_exists($file)) {
                    require_once $file;
                }
            }
            if (!class_exists($controllerName)) {
                throw new \Exception("Controller introuvable : " . $controllerName);
            }
            $controller = new $controllerName();

            if (!method_exists($controller, $method)) {
                throw new \Exception("Méthode introuvable : " . $method);
            }

            return $controller->$method();
        }
    }
    public function sendNotFound()
    {
        header("HTTP/1.0 404 Not Found");
        $controller = new page404Controller();
        return $controller->index();
    }
}
