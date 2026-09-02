const data = [
  [
    "Городская кофейня «Маяк»",
    "4 832",
    "М",
    "av-a",
    "cv-a",
    "cv-d",
    "Кофе, завтраки и тёплые встречи в самом центре города.",
    "Открыты сегодня до 22:00",
  ],
  [
    "Кондитерская «Тёплый хлеб»",
    "2 148",
    "Т",
    "av-b",
    "cv-b",
    "cv-a",
    "Свежая выпечка и десерты, которые делают день лучше.",
    "Принимаем заказы на завтра",
  ],
  [
    "SMM без скучных правил",
    "18 540",
    "S",
    "av-c",
    "cv-c",
    "cv-b",
    "Сообщество о продвижении, контенте и понятном маркетинге.",
    "Новые материалы каждую неделю",
  ],
  [
    "Фотостудия «Свет»",
    "1 926",
    "С",
    "av-d",
    "cv-d",
    "cv-c",
    "Пространство для съёмок, идей и красивых историй.",
    "Ближайшие съёмки: 25 августа",
  ],
  [
    "Зелёный двор",
    "8 207",
    "З",
    "av-e",
    "cv-e",
    "cv-d",
    "Садовый центр и товары для уютного дома.",
    "Сезон посадок уже начался",
  ],
  [
    "Мебель и интерьер NEST",
    "5 394",
    "N",
    "av-f",
    "cv-f",
    "cv-e",
    "Интерьеры, в которых хочется жить. Доставка по России.",
    "Скидка до 30% на коллекцию",
  ],
  [
    "Йога в городе",
    "3 651",
    "Й",
    "av-c",
    "cv-a",
    "cv-f",
    "Практики для тела, спокойствия и нового ритма жизни.",
    "Утренняя практика — в 08:00",
  ],
  [
    "Школа английского GET",
    "12 018",
    "G",
    "av-d",
    "cv-b",
    "cv-a",
    "Английский для учёбы, работы и путешествий.",
    "Идёт набор в новые группы",
  ],
  [
    "Керамика ручной работы",
    "987",
    "К",
    "av-b",
    "cv-c",
    "cv-b",
    "Авторская керамика для дома и в подарок.",
    "Отправим заказ за 1–2 дня",
  ],
  [
    "Ресторан «Север»",
    "6 421",
    "С",
    "av-a",
    "cv-d",
    "cv-c",
    "Современная кухня и атмосфера северного города.",
    "Бронируйте столик онлайн",
  ],
];
let selected = new Set(),
  filtered = new Set();

let tempImages = {
  avatar: null,
  cover: null,
  mobile: null,
};

function plural(n, w1, w2, w5) {
  const m = n % 100;
  if (m > 10 && m < 20) return w5;
  const m1 = n % 10;
  if (m1 === 1) return w1;
  if (m1 > 1 && m1 < 5) return w2;
  return w5;
}
const groupList = document.querySelector("#groupList"),
  designList = document.querySelector("#designList");
function groupRows() {
  groupList.innerHTML = data
    .map(
      (g, i) =>
        `<div class="group-row ${filtered.has(i) ? "filtered" : ""}" data-i="${i}"><input type="checkbox" ${filtered.has(i) ? "checked" : ""}><span>${i + 1}</span><span class="group-name"><i class="${g[3]}">${g[2]}</i><span><strong>${g[0]}</strong><small>${g[1]} подписчиков</small></span></span><i class="online ${i === 5 ? "offline" : ""}"></i></div>`,
    )
    .join("");
  document.querySelectorAll(".group-row").forEach(
    (r) =>
      (r.onclick = () => {
        const i = +r.dataset.i;
        filtered.has(i) ? filtered.delete(i) : filtered.add(i);
        groupRows();
        designRows();
      }),
  );
  document.querySelector("#groupCounter").textContent = filtered.size
    ? `Фильтр: ${filtered.size} сообществ`
    : "Все сообщества";
}
function designRows() {
  const source = filtered.size ? [...filtered] : data.map((_, i) => i);
  designList.innerHTML = source
    .map((i) => {
      const g = data[i];
      const avatarStyle = g[8] ? `style="background-image:url('${g[8]}');background-size:cover;background-position:center"` : '';
      const coverStyle = g[9] ? `style="background-image:url('${g[9]}');background-size:cover;background-position:center"` : '';
      const mobileStyle = g[10] ? `style="background-image:url('${g[10]}');background-size:cover;background-position:center"` : '';
      return `<div class="design-row ${selected.has(i) ? "selected" : ""}" data-i="${i}"><input type="checkbox" ${selected.has(i) ? "checked" : ""}><span><strong>${g[0]}</strong><small>id${10001 + i}</small></span><span><i class="thumb avatar ${g[3]}" ${avatarStyle}></i></span><span><i class="thumb ${g[4]}" ${coverStyle}></i></span><span><i class="thumb mobile ${g[5]}" ${mobileStyle}></i></span><span class="clip">${g[6]}</span><span class="clip">${g[7]}</span><span class="updated">Сегодня, 12:${10 + i}</span></div>`;
    })
    .join("");
  document.querySelectorAll(".design-row").forEach(
    (r) =>
      (r.onclick = () => {
        const i = +r.dataset.i;
        selected.has(i) ? selected.delete(i) : selected.add(i);
        designRows();
        inspector();
      }),
  );
  document.querySelector("#rowCounter").textContent = selected.size
    ? `Выбрано: ${selected.size}`
    : "Не выбрано";
  document.querySelector("#allRows").checked =
    source.length > 0 && source.every((i) => selected.has(i));
}
function same(field) {
  const values = [...selected].map((i) => data[i][field]);
  return values.every((v) => v === values[0]) ? values[0] : null;
}
function inspector() {
  const has = selected.size > 0;
  document.querySelector("#empty").classList.toggle("hidden", has);
  document.querySelector("#fields").classList.toggle("hidden", !has);
  if (!has) return;
  document.querySelector("#pickedCount").textContent =
    `${selected.size} ${plural(selected.size, "сообщество", "сообщества", "сообществ")}`;
  setText("description", same(6), "Введите новое описание");
  setText("status", same(7), "Введите новый статус");

  tempImages = { avatar: null, cover: null, mobile: null };
  textChanged = { description: false, status: false };
  const buttons = document.querySelectorAll(".file");
  if (buttons.length >= 3) {
    buttons[0].textContent = "＋ Выбрать изображение";
    buttons[1].textContent = "＋ Выбрать изображение";
    buttons[2].textContent = "＋ Выбрать изображение";
  }
}
function setText(id, value, placeholder) {
  const el = document.querySelector("#" + id);
  el.value = value || "";
  el.placeholder = value ? placeholder : "Разные значения";
  el.classList.toggle("different", !value);
}
let currentUploadType = null;
const filePicker = document.querySelector("#filePicker");

if (filePicker) {
  filePicker.onchange = (e) => {
    const file = e.target.files[0];
    if (file && currentUploadType) {
      const reader = new FileReader();
      const type = currentUploadType; // Capture the current value
      reader.onload = (e) => {
        tempImages[type] = e.target.result;
        const buttons = document.querySelectorAll(".file");
        if (type === 'avatar' && buttons[0]) buttons[0].textContent = "✓ Изображение выбрано";
        if (type === 'cover' && buttons[1]) buttons[1].textContent = "✓ Изображение выбрано";
        if (type === 'mobile' && buttons[2]) buttons[2].textContent = "✓ Изображение выбрано";
      };
      reader.readAsDataURL(file);
    }
  };
}

const fileButtons = document.querySelectorAll(".file");
if (fileButtons.length >= 3) {
  fileButtons[0].onclick = () => { currentUploadType = 'avatar'; filePicker?.click(); };
  fileButtons[1].onclick = () => { currentUploadType = 'cover'; filePicker?.click(); };
  fileButtons[2].onclick = () => { currentUploadType = 'mobile'; filePicker?.click(); };
}

document.querySelector("#allGroups").onchange = (e) => {
  filtered = e.target.checked ? new Set(data.map((_, i) => i)) : new Set();
  groupRows();
  designRows();
};
document.querySelector("#allRows").onchange = (e) => {
  const source = filtered.size ? [...filtered] : data.map((_, i) => i);
  selected = e.target.checked ? new Set(source) : new Set();
  designRows();
  inspector();
};
document.querySelector("#clear").onclick = () => {
  selected.clear();
  designRows();
  inspector();
};
document.querySelector("#cancel").onclick = () => {
  selected.clear();
  designRows();
  inspector();
};
document.querySelector("#replaceButton").onclick = () =>
  selected.size
    ? document.querySelector("#description").focus()
    : toast("Сначала выберите сообщества в таблице");
let textChanged = { description: false, status: false };
document.querySelector("#description").addEventListener('input', () => textChanged.description = true);
document.querySelector("#status").addEventListener('input', () => textChanged.status = true);

document.querySelector(".send").onclick = async () => {
  const updates = [];
  data.forEach((groupData, i) => {
    if (groupData[12]) {
      const groupId = groupData[11] !== undefined ? groupData[11] : 10001 + i;
      updates.push({ group_id: groupId, index: i, ...groupData[12] });
    }
  });

  if (updates.length === 0) return toast("Нет локальных изменений для отправки в VK");

  try {
    const res = await fetch("/api/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Ошибка сохранения");

    // Clear dirty flags
    updates.forEach(u => {
      delete data[u.index][12];
    });

    toast(`Изменения отправлены в VK для ${updates.length} ${plural(updates.length, "сообщества", "сообществ", "сообществ")}`);
  } catch (e) {
    toast("Ошибка: " + e.message);
  }
};

document.querySelector("#save").onclick = () => {
  const applyAll = document.querySelector('input[name="apply"]:checked')?.value === 'all';
  const targetSet = applyAll ? (filtered.size ? filtered : new Set(data.map((_, i) => i))) : selected;

  if (!targetSet.size) return toast("Сначала выберите сообщества в таблице");

  const d = document.querySelector("#description"),
    s = document.querySelector("#status");

  targetSet.forEach((i) => {
    data[i][12] = data[i][12] || {};
    if (textChanged.description) {
      data[i][6] = d.value;
      data[i][12].description = d.value;
    }
    if (textChanged.status) {
      data[i][7] = s.value;
      data[i][12].status = s.value;
    }
    if (tempImages.avatar) {
      data[i][8] = tempImages.avatar;
      data[i][12].avatar = tempImages.avatar;
    }
    if (tempImages.cover) {
      data[i][9] = tempImages.cover;
      data[i][12].cover = tempImages.cover;
    }
    if (tempImages.mobile) {
      data[i][10] = tempImages.mobile;
      data[i][12].mobile = tempImages.mobile;
    }
  });

  document.querySelector("#changes").textContent = "0";
  textChanged = { description: false, status: false };
  designRows();
  inspector();
  toast(`Изменения сохранены для ${targetSet.size} ${plural(targetSet.size, "сообщества", "сообществ", "сообществ")}`);
};
function toast(msg) {
  const t = document.querySelector("#toast");
  t.textContent = msg;
  t.classList.remove("hidden");
  setTimeout(() => t.classList.add("hidden"), 2200);
}
groupRows();
designRows();
inspector();
