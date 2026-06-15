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
  editingCardId: null,
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
const imageUpload = document.querySelector("#image-upload");
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
let cardsLoadVersion = 0;

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
                  <div class="translation-word">
                    <strong>${escapeHtml(card.english)}</strong>
                    <button class="speak-button" data-action="speak" data-language="english"
                      aria-label="Прослухати англійську вимову слова «${escapeHtml(card.ukrainian)}»"
                      title="Прослухати вимову">
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M4 9v6h4l5 4V5L8 9H4Z"></path>
                        <path d="M16 8.5a5 5 0 0 1 0 7"></path>
                        <path d="M18.5 6a8.5 8.5 0 0 1 0 12"></path>
                      </svg>
                    </button>
                  </div>
                  <p class="pronunciation">${escapeHtml(card.english_pronunciation)}</p>
                </div>
                <div class="divider"></div>
                <div class="translation">
                  <span class="language">🇪🇸 Іспанська</span>
                  <div class="translation-word">
                    <strong>${escapeHtml(card.spanish)}</strong>
                    <button class="speak-button" data-action="speak" data-language="spanish"
                      aria-label="Прослухати іспанську вимову слова «${escapeHtml(card.ukrainian)}»"
                      title="Прослухати вимову">
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M4 9v6h4l5 4V5L8 9H4Z"></path>
                        <path d="M16 8.5a5 5 0 0 1 0 7"></path>
                        <path d="M18.5 6a8.5 8.5 0 0 1 0 12"></path>
                      </svg>
                    </button>
                  </div>
                  <p class="pronunciation">${escapeHtml(card.spanish_pronunciation)}</p>
                </div>
                <div class="back-actions">
                  <button class="learn-button ${card.is_learned ? "active" : ""}" data-action="learned">
                    ${card.is_learned ? "✓ Вивчено" : "Позначити вивченим"}
                  </button>
                  ${
                    card.id.startsWith("demo-")
                      ? `<button class="back-button" data-action="flip">↻ Назад</button>`
                      : `<button class="edit-card-button" data-action="edit">✎ Редагувати</button>`
                  }
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
  const loadVersion = ++cardsLoadVersion;
  const userId = state.user?.id || null;

  if (!db || !state.user) {
    state.cards = [...demoCards];
    render();
    return;
  }

  const { data, error } = await db
    .from("cards")
    .select("*")
    .order("created_at", { ascending: false });

  if (loadVersion !== cardsLoadVersion || state.user?.id !== userId) return;

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
  state.editingCardId = null;
  cardForm.reset();
  imagePreview.removeAttribute("src");
  imagePreview.hidden = true;
  formError.textContent = "";
  document.querySelector("#card-modal-kicker").textContent = "НОВА КАРТКА";
  document.querySelector("#card-modal-title").textContent = "Додати слово";
  saveCardButton.textContent = "Створити картку";
  cardModal.showModal();
}

function openEditModal(card) {
  if (!state.user || card.id.startsWith("demo-")) return;

  state.editingCardId = card.id;
  cardForm.reset();
  cardForm.elements.ukrainian.value = card.ukrainian || "";
  cardForm.elements.english.value = card.english || "";
  cardForm.elements.english_pronunciation.value = card.english_pronunciation || "";
  cardForm.elements.spanish.value = card.spanish || "";
  cardForm.elements.spanish_pronunciation.value = card.spanish_pronunciation || "";
  cardForm.elements.category.value = card.category || "";
  imageInput.value = "";

  if (card.image_url) {
    imagePreview.src = card.image_url;
    imagePreview.hidden = false;
  } else {
    imagePreview.removeAttribute("src");
    imagePreview.hidden = true;
  }

  formError.textContent = "";
  document.querySelector("#card-modal-kicker").textContent = "РЕДАГУВАННЯ";
  document.querySelector("#card-modal-title").textContent = `Картка «${card.ukrainian}»`;
  saveCardButton.textContent = "Зберегти зміни";
  cardModal.showModal();
}

async function uploadImage(file, cardId, suffix = "") {
  if (!file) return { image_url: null, image_path: null };
  if (file.size > 5 * 1024 * 1024) throw new Error("Картинка має бути меншою за 5 МБ");

  const extension = file.name.split(".").pop().toLowerCase();
  const imagePath = `${state.user.id}/${cardId}${suffix}.${extension}`;
  const { error } = await db.storage.from("card-images").upload(imagePath, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;

  const { data } = db.storage.from("card-images").getPublicUrl(imagePath);
  return { image_url: data.publicUrl, image_path: imagePath };
}

async function saveCard(event) {
  event.preventDefault();
  if (!state.user || !db) return;

  const editingCard = state.cards.find((card) => card.id === state.editingCardId) || null;
  formError.textContent = "";
  saveCardButton.disabled = true;
  saveCardButton.textContent = editingCard ? "Зберігаю..." : "Створюю...";

  const formData = new FormData(cardForm);
  const cardId = editingCard?.id || crypto.randomUUID();
  let uploadedPath = null;

  try {
    const newImageFile = imageInput.files[0];
    const image = newImageFile
      ? await uploadImage(newImageFile, cardId, editingCard ? `-${Date.now()}` : "")
      : {
          image_url: editingCard?.image_url || null,
          image_path: editingCard?.image_path || null,
        };
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
      color: editingCard?.color || palette[state.cards.length % palette.length],
    };

    const query = editingCard
      ? db.from("cards").update(card).eq("id", cardId)
      : db.from("cards").insert(card);
    const { data, error } = await query.select().single();
    if (error) throw error;

    if (editingCard) {
      state.cards = state.cards.map((item) => (item.id === cardId ? data : item));
      if (newImageFile && editingCard.image_path && editingCard.image_path !== image.image_path) {
        const { error: imageError } = await db.storage
          .from("card-images")
          .remove([editingCard.image_path]);
        if (imageError) console.error(imageError);
      }
    } else {
      state.cards.unshift(data);
    }

    state.editingCardId = null;
    cardForm.reset();
    imagePreview.removeAttribute("src");
    imagePreview.hidden = true;
    cardModal.close();
    render();
    showToast(editingCard ? "Зміни збережено" : "Картку створено");
  } catch (error) {
    const isNewUpload = uploadedPath && uploadedPath !== editingCard?.image_path;
    if (isNewUpload) await db.storage.from("card-images").remove([uploadedPath]);
    formError.textContent =
      error.message || (editingCard ? "Не вдалося зберегти зміни" : "Не вдалося створити картку");
  } finally {
    saveCardButton.disabled = false;
    saveCardButton.textContent = editingCard ? "Зберегти зміни" : "Створити картку";
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

function speakCard(card, language, button) {
  if (!("speechSynthesis" in window)) {
    showToast("Цей браузер не підтримує озвучення");
    return;
  }

  const isEnglish = language === "english";
  const text = isEnglish ? card.english : card.spanish;
  const languageCode = isEnglish ? "en-US" : "es-ES";
  const utterance = new SpeechSynthesisUtterance(text);
  const voices = speechSynthesis.getVoices();
  const matchingVoice = voices.find((voice) =>
    voice.lang.toLowerCase().startsWith(languageCode.slice(0, 2).toLowerCase()),
  );

  utterance.lang = languageCode;
  utterance.rate = 0.82;
  utterance.pitch = 1;
  if (matchingVoice) utterance.voice = matchingVoice;

  document.querySelectorAll(".speak-button.speaking").forEach((item) => {
    item.classList.remove("speaking");
  });
  button.classList.add("speaking");
  utterance.addEventListener("end", () => button.classList.remove("speaking"));
  utterance.addEventListener("error", () => {
    button.classList.remove("speaking");
    showToast("Не вдалося відтворити вимову");
  });

  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
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
  } else if (actionButton.dataset.action === "speak") {
    speakCard(card, actionButton.dataset.language, actionButton);
  } else if (actionButton.dataset.action === "edit") {
    openEditModal(card);
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
cardForm.addEventListener("submit", saveCard);

document.querySelectorAll("[data-close-modal]").forEach((button) => {
  button.addEventListener("click", () => {
    state.editingCardId = null;
    cardModal.close();
  });
});
document.querySelector("[data-close-profile]").addEventListener("click", () => profileModal.close());

imageInput.addEventListener("change", () => {
  const file = imageInput.files[0];
  if (file) useImageFile(file, false);
});

const allowedImageTypes = ["image/png", "image/jpeg", "image/webp"];
let imageDragDepth = 0;

function showImagePreview(file) {
  if (imagePreview.dataset.objectUrl) {
    URL.revokeObjectURL(imagePreview.dataset.objectUrl);
  }
  const objectUrl = URL.createObjectURL(file);
  imagePreview.dataset.objectUrl = objectUrl;
  imagePreview.src = objectUrl;
  imagePreview.hidden = false;
}

function useImageFile(file, updateInput = true) {
  if (!allowedImageTypes.includes(file.type)) {
    formError.textContent = "Оберіть картинку у форматі PNG, JPG або WebP";
    if (!updateInput) imageInput.value = "";
    return false;
  }
  if (file.size > 5 * 1024 * 1024) {
    formError.textContent = "Картинка має бути меншою за 5 МБ";
    if (!updateInput) imageInput.value = "";
    return false;
  }

  if (updateInput) {
    const transfer = new DataTransfer();
    transfer.items.add(file);
    imageInput.files = transfer.files;
  }

  formError.textContent = "";
  showImagePreview(file);
  return true;
}

["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
  imageUpload.addEventListener(eventName, (event) => {
    event.preventDefault();
    event.stopPropagation();
  });
});

imageUpload.addEventListener("dragenter", () => {
  imageDragDepth += 1;
  imageUpload.classList.add("is-dragging");
});

imageUpload.addEventListener("dragover", (event) => {
  event.dataTransfer.dropEffect = "copy";
});

imageUpload.addEventListener("dragleave", () => {
  imageDragDepth -= 1;
  if (imageDragDepth <= 0) {
    imageDragDepth = 0;
    imageUpload.classList.remove("is-dragging");
  }
});

imageUpload.addEventListener("drop", (event) => {
  imageDragDepth = 0;
  imageUpload.classList.remove("is-dragging");
  const file = event.dataTransfer.files[0];
  if (file) useImageFile(file);
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
    const nextUser = session?.user || null;
    const userChanged = state.user?.id !== nextUser?.id;
    state.user = nextUser;
    renderUser();
    if (userChanged) await loadCards();
  });
}

initialize();
