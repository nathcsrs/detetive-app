const categories = [
  {
    id: "suspects",
    title: "Suspeitos",
    items: [
      { name: "Sargento Bigode", icon: "🛡️", pawn: "Amarelo", color: "#f2c94c" },
      { name: "Florista Dona Branca", icon: "💐", pawn: "Branco", color: "#f8f8f2" },
      { name: "Chef de Cozinha Tony Gourmet", icon: "👨‍🍳", pawn: "Marrom", color: "#7a4a2a" },
      { name: "Mordomo James", icon: "🤵", pawn: "Azul", color: "#2d6cdf" },
      { name: "Médica Dona Violeta", icon: "🩺", pawn: "Rosa", color: "#e86aa3" },
      { name: "Dançarina Srta. Rosa", icon: "🎵", pawn: "Vermelho", color: "#d8483e" },
      { name: "Coveiro Sérgio Soturno", icon: "💀", pawn: "Preto", color: "#242424" },
      { name: "Advogado Sr. Marinho", icon: "⚖️", pawn: "Verde", color: "#2f8f5b" },
    ],
  },
  {
    id: "weapons",
    title: "Armas",
    items: [
      { name: "Espingarda", icon: "🎯" },
      { name: "Pá", icon: "🪏" },
      { name: "Pé de Cabra", icon: "🛠️" },
      { name: "Tesoura", icon: "✂️" },
      { name: "Arma Química", icon: "⚗️" },
      { name: "Veneno", icon: "☠️" },
      { name: "Soco Inglês", icon: "👊" },
      { name: "Faca", icon: "🔪" },
    ],
  },
  {
    id: "places",
    title: "Locais",
    items: [
      { name: "Prefeitura", icon: "🏛️" },
      { name: "Restaurante", icon: "🍽️" },
      { name: "Floricultura", icon: "🌷" },
      { name: "Boate", icon: "🎶" },
      { name: "Hospital", icon: "🏥" },
      { name: "Mansão", icon: "🏰" },
      { name: "Cemitério", icon: "🪦" },
      { name: "Praça", icon: "🌳" },
      { name: "Hotel", icon: "🏨" },
      { name: "Banco", icon: "🏦" },
      { name: "Estação de Trem", icon: "🚉" },
    ],
  },
];

const states = [
  { id: "discarded", label: "D", text: "Descartado" },
  { id: "possible", label: "P", text: "Possível" },
  { id: "final", label: "F", text: "Final" },
];

const storageKey = "detetive-score-sheet";
const themeKey = "detetive-theme";
const startScreen = document.querySelector("#startScreen");
const appMain = document.querySelector("#appMain");
const continueButton = document.querySelector("#continueButton");
const newGameButton = document.querySelector("#newGameButton");
const categoryGrid = document.querySelector("#categoryGrid");
const solutionGrid = document.querySelector("#solutionGrid");
const resetButton = document.querySelector("#resetButton");
const themeButtons = document.querySelectorAll("[data-theme-option]");
const themeColorMeta = document.querySelector('meta[name="theme-color"]');

let marks = loadMarks();
let currentTheme = loadTheme();

applyTheme(currentTheme);

function loadMarks() {
  try {
    const stored = window.localStorage.getItem(storageKey);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveMarks() {
  window.localStorage.setItem(storageKey, JSON.stringify(marks));
}

function clearSavedGame() {
  window.localStorage.removeItem(storageKey);
}

function showMainScreen() {
  startScreen.hidden = true;
  appMain.hidden = false;
  window.scrollTo({ top: 0, behavior: "auto" });
}

function loadTheme() {
  try {
    const stored = window.localStorage.getItem(themeKey);
    if (stored === "light" || stored === "dark") {
      return stored;
    }
  } catch {
    return "light";
  }

  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function saveTheme(theme) {
  window.localStorage.setItem(themeKey, theme);
}

function applyTheme(theme) {
  currentTheme = theme;
  document.documentElement.dataset.theme = theme;
  themeColorMeta?.setAttribute("content", theme === "dark" ? "#202124" : "#eef2ef");

  themeButtons.forEach((button) => {
    const active = button.dataset.themeOption === theme;
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });
}

function itemKey(categoryId, item) {
  return `${categoryId}:${item.name}`;
}

function getItemState(categoryId, item) {
  return marks[itemKey(categoryId, item)] || "";
}

function setItemState(categoryId, item, state) {
  const key = itemKey(categoryId, item);
  const currentState = getItemState(categoryId, item);
  const nextState = currentState === state ? "" : state;

  if (nextState === "final") {
    const category = categories.find((entry) => entry.id === categoryId);
    category.items.forEach((categoryItem) => {
      const categoryItemKey = itemKey(categoryId, categoryItem);
      if (marks[categoryItemKey] === "final") {
        delete marks[categoryItemKey];
      }
    });
  }

  if (nextState) {
    marks[key] = nextState;
  } else {
    delete marks[key];
  }

  saveMarks();
  render();
}

function getCounts(category) {
  return category.items.reduce(
    (totals, item) => {
      const state = getItemState(category.id, item);
      if (state) {
        totals[state] += 1;
      }
      return totals;
    },
    { discarded: 0, possible: 0, final: 0 },
  );
}

function getFinalItem(category) {
  return category.items.find((item) => getItemState(category.id, item) === "final");
}

function renderSolution() {
  solutionGrid.innerHTML = "";

  categories.forEach((category) => {
    const finalItem = getFinalItem(category);
    const solutionItem = document.createElement("article");
    solutionItem.className = "solution-item";
    solutionItem.innerHTML = `
      <span>${category.title}</span>
      <strong>${finalItem ? `${finalItem.icon} ${finalItem.name}` : "Em aberto"}</strong>
    `;
    solutionGrid.appendChild(solutionItem);
  });
}

function renderCategory(category) {
  const counts = getCounts(category);
  const card = document.createElement("article");
  card.className = "category-card";

  const header = document.createElement("header");
  header.className = "category-header";
  header.innerHTML = `
    <div>
      <p class="eyebrow">${category.items.length} itens</p>
      <h2>${category.title}</h2>
    </div>
    <div class="mini-stats" aria-label="Resumo de ${category.title}">
      <span>${counts.discarded}D</span>
      <span>${counts.possible}P</span>
      <span>${counts.final}F</span>
    </div>
  `;

  const table = document.createElement("div");
  table.className = "mark-table";
  table.setAttribute("role", "table");
  table.setAttribute("aria-label", category.title);

  const tableHeader = document.createElement("div");
  tableHeader.className = "mark-row mark-row-heading";
  tableHeader.setAttribute("role", "row");
  tableHeader.innerHTML = `
    <span role="columnheader">Item</span>
    ${states.map((state) => `<span role="columnheader">${state.label}</span>`).join("")}
  `;
  table.appendChild(tableHeader);

  category.items.forEach((item) => {
    const itemState = getItemState(category.id, item);
    const row = document.createElement("div");
    row.className = `mark-row${itemState ? ` is-${itemState}` : ""}`;
    row.setAttribute("role", "row");
    if (item.color) {
      row.style.setProperty("--pawn-color", item.color);
    }

    const name = document.createElement("span");
    name.className = "item-name";
    name.setAttribute("role", "cell");
    name.innerHTML = `
      <span class="item-icon" aria-hidden="true">${item.icon}</span>
      <span class="item-text">
        <span class="item-label">${item.name}</span>
        ${
          item.pawn
            ? `<span class="pawn-chip"><span class="pawn-dot"></span>Peão ${item.pawn}</span>`
            : ""
        }
      </span>
    `;
    row.appendChild(name);

    states.forEach((state) => {
      const active = itemState === state.id;
      const button = document.createElement("button");
      button.className = `mark-box ${state.id}${active ? " active" : ""}`;
      button.type = "button";
      button.setAttribute("role", "cell");
      button.setAttribute("aria-pressed", active ? "true" : "false");
      button.setAttribute("aria-label", `${item.name}: ${state.text}`);
      button.title = state.text;
      button.textContent = active ? state.label : "";
      button.addEventListener("click", () => setItemState(category.id, item, state.id));
      row.appendChild(button);
    });

    table.appendChild(row);
  });

  card.append(header, table);
  return card;
}

function render() {
  renderSolution();
  categoryGrid.innerHTML = "";
  categories.forEach((category) => {
    categoryGrid.appendChild(renderCategory(category));
  });
}

resetButton.addEventListener("click", () => {
  marks = {};
  clearSavedGame();
  render();
});

continueButton.addEventListener("click", () => {
  marks = loadMarks();
  render();
  showMainScreen();
});

newGameButton.addEventListener("click", () => {
  marks = {};
  clearSavedGame();
  render();
  showMainScreen();
});

themeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const selectedTheme = button.dataset.themeOption;
    applyTheme(selectedTheme);
    saveTheme(selectedTheme);
  });
});

render();
