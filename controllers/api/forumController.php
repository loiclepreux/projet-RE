<?php

namespace monApp\controllers\api;

use monApp\core\app;

class forumController
{
    // Envoie une réponse JSON et arrête le script
    private function json(array $data, int $status = 200)
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data);
        exit;
    }

    // Pour écrire : requête POST + être connecté + pas de spam
    private function checkCanPost(): array
    {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->json(['success' => false, 'error' => 'Méthode non autorisée'], 405);
        }
        if (empty($_SESSION['user'])) {
            $this->json(['success' => false, 'error' => 'Tu dois être connecté pour écrire sur le forum.'], 401);
        }
        // Anti-spam : 15 secondes minimum entre deux messages
        $last = $_SESSION['last_forum_post'] ?? 0;
        if (time() - $last < 15) {
            $this->json(['success' => false, 'error' => 'Doucement ! Attends quelques secondes avant de reposter.'], 429);
        }

        $data = json_decode(file_get_contents('php://input'), true);
        return is_array($data) ? $data : [];
    }

    // Vérifie la longueur d'un texte (mb_strlen compte bien les accents)
    private function checkLength(string $text, int $min, int $max, string $label)
    {
        $length = mb_strlen($text);
        if ($length < $min || $length > $max) {
            $this->json(['success' => false, 'error' => "$label : entre $min et $max caractères."], 400);
        }
    }

    // ========== LISTE DES SUJETS ==========
    public function listTopics()
    {
        $stmt = app::$db->getPDO()->query("
            SELECT t.id, t.title, t.created_at, u.username,
                   COUNT(r.id) AS replies,
                   GREATEST(t.created_at, COALESCE(MAX(r.created_at), t.created_at)) AS last_activity
            FROM forum_topics t
            JOIN users u ON u.id = t.user_id
            LEFT JOIN forum_replies r ON r.topic_id = t.id
            GROUP BY t.id, t.title, t.created_at, u.username
            ORDER BY last_activity DESC
            LIMIT 50
        ");

        $this->json(['success' => true, 'topics' => $stmt->fetchAll()]);
    }

    // ========== UN SUJET + SES RÉPONSES ==========
    public function getTopic()
    {
        $id = (int) ($_GET['id'] ?? 0);
        $pdo = app::$db->getPDO();

        $stmt = $pdo->prepare("
            SELECT t.id, t.title, t.message, t.created_at, u.username
            FROM forum_topics t
            JOIN users u ON u.id = t.user_id
            WHERE t.id = ?
        ");
        $stmt->execute([$id]);
        $topic = $stmt->fetch();

        if (!$topic) {
            $this->json(['success' => false, 'error' => 'Ce sujet n\'existe pas.'], 404);
        }

        $stmt = $pdo->prepare("
            SELECT r.id, r.message, r.created_at, u.username
            FROM forum_replies r
            JOIN users u ON u.id = r.user_id
            WHERE r.topic_id = ?
            ORDER BY r.created_at ASC, r.id ASC
        ");
        $stmt->execute([$id]);

        $this->json(['success' => true, 'topic' => $topic, 'replies' => $stmt->fetchAll()]);
    }

    // ========== CRÉER UN SUJET ==========
    public function createTopic()
    {
        $data = $this->checkCanPost();
        $title = trim($data['title'] ?? '');
        $message = trim($data['message'] ?? '');

        $this->checkLength($title, 3, 120, 'Titre');
        $this->checkLength($message, 2, 3000, 'Message');

        $pdo = app::$db->getPDO();
        $stmt = $pdo->prepare("INSERT INTO forum_topics (user_id, title, message) VALUES (?, ?, ?)");
        $stmt->execute([$_SESSION['user']['id'], $title, $message]);

        $_SESSION['last_forum_post'] = time();
        $this->json(['success' => true, 'id' => (int) $pdo->lastInsertId()]);
    }

    // ========== RÉPONDRE À UN SUJET ==========
    public function reply()
    {
        $data = $this->checkCanPost();
        $topicId = (int) ($data['topic_id'] ?? 0);
        $message = trim($data['message'] ?? '');

        $this->checkLength($message, 2, 3000, 'Message');

        $pdo = app::$db->getPDO();
        $stmt = $pdo->prepare("SELECT id FROM forum_topics WHERE id = ?");
        $stmt->execute([$topicId]);
        if (!$stmt->fetch()) {
            $this->json(['success' => false, 'error' => 'Ce sujet n\'existe pas.'], 404);
        }

        $stmt = $pdo->prepare("INSERT INTO forum_replies (topic_id, user_id, message) VALUES (?, ?, ?)");
        $stmt->execute([$topicId, $_SESSION['user']['id'], $message]);

        $_SESSION['last_forum_post'] = time();
        $this->json(['success' => true]);
    }
}
