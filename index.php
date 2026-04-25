<?php

use monApp\core\app;
use monApp\core\tools;

ini_set('display_errors', 1);
require "vendor/autoload.php";

tools::gets();
app::db();
app::page();
echo app::getHtml();
