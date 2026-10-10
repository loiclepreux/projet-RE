<?php

namespace monApp\controllers\api;

use monApp\core\app;

class scoreController
{
    // Envoie une réponse JSON et arrête le script
    private function json(array $data, int $status = 200)
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data);
        exit;
    }

    // ========== ENREGISTRER LE SCORE DE LA PARTIE TERMINÉE ==========
    public function saveScore()
    {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->json(['success' => false, 'error' => 'Méthode non autorisée'], 405);
        }

        // Pas connecté : le score reste en attente dans la session.
        // Il sera enregistré automatiquement dès que le joueur se connecte.
        if (empty($_SESSION['user'])) {
            $this->json(['success' => true, 'saved' => false, 'reason' => 'not_logged']);
        }

        $saved = self::savePendingQuiz((int) $_SESSION['user']['id']);
        $this->json(['success' => true, 'saved' => $saved]);
    }

    // Enregistre la partie en session si elle est terminée et pas encore enregistrée.
    // Le score vient de la session (calculé par le serveur), jamais du navigateur.
    public static function savePendingQuiz(int $userId): bool
    {
        $quiz = $_SESSION['quiz'] ?? null;

        if (!$quiz || $quiz['saved'] || count($quiz['answered']) < count($quiz['correct'])) {
            return false;
        }

        $stmt = app::$db->getPDO()->prepare("
            INSERT INTO scores (user_id, score, theme, difficulty)
            VALUES (?, ?, 'quiz', ?)
        ");
        $stmt->execute([$userId, $quiz['score'], $quiz['difficulty']]);

        $_SESSION['quiz']['saved'] = true;
        return true;
    }

    // ========== PAGE SCORE : MES SCORES + CLASSEMENT ==========
    public function getScores()
    {
        $difficulty = $_GET['difficulty'] ?? 'facile';
        if (!in_array($difficulty, ['facile', 'moyen', 'difficile'], true)) {
            $difficulty = 'facile';
        }

        $pdo = app::$db->getPDO();

        // Top 10 : le meilleur score de chaque joueur dans cette difficulté
        $stmt = $pdo->prepare("
            SELECT u.username, MAX(s.score) AS best, COUNT(*) AS games
            FROM scores s
            JOIN users u ON u.id = s.user_id
            WHERE s.difficulty = ?
            GROUP BY u.id, u.username
            ORDER BY best DESC, games ASC, MIN(s.created_at) ASC
            LIMIT 10
        ");
        $stmt->execute([$difficulty]);
        $leaderboard = $stmt->fetchAll();

        // Les scores du joueur connecté
        $me = null;
        if (!empty($_SESSION['user'])) {
            $userId = (int) $_SESSION['user']['id'];

            $stmt = $pdo->prepare("
                SELECT MAX(score) AS best, COUNT(*) AS games
                FROM scores
                WHERE user_id = ? AND difficulty = ?
            ");
            $stmt->execute([$userId, $difficulty]);
            $stats = $stmt->fetch();

            $stmt = $pdo->prepare("
                SELECT score, difficulty
                FROM scores
                WHERE user_id = ?
                ORDER BY created_at DESC, id DESC
                LIMIT 1
            ");
            $stmt->execute([$userId]);
            $last = $stmt->fetch() ?: null;

            $me = [
                'username' => $_SESSION['user']['username'],
                'best' => $stats['best'] !== null ? (int) $stats['best'] : null,
                'games' => (int) $stats['games'],
                'last' => $last,
            ];
        }

        $this->json([
            'success' => true,
            'difficulty' => $difficulty,
            'me' => $me,
            'leaderboard' => $leaderboard,
        ]);
    }
}
