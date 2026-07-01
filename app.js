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
const ADMIN_EMAILS = [
  "dobjanskiy51@gmail.com",
  "lyudmiladobshanska@gmail.com",
  "petrostanislav@gmail.com",
  "dobzhansky.igor@gmail.com",
];
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
  swipeQuiz: {
    cards: [],
    mode: "unlearned",
    known: 0,
    unknown: 0,
    isAnimating: false,
  },
  editingCardId: null,
  cardDraftVisibility: "public",
};

const grid = document.querySelector("#cards-grid");
const filters = document.querySelector("#filters");
const searchInput = document.querySelector("#search-input");
const visibleCount = document.querySelector("#visible-count");
const emptyState = document.querySelector("#empty-state");
const toast = document.querySelector("#toast");
const authButton = document.querySelector("#auth-button");
const profileButton = document.querySelector("#profile-button");
const addPrivateCardButton = document.querySelector("#add-private-card-button");
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
const quizOptions = document.querySelector("#quiz-options");
const quizShell = document.querySelector("#quiz-shell");
const swipeQuiz = document.querySelector("#swipe-quiz");
const swipeStack = document.querySelector("#swipe-stack");
const quizLaunchButton = document.querySelector("#quiz-launch-button");
const quizForm = document.querySelector("#quiz-form");
const quizAnswer = document.querySelector("#quiz-answer");
const quizFeedback = document.querySelector("#quiz-feedback");
let cardsLoadVersion = 0;

const translationFallbacks = {
  "книга": { english: "Book", spanish: "Libro" },
  "яблуко": { english: "Apple", spanish: "Manzana" },
  "дім": { english: "Home", spanish: "Casa" },
  "кава": { english: "Coffee", spanish: "Café" },
  "дякую": { english: "Thank you", spanish: "Gracias" },
  "доброго ранку": { english: "Good morning", spanish: "Buenos días" },
  "вода": { english: "Water", spanish: "Agua" },
  "їжа": { english: "Food", spanish: "Comida" },
  "кавун": { english: "Watermelon", spanish: "Sandía" },
  "груша": { english: "Pear", spanish: "Pera" },
  "ананас": { english: "Pineapple", spanish: "Piña" },
  "холодильник": { english: "Refrigerator", spanish: "Refrigerador" },
  "овочі": { english: "Vegetables", spanish: "Verduras" },
  "чайник": { english: "Kettle", spanish: "Pava" },
  "паспорт": { english: "Passport", spanish: "Pasaporte" },
  "квиток": { english: "Ticket", spanish: "Boleto" },
  "білет": { english: "Ticket", spanish: "Boleto" },
  "автобус": { english: "Bus", spanish: "Autobús" },
  "таксі": { english: "Taxi", spanish: "Taxi" },
  "готель": { english: "Hotel", spanish: "Hotel" },
  "аеропорт": { english: "Airport", spanish: "Aeropuerto" },
  "документ": { english: "Document", spanish: "Documento" },
  "де?": { english: "Where?", spanish: "¿Dónde?" },
  "хто": { english: "Who?", spanish: "¿Quién?" },
  "що?": { english: "What?", spanish: "¿Qué?" },
  "скільки?": { english: "How much?", spanish: "¿Cuánto?" },
};

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

function currentUserEmail() {
  return (state.user?.email || "").trim().toLocaleLowerCase("uk");
}

function isCurrentUserAdmin() {
  return ADMIN_EMAILS.includes(currentUserEmail());
}

function isDemoCard(card) {
  return card.id?.startsWith("demo-");
}

function isOwnCard(card) {
  return Boolean(state.user?.id && card.user_id === state.user.id);
}

function isSharedCard(card) {
  return isDemoCard(card) || Boolean(card.is_public);
}

function canManageCard(card) {
  return !isDemoCard(card) && (isOwnCard(card) || isCurrentUserAdmin());
}

function normalizeLookup(value) {
  return value.trim().toLocaleLowerCase("uk").replace(/\s+/g, " ");
}

function setAdvancedFieldsVisible(isVisible) {
  document.querySelectorAll(".advanced-card-field").forEach((field) => {
    field.hidden = !isVisible;
    field.querySelectorAll("input").forEach((input) => {
      if (input.type !== "file") input.required = isVisible;
    });
  });
}

function transliterateToUkrainianSounds(value, language) {
  const phrase = value
    .toLocaleLowerCase()
    .replace(/[¿¡]/g, "")
    .replace(/[.,!?]/g, "")
    .trim();

  const words = phrase.split(/\s+/).map((word) => {
    let result = word;
    const replacements = language === "english"
      ? [
          [/tion/g, "шн"], [/th/g, "с"], [/sh/g, "ш"], [/ch/g, "ч"], [/oo/g, "у"],
          [/ee/g, "і"], [/ea/g, "і"], [/ou/g, "ау"], [/ow/g, "ау"], [/ai/g, "ей"],
          [/ay/g, "ей"], [/ph/g, "ф"], [/ck/g, "к"], [/qu/g, "кв"], [/w/g, "в"],
          [/y/g, "і"], [/j/g, "дж"], [/x/g, "кс"], [/a/g, "а"], [/b/g, "б"],
          [/c/g, "к"], [/d/g, "д"], [/e/g, "е"], [/f/g, "ф"], [/g/g, "г"],
          [/h/g, "х"], [/i/g, "і"], [/k/g, "к"], [/l/g, "л"], [/m/g, "м"],
          [/n/g, "н"], [/o/g, "о"], [/p/g, "п"], [/q/g, "к"], [/r/g, "р"],
          [/s/g, "с"], [/t/g, "т"], [/u/g, "у"], [/v/g, "в"], [/z/g, "з"],
        ]
      : [
          [/ll/g, "й"], [/ñ/g, "нь"], [/ch/g, "ч"], [/qu/g, "к"], [/gue/g, "ге"],
          [/gui/g, "гі"], [/j/g, "х"], [/ge/g, "хе"], [/gi/g, "хі"], [/ce/g, "се"],
          [/ci/g, "сі"], [/z/g, "с"], [/v/g, "б"], [/y/g, "й"], [/a/g, "а"],
          [/b/g, "б"], [/c/g, "к"], [/d/g, "д"], [/e/g, "е"], [/f/g, "ф"],
          [/g/g, "г"], [/h/g, ""], [/i/g, "і"], [/k/g, "к"], [/l/g, "л"],
          [/m/g, "м"], [/n/g, "н"], [/o/g, "о"], [/p/g, "п"], [/r/g, "р"],
          [/s/g, "с"], [/t/g, "т"], [/u/g, "у"], [/x/g, "кс"],
        ];
    replacements.forEach(([pattern, replacement]) => {
      result = result.replace(pattern, replacement);
    });
    return result;
  });

  return `[${words.join(" ")}]`;
}

async function translateWord(word, targetLanguage) {
  const url = new URL("https://api.mymemory.translated.net/get");
  url.searchParams.set("q", word);
  url.searchParams.set("langpair", `uk|${targetLanguage}`);

  const response = await fetch(url.toString());
  if (!response.ok) throw new Error("translation failed");
  const data = await response.json();
  const translatedText = data?.responseData?.translatedText?.trim();
  if (!translatedText) throw new Error("empty translation");
  return translatedText;
}

function chooseVisualKind(card) {
  const lookup = normalizeLookup(`${card.ukrainian} ${card.english} ${card.spanish} ${card.category}`);
  const checks = [
    ["watermelon", /кавун|watermelon|sand[ií]a/],
    ["pear", /груша|pear|pera/],
    ["pineapple", /ананас|pineapple|pi[ñn]a/],
    ["refrigerator", /холодильник|fridge|refrigerator|refrigerador/],
    ["kettle", /чайник|kettle|pava|tetera/],
    ["vegetables", /овоч|vegetable|verdura|їжа|food|comida/],
    ["money", /скільки|кошту|грош|money|cash|price|cost|cu[aá]nto|dinero/],
    ["toilet", /туалет|toilet|ba[ñn]o|bathroom/],
    ["document", /паспорт|документ|квиток|білет|passport|document|ticket|boleto/],
    ["transport", /автобус|таксі|bus|taxi|autob[uú]s/],
    ["building", /готель|аеропорт|hotel|airport|aeropuerto|будівл|заклад/],
    ["phrase", /де|хто|що|чому|коли|фраз|where|who|what|why|when|d[oó]nde|qui[eé]n|qu[eé]/],
  ];
  return checks.find(([, pattern]) => pattern.test(lookup))?.[0] || "generic";
}

function generatedObjectSvg(kind) {
  const objects = {
    watermelon: `
      <g filter="url(#softShadow)">
        <circle cx="410" cy="330" r="132" fill="url(#watermelonSkin)"/>
        <path d="M492 345c122 22 214 96 204 164-10 70-118 103-240 80s-214-96-204-165c10-69 118-102 240-79Z" fill="#79a844"/>
        <path d="M499 364c100 18 176 75 169 128-8 53-96 76-196 58s-176-75-169-128c7-53 96-76 196-58Z" fill="#ff695b"/>
        <path d="M279 424c11 61 97 111 193 128 86 16 166 1 193-35" fill="none" stroke="#f8f5d2" stroke-width="18" stroke-linecap="round"/>
        <ellipse cx="468" cy="446" rx="9" ry="17" fill="#313233" transform="rotate(-18 468 446)"/>
        <ellipse cx="535" cy="466" rx="9" ry="17" fill="#313233" transform="rotate(-18 535 466)"/>
        <ellipse cx="593" cy="431" rx="9" ry="17" fill="#313233" transform="rotate(-18 593 431)"/>
      </g>`,
    pear: `
      <g filter="url(#softShadow)">
        <path d="M394 250c-12-79 109-87 105 1 68 27 103 104 74 179-33 86-188 93-231 8-38-76-15-156 52-188Z" fill="url(#pearFill)"/>
        <path d="M487 234c21-50 40-72 69-88" stroke="#8d5a2a" stroke-width="24" stroke-linecap="round"/>
        <path d="M467 191c-71-15-116 17-139 69 74 18 119-8 139-69Z" fill="#70b641"/>
        <path d="M545 322c70 15 118 72 107 128-12 58-84 88-155 73s-119-72-107-129 84-87 155-72Z" fill="#fff4d5"/>
        <ellipse cx="524" cy="424" rx="12" ry="22" fill="#9b6b30"/>
        <ellipse cx="564" cy="432" rx="12" ry="22" fill="#9b6b30"/>
      </g>`,
    pineapple: `
      <g filter="url(#softShadow)">
        <path d="M414 225c-47-57-33-123 4-169 22 51 19 92-4 169Z" fill="#4d9732"/>
        <path d="M459 230c-13-83 14-135 72-172 0 72-22 123-72 172Z" fill="#4e9e38"/>
        <path d="M381 237c-63-48-81-103-58-160 39 54 59 99 58 160Z" fill="#65ad3f"/>
        <ellipse cx="454" cy="397" rx="128" ry="164" fill="url(#pineappleFill)"/>
        ${Array.from({ length: 7 }, (_, row) =>
          Array.from({ length: 5 }, (_, col) => {
            const x = 356 + col * 48 + (row % 2) * 22;
            const y = 280 + row * 38;
            return `<path d="M${x} ${y}q24 18 0 36q-24-18 0-36Z" fill="#dd8b16" opacity=".42"/>`;
          }).join("")
        ).join("")}
        <ellipse cx="575" cy="455" rx="118" ry="78" fill="#ffe46f"/>
        <circle cx="575" cy="455" r="38" fill="#ffd95c" opacity=".55"/>
      </g>`,
    refrigerator: `
      <g filter="url(#softShadow)">
        <rect x="328" y="140" width="244" height="390" rx="36" fill="url(#metalFill)"/>
        <rect x="446" y="140" width="10" height="390" rx="5" fill="#55575d"/>
        <rect x="342" y="525" width="60" height="24" rx="12" fill="#585b62"/>
        <rect x="498" y="525" width="60" height="24" rx="12" fill="#585b62"/>
      </g>`,
    kettle: `
      <g filter="url(#softShadow)">
        <path d="M350 254h205c42 0 76 34 76 76v160H292V312c0-32 26-58 58-58Z" fill="url(#creamFill)"/>
        <path d="M305 322l-83 31 83 70Z" fill="#aaa0ca"/>
        <path d="M620 324c89-40 116 107 8 135" fill="none" stroke="#aaa0ca" stroke-width="46" stroke-linecap="round"/>
        <rect x="397" y="176" width="172" height="54" rx="27" fill="#aaa0ca"/>
        <rect x="383" y="482" width="270" height="58" rx="29" fill="#aaa0ca"/>
        <rect x="448" y="334" width="52" height="148" rx="24" fill="#8d8fa2"/>
      </g>`,
    vegetables: `
      <g filter="url(#softShadow)">
        <circle cx="356" cy="345" r="72" fill="#78b844"/>
        <ellipse cx="450" cy="396" rx="62" ry="112" fill="#8fc74b"/>
        <ellipse cx="555" cy="360" rx="70" ry="96" fill="#a8d464"/>
        <circle cx="520" cy="455" r="62" fill="#f05d44"/>
        <ellipse cx="387" cy="480" rx="130" ry="38" fill="#6db454"/>
        <ellipse cx="309" cy="450" rx="104" ry="44" fill="#ff9e3d"/>
        <ellipse cx="618" cy="470" rx="82" ry="50" fill="#f2e5cd"/>
        <circle cx="641" cy="382" r="58" fill="#d79a4a"/>
      </g>`,
    money: `
      <g filter="url(#softShadow)">
        <rect x="314" y="246" width="260" height="148" rx="18" fill="#b6acd4" transform="rotate(-7 444 320)"/>
        <rect x="360" y="216" width="248" height="148" rx="18" fill="#efe5cd" transform="rotate(11 484 290)"/>
        <circle cx="486" cy="293" r="38" fill="#a69acb"/>
        <path d="M474 293h24M486 278v30" stroke="#f8efd8" stroke-width="12" stroke-linecap="round"/>
        <rect x="600" y="280" width="124" height="72" rx="14" fill="#aaa0ca" transform="rotate(10 662 316)"/>
        <circle cx="608" cy="440" r="36" fill="#aaa0ca"/>
        <circle cx="653" cy="450" r="36" fill="#aaa0ca"/>
      </g>`,
    toilet: `
      <g filter="url(#softShadow)">
        <rect x="500" y="150" width="164" height="228" rx="24" fill="#f8f7ef"/>
        <path d="M331 310h240c20 0 34 20 28 39l-32 99c-14 43-54 72-99 72H347c-45 0-82-37-82-82v-61c0-37 29-67 66-67Z" fill="#f8f7ef"/>
        <ellipse cx="424" cy="350" rx="128" ry="47" fill="#dedbd0"/>
        <ellipse cx="424" cy="342" rx="98" ry="27" fill="#ffffff"/>
      </g>`,
    document: `
      <g filter="url(#softShadow)">
        <rect x="340" y="196" width="242" height="320" rx="24" fill="#fff7e8" transform="rotate(-5 461 356)"/>
        <rect x="390" y="158" width="244" height="320" rx="24" fill="#efe7d8" transform="rotate(8 512 318)"/>
        <rect x="414" y="238" width="146" height="20" rx="10" fill="#aaa0ca"/>
        <rect x="414" y="292" width="122" height="18" rx="9" fill="#c9bfdc"/>
        <rect x="414" y="340" width="156" height="18" rx="9" fill="#c9bfdc"/>
        <circle cx="510" cy="425" r="46" fill="#ef786a" opacity=".75"/>
      </g>`,
    transport: `
      <g filter="url(#softShadow)">
        <rect x="276" y="258" width="356" height="190" rx="44" fill="#f5c95b"/>
        <rect x="326" y="286" width="86" height="58" rx="15" fill="#dbeeea"/>
        <rect x="434" y="286" width="118" height="58" rx="15" fill="#dbeeea"/>
        <rect x="256" y="380" width="396" height="48" rx="24" fill="#ef786a"/>
        <circle cx="356" cy="452" r="36" fill="#57595f"/>
        <circle cx="560" cy="452" r="36" fill="#57595f"/>
      </g>`,
    building: `
      <g filter="url(#softShadow)">
        <rect x="306" y="202" width="290" height="306" rx="30" fill="#efe7d8"/>
        <rect x="356" y="250" width="64" height="64" rx="14" fill="#9ecfc3"/>
        <rect x="478" y="250" width="64" height="64" rx="14" fill="#9ecfc3"/>
        <rect x="356" y="348" width="64" height="64" rx="14" fill="#9ecfc3"/>
        <rect x="478" y="348" width="64" height="64" rx="14" fill="#9ecfc3"/>
        <rect x="420" y="430" width="66" height="78" rx="22" fill="#aaa0ca"/>
        <path d="M282 205h338l-169-86Z" fill="#ef786a"/>
      </g>`,
    phrase: `
      <g filter="url(#softShadow)">
        <path d="M308 218h292c55 0 100 45 100 100v54c0 55-45 100-100 100H468l-98 72 24-72h-86c-55 0-100-45-100-100v-54c0-55 45-100 100-100Z" fill="#fff7e8"/>
        <circle cx="392" cy="348" r="28" fill="#aaa0ca"/>
        <circle cx="476" cy="348" r="28" fill="#aaa0ca"/>
        <circle cx="560" cy="348" r="28" fill="#aaa0ca"/>
      </g>`,
    generic: `
      <g filter="url(#softShadow)">
        <rect x="326" y="220" width="250" height="250" rx="54" fill="url(#creamFill)" transform="rotate(-8 451 345)"/>
        <rect x="420" y="172" width="166" height="166" rx="42" fill="#aaa0ca" opacity=".92" transform="rotate(13 503 255)"/>
        <circle cx="544" cy="424" r="78" fill="#ef786a" opacity=".78"/>
      </g>`,
  };
  return objects[kind] || objects.generic;
}

function createGeneratedImage(card) {
  const accent = card.color || palette[0];
  const kind = chooseVisualKind(card);
  const coolBackground = ["refrigerator", "transport", "building"].includes(kind);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 640">
      <defs>
        <radialGradient id="bg" cx="50%" cy="45%" r="78%">
          <stop offset="0%" stop-color="${coolBackground ? "#edf8f2" : "#fff7e8"}"/>
          <stop offset="100%" stop-color="${coolBackground ? "#d8eee6" : "#f8e5cf"}"/>
        </radialGradient>
        <radialGradient id="stage" cx="45%" cy="38%" r="72%">
          <stop offset="0%" stop-color="#ffe8bc"/>
          <stop offset="100%" stop-color="${accent}"/>
        </radialGradient>
        <linearGradient id="creamFill" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#fff5dd"/>
          <stop offset="100%" stop-color="#d8c4a4"/>
        </linearGradient>
        <linearGradient id="metalFill" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#d8d9dc"/>
          <stop offset="100%" stop-color="#8f9299"/>
        </linearGradient>
        <linearGradient id="pearFill" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#fff46a"/>
          <stop offset="100%" stop-color="#aec93c"/>
        </linearGradient>
        <linearGradient id="pineappleFill" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#ffc84e"/>
          <stop offset="100%" stop-color="#d47b18"/>
        </linearGradient>
        <radialGradient id="watermelonSkin" cx="40%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#b7d95d"/>
          <stop offset="100%" stop-color="#517f35"/>
        </radialGradient>
        <filter id="softShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="28" stdDeviation="18" flood-color="#7d6658" flood-opacity=".22"/>
        </filter>
      </defs>
      <rect width="900" height="640" rx="48" fill="url(#bg)"/>
      <circle cx="450" cy="332" r="244" fill="url(#stage)" opacity=".72"/>
      <path d="M190 230c-38 35-36 80 7 118" fill="none" stroke="#9f88d6" stroke-width="26" stroke-linecap="round"/>
      <path d="M705 95c23 57 68 25 77 78-54 6-29 54-81 75-23-54-68-27-78-78 54-8 29-55 82-75Z" fill="#a491db"/>
      <circle cx="194" cy="520" r="22" fill="#a491db"/>
      <circle cx="764" cy="384" r="20" fill="#a491db"/>
      ${generatedObjectSvg(kind)}
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

async function buildAutomaticCardFields(ukrainian, category, color) {
  const fallback = translationFallbacks[normalizeLookup(ukrainian)] || null;
  let english = fallback?.english;
  let spanish = fallback?.spanish;

  try {
    english ||= await translateWord(ukrainian, "en");
    spanish ||= await translateWord(ukrainian, "es");
  } catch (error) {
    if (!english || !spanish) {
      throw new Error("Не вдалося автоматично перекласти слово. Спробуйте ще раз або відкрийте редагування після створення.");
    }
  }

  const card = {
    ukrainian,
    category,
    english,
    spanish,
    english_pronunciation: transliterateToUkrainianSounds(english, "english"),
    spanish_pronunciation: transliterateToUkrainianSounds(spanish, "spanish"),
    color,
  };

  return {
    ...card,
    image_url: createGeneratedImage(card),
    image_path: null,
  };
}

function cardLabel(count) {
  const lastTwo = count % 100;
  const last = count % 10;
  if (lastTwo >= 11 && lastTwo <= 14) return "карток";
  if (last === 1) return "картка";
  if (last >= 2 && last <= 4) return "картки";
  return "карток";
}

function getCardsForCurrentView() {
  if (state.view === "mine") return state.cards.filter((card) => isOwnCard(card));
  if (state.view === "favorites") return state.cards.filter((card) => card.is_favorite);
  if (state.view === "learned") return state.cards.filter((card) => card.is_learned);
  return state.cards.filter((card) => isSharedCard(card));
}

function renderFilters() {
  const categories = ["Усі", ...new Set(getCardsForCurrentView().map((card) => card.category))];
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
  return getCardsForCurrentView().filter((card) => {
    const matchesCategory = state.category === "Усі" || card.category === state.category;
    const searchable = [card.ukrainian, card.english, card.spanish, card.category]
      .join(" ")
      .toLocaleLowerCase("uk");
    return matchesCategory && searchable.includes(query);
  });
}

function renderCards() {
  const visibleCards = getVisibleCards();
  visibleCount.textContent = `${visibleCards.length} ${cardLabel(visibleCards.length)}`;
  emptyState.hidden = visibleCards.length !== 0;

  grid.innerHTML = visibleCards
    .map((card) => {
      const canManage = canManageCard(card);
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
              ${
                canManage
                  ? `<button
                      class="delete-card-button"
                      data-action="delete"
                      aria-label="Видалити картку «${escapeHtml(card.ukrainian)}»"
                      title="Видалити картку"
                    >×</button>`
                  : ""
              }
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
                    canManage
                      ? `<button class="edit-card-button" data-action="edit">✎ Редагувати</button>`
                      : isDemoCard(card)
                      ? `<button class="back-button" data-action="flip">↻ Назад</button>`
                      : ""
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
  quizLaunchButton.hidden = false;
  quizLaunchButton.disabled = false;
  quizLaunchButton.title = "";
}

function updateLibraryHeading() {
  const titles = {
    all: "Усі картки",
    mine: "Мої картки",
    favorites: "Улюблені",
    learned: "Вивчені",
  };
  document.querySelector("#library-title").textContent = titles[state.view] || titles.all;
}

function updateNavigation() {
  document.querySelectorAll("[data-view]").forEach((item) => {
    item.classList.toggle("active", item.dataset.view === state.view);
  });
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
  updateNavigation();
  updateLibraryHeading();
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

function openQuizMenu() {
  welcomeSection.hidden = true;
  librarySection.hidden = true;
  quizPage.hidden = false;
  quizOptions.hidden = false;
  quizShell.hidden = true;
  swipeQuiz.hidden = true;
  document.querySelector("#quiz-progress").textContent = "Оберіть режим";
  document.querySelector(".mobile-nav").hidden = true;
  scrollTo({ top: 0, behavior: "smooth" });
}

function updateSwipeStatus() {
  const total = state.swipeQuiz.cards.length + state.swipeQuiz.known + state.swipeQuiz.unknown;
  const done = state.swipeQuiz.known + state.swipeQuiz.unknown;
  document.querySelector("#swipe-left-count").textContent = `Не знаю: ${state.swipeQuiz.unknown}`;
  document.querySelector("#swipe-right-count").textContent = `Знаю: ${state.swipeQuiz.known}`;
  document.querySelector("#swipe-progress").textContent = `${done} / ${total}`;
}

function renderSwipeStack() {
  updateSwipeStatus();
  const cards = state.swipeQuiz.cards;

  if (!cards.length) {
    swipeStack.innerHTML = `
      <div class="swipe-result">
        <p class="section-kicker">QUIZ ЗАВЕРШЕНО</p>
        <h3>Готово!</h3>
        <p>Знаю: ${state.swipeQuiz.known}. Не знаю: ${state.swipeQuiz.unknown}.</p>
        <button class="primary-button" type="button" id="swipe-finish-button">Повернутися до карток</button>
      </div>
    `;
    document.querySelector("#swipe-finish-button").addEventListener("click", closeQuiz);
    return;
  }

  swipeStack.innerHTML = cards
    .slice(0, 4)
    .map((card, index) => {
      const offset = index * 10;
      const rotation = (index - 1) * 4;
      const image = card.image_url
        ? `<img src="${escapeHtml(card.image_url)}" alt="${escapeHtml(card.ukrainian)}" />`
        : `<div class="card-emoji">${card.emoji || "✦"}</div>`;
      return `
        <article
          class="swipe-card"
          data-id="${escapeHtml(card.id)}"
          style="--stack-offset:${offset}px; --stack-rotate:${rotation}deg; --stack-scale:${1 - index * 0.04}; z-index:${20 - index};"
        >
          <div class="swipe-card-inner">
            <div class="swipe-card-face swipe-card-front">
              <div class="swipe-card-image">${image}</div>
              <span>${escapeHtml(card.category)}</span>
              <h3>${escapeHtml(card.ukrainian)}</h3>
              <p>Натисни, щоб перевірити переклад. Вправо — знаю, вліво — не знаю.</p>
            </div>
            <div class="swipe-card-face swipe-card-back">
              <span>Відповідь</span>
              <h3>${escapeHtml(card.ukrainian)}</h3>
              <div class="swipe-answer-list">
                <p><strong>English:</strong> ${escapeHtml(card.english)} <small>${escapeHtml(card.english_pronunciation || "")}</small></p>
                <p><strong>Español:</strong> ${escapeHtml(card.spanish)} <small>${escapeHtml(card.spanish_pronunciation || "")}</small></p>
              </div>
              <p>Тепер обери: знаєш це слово чи треба повторити.</p>
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  setupSwipeCard();
}

async function markSwipeCard(card, isKnown) {
  if (state.swipeQuiz.isAnimating) return;
  state.swipeQuiz.isAnimating = true;

  if (isKnown) {
    state.swipeQuiz.known += 1;
    if (state.swipeQuiz.mode === "unlearned" && !card.is_learned && !isDemoCard(card) && db && state.user) {
      const saved = await setCardValue(card, "is_learned", true);
      if (!saved) {
        state.swipeQuiz.known -= 1;
        state.swipeQuiz.isAnimating = false;
        return;
      }
    }
  } else {
    state.swipeQuiz.unknown += 1;
    if (state.swipeQuiz.mode === "learned" && card.is_learned && !isDemoCard(card) && db && state.user) {
      const saved = await setCardValue(card, "is_learned", false);
      if (!saved) {
        state.swipeQuiz.unknown -= 1;
        state.swipeQuiz.isAnimating = false;
        return;
      }
    }
  }

  state.swipeQuiz.cards.shift();
  state.swipeQuiz.isAnimating = false;
  renderSwipeStack();
  updateProgress();
}

function setupSwipeCard() {
  const topCard = swipeStack.querySelector(".swipe-card");
  if (!topCard) return;
  const card = state.swipeQuiz.cards[0];
  let startX = 0;
  let startY = 0;
  let currentX = 0;
  let currentY = 0;
  let dragging = false;
  let hasMoved = false;

  const moveCard = () => {
    const rotate = currentX / 16;
    topCard.style.transform = `translate(${currentX}px, ${currentY}px) rotate(${rotate}deg)`;
    topCard.classList.toggle("swiping-known", currentX > 70);
    topCard.classList.toggle("swiping-unknown", currentX < -70);
  };

  topCard.addEventListener("pointerdown", (event) => {
    dragging = true;
    hasMoved = false;
    startX = event.clientX;
    startY = event.clientY;
    topCard.setPointerCapture(event.pointerId);
    topCard.classList.add("is-dragging");
  });

  topCard.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    currentX = event.clientX - startX;
    currentY = event.clientY - startY;
    if (Math.abs(currentX) > 8 || Math.abs(currentY) > 8) hasMoved = true;
    moveCard();
  });

  topCard.addEventListener("pointerup", async () => {
    if (!dragging) return;
    dragging = false;
    topCard.classList.remove("is-dragging");

    if (!hasMoved) {
      topCard.classList.toggle("is-flipped");
      currentX = 0;
      currentY = 0;
      topCard.style.transform = "";
      topCard.classList.remove("swiping-known", "swiping-unknown");
      return;
    }

    if (currentX > 120) {
      topCard.classList.add("fly-right");
      setTimeout(() => markSwipeCard(card, true), 220);
      return;
    }

    if (currentX < -120) {
      topCard.classList.add("fly-left");
      setTimeout(() => markSwipeCard(card, false), 220);
      return;
    }

    currentX = 0;
    currentY = 0;
    topCard.style.transform = "";
    topCard.classList.remove("swiping-known", "swiping-unknown");
  });
}

function openSwipeQuiz(mode = "unlearned") {
  const isLearnedMode = mode === "learned";
  const quizCards = state.cards.filter((card) => (isLearnedMode ? card.is_learned : !card.is_learned));
  if (!quizCards.length) {
    showToast(isLearnedMode ? "Поки немає вивчених карток" : "Усі картки вже вивчені");
    return;
  }

  state.swipeQuiz.cards = shuffleCards(quizCards);
  state.swipeQuiz.mode = mode;
  state.swipeQuiz.known = 0;
  state.swipeQuiz.unknown = 0;
  state.swipeQuiz.isAnimating = false;
  quizOptions.hidden = true;
  quizShell.hidden = true;
  swipeQuiz.hidden = false;
  document.querySelector("#swipe-kicker").textContent = isLearnedMode ? "ВИВЧЕНІ КАРТКИ" : "НЕВИВЧЕНІ КАРТКИ";
  document.querySelector("#swipe-title").textContent = isLearnedMode ? "Перевір вивчені слова" : "Перевір себе свайпом";
  document.querySelector("#swipe-description").textContent = isLearnedMode
    ? "Переверни картку, перевір відповідь. Вправо — знаю, вліво — повернути в невивчені."
    : "Потягни картку вліво, якщо ще не знаєш, або вправо, якщо вже знаєш. Натисни на картку, щоб подивитися відповідь.";
  document.querySelector("#quiz-progress").textContent = isLearnedMode ? "Quiz 2" : "Quiz 1";
  renderSwipeStack();
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
  quizOptions.hidden = true;
  quizShell.hidden = false;
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
  addPrivateCardButton.hidden = !isCurrentUserAdmin();
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

  state.cards = await applyPersonalCardState(data || []);
  render();
}

async function applyPersonalCardState(cards) {
  if (!cards.length || !db || !state.user) return cards;

  const ids = cards.map((card) => card.id);
  const { data, error } = await db
    .from("card_user_state")
    .select("card_id,is_favorite,is_learned")
    .in("card_id", ids);

  if (error) {
    console.warn("Personal card state is unavailable yet", error);
    return cards;
  }

  const personalState = new Map((data || []).map((item) => [item.card_id, item]));
  return cards.map((card) => {
    const saved = personalState.get(card.id);
    return {
      ...card,
      is_favorite: saved?.is_favorite ?? card.is_favorite ?? false,
      is_learned: saved?.is_learned ?? card.is_learned ?? false,
    };
  });
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

function openCardModal({ visibility = "public" } = {}) {
  if (!state.user) {
    showToast(isConfigured ? "Увійдіть через Google, щоб створити картку" : "Спочатку підключіть Supabase");
    if (isConfigured) signIn();
    return;
  }
  state.editingCardId = null;
  state.cardDraftVisibility = visibility;
  setAdvancedFieldsVisible(false);
  cardForm.reset();
  imagePreview.removeAttribute("src");
  imagePreview.hidden = true;
  formError.textContent = "";
  document.querySelector("#card-modal-kicker").textContent =
    visibility === "private" ? "ОСОБИСТА КАРТКА" : "НОВА КАРТКА";
  document.querySelector("#card-modal-title").textContent =
    visibility === "private" ? "Додати для себе" : "Додати слово";
  saveCardButton.textContent = "Створити автоматично";
  cardModal.showModal();
}

function openEditModal(card) {
  if (!state.user || !canManageCard(card)) return;

  state.editingCardId = card.id;
  state.cardDraftVisibility = "public";
  setAdvancedFieldsVisible(true);
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
  saveCardButton.textContent = editingCard ? "Зберігаю..." : "Дороблюю картку...";

  const formData = new FormData(cardForm);
  const cardId = editingCard?.id || crypto.randomUUID();
  const ukrainian = formData.get("ukrainian").trim();
  const category = formData.get("category").trim();
  let uploadedPath = null;

  try {
    const newImageFile = imageInput.files[0] || null;
    const autoFields = editingCard
      ? null
      : await buildAutomaticCardFields(
          ukrainian,
          category,
          palette[state.cards.length % palette.length],
        );
    const image = editingCard
      ? newImageFile
        ? await uploadImage(newImageFile, cardId, `-${Date.now()}`)
        : {
            image_url: editingCard.image_url || null,
            image_path: editingCard.image_path || null,
          }
      : newImageFile
        ? await uploadImage(newImageFile, cardId)
        : {
            image_url: autoFields.image_url,
            image_path: autoFields.image_path,
          };
    uploadedPath = image.image_path;
    const card = {
      id: cardId,
      user_id: editingCard?.user_id || state.user.id,
      ukrainian,
      english: editingCard ? formData.get("english").trim() : autoFields.english,
      english_pronunciation: editingCard
        ? formData.get("english_pronunciation").trim()
        : autoFields.english_pronunciation,
      spanish: editingCard ? formData.get("spanish").trim() : autoFields.spanish,
      spanish_pronunciation: editingCard
        ? formData.get("spanish_pronunciation").trim()
        : autoFields.spanish_pronunciation,
      category,
      image_url: image.image_url,
      image_path: image.image_path,
      color: editingCard?.color || autoFields.color,
      is_public: editingCard
        ? Boolean(editingCard.is_public)
        : isCurrentUserAdmin() && state.cardDraftVisibility !== "private",
    };

    const query = editingCard
      ? db.from("cards").update(card).eq("id", cardId)
      : db.from("cards").insert(card);
    const { data, error } = await query.select().single();
    if (error) throw error;

    if (editingCard) {
      state.cards = state.cards.map((item) =>
        item.id === cardId
          ? {
              ...data,
              is_favorite: item.is_favorite,
              is_learned: item.is_learned,
            }
          : item,
      );
      if (newImageFile && editingCard.image_path && editingCard.image_path !== image.image_path) {
        const { error: imageError } = await db.storage
          .from("card-images")
          .remove([editingCard.image_path]);
        if (imageError) console.error(imageError);
      }
    } else {
      state.cards.unshift({
        ...data,
        is_favorite: false,
        is_learned: false,
      });
      state.view = data.is_public ? "all" : "mine";
      state.category = "Усі";
    }

    state.editingCardId = null;
    state.cardDraftVisibility = "public";
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
    saveCardButton.textContent = editingCard ? "Зберегти зміни" : "Створити автоматично";
  }
}

async function toggleCardValue(card, field) {
  const nextValue = !card[field];
  await setCardValue(card, field, nextValue);
}

async function setCardValue(card, field, nextValue) {
  if (!state.user || !db || isDemoCard(card)) {
    showToast("Увійдіть, щоб зберігати прогрес між пристроями");
    return false;
  }

  const { error } = await db.from("card_user_state").upsert(
    {
      user_id: state.user.id,
      card_id: card.id,
      [field]: nextValue,
    },
    { onConflict: "user_id,card_id" },
  );

  if (error) {
    showToast("Не вдалося зберегти зміну");
    console.error(error);
    return false;
  }

  card[field] = nextValue;
  renderCards();
  updateProgress();
  return true;
}

async function deleteCard(card) {
  if (!state.user || !db || isDemoCard(card)) {
    showToast("Демонстраційну картку не можна видалити");
    return;
  }

  if (!canManageCard(card)) {
    showToast("Цю картку може видалити тільки адміністратор");
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
    state.category = "Усі";
    render();
  });
});

quizLaunchButton.addEventListener("click", openQuizMenu);
document.querySelector("#quiz-back-button").addEventListener("click", closeQuiz);
quizOptions.addEventListener("click", (event) => {
  const button = event.target.closest("[data-quiz-option]");
  if (!button) return;

  if (button.dataset.quizOption === "learned") {
    openSwipeQuiz("unlearned");
    return;
  }

  if (button.dataset.quizOption === "learned-stack") {
    openSwipeQuiz("learned");
    return;
  }

  showToast("Сюди додамо твій текст трохи пізніше");
});
document.querySelector("#swipe-exit-button").addEventListener("click", closeQuiz);
document.querySelector(".swipe-actions").addEventListener("click", async (event) => {
  const button = event.target.closest("[data-swipe-action]");
  const card = state.swipeQuiz.cards[0];
  if (!button || !card) return;
  await markSwipeCard(card, button.dataset.swipeAction === "known");
});
quizForm.addEventListener("submit", checkQuizAnswer);
document.querySelector(".quiz-language-switch").addEventListener("click", (event) => {
  const button = event.target.closest("[data-quiz-language]");
  if (!button || state.quiz.locked) return;
  state.quiz.language = button.dataset.quizLanguage;
  updateQuizLanguage();
  quizAnswer.focus();
});

document.querySelector("#add-card-button").addEventListener("click", () => openCardModal());
addPrivateCardButton.addEventListener("click", () => openCardModal({ visibility: "private" }));
authButton.addEventListener("click", signIn);
profileButton.addEventListener("click", () => profileModal.showModal());
document.querySelector("#sign-out-button").addEventListener("click", signOut);
document.querySelector("#switch-account-button").addEventListener("click", switchAccount);
document.querySelector("#add-account-button").addEventListener("click", addAccount);
cardForm.addEventListener("submit", saveCard);

document.querySelectorAll("[data-close-modal]").forEach((button) => {
  button.addEventListener("click", () => {
    state.editingCardId = null;
    state.cardDraftVisibility = "public";
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

