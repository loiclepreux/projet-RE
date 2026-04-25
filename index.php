<?php

require_once __DIR__ . '/vendor/autoload.php';

use monApp\core\app;

app::page();

echo app::getHtml();
