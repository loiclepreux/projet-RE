<?php

namespace monApp\core;

class tpl {

    private static array $vars = [];

    public static function assign(string $key, $value): void {
        self::$vars[$key] = $value;
    }

    public static function view(string $view): void {
        $file = "views/sections/$view.html";

        if (!file_exists($file)) {
            http_response_code(404);
            echo "Vue '$view' introuvable.";
            return;
        }

        extract(self::$vars);
        include $file;
    }

    public static function is_set(string $var): bool {
        return array_key_exists($var, self::$vars);
    }

}
?>