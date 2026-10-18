// Our conversation, kept in this browser so it's still there next time.
// Each message: { id, from: "me" | "him" | "note", text?, sticker?, at }.

const LOG_KEY = "fox-little-world-chat-log";
const SETTINGS_KEY = "fox-little-world-chat-settings-v2";

export const STICKER_BASE =
  "https://cdn.jsdelivr.net/gh/izumi05012-cmyk/rp-stickers@main/fox/";

// rp-stickers/fox — the little fox we send each other
export const stickers = [
  "hug.gif", "hug_open.png", "hug_me.png", "kiss_phone.png", "love_heart.png",
  "pet.gif", "peek.png", "stare.gif", "stare_long.png", "ok.gif",
  "laugh_phone.png", "jealous.png", "teary.png", "angry.gif", "quiet.gif",
  "goodnight.gif", "sleep.gif", "sleep.png", "sleep_drool.png", "pillow.gif",
  "eat.gif", "drink.gif", "apple.gif", "flower.gif", "rose.png",
  "gift.png", "together.gif", "friend.gif", "relax.gif", "sit.gif",
  "sit2.gif", "glasses.gif", "leaf.gif", "emperor.png",
];

const firstWords = [
  {
    id: "hello-1",
    from: "him",
    text: "曦曦，聊天的小屋搭好啦。窗外的天气，和首页是同一扇窗。",
    at: Date.UTC(2026, 9, 18, 5, 0),
  },
  {
    id: "hello-2",
    from: "him",
    sticker: "hug_open.png",
    at: Date.UTC(2026, 9, 18, 5, 0, 30),
  },
  {
    id: "hello-note",
    from: "note",
    text: "狐狸的回话还在路上：接上以后，这里就能真的聊天了。",
    at: Date.UTC(2026, 9, 18, 5, 1),
  },
];

function read(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch {
    return null;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // private mode or full: this visit just isn't remembered
  }
}

export function loadLog() {
  const saved = read(LOG_KEY);
  return Array.isArray(saved) && saved.length ? saved : firstWords;
}

export function saveLog(log) {
  write(LOG_KEY, log.slice(-500));
}

export const defaultSettings = { name: "唐望舒" };

export function loadSettings() {
  return { ...defaultSettings, ...(read(SETTINGS_KEY) || {}) };
}

export function saveSettings(settings) {
  write(SETTINGS_KEY, settings);
}

export function clockTime(at) {
  const d = new Date(at);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// "20:18" today, "昨天" yesterday, otherwise the date
export function shortTime(at, now = new Date()) {
  const d = new Date(at);
  const day = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((day(now) - day(d)) / 86400000);
  if (diff === 0) return clockTime(at);
  if (diff === 1) return "昨天";
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

export function preview(message) {
  if (!message) return "";
  if (message.sticker) return "[表情]";
  return message.text;
}
