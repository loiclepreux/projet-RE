    public function index()
    {
        ob_start();
        require __DIR__ . '/../../views/pages/contact.php';
        return ob_get_clean();
    }