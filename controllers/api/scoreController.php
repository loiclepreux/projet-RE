<?php

namespace monApp\controllers\api;

use monApp\core\app;

class scoreController
{
    public function saveScore()
    {
        header('Content-Type: application/json');

        try {
            $input = json_decode(file_get_contents("php://input"), true);

            if (
                !isset($input['user_id']) ||
                !isset($input['score']) ||
                !isset($input['difficulty']) ||
                !isset($input['theme'])
            ) {
                http_response_code(400);
                echo json_encode(['success' => false]);
                return;
            }

            $pdo = app::$db->getPDO();

            $stmt = $pdo->prepare("
                INSERT INTO scores (user_id, score, theme, difficulty)
                VALUES (?, ?, ?, ?)
            ");

            $stmt->execute([
                $input['user_id'],
                $input['score'],
                $input['theme'],
                $input['difficulty']
            ]);

            echo json_encode(['success' => true]);

        } catch (\Throwable $e) {
            http_response_code(500);
            echo json_encode(['success' => false]);
        }
    }
}