<?php

namespace monApp\controllers\api;

use monApp\core\app;
use PDO;

class quizController
{
    // Envoie une réponse JSON et arrête le script
    private function json(array $data, int $status = 200)
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data);
        exit;
    }

    // ========== DÉMARRER UNE PARTIE : 20 questions au hasard ==========
    public function getQuestions()
    {
        $difficulty = $_GET['difficulty'] ?? '';

        if (!in_array($difficulty, ['facile', 'moyen', 'difficile'], true)) {
            $this->json(['success' => false, 'error' => 'invalid_difficulty'], 400);
        }

        try {
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

            $stmtA = $pdo->prepare("SELECT id, answer, is_true FROM answers WHERE question_id = ?");
            $correctAnswers = [];

            foreach ($questions as &$q) {
                $stmtA->execute([$q['id']]);
                $answers = $stmtA->fetchAll(PDO::FETCH_ASSOC);

                // La bonne réponse reste sur le serveur, le navigateur ne la reçoit pas
                $q['answers'] = [];
                foreach ($answers as $a) {
                    if ((int) $a['is_true'] === 1) {
                        $correctAnswers[$q['id']] = (int) $a['id'];
                    }
                    $q['answers'][] = ['id' => (int) $a['id'], 'answer' => $a['answer']];
                }
                shuffle($q['answers']);
            }
            unset($q);

            // La partie en cours est retenue dans la session
            $_SESSION['quiz'] = [
                'difficulty' => $difficulty,
                'correct' => $correctAnswers,
                'answered' => [],
                'score' => 0,
                'saved' => false,
            ];

            $this->json(['success' => true, 'data' => $questions]);
        } catch (\Throwable $e) {
            error_log($e->getMessage());
            $this->json(['success' => false, 'error' => 'server_error'], 500);
        }
    }

    // ========== VÉRIFIER UNE RÉPONSE ==========
    public function answer()
    {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->json(['success' => false, 'error' => 'Méthode non autorisée'], 405);
        }

        $quiz = $_SESSION['quiz'] ?? null;
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $questionId = (int) ($input['question_id'] ?? 0);
        $answerId = isset($input['answer_id']) ? (int) $input['answer_id'] : null; // null = temps écoulé

        if (!$quiz || !isset($quiz['correct'][$questionId])) {
            $this->json(['success' => false, 'error' => 'Question inconnue'], 400);
        }
        if (in_array($questionId, $quiz['answered'], true)) {
            $this->json(['success' => false, 'error' => 'Question déjà répondue'], 400);
        }

        $correctId = $quiz['correct'][$questionId];
        $isCorrect = $answerId === $correctId;

        $_SESSION['quiz']['answered'][] = $questionId;
        if ($isCorrect) {
            $_SESSION['quiz']['score']++;
        }

        $this->json([
            'success' => true,
            'correct' => $isCorrect,
            'correct_answer_id' => $correctId,
            'score' => $_SESSION['quiz']['score'],
        ]);
    }
}
