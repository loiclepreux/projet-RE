<?php

namespace monApp\core;

use PDO;
use PDOException;

class database
{

    private $serverName;
    private $bddName;
    private $userName;
    private $password;

    private $db; //variable conservant la connexion à la base de données

    public function __construct($hote, $dbName, $user, $motDePasse)
    {

        $this->serverName = $hote;
        $this->bddName = $dbName;
        $this->userName = $user;
        $this->password = $motDePasse;

        try {
            $this->db = new PDO(
                "mysql:host={$this->serverName};dbname={$this->bddName};charset=utf8mb4",
                $this->userName,
                $this->password,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ]
            );
        } catch (PDOException $erreur) {
            error_log("Erreur BDD : " . $erreur->getMessage());
            throw $erreur;

        }
    }

    public function getPDO()
    {
        return $this->db;
    }

    public function query($sql, $class)
    {
        try {
            $rst = $this->db->query($sql);
            if ($rst === false) {
                error_log("Debug query : Erreur dans la requête");
                error_log("Error info : " . implode(", ", $this->db->errorInfo()));
                return [];
            }

            // Utiliser FETCH_CLASS au lieu de FETCH_ASSOC
            $results = $rst->fetchAll(PDO::FETCH_CLASS, $class);

            error_log("Debug query : " . count($results) . " résultats trouvés");
            return $results;
        } catch (PDOException $e) {
            error_log("Debug query : Exception - " . $e->getMessage());
            return [];
        }
    }

    public function prepare($sql, $data, $class = null)
    {
        $rst = $this->db->prepare($sql);
        $success = $rst->execute($data);

        // Si un nom de classe est fourni, on retourne les résultats
        if ($class !== null) {
            return $rst->fetchAll(PDO::FETCH_CLASS, $class);
        }

        // Sinon on retourne le succès de l'exécution
        return $success;
    }

    public function exec($sql, $data = [])
    {
        if (empty($data)) {
            return $this->db->exec($sql);
        } else {
            $stmt = $this->db->prepare($sql);
            return $stmt->execute($data);
        }
    }

    public function lastInsertId()
    {
        return $this->db->lastInsertId();
    }

    public function beginTransaction()
    {
        return $this->db->beginTransaction();
    }

    public function commit()
    {
        return $this->db->commit();
    }

    public function rollBack()
    {
        return $this->db->rollBack();
    }
}
