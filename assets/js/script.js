// ======================================================
// HORLOGES - AFFICHER L'HEURE EN TEMPS RÉEL
// ======================================================
document.addEventListener("DOMContentLoaded", () => {
    function updateClock(id, timezone) {
        const el = document.getElementById(id);
        if (!el) return;
        el.textContent = new Intl.DateTimeFormat("fr-FR", {
            timeStyle: "medium",
            hour12: false,
            timeZone: timezone,
        }).format(new Date());
    }
    function updateClocks() {
        updateClock("clock-ny", "America/New_York");
        updateClock("clock-tokyo", "Asia/Tokyo");
        updateClock("clock-paris", "Europe/Paris");
        updateClock("clock-london", "Europe/London");
        updateClock("clock-moscow", "Europe/Moscow");
        updateClock("clock-beijing", "Asia/Shanghai");
    }
    updateClocks();
    setInterval(updateClocks, 1000);
});

// ======================================================
// COMPTES : CONNEXION, INSCRIPTION, DÉCONNEXION
// ======================================================

document.addEventListener("DOMContentLoaded", () => {
    const authModal = document.getElementById("auth-modal");
    const loginForm = document.getElementById("login-screen");
    const registerForm = document.getElementById("register-screen");
    const authError = document.getElementById("auth-error");

    // Envoie des données en JSON à notre API PHP et renvoie sa réponse
    async function postJson(url, data) {
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        const result = await res.json().catch(() => ({}));
        if (!res.ok || !result.success) {
            throw new Error(result.error || "Une erreur est survenue.");
        }
        return result;
    }

    function showError(message) {
        authError.textContent = message;
        authError.classList.remove("hidden");
    }

    function openModal(screen) {
        authError.classList.add("hidden");
        authModal.classList.remove("hidden");
        loginForm.classList.toggle("hidden", screen !== "login");
        registerForm.classList.toggle("hidden", screen !== "register");
        authModal.querySelector(`#${screen}-screen input`).focus();
    }

    // D'autres scripts (quiz, forum) peuvent ouvrir la fenêtre de connexion
    window.openAuthModal = openModal;

    document.addEventListener("click", async (event) => {
        const id = event.target.id;

        if (id === "open-login" || id === "go-login") {
            event.preventDefault();
            openModal("login");
        }
        if (id === "go-register") {
            event.preventDefault();
            openModal("register");
        }
        // Clic sur la croix ou sur le fond noir autour de la fenêtre
        if (id === "close-auth" || event.target === authModal) {
            authModal.classList.add("hidden");
        }
        if (id === "logout-btn") {
            event.preventDefault();
            await postJson("?p=api/logout", {}).catch(() => {});
            location.reload();
        }
    });

    // Touche Échap = fermer la fenêtre
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") authModal.classList.add("hidden");
    });

    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        try {
            await postJson("?p=api/login", {
                email: document.getElementById("login-email").value,
                password: document.getElementById("login-password").value,
            });
            location.reload();
        } catch (err) {
            showError(err.message);
        }
    });

    registerForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        try {
            await postJson("?p=api/register", {
                email: document.getElementById("register-email").value,
                username: document.getElementById("register-pseudo").value,
                password: document.getElementById("register-password").value,
            });
            location.reload();
        } catch (err) {
            showError(err.message);
        }
    });
});

// ======================================================
// MODIFICATION DE LA NAVIGATION EN FONCTION DE LA PAGE
// ======================================================

document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const currentPage = params.get("p") || "home";
    const navLinks = document.querySelectorAll("header nav ul li a");

    navLinks.forEach((link) => {
        const li = link.parentElement;
        const href = link.getAttribute("href");

        if (li.id === "auth-nav") return;
        if (
            currentPage === "home" &&
            (href === "./" || href === "/" || href === "")
        ) {
            li.style.display = "none";
        }
        if (currentPage !== "home" && href === `?p=${currentPage}`) {
            li.style.display = "none";
        }
    });
});

// ======================================================
// APPARITION DU QUIZ
// ======================================================

