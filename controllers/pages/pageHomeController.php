<?php

namespace monApp\controllers\pages;

class pageHomeController
{
    public function index()
    {
        ob_start(); // démarre la capture du HTML

        require __DIR__ . '/../../views/pages/home.php';

        return ob_get_clean(); // retourne le HTML au lieu de l'afficher
    }
}
