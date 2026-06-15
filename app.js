const demoCards = [
  {
    id: "demo-book",
    ukrainian: "Книга",
    english: "Book",
    english_pronunciation: "[бук]",
    spanish: "Libro",
    spanish_pronunciation: "[лібро]",
    category: "Речі",
    image_url: "assets/book.png",
    color: "#f1dfc4",
    is_favorite: false,
    is_learned: false,
  },
  {
    id: "demo-apple",
    ukrainian: "Яблуко",
    english: "Apple",
    english_pronunciation: "[епл]",
    spanish: "Manzana",
    spanish_pronunciation: "[мансана]",
    category: "Їжа",
    emoji: "🍎",
    color: "#e5efdb",
    is_favorite: false,
    is_learned: false,
  },
  {
    id: "demo-home",
    ukrainian: "Дім",
    english: "Home",
    english_pronunciation: "[хоум]",
    spanish: "Casa",
    spanish_pronunciation: "[каса]",
    category: "Місця",
    emoji: "🏡",
    color: "#d9eae8",
    is_favorite: false,
    is_learned: false,
  },
  {
    id: "demo-coffee",
    ukrainian: "Кава",
    english: "Coffee",
    english_pronunciation: "[кофі]",
    spanish: "Café",
    spanish_pronunciation: "[кафе]",
    category: "Їжа",
    emoji: "☕",
    color: "#eee0d4",
    is_favorite: false,
    is_learned: false,
  },
  {
    id: "demo-thanks",
    ukrainian: "Дякую",
    english: "Thank you",
    english_pronunciation: "[сенк ю]",
    spanish: "Gracias",
    spanish_pronunciation: "[ґрасіас]",
    category: "Фрази",
    emoji: "🙏",
    color: "#eee0ec",
    is_favorite: false,
    is_learned: false,
  },
  {
    id: "demo-morning",
    ukrainian: "Доброго ранку",
    english: "Good morning",
    english_pronunciation: "[ґуд морнінґ]",
    spanish: "Buenos días",
    spanish_pronunciation: "[буенос діас]",
    category: "Фрази",
    emoji: "🌤️",
    color: "#f3e8bd",
    is_favorite: false,
    is_learned: false,
  },
];

const palette = ["#f1dfc4", "#e5efdb", "#d9eae8", "#eee0d4", "#eee0ec", "#f3e8bd"];
const config = window.SUPABASE_CONFIG || {};
const isConfigured =
  config.url &&
  config.publishableKey &&
  !config.url.includes("YOUR_") &&
  !config.publishableKey.includes("YOUR_");
const db = isConfigured ? window.supabase.createClient(config.url, config.publishableKey) : null;

const state = {
  cards: [...demoCards],
  category: "Усі",
  query: "",
  view: "all",
  user: null,
  quiz: {
    cards: [],
    index: 0,
    correct: 0,
    language: "english",
    locked: false,
  },
};

const grid = document.querySelector("#cards-grid");
const filters = document.querySelector("#filters");
const searchInput = document.querySelector("#search-input");
const visibleCount = document.querySelector("#visible-count");
const emptyState = document.querySelector("#empty-state");
const toast = document.querySelector("#toast");
const authButton = document.querySelector("#auth-button");
const profileButton = document.querySelector("#profile-button");
const cardModal = document.querySelector("#card-modal");
const profileModal = document.querySelector("#profile-modal");
const cardForm = document.querySelector("#card-form");
const imageInput = document.querySelector("#card-image");
const imagePreview = document.querySelector("#image-preview");
const formError = document.querySelector("#form-error");
const saveCardButton = document.querySelector("#save-card-button");
const librarySection = document.querySelector(".library");
const welcomeSection = document.querySelector(".welcome");
const quizPage = document.querySelector("#quiz-page");
const quizLaunchButton = document.querySelector("#quiz-launch-button");
const quizForm = document.querySelector("#quiz-form");
const quizAnswer = document.querySelector("#quiz-answer");
const quizFeedback = document.querySelector("#quiz-feedback");

function escapeHtml(value) {
  const element = document.createElement("div");
  element.textContent = value ?? "";
  return element.innerHTML;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => toast.classList.remove("show"), 2200);
}