document.addEventListener("DOMContentLoaded", () => {
    // VARIABLES //

    let questions = [];
    let currentIndex = 0;
    let score = 0;
    let selectedDifficulty = null;
    let timer = null;
    let timeLeft = 15;
    // ELEMENTS DOM //

    const startBtn = document.getElementById("start-btn");
    const quizStart = document.getElementById("quiz-start");
    const quizDifficulty = document.getElementById("quiz-difficulty");
    const quizPlay = document.getElementById("quiz-play");
    const quizResult = document.getElementById("quiz-result");
    const questionText = document.getElementById("question-text");
    const answersContainer = document.getElementById("answers");
    const questionIndexEl = document.getElementById("question-index");
    const timerEl = document.getElementById("timer");
    const finalScore = document.getElementById("final-score");
    const difficultyButtons = document.querySelectorAll(
        ".difficulty-buttons button",
    );
    const quizMusic = document.getElementById("quiz-music");
    const quizLoading = document.getElementById("quiz-loading");
    const loadingVideo = document.getElementById("loading-video");

    function hideAllScreens() {
        quizStart.classList.add("hidden");
        quizDifficulty.classList.add("hidden");
        quizPlay.classList.add("hidden");
        quizResult.classList.add("hidden");
        quizLoading.classList.add("hidden");
    }

    // CHARGEMENT DES QUESTIONS //

    async function loadQuestionsByDifficulty() {
        try {
            loadingVideo.currentTime = 0;
            loadingVideo.play();

            const res = await fetch(
                `?p=api/quiz&difficulty=${selectedDifficulty}`,
            );
            const result = await res.json();

            if (
                !result.success ||
                !Array.isArray(result.data) ||
                !result.data.length
            ) {
                throw new Error("Aucune question");
            }

            questions = result.data;
            currentIndex = 0;
            score = 0;

            showQuestion();
            return true;
        } catch (err) {
            console.error(err);
            alert("Erreur de chargement du quiz");
            hideAllScreens();
            quizDifficulty.classList.remove("hidden");
            return false;
        }
    }
    // START BUTTON //

    if (startBtn) {
        startBtn.addEventListener("click", () => {
            quizStart.classList.add("hidden");
            quizDifficulty.classList.remove("hidden");
        });
    }
    // DIFFICULTY SELECTION //

    difficultyButtons.forEach((btn) => {
        btn.addEventListener("click", async () => {
            selectedDifficulty = btn.dataset.difficulty;

            hideAllScreens();
            quizLoading.classList.remove("hidden");

            quizMusic.volume = 0.2;
            quizMusic.play();

            const ok = await loadQuestionsByDifficulty();
            if (!ok) return;

            hideAllScreens();
            quizPlay.classList.remove("hidden");
        });
    });
    // TIMER //

    function startTimer() {
        clearInterval(timer);

        timeLeft = 15;
        timerEl.textContent = `00:${timeLeft}`;

        timer = setInterval(() => {
            timeLeft--;
            timerEl.textContent = `00:${timeLeft < 10 ? "0" : ""}${timeLeft}`;

            if (timeLeft <= 0) {
                clearInterval(timer);
                disableAnswers();
                revealCorrectAnswer();
                setTimeout(nextQuestion, 1000);
            }
        }, 1000);
    }
    // SHOW QUESTION //

    function showQuestion() {
        if (currentIndex >= questions.length) {
            endQuiz();
            return;
        }
        const q = questions[currentIndex];

        questionIndexEl.textContent = `Question ${currentIndex + 1} / ${questions.length}`;
        questionText.textContent = q.question;
        answersContainer.innerHTML = "";

        q.answers.forEach((answer) => {
            const btn = document.createElement("button");
            btn.className = "answer-btn";
            btn.textContent = answer.answer;
            btn.dataset.correct = answer.is_true;

            btn.addEventListener("click", () => {
                clearInterval(timer);
                disableAnswers();

                if (answer.is_true == 1) {
                    btn.classList.add("good");
                    score++;
                } else {
                    btn.classList.add("bad");
                    revealCorrectAnswer();
                }
                setTimeout(nextQuestion, 1000);
            });
            answersContainer.appendChild(btn);
        });
        startTimer();
    }
    // UTILITAIRES //

    function disableAnswers() {
        document
            .querySelectorAll(".answer-btn")
            .forEach((btn) => (btn.disabled = true));
    }

    function revealCorrectAnswer() {
        document.querySelectorAll(".answer-btn").forEach((btn) => {
            if (btn.dataset.correct == 1) {
                btn.classList.add("good");
            }
        });
    }

    function nextQuestion() {
        currentIndex++;
        if (currentIndex < questions.length) {
            showQuestion();
        } else {
            endQuiz();
        }
    }

    async function saveScore() {
        try {
            const userId = localStorage.getItem("user_id");

            // si pas connecté → on ne sauvegarde pas
            if (!userId) return;

            await fetch("?p=api/score", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    user_id: userId,
                    score: score,
                    difficulty: selectedDifficulty,
                    theme: "quiz",
                }),
            });
        } catch (err) {
            console.error("Erreur save score :", err);
        }
    }
    // END QUIZ //

    function endQuiz() {
        clearInterval(timer);
        saveScore();
        quizMusic.pause();
        quizMusic.currentTime = 0;
        quizPlay.classList.add("hidden");
        quizResult.classList.remove("hidden");
        finalScore.textContent = score;
    }
});

