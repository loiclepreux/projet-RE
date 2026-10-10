<?php

namespace monApp\controllers\pages;

class pageScoreController
{
    public function index()
    {
        ob_start();
        require __DIR__ . '/../../views/pages/score.php';
        return ob_get_clean();
    }
}
