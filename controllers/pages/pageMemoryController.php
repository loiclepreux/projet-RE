    public function index()
    {
        ob_start();
        require __DIR__ . '/../../views/pages/memory.php';
        return ob_get_clean();
    }