<?php

namespace monApp\controllers\pages;

class pageQuizController
{
    public function index()
    {
        ob_start();
        require __DIR__ . '/../../views/pages/quiz.php';
        return ob_get_clean();
    }
}