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

    // Page où aller après la connexion (null = on recharge la page actuelle)
    let redirectAfterAuth = null;

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

    function showScreen(screen) {
        authError.classList.add("hidden");
        authModal.classList.remove("hidden");
        loginForm.classList.toggle("hidden", screen !== "login");
        registerForm.classList.toggle("hidden", screen !== "register");
        authModal.querySelector(`#${screen}-screen input`).focus();
    }

    function openModal(screen, redirect = null) {
        redirectAfterAuth = redirect;
        showScreen(screen);
    }

    function afterAuth() {
        if (redirectAfterAuth) {
            location.href = redirectAfterAuth;
        } else {
            location.reload();
        }
    }

    // D'autres scripts (quiz, page score) peuvent ouvrir la fenêtre de connexion
    window.openAuthModal = openModal;

    document.addEventListener("click", async (event) => {
        const id = event.target.id;

        if (id === "open-login") {
            event.preventDefault();
            openModal("login");
        }
        if (id === "go-login") {
            event.preventDefault();
            showScreen("login");
        }
        if (id === "go-register") {
            event.preventDefault();
            showScreen("register");
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
            afterAuth();
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
            afterAuth();
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
// QUIZ
// ======================================================

document.addEventListener("DOMContentLoaded", () => {
    const quizPlay = document.getElementById("quiz-play");
    if (!quizPlay) return; // on n'est pas sur la page Quiz

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
    const quizResult = document.getElementById("quiz-result");
    const questionText = document.getElementById("question-text");
    const answersContainer = document.getElementById("answers");
    const questionIndexEl = document.getElementById("question-index");
    const timerEl = document.getElementById("timer");
    const finalScore = document.getElementById("final-score");
    const finalTotal = document.getElementById("final-total");
    const scoreStatus = document.getElementById("score-status");
    const restartBtn = document.getElementById("restart-btn");
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
            loadingVideo.play().catch(() => {});

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
            return true;
        } catch (err) {
            console.error(err);
            alert("Erreur de chargement du quiz");
            hideAllScreens();
            quizDifficulty.classList.remove("hidden");
            return false;
        }
    }

    // BOUTON COMMENCER //

    startBtn.addEventListener("click", () => {
        quizStart.classList.add("hidden");
        quizDifficulty.classList.remove("hidden");
    });

    // CHOIX DE LA DIFFICULTÉ //

    difficultyButtons.forEach((btn) => {
        btn.addEventListener("click", async () => {
            selectedDifficulty = btn.dataset.difficulty;

            hideAllScreens();
            quizLoading.classList.remove("hidden");

            quizMusic.volume = 0.2;
            quizMusic.play().catch(() => {});

            const ok = await loadQuestionsByDifficulty();
            if (!ok) return;

            hideAllScreens();
            quizPlay.classList.remove("hidden");
            showQuestion();
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
                // Temps écoulé : on envoie "pas de réponse" au serveur
                handleAnswer(null, null);
            }
        }, 1000);
    }

    // AFFICHER UNE QUESTION //

    function showQuestion() {
        const q = questions[currentIndex];

        questionIndexEl.textContent = `Question ${currentIndex + 1} / ${questions.length}`;
        questionText.textContent = q.question;
        answersContainer.innerHTML = "";

        q.answers.forEach((answer) => {
            const btn = document.createElement("button");
            btn.className = "answer-btn";
            btn.textContent = answer.answer;
            btn.dataset.id = answer.id;
            btn.addEventListener("click", () => handleAnswer(answer.id, btn));
            answersContainer.appendChild(btn);
        });

        startTimer();
    }

    // RÉPONSE : c'est le serveur qui dit si c'est juste //

    async function handleAnswer(answerId, clickedBtn) {
        clearInterval(timer);
        disableAnswers();

        try {
            const res = await fetch("?p=api/quiz/answer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    question_id: questions[currentIndex].id,
                    answer_id: answerId,
                }),
            });
            const result = await res.json();
            if (!result.success) throw new Error(result.error);

            score = result.score;
            if (clickedBtn) {
                clickedBtn.classList.add(result.correct ? "good" : "bad");
            }
            revealCorrectAnswer(result.correct_answer_id);
        } catch (err) {
            console.error("Erreur réponse :", err);
        }

        setTimeout(nextQuestion, 1000);
    }

    function disableAnswers() {
        document
            .querySelectorAll(".answer-btn")
            .forEach((btn) => (btn.disabled = true));
    }

    function revealCorrectAnswer(correctId) {
        const btn = answersContainer.querySelector(`[data-id="${correctId}"]`);
        if (btn) btn.classList.add("good");
    }

    function nextQuestion() {
        currentIndex++;
        if (currentIndex < questions.length) {
            showQuestion();
        } else {
            endQuiz();
        }
    }

    // FIN DE PARTIE //

    async function endQuiz() {
        clearInterval(timer);
        quizMusic.pause();
        quizMusic.currentTime = 0;

        hideAllScreens();
        quizResult.classList.remove("hidden");
        finalScore.textContent = score;
        finalTotal.textContent = questions.length;
        scoreStatus.textContent = "Enregistrement du score...";

        try {
            const res = await fetch("?p=api/score", { method: "POST" });
            const result = await res.json();

            if (result.saved) {
                scoreStatus.textContent = "✔ Score enregistré au classement.";
            } else if (result.reason === "not_logged") {
                scoreStatus.innerHTML = `Connecte-toi pour enregistrer ce score au classement.
                    <button type="button" id="save-login" class="quiz-btn">Se connecter</button>`;
                document
                    .getElementById("save-login")
                    .addEventListener("click", () => {
                        window.openAuthModal("login", "?p=score");
                    });
            } else {
                scoreStatus.textContent = "";
            }
        } catch (err) {
            console.error("Erreur save score :", err);
            scoreStatus.textContent = "Le score n'a pas pu être enregistré.";
        }
    }

    // REJOUER //

    restartBtn.addEventListener("click", () => {
        hideAllScreens();
        quizDifficulty.classList.remove("hidden");
    });
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

// ======================================================
// PAGE SCORE : MES SCORES + CLASSEMENT
// ======================================================

document.addEventListener("DOMContentLoaded", () => {
    const leaderboardBody = document.getElementById("leaderboard-body");
    if (!leaderboardBody) return; // on n'est pas sur la page Score

    const myScores = document.getElementById("my-scores");
    const tabs = document.querySelectorAll(".score-tabs button");

    async function loadScores(difficulty) {
        tabs.forEach((tab) =>
            tab.classList.toggle(
                "active",
                tab.dataset.difficulty === difficulty,
            ),
        );

        try {
            const res = await fetch(`?p=api/scores&difficulty=${difficulty}`);
            const data = await res.json();
            if (!data.success) throw new Error();

            showMyScores(data.me, difficulty);
            showLeaderboard(data.leaderboard, data.me);
        } catch {
            leaderboardBody.innerHTML = `<tr><td colspan="4">Impossible de charger le classement.</td></tr>`;
        }
    }

    function showMyScores(me, difficulty) {
        if (!me) {
            myScores.innerHTML = `
                <p>Connecte-toi pour garder tes scores et apparaître au classement.</p>
                <button type="button" id="score-login" class="quiz-btn">Se connecter</button>`;
            document
                .getElementById("score-login")
                .addEventListener("click", () => {
                    window.openAuthModal("login");
                });
            return;
        }

        // textContent : le pseudo est affiché comme du texte, jamais comme du HTML
        myScores.innerHTML = `
            <p>Bienvenue, <span class="auth-pseudo"></span></p>
            <p>Meilleur score en ${difficulty} : <strong>${me.best ?? "-"}</strong>/20</p>
            <p>Parties jouées en ${difficulty} : <strong>${me.games}</strong></p>
            <p>Dernier score : <strong>${me.last ? `${me.last.score}/20 (${me.last.difficulty})` : "-"}</strong></p>`;
        myScores.querySelector(".auth-pseudo").textContent = me.username;
    }

    function showLeaderboard(rows, me) {
        leaderboardBody.innerHTML = "";

        if (!rows.length) {
            leaderboardBody.innerHTML = `<tr><td colspan="4">Personne n'a encore joué dans cette difficulté. Lance-toi !</td></tr>`;
            return;
        }

        rows.forEach((row, i) => {
            const tr = document.createElement("tr");
            if (me && row.username === me.username) tr.classList.add("me");

            [i + 1, row.username, `${row.best}/20`, row.games].forEach(
                (value) => {
                    const td = document.createElement("td");
                    td.textContent = value;
                    tr.appendChild(td);
                },
            );
            leaderboardBody.appendChild(tr);
        });
    }

    tabs.forEach((tab) => {
        tab.addEventListener("click", () => loadScores(tab.dataset.difficulty));
    });

    loadScores("facile");
});

// ======================================================
// FORUM
// ======================================================

document.addEventListener("DOMContentLoaded", () => {
    const listView = document.getElementById("forum-list-view");
    if (!listView) return; // on n'est pas sur la page Forum

    const topicView = document.getElementById("forum-topic-view");
    const topicsEl = document.getElementById("topics");
    const topicDetail = document.getElementById("topic-detail");
    const repliesEl = document.getElementById("replies");
    const createForm = document.getElementById("create-topic-form"); // absent si pas connecté
    const replyForm = document.getElementById("reply-form"); // absent si pas connecté

    // ?p=forum = liste des sujets, ?p=forum&topic=12 = le sujet n°12
    const topicId = new URLSearchParams(location.search).get("topic");

    // Les boutons "Se connecter" ramènent sur la même page après connexion
    document.querySelectorAll(".forum-login-btn").forEach((btn) => {
        btn.addEventListener("click", () => window.openAuthModal("login"));
    });

    // La base enregistre en heure UTC ("Z") : le navigateur convertit en heure locale
    function formatDate(sqlDate) {
        return new Date(sqlDate.replace(" ", "T") + "Z").toLocaleString(
            "fr-FR",
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            },
        );
    }

    // Crée un élément HTML avec du texte dedans (textContent = jamais de HTML injecté)
    function el(tag, className, text) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    }

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

    function showError(id, message) {
        const box = document.getElementById(id);
        box.textContent = message;
        box.classList.remove("hidden");
    }

    // ===== LISTE =====

    async function loadTopics() {
        try {
            const res = await fetch("?p=api/forum");
            const data = await res.json();
            topicsEl.innerHTML = "";

            if (!data.topics.length) {
                topicsEl.appendChild(
                    el(
                        "p",
                        "forum-empty",
                        "Aucun sujet pour l'instant. Lance la discussion !",
                    ),
                );
                return;
            }

            data.topics.forEach((topic) => {
                const link = el("a", "forum-topic");
                link.href = `?p=forum&topic=${topic.id}`;
                link.appendChild(el("h3", "", topic.title));
                const replies = Number(topic.replies);
                link.appendChild(
                    el(
                        "p",
                        "topic-meta",
                        `Par ${topic.username} · ${formatDate(topic.created_at)} · ${replies} réponse${replies > 1 ? "s" : ""}`,
                    ),
                );
                topicsEl.appendChild(link);
            });
        } catch {
            topicsEl.innerHTML = "<p>Impossible de charger les sujets.</p>";
        }
    }

    // ===== UN SUJET =====

    function postBlock(post, container) {
        container.innerHTML = "";
        container.appendChild(
            el(
                "p",
                "topic-meta",
                `${post.username} · ${formatDate(post.created_at)}`,
            ),
        );
        container.appendChild(el("p", "forum-message", post.message));
    }

    async function loadTopic() {
        listView.classList.add("hidden");
        topicView.classList.remove("hidden");

        try {
            const res = await fetch(
                `?p=api/forum/topic&id=${encodeURIComponent(topicId)}`,
            );
            const data = await res.json();
            if (!data.success) throw new Error(data.error);

            document.title = `${data.topic.title} - Forum`;
            postBlock(data.topic, topicDetail);
            topicDetail.prepend(el("h1", "", data.topic.title));

            repliesEl.innerHTML = "";
            if (!data.replies.length) {
                repliesEl.appendChild(
                    el(
                        "p",
                        "forum-empty",
                        "Pas encore de réponse. Sois le premier !",
                    ),
                );
            }
            data.replies.forEach((reply) => {
                const block = el("article", "forum-post");
                postBlock(reply, block);
                repliesEl.appendChild(block);
            });
        } catch (err) {
            topicDetail.innerHTML = "";
            topicDetail.appendChild(
                el("p", "", err.message || "Impossible de charger ce sujet."),
            );
            if (replyForm) replyForm.classList.add("hidden");
        }
    }

    // ===== ÉCRIRE =====

    if (createForm) {
        createForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            try {
                const result = await postJson("?p=api/forum/create", {
                    title: document.getElementById("topic-title").value,
                    message: document.getElementById("topic-message").value,
                });
                location.href = `?p=forum&topic=${result.id}`; // on ouvre le sujet créé
            } catch (err) {
                showError("create-error", err.message);
            }
        });
    }

    if (replyForm) {
        replyForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            try {
                await postJson("?p=api/forum/reply", {
                    topic_id: topicId,
                    message: document.getElementById("reply-message").value,
                });
                document.getElementById("reply-message").value = "";
                document.getElementById("reply-error").classList.add("hidden");
                loadTopic();
            } catch (err) {
                showError("reply-error", err.message);
            }
        });
    }

    if (topicId) {
        loadTopic();
    } else {
        loadTopics();
    }
});
