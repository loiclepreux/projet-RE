<?php

// namespace monApp\core;
// class autoloader{
//     public static function register(){
//         spl_autoload_register(["autoloader", "autoload"]);
//     }
//     public static function autoload($class){
//         if(file_exists("core/$class.php")){
//             require("core/$class.php");
//         }
//         if(file_exists("models/$class.php")){
//             require("models/$class.php");
//         }
//     }
// }
// autoloader::register();

namespace monApp\core;

class autoloader
{
    public static function register()
    {
        spl_autoload_register([self::class, "autoload"]);
    }
    public static function autoload($class)
    {
        $class = ltrim($class, "\\");
        $class = str_replace("monApp\\", "", $class);
        $relativePath = str_replace("\\", "/", $class) . ".php";
        $baseDir = dirname(__DIR__);
        $fullPath = $baseDir . "/" . $relativePath;

        if (file_exists($fullPath)) {
            require_once $fullPath;
        }
    }
}
autoloader::register();
