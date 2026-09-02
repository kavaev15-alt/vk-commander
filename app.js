const communities = [
  ["Городская кофейня «Маяк»", "4 832", "М", "av-a"],
  ["Кондитерская «Тёплый хлеб»", "2 148", "Т", "av-b"],
  ["SMM без скучных правил", "18 540", "S", "av-c"],
  ["Фотостудия «Свет»", "1 926", "С", "av-d"],
  ["Зелёный двор", "8 207", "З", "av-e"],
  ["Мебель и интерьер NEST", "5 394", "N", "av-f"],
  ["Йога в городе", "3 651", "Й", "av-c"],
  ["Школа английского GET", "12 018", "G", "av-d"],
  ["Керамика ручной работы", "987", "К", "av-b"],
  ["Ресторан «Север»", "6 421", "С", "av-a"],
];
const covers = [
  "cover-a",
  "cover-b",
  "cover-c",
  "cover-d",
  "cover-e",
  "cover-f",
  "cover-c",
  "cover-a",
  "cover-b",
  "cover-d",
];
const descriptions = [
  "Кофе, завтраки и тёплые встречи в самом центре города.",
  "Свежая выпечка и десерты, которые делают день лучше.",
  "Сообщество о продвижении, контенте и понятном маркетинге.",
  "Пространство для съёмок, идей и красивых историй.",
  "Садовый центр и товары для уютного дома.",
  "Интерьеры, в которых хочется жить. Доставка по России.",
  "Практики для тела, спокойствия и нового ритма жизни.",
  "Английский для учёбы, работы и путешествий.",
  "Авторская керамика для дома и в подарок.",
  "Современная кухня и атмосфера северного города.",
];
const statuses = [
  "Открыты сегодня до 22:00",
  "Принимаем заказы на завтра",
  "Новые материалы каждую неделю",
  "Ближайшие съёмки: 25 августа",
  "Сезон посадок уже начался",
  "Скидка до 30% на коллекцию",
  "Утренняя практика — в 08:00",
  "Идёт набор в новые группы",
  "Отправим заказ за 1–2 дня",
  "Бронируйте столик онлайн",
];
let groupSelected = new Set(),
  assetSelected = new Set(),
  asset = "avatar";
const list = document.querySelector("#groupList"),
  assets = document.querySelector("#assetList"),
  isText = () => asset === "description" || asset === "status";
function renderGroups() {
  list.innerHTML = communities
    .map(
      (g, i) =>
        `<div class="group-row ${groupSelected.has(i) ? "selected" : ""}" data-i="${i}"><span><input type="checkbox" ${groupSelected.has(i) ? "checked" : ""}></span><span>${i + 1}</span><span class="community"><i class="mini-avatar ${g[3]}">${g[2]}</i><span><strong>${g[0]}</strong><small>${g[1]} подписчиков</small></span></span><span><i class="dot ${i === 5 ? "gray" : ""}"></i></span></div>`,
    )
    .join("");
  document.querySelectorAll(".group-row").forEach(
    (row) =>
      (row.onclick = () => {
        const i = +row.dataset.i;
        groupSelected.has(i) ? groupSelected.delete(i) : groupSelected.add(i);
        renderGroups();
        renderAssets();
      }),
  );
  document.querySelector("#groupSelected").textContent = groupSelected.size
    ? `Выбрано: ${groupSelected.size}`
    : "Не выбрано";
}
function renderAssets() {
  const source = groupSelected.size
      ? [...groupSelected]
      : communities.map((_, i) => i),
    textMode = isText(),
    head = document.querySelector("#assetHead");
  head.classList.toggle("text-head", textMode);
  head.innerHTML = textMode
    ? '<span><input type="checkbox" id="allAssets" /></span><span>Сообщество</span><span>Текущее значение</span><span>Обновлено</span>'
    : '<span><input type="checkbox" id="allAssets" /></span><span>Сообщество</span><span>Текущее изображение</span><span>Размер</span><span>Обновлено</span>';
  assets.innerHTML = source
    .map((i) => {
      const g = communities[i],
        selected = assetSelected.has(i),
        size =
          asset === "avatar"
            ? "400 × 400"
            : asset === "cover"
              ? "1920 × 768"
              : "1080 × 607";
      if (textMode) {
        const value = asset === "description" ? descriptions[i] : statuses[i];
        return `<div class="asset-row text-row ${selected ? "selected" : ""}" data-i="${i}"><span><input type="checkbox" ${selected ? "checked" : ""}></span><span><strong>${g[0]}</strong><small>id${10001 + i}</small></span><span class="${asset === "status" ? "status-preview" : "text-preview"}">${value}</span><span class="updated">Сегодня, 12:${10 + i}</span></div>`;
      }
      const image =
        asset === "avatar"
          ? `<div class="thumb avatar ${g[3]}"></div>`
          : `<div class="thumb ${covers[i]}"></div>`;
      return `<div class="asset-row ${selected ? "selected" : ""}" data-i="${i}"><span><input type="checkbox" ${selected ? "checked" : ""}></span><span><strong>${g[0]}</strong><small>id${10001 + i}</small></span><span>${image}</span><span><small>${size}</small></span><span class="updated">Сегодня, 12:${10 + i}</span></div>`;
    })
    .join("");
  document.querySelectorAll(".asset-row").forEach(
    (row) =>
      (row.onclick = () => {
        const i = +row.dataset.i;
        assetSelected.has(i) ? assetSelected.delete(i) : assetSelected.add(i);
        renderAssets();
        updateInspector();
      }),
  );
  document.querySelector("#allAssets").onchange = (e) => {
    assetSelected = e.target.checked ? new Set(source) : new Set();
    renderAssets();
    updateInspector();
  };
  document.querySelector("#assetSelected").textContent = assetSelected.size
    ? `Выбрано: ${assetSelected.size}`
    : "Не выбрано";
}
function updateInspector() {
  const data = document.querySelector("#inspectorData"),
    empty = document.querySelector("#inspectorEmpty"),
    textMode = isText();
  data.classList.toggle("hidden", !assetSelected.size);
  empty.classList.toggle("hidden", !!assetSelected.size);
  if (assetSelected.size) {
    const first = [...assetSelected][0];
    document.querySelector("#selectionLabel").textContent =
      `Выбрано: ${assetSelected.size}`;
    document.querySelector("#previewBox").classList.toggle("hidden", textMode);
    document.querySelector("#uploadField").classList.toggle("hidden", textMode);
    document.querySelector("#textField").classList.toggle("hidden", !textMode);
    document
      .querySelector(".checkbox-field")
      .classList.toggle("hidden", textMode);
    document.querySelector("#textFieldLabel").textContent =
      asset === "description" ? "НОВОЕ ОПИСАНИЕ" : "НОВЫЙ СТАТУС";
    document.querySelector("#textValue").placeholder =
      asset === "description"
        ? "Введите новое описание сообщества"
        : "Введите новый статус сообщества";
    const preview = document.querySelector("#preview");
    preview.className = `image-preview ${asset === "avatar" ? communities[first][3] : covers[first]}`;
    document.querySelector("#imageLabel").textContent =
      asset === "avatar"
        ? "НОВЫЙ АВАТАР"
        : asset === "cover"
          ? "НОВАЯ ОБЛОЖКА"
          : "НОВАЯ МОБИЛЬНАЯ ОБЛОЖКА";
    document.querySelector("#imageHint").textContent =
      asset === "avatar"
        ? "PNG, JPG или WEBP · 400 × 400 px"
        : asset === "cover"
          ? "PNG, JPG или WEBP · 1920 × 768 px"
          : "PNG, JPG или WEBP · 1080 × 607 px";
  }
}
document.querySelectorAll(".asset-tab").forEach(
  (t) =>
    (t.onclick = () => {
      document
        .querySelectorAll(".asset-tab")
        .forEach((x) => x.classList.remove("active"));
      t.classList.add("active");
      asset = t.dataset.asset;
      assetSelected.clear();
      renderAssets();
      updateInspector();
    }),
);
document.querySelector("#allGroups").onchange = (e) => {
  groupSelected = e.target.checked
    ? new Set(communities.map((_, i) => i))
    : new Set();
  renderGroups();
  renderAssets();
};
document.querySelector("#replace").onclick = () => {
  if (!assetSelected.size) return toast("Сначала выберите элементы в таблице");
  updateInspector();
  document.querySelector(isText ? "#textValue" : ".file-input").focus();
};
document.querySelector("#apply").onclick = () =>
  toast(`Изменения подготовлены для ${assetSelected.size} сообществ`);
document.querySelectorAll(".section").forEach(
  (s) =>
    (s.onclick = () => {
      document
        .querySelectorAll(".section")
        .forEach((x) => x.classList.remove("active"));
      s.classList.add("active");
      toast(
        s.dataset.section === "design"
          ? "Раздел «Оформление»"
          : "Раздел в макете будет добавлен следующим этапом",
      );
    }),
);
function toast(msg) {
  const t = document.querySelector("#toast");
  t.textContent = msg;
  t.classList.remove("hidden");
  setTimeout(() => t.classList.add("hidden"), 2400);
}
renderGroups();
renderAssets();
