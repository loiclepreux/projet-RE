<?php

namespace monApp\core;
class rooter{

    private $routes = [];

    public function addRoute($page,$action){
        $this->routes[$page] = $action;
    }

    public function getRoute($page){
        return $this->routes[$page] ?? null;
    }

}

?>