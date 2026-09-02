const receiveButton = document.querySelector(".sync");
if (receiveButton) {
  receiveButton.title = "Подключить VK и загрузить данные сообществ";
  receiveButton.addEventListener("click", async () => {
    try {
      const status = await fetch("/api/health").then((response) =>
        response.json(),
      );
      if (!status.configured) {
        document.getElementById("configModal").classList.remove("hidden");
        return;
      }
      window.location.assign("/auth/vk");
    } catch {
      showVkToast(
        "Не удалось связаться с локальным сервером. Запусти программу заново.",
      );
    }
  });
}

document.getElementById("closeConfigModal").onclick = () => {
  document.getElementById("configModal").classList.add("hidden");
};

document.getElementById("saveConfigModal").onclick = async () => {
  const appId = document.getElementById("vkAppId").value;
  const appSecret = document.getElementById("vkAppSecret").value;
  if (!appId || !appSecret) return showVkToast("Пожалуйста, заполните оба поля");

  try {
    const res = await fetch("/api/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ app_id: appId, app_secret: appSecret })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    document.getElementById("configModal").classList.add("hidden");
    window.location.assign("/auth/vk");
  } catch (e) {
    showVkToast("Ошибка сохранения: " + e.message);
  }
};

function showVkToast(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.remove("hidden");
  setTimeout(() => toast.classList.add("hidden"), 4500);
}

async function loadVkGroups() {
  const response = await fetch("/api/groups");
  const result = await response.json();
  if (!response.ok)
    throw new Error(result.error || "Не удалось получить сообщества");
  const groups = result.items || [];
  data.splice(
    0,
    data.length,
    ...groups.map((group, index) => {
      const cover = group.cover?.images?.[0]?.url || "";
      return [
        group.name,
        String(group.members_count || 0),
        group.name.slice(0, 1).toUpperCase(),
        ["av-a", "av-b", "av-c", "av-d", "av-e", "av-f"][index % 6],
        ["cv-a", "cv-b", "cv-c", "cv-d", "cv-e", "cv-f"][index % 6],
        ["cv-f", "cv-e", "cv-d", "cv-c", "cv-b", "cv-a"][index % 6],
        group.description || "Описание пока не заполнено",
        typeof group.status === "string" ? group.status : "—",
        group.photo_200 || group.photo_100 || "",
        cover,
        cover,
        group.id, // index 11
      ];
    }),
  );
  filtered.clear();
  selected.clear();
  groupRows();
  designRows();
  inspector();
  showVkToast(`Загружено сообществ: ${groups.length}`);
}

fetch("/api/health")
  .then((response) => (response.ok ? response.json() : null))
  .then(async (status) => {
    if (!status?.connected || !location.search.includes("connected=1")) return;
    history.replaceState({}, "", "/");
    await loadVkGroups();
  })
  .catch((error) => {
    if (location.search.includes("connected=1")) showVkToast(error.message);
  });
