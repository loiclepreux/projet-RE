<?php

namespace monApp\controllers\api;

use monApp\core\app;
use PDO; // ✅ IMPORTANT

class quizController {

    public function getQuestions() {

        header('Content-Type: application/json');

        if (!isset($_GET['difficulty'])) {
            http_response_code(400);
            echo json_encode([
                'error' => 'difficulty_required'
            ]);
            exit;
        }

        $difficulty = $_GET['difficulty'];

        // 🔹 Valeurs autorisées
        $allowed = ['facile', 'moyen', 'difficile'];
        if (!in_array($difficulty, $allowed)) {
            http_response_code(400);
            echo json_encode([
                'error' => 'invalid_difficulty'
            ]);
            exit;
        }

          // 🔹 PDO
        $pdo = app::$db->getPDO();

        // 🔹 Questions filtrées
        $stmt = $pdo->prepare("
            SELECT id, question
            FROM questions
            WHERE difficulty = ?
        ");
        $stmt->execute([$difficulty]);
        $questions = $stmt->fetchAll(PDO::FETCH_ASSOC);

        shuffle($questions);
        $questions = array_slice($questions, 0, 20);

        // 🔹 Réponses
        foreach ($questions as &$q) {
            $stmtA = $pdo->prepare("
                SELECT id, answer, is_true
                FROM answers
                WHERE question_id = ?
            ");
            $stmtA->execute([$q['id']]);
            $q['answers'] = $stmtA->fetchAll(PDO::FETCH_ASSOC);
        }

        echo json_encode($questions);
        exit;
    }
}