function cardLabel(count) {
  const lastTwo = count % 100;
  const last = count % 10;
  if (lastTwo >= 11 && lastTwo <= 14) return "карток";
  if (last === 1) return "картка";
  if (last >= 2 && last <= 4) return "картки";
  return "карток";
}

function renderFilters() {
  const categories = ["Усі", ...new Set(state.cards.map((card) => card.category))];
  if (!categories.includes(state.category)) state.category = "Усі";
  filters.innerHTML = categories
    .map(
      (category) => `
        <button class="filter-button ${state.category === category ? "active" : ""}"
          data-category="${escapeHtml(category)}">${escapeHtml(category)}</button>
      `,
    )
    .join("");
}

function getVisibleCards() {
  const query = state.query.toLocaleLowerCase("uk");
  return state.cards.filter((card) => {
    const matchesCategory = state.category === "Усі" || card.category === state.category;
    const searchable = [card.ukrainian, card.english, card.spanish, card.category]
      .join(" ")
      .toLocaleLowerCase("uk");
    const matchesView =
      state.view === "all" ||
      (state.view === "favorites" && card.is_favorite) ||
      (state.view === "learned" && card.is_learned);
    return matchesCategory && searchable.includes(query) && matchesView;
  });
}

function renderCards() {
  const visibleCards = getVisibleCards();
  visibleCount.textContent = `${visibleCards.length} ${cardLabel(visibleCards.length)}`;
  emptyState.hidden = visibleCards.length !== 0;

  grid.innerHTML = visibleCards
    .map((card) => {
      const visual = card.image_url
        ? `<img src="${escapeHtml(card.image_url)}" alt="${escapeHtml(card.ukrainian)}" />`
        : `<span class="card-emoji" role="img" aria-label="${escapeHtml(card.ukrainian)}">${card.emoji || "✦"}</span>`;

      return `
        <article class="flashcard" data-id="${card.id}">
          <div class="card-inner">
            <div class="card-face card-front">
              <div class="card-image" style="--card-color: ${card.color || palette[0]}">
                ${visual}
                <button class="favorite-button ${card.is_favorite ? "active" : ""}"
                  data-action="favorite"
                  aria-label="${card.is_favorite ? "Прибрати з улюблених" : "Додати в улюблені"}"
                  aria-pressed="${card.is_favorite}">${card.is_favorite ? "♥" : "♡"}</button>
              </div>
              <div class="card-content">
                <span class="category">${escapeHtml(card.category)}</span>
                <h3>${escapeHtml(card.ukrainian)}</h3>
                <span class="flip-hint"><span aria-hidden="true">↻</span> Натисни, щоб перевернути</span>
              </div>
              <button class="card-flip-button" data-action="flip"
                aria-label="Перевернути картку «${escapeHtml(card.ukrainian)}»"></button>
            </div>
            <div class="card-face card-back">
              <button
                class="delete-card-button"
                data-action="delete"
                aria-label="Видалити картку «${escapeHtml(card.ukrainian)}»"
                title="Видалити картку"
              >×</button>
              <div class="translations">
                <div class="translation">
                  <span class="language">🇬🇧 Англійська</span>
                  <strong>${escapeHtml(card.english)}</strong>
                  <p class="pronunciation">${escapeHtml(card.english_pronunciation)}</p>
                </div>
                <div class="divider"></div>
                <div class="translation">
                  <span class="language">🇪🇸 Іспанська</span>
                  <strong>${escapeHtml(card.spanish)}</strong>
                  <p class="pronunciation">${escapeHtml(card.spanish_pronunciation)}</p>
                </div>
                <div class="back-actions">
                  <button class="learn-button ${card.is_learned ? "active" : ""}" data-action="learned">
                    ${card.is_learned ? "✓ Вивчено" : "Позначити вивченим"}
                  </button>
                  <button class="back-button" data-action="flip">↻ Назад</button>
                </div>
              </div>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

function updateQuizButton() {
  const learnedCount = state.cards.filter((card) => card.is_learned).length;
  quizLaunchButton.hidden = state.view !== "learned";
  quizLaunchButton.disabled = learnedCount === 0;
  quizLaunchButton.title = learnedCount ? "" : "Спочатку позначте хоча б одну картку вивченою";
}

function updateProgress() {
  const learned = state.cards.filter((card) => card.is_learned).length;
  const percent = state.cards.length ? Math.round((learned / state.cards.length) * 100) : 0;
  document.querySelector("#learned-count").textContent = learned;
  document.querySelector("#total-count").textContent = state.cards.length;
  document.querySelector("#progress-percent").textContent = `${percent}%`;
  const ring = document.querySelector(".progress-ring");
  ring.style.setProperty("--progress", `${percent}%`);
  ring.setAttribute("aria-label", `Вивчено ${percent} відсотків`);
}

function render() {
  renderFilters();
  renderCards();
  updateProgress();
  updateQuizButton();
}

function shuffleCards(cards) {
  const shuffled = [...cards];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }
  return shuffled;
}

function normalizeAnswer(value) {
  return value.trim().toLocaleLowerCase().replace(/\s+/g, " ");
}

function updateQuizLanguage() {
  const isEnglish = state.quiz.language === "english";
  document.querySelector("#quiz-instruction").textContent =
    `Напиши переклад ${isEnglish ? "англійською" : "іспанською"}.`;
  document.querySelector("#quiz-answer-label").textContent =
    `Твоя відповідь ${isEnglish ? "англійською" : "іспанською"}`;
  document.querySelectorAll("[data-quiz-language]").forEach((button) => {
    button.classList.toggle("active", button.dataset.quizLanguage === state.quiz.language);
  });
}

function closeQuiz() {
  location.reload();
}

function renderQuizQuestion() {
  const card = state.quiz.cards[state.quiz.index];
  if (!card) {
    document.querySelector("#quiz-shell").innerHTML = `
      <div class="quiz-result">
        <p class="section-kicker">QUIZ ЗАВЕРШЕНО</p>
        <h2>Гарна робота!</h2>
        <strong>${state.quiz.correct} / ${state.quiz.cards.length}</strong>
        <p>Правильних відповідей</p>
        <button class="primary-button" id="quiz-finish-button">Повернутися до карток</button>
      </div>
    `;
    document.querySelector("#quiz-progress").textContent = "Готово";
    document.querySelector("#quiz-finish-button").addEventListener("click", closeQuiz);
    return;
  }

  state.quiz.locked = false;
  quizFeedback.hidden = true;
  quizFeedback.className = "quiz-feedback";
  quizAnswer.value = "";
  quizAnswer.disabled = false;
  quizForm.querySelector("button").disabled = false;
  document.querySelector("#quiz-progress").textContent =
    `${state.quiz.index + 1} / ${state.quiz.cards.length}`;
  document.querySelector("#quiz-category").textContent = card.category;
  document.querySelector("#quiz-word").textContent = card.ukrainian;
  updateQuizLanguage();
  quizAnswer.focus();
}

function startQuiz() {
  const learnedCards = state.cards.filter((card) => card.is_learned);
  if (!learnedCards.length) {
    showToast("Спочатку позначте картки вивченими");
    return;
  }

  state.quiz.cards = shuffleCards(learnedCards);
  state.quiz.index = 0;
  state.quiz.correct = 0;
  state.quiz.language = "english";
  welcomeSection.hidden = true;
  librarySection.hidden = true;
  quizPage.hidden = false;
  document.querySelector(".mobile-nav").hidden = true;
  scrollTo({ top: 0, behavior: "smooth" });
  renderQuizQuestion();
}

function checkQuizAnswer(event) {
  event.preventDefault();
  if (state.quiz.locked) return;

  const card = state.quiz.cards[state.quiz.index];
  const expected = card[state.quiz.language];
  const isCorrect = normalizeAnswer(quizAnswer.value) === normalizeAnswer(expected);
  state.quiz.locked = true;
  if (isCorrect) state.quiz.correct += 1;

  quizAnswer.disabled = true;
  quizForm.querySelector("button").disabled = true;
  quizFeedback.hidden = false;
  quizFeedback.classList.add(isCorrect ? "correct" : "incorrect");
  quizFeedback.textContent = isCorrect
    ? "Правильно!"
    : `Неправильно. Правильна відповідь: ${expected}`;

  setTimeout(() => {
    state.quiz.index += 1;
    renderQuizQuestion();
  }, 1100);
}

function renderUser() {
  const metadata = state.user?.user_metadata || {};
  authButton.hidden = Boolean(state.user);
  profileButton.hidden = !state.user;
  if (!state.user) return;

  const name = metadata.full_name || metadata.name || state.user.email || "Користувач";
  profileButton.textContent = name.slice(0, 1).toLocaleUpperCase("uk");
  document.querySelector("#profile-name").textContent = name;
  document.querySelector("#profile-email").textContent = state.user.email || "";
  const photo = document.querySelector("#profile-photo");
  photo.src = metadata.avatar_url || "";
  photo.hidden = !metadata.avatar_url;
}

async function loadCards() {
  if (!db || !state.user) {
    state.cards = [...demoCards];
    render();
    return;
  }

  const { data, error } = await db
    .from("cards")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    showToast("Не вдалося завантажити картки");
    console.error(error);
    return;
  }

  state.cards = data || [];
  render();
}

async function signIn(options = {}) {
  if (!isConfigured) {
    showToast("Спочатку додайте ключі Supabase");
    return;
  }
  if (location.protocol === "file:") {
    showToast("Google-вхід потребує опублікованої адреси сайту");
    return;
  }

  const { error } = await db.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${location.origin}${location.pathname}`,
      queryParams: {
        prompt: "select_account",
        ...(options.loginHint ? { login_hint: options.loginHint } : {}),
      },
    },
  });
  if (error) showToast(error.message);
}

