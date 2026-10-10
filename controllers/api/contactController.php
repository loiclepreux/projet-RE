<?php

namespace monApp\controllers\api;

use monApp\core\app;

class contactController
{
    // Envoie une réponse JSON et arrête le script
    private function json(array $data, int $status = 200)
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data);
        exit;
    }

    // ========== ENVOYER UN MESSAGE ==========
    public function send()
    {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->json(['success' => false, 'error' => 'Méthode non autorisée'], 405);
        }

        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        // Piège à robots : ce champ est invisible pour un humain.
        // S'il est rempli, c'est un robot : on fait semblant que tout va bien.
        if (!empty($data['website'])) {
            $this->json(['success' => true]);
        }

        // Anti-spam : 1 message par minute
        $last = $_SESSION['last_contact'] ?? 0;
        if (time() - $last < 60) {
            $this->json(['success' => false, 'error' => 'Message déjà envoyé. Attends une minute avant d\'en renvoyer un.'], 429);
        }

        $name = trim($data['name'] ?? '');
        $email = strtolower(trim($data['email'] ?? ''));
        $message = trim($data['message'] ?? '');

        if (mb_strlen($name) < 2 || mb_strlen($name) > 100) {
            $this->json(['success' => false, 'error' => 'Nom : entre 2 et 100 caractères.'], 400);
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->json(['success' => false, 'error' => 'Adresse email invalide.'], 400);
        }
        if (mb_strlen($message) < 10 || mb_strlen($message) > 3000) {
            $this->json(['success' => false, 'error' => 'Message : entre 10 et 3000 caractères.'], 400);
        }

        $stmt = app::$db->getPDO()->prepare("
            INSERT INTO contact_messages (name, email, message)
            VALUES (?, ?, ?)
        ");
        $stmt->execute([$name, $email, $message]);

        $_SESSION['last_contact'] = time();
        $this->json(['success' => true]);
    }
}
