<?php

namespace monApp\controllers\pages;

class page404Controller
{
    public function index()
    {
        ob_start();
        require __DIR__ . '/../../views/pages/404.php';
        return ob_get_clean();
    }
}