async function switchAccount() {
  if (!db) return;
  profileModal.close();
  const { error } = await db.auth.signOut();
  if (error) {
    showToast(error.message);
    return;
  }
  await signIn();
}

async function addAccount() {
  profileModal.close();
  await signIn();
}

async function signOut() {
  if (!db) return;
  const { error } = await db.auth.signOut();
  if (error) {
    showToast(error.message);
    return;
  }
  profileModal.close();
}

function openCardModal() {
  if (!state.user) {
    showToast(isConfigured ? "Увійдіть через Google, щоб створити картку" : "Спочатку підключіть Supabase");
    if (isConfigured) signIn();
    return;
  }
  formError.textContent = "";
  cardModal.showModal();
}

async function uploadImage(file, cardId) {
  if (!file) return { image_url: null, image_path: null };
  if (file.size > 5 * 1024 * 1024) throw new Error("Картинка має бути меншою за 5 МБ");

  const extension = file.name.split(".").pop().toLowerCase();
  const imagePath = `${state.user.id}/${cardId}.${extension}`;
  const { error } = await db.storage.from("card-images").upload(imagePath, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;

  const { data } = db.storage.from("card-images").getPublicUrl(imagePath);
  return { image_url: data.publicUrl, image_path: imagePath };
}

async function createCard(event) {
  event.preventDefault();
  if (!state.user || !db) return;

  formError.textContent = "";
  saveCardButton.disabled = true;
  saveCardButton.textContent = "Створюю...";

  const formData = new FormData(cardForm);
  const cardId = crypto.randomUUID();
  let uploadedPath = null;

  try {
    const image = await uploadImage(imageInput.files[0], cardId);
    uploadedPath = image.image_path;
    const card = {
      id: cardId,
      user_id: state.user.id,
      ukrainian: formData.get("ukrainian").trim(),
      english: formData.get("english").trim(),
      english_pronunciation: formData.get("english_pronunciation").trim(),
      spanish: formData.get("spanish").trim(),
      spanish_pronunciation: formData.get("spanish_pronunciation").trim(),
      category: formData.get("category").trim(),
      image_url: image.image_url,
      image_path: image.image_path,
      color: palette[state.cards.length % palette.length],
    };

    const { data, error } = await db.from("cards").insert(card).select().single();
    if (error) throw error;

    state.cards.unshift(data);
    cardForm.reset();
    imagePreview.hidden = true;
    cardModal.close();
    render();
    showToast("Картку створено");
  } catch (error) {
    if (uploadedPath) await db.storage.from("card-images").remove([uploadedPath]);
    formError.textContent = error.message || "Не вдалося створити картку";
  } finally {
    saveCardButton.disabled = false;
    saveCardButton.textContent = "Створити картку";
  }
}

async function toggleCardValue(card, field) {
  if (!state.user || !db || card.id.startsWith("demo-")) {
    showToast("Увійдіть, щоб зберігати прогрес між пристроями");
    return;
  }

  const nextValue = !card[field];
  const { error } = await db.from("cards").update({ [field]: nextValue }).eq("id", card.id);
  if (error) {
    showToast("Не вдалося зберегти зміну");
    return;
  }
  card[field] = nextValue;
  renderCards();
  updateProgress();
}

async function deleteCard(card) {
  if (!state.user || !db || card.id.startsWith("demo-")) {
    showToast("Демонстраційну картку не можна видалити");
    return;
  }

  const confirmed = confirm(`Точно видалити картку «${card.ukrainian}»?`);
  if (!confirmed) return;

  const { error } = await db.from("cards").delete().eq("id", card.id);
  if (error) {
    showToast("Не вдалося видалити картку");
    return;
  }

  if (card.image_path) {
    const { error: imageError } = await db.storage
      .from("card-images")
      .remove([card.image_path]);
    if (imageError) console.error(imageError);
  }

  state.cards = state.cards.filter((item) => item.id !== card.id);
  render();
  showToast(`Картку «${card.ukrainian}» видалено`);
}

filters.addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  state.category = button.dataset.category;
  render();
});

searchInput.addEventListener("input", (event) => {
  state.query = event.target.value.trim();
  renderCards();
});

grid.addEventListener("click", async (event) => {
  const actionButton = event.target.closest("[data-action]");
  const cardElement = event.target.closest(".flashcard");
  if (!cardElement) return;
  const card = state.cards.find((item) => item.id === cardElement.dataset.id);
  if (!card) return;

  if (!actionButton) {
    cardElement.classList.toggle("flipped");
    return;
  }

  if (actionButton.dataset.action === "flip") {
    cardElement.classList.toggle("flipped");
  } else if (actionButton.dataset.action === "favorite") {
    await toggleCardValue(card, "is_favorite");
  } else if (actionButton.dataset.action === "learned") {
    await toggleCardValue(card, "is_learned");
  } else if (actionButton.dataset.action === "delete") {
    await deleteCard(card);
  }
});

document.querySelectorAll("[data-view]").forEach((button) => {
  button.addEventListener("click", () => {
    state.view = button.dataset.view;
    document.querySelectorAll("[data-view]").forEach((item) => {
      item.classList.toggle("active", item.dataset.view === state.view);
    });
    renderCards();
    updateQuizButton();
  });
});

quizLaunchButton.addEventListener("click", startQuiz);
document.querySelector("#quiz-back-button").addEventListener("click", closeQuiz);
quizForm.addEventListener("submit", checkQuizAnswer);
document.querySelector(".quiz-language-switch").addEventListener("click", (event) => {
  const button = event.target.closest("[data-quiz-language]");
  if (!button || state.quiz.locked) return;
  state.quiz.language = button.dataset.quizLanguage;
  updateQuizLanguage();
  quizAnswer.focus();
});

document.querySelector("#add-card-button").addEventListener("click", openCardModal);
authButton.addEventListener("click", signIn);
profileButton.addEventListener("click", () => profileModal.showModal());
document.querySelector("#sign-out-button").addEventListener("click", signOut);
document.querySelector("#switch-account-button").addEventListener("click", switchAccount);
document.querySelector("#add-account-button").addEventListener("click", addAccount);
cardForm.addEventListener("submit", createCard);

document.querySelectorAll("[data-close-modal]").forEach((button) => {
  button.addEventListener("click", () => cardModal.close());
});
document.querySelector("[data-close-profile]").addEventListener("click", () => profileModal.close());

imageInput.addEventListener("change", () => {
  const file = imageInput.files[0];
  if (!file) {
    imagePreview.hidden = true;
    return;
  }
  imagePreview.src = URL.createObjectURL(file);
  imagePreview.hidden = false;
});

[cardModal, profileModal].forEach((modal) => {
  modal.addEventListener("click", (event) => {
    if (event.target === modal) modal.close();
  });
});

const savedTheme =
  localStorage.getItem("theme") ||
  (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
document.documentElement.dataset.theme = savedTheme;

document.querySelector(".theme-toggle").addEventListener("click", () => {
  const theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("theme", theme);
});

async function initialize() {
  render();
  if (!db) return;

  const { data } = await db.auth.getSession();
  state.user = data.session?.user || null;
  renderUser();
  await loadCards();

  db.auth.onAuthStateChange(async (_event, session) => {
    state.user = session?.user || null;
    renderUser();
    await loadCards();
  });
}

initialize();