// ======================================================
// CHARGEMENT DES CARTE DE MEMORY
// ======================================================

document.addEventListener("DOMContentLoaded", () => {
    // =========================
    // VARIABLES GLOBALES
    // =========================

    const grid = document.querySelector(".memory-grid");
    const startScreen = document.getElementById("memory-start");
    const playScreen = document.getElementById("memory-play");
    const movesEl = document.getElementById("memory-moves");
    const winScreen = document.getElementById("memory-win");
    // On n'est pas sur la page Memory : on ne fait rien
    if (!grid) return;

    let firstCard = null;
    let secondCard = null;
    let lockBoard = false;
    let moves = 0;
    let matchedPairs = 0;
    let totalPairs = 0;
    let timerInterval = null;
    let seconds = 0;

    // =========================
    // IMAGES DISPONIBLES
    // =========================

    const images = [
        "Ada.png",
        "Albert.jpeg",
        "Barry.jpg",
        "Carlos.jpeg",
        "Cerberus.jpg",
        "Chris.jpeg",
        "Claire.png",
        "Crow.png",
        "Ethan.png",
        "G-virus.png",
        "Hunter.jpg",
        "Ivy.png",
        "Jill.jpeg",
        "Las-plagas.png",
        "Leon.png",
        "Licker.png",
        "Nemesis.png",
        "Progenitor.jpeg",
        "Rebecca.jpg",
        "T-virus.jpg",
        "Tyran.png",
        "Uroboros.png",
        "William.png",
        "Zombie.png",
    ];

    // =========================
    // DIFFICULTÉS
    // =========================

    const difficultyConfig = {
        facile: 12, // 24 cartes
        moyen: 18, // 36 cartes
        difficile: 24, // 48 cartes
    };

    // Nombre de colonnes idéal par difficulté (sur grand écran)
    const columnsConfig = {
        facile: 6,
        moyen: 9,
        difficile: 12,
    };

    let currentLevel = null;

    function applyDifficultyLayout(level) {
        currentLevel = level;

        const container = document.querySelector(".memory-container");
        const available = container.clientWidth - 40; // place disponible (moins le padding)
        const gap = window.innerWidth < 600 ? 8 : 18;
        const minCard = 56; // une carte ne descend jamais sous 56 px de large

        // Autant de colonnes que prévu... mais pas plus que ce qui tient à l'écran
        const maxColumns = Math.floor((available + gap) / (minCard + gap));
        const columns = Math.max(3, Math.min(columnsConfig[level], maxColumns));

        grid.style.gridTemplateColumns = `repeat(${columns}, minmax(0, 90px))`;
        grid.style.gap = `${gap}px`;
    }

    // Si on tourne le téléphone ou qu'on redimensionne la fenêtre, on recalcule
    window.addEventListener("resize", () => {
        if (currentLevel) applyDifficultyLayout(currentLevel);
    });

    // =========================
    // ÉCOUTEURS DIFFICULTÉ
    // =========================

    document.querySelectorAll(".memory-difficulty button").forEach((btn) => {
        btn.addEventListener("click", () => {
            const level = btn.dataset.level;
            startGame(level);
        });
    });

    // =========================
    // START TIMER
    // =========================

    function startTimer() {
        stopTimer(); // sécurité
        timerInterval = setInterval(() => {
            seconds++;
            updateTimerDisplay();
        }, 1000);
    }

    function stopTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }

    function updateTimerDisplay() {
        const min = String(Math.floor(seconds / 60)).padStart(2, "0");
        const sec = String(seconds % 60).padStart(2, "0");
        document.getElementById("memory-timer").textContent = `${min}:${sec}`;
    }

    // =========================
    // DÉMARRER LE JEU
    // =========================

    function startGame(level) {
        resetGame();

        const pairCount = difficultyConfig[level];
        const selectedImages = shuffle([...images]).slice(0, pairCount);
        const cards = shuffle([...selectedImages, ...selectedImages]);

        totalPairs = pairCount;

        generateCards(cards);
        applyDifficultyLayout(level);

        startScreen.classList.add("hidden");
        playScreen.classList.remove("hidden");

        seconds = 0;
        updateTimerDisplay();
        startTimer();
    }

    // =========================
    // GÉNÉRATION DES CARTES
    // =========================

    function generateCards(cards) {
        grid.innerHTML = "";

        cards.forEach((img) => {
            const card = document.createElement("div");
            card.className = "memory-card";
            card.dataset.image = img;

            card.innerHTML = `
                <div class="memory-card-inner">
                    <div class="memory-card-front">
                        <img src="assets/img/logo_umbrella.png" alt="logo_umbrella">
                    </div>
                    <div class="memory-card-back">
                        <img src="assets/img/${img}" alt="">
                    </div>
                </div>
            `;

            card.addEventListener("click", () => flipCard(card));
            grid.appendChild(card);
        });
    }

    // =========================
    // FLIP
    // =========================

    function flipCard(card) {
        if (lockBoard) return;
        if (card === firstCard) return;
        if (card.classList.contains("is-matched")) return;

        card.classList.add("is-flipped");

        if (!firstCard) {
            firstCard = card;
            return;
        }

        secondCard = card;
        moves++;
        movesEl.textContent = moves;

        checkMatch();
    }

    // =========================
    // COMPARAISON
    // =========================

    function showWinScreen() {
        winScreen.classList.remove("hidden");

        document.getElementById("final-time").textContent =
            document.getElementById("memory-timer").textContent;
    }

    function checkMatch() {
        const isMatch = firstCard.dataset.image === secondCard.dataset.image;

        if (isMatch) {
            disableCards();
        } else {
            unflipCards();
        }
    }

    function disableCards() {
        firstCard.classList.add("is-matched");
        secondCard.classList.add("is-matched");

        resetTurn();
        matchedPairs++;

        if (matchedPairs === totalPairs) {
            stopTimer();
            setTimeout(() => {
                showWinScreen();
            }, 500);
        }
    }

    function unflipCards() {
        lockBoard = true;

        setTimeout(() => {
            firstCard.classList.remove("is-flipped");
            secondCard.classList.remove("is-flipped");
            resetTurn();
        }, 900);
    }

    function resetTurn() {
        [firstCard, secondCard] = [null, null];
        lockBoard = false;
    }

    // =========================
    // RESET / SHUFFLE
    // =========================

    function resetGame() {
        firstCard = null;
        secondCard = null;
        lockBoard = false;
        matchedPairs = 0;
        moves = 0;
        movesEl.textContent = "0";
        grid.innerHTML = "";

        stopTimer();
        seconds = 0;
        updateTimerDisplay();
    }

    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    document.getElementById("win-restart").addEventListener("click", () => {
        location.reload();
    });

    document.getElementById("win-exit").addEventListener("click", () => {
        winScreen.classList.add("hidden");
        playScreen.classList.add("hidden");
        startScreen.classList.remove("hidden");
    });

    resetGame();
});
