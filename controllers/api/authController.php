<?php

namespace monApp\controllers\api;

use monApp\core\app;

class authController
{
    // Envoie une réponse JSON et arrête le script
    private function json(array $data, int $status = 200)
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data);
        exit;
    }

    // Lit les données envoyées en JSON par le JavaScript
    private function input(): array
    {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->json(['success' => false, 'error' => 'Méthode non autorisée'], 405);
        }
        $data = json_decode(file_get_contents('php://input'), true);
        return is_array($data) ? $data : [];
    }

    // ========== INSCRIPTION ==========
    public function register()
    {
        $data = $this->input();
        $username = trim($data['username'] ?? '');
        $email = strtolower(trim($data['email'] ?? ''));
        $password = $data['password'] ?? '';

        if (!preg_match('/^[a-zA-Z0-9_-]{3,30}$/', $username)) {
            $this->json(['success' => false, 'error' => 'Pseudo : 3 à 30 caractères (lettres, chiffres, - ou _).'], 400);
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->json(['success' => false, 'error' => 'Adresse email invalide.'], 400);
        }
        if (strlen($password) < 8) {
            $this->json(['success' => false, 'error' => 'Le mot de passe doit faire au moins 8 caractères.'], 400);
        }

        $pdo = app::$db->getPDO();

        // Pseudo ou email déjà pris ?
        $stmt = $pdo->prepare("SELECT username, email FROM users WHERE username = ? OR email = ?");
        $stmt->execute([$username, $email]);
        foreach ($stmt->fetchAll() as $existing) {
            if ($existing['email'] === $email) {
                $this->json(['success' => false, 'error' => 'Cet email est déjà utilisé.'], 409);
            }
            $this->json(['success' => false, 'error' => 'Ce pseudo est déjà pris.'], 409);
        }

        // Le mot de passe n'est jamais enregistré en clair
        $hash = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("INSERT INTO users (username, email, password) VALUES (?, ?, ?)");
        $stmt->execute([$username, $email, $hash]);

        $this->logUserIn((int) $pdo->lastInsertId(), $username);
        $this->json(['success' => true, 'user' => $_SESSION['user']]);
    }

    // ========== CONNEXION ==========
    public function login()
    {
        $data = $this->input();
        $email = strtolower(trim($data['email'] ?? ''));
        $password = $data['password'] ?? '';

        $stmt = app::$db->getPDO()->prepare("SELECT id, username, password FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        // Même message si l'email ou le mot de passe est faux : on ne dit pas lequel
        if (!$user || !password_verify($password, $user['password'])) {
            $this->json(['success' => false, 'error' => 'Email ou mot de passe incorrect.'], 401);
        }

        $this->logUserIn((int) $user['id'], $user['username']);
        $this->json(['success' => true, 'user' => $_SESSION['user']]);
    }

    // ========== DÉCONNEXION ==========
    public function logout()
    {
        $this->input();
        $_SESSION = [];
        session_destroy();
        $this->json(['success' => true]);
    }

    // ========== QUI EST CONNECTÉ ? ==========
    public function me()
    {
        $this->json(['success' => true, 'user' => $_SESSION['user'] ?? null]);
    }

    private function logUserIn(int $id, string $username)
    {
        // Nouvel identifiant de session à chaque connexion (protège contre le vol de session)
        session_regenerate_id(true);
        $_SESSION['user'] = ['id' => $id, 'username' => $username];
    }
}
