<?php

namespace monApp\controllers\api;

use monApp\core\app;
use PDO;

class quizController
{
    public function getQuestions()
    {
        header('Content-Type: application/json; charset=utf-8');

        try {
            if (!isset($_GET['difficulty'])) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'difficulty_required'
                ]);
                exit;
            }

            $difficulty = $_GET['difficulty'];

            $allowed = ['facile', 'moyen', 'difficile'];

            if (!in_array($difficulty, $allowed, true)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'invalid_difficulty'
                ]);
                exit;
            }

            $pdo = app::$db->getPDO();

            $stmt = $pdo->prepare("
                SELECT id, question
                FROM questions
                WHERE difficulty = ?
                ORDER BY RAND()
                LIMIT 20
            ");
            $stmt->execute([$difficulty]);
            $questions = $stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($questions as &$q) {
                $stmtA = $pdo->prepare("
                    SELECT id, answer, is_true
                    FROM answers
                    WHERE question_id = ?
                ");
                $stmtA->execute([$q['id']]);
                $q['answers'] = $stmtA->fetchAll(PDO::FETCH_ASSOC);

                shuffle($q['answers']);
            }

            echo json_encode([
                'success' => true,
                'data' => $questions
            ]);
            exit;
        } catch (\Throwable $e) {
            http_response_code(500);

            echo json_encode([
                'success' => false,
                'error' => 'server_error'
            ]);
            exit;
        }
    }
}
