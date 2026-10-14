// 曦曦's own photos for the journal slots, kept in this browser's IndexedDB.
// They stay on the device they were added on (no server yet), so every call
// fails soft: if storage is unavailable the default picture just shows.
const DB_NAME = "fox-little-world";
const STORE = "photos";

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function run(mode, action) {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const request = action(tx.objectStore(STORE));
        tx.oncomplete = () => resolve(request.result);
        tx.onerror = () => reject(tx.error);
      })
  );
}

export async function loadPhotos(slots) {
  const found = {};
  try {
    for (const slot of slots) {
      const blob = await run("readonly", (store) => store.get(slot));
      if (blob) found[slot] = URL.createObjectURL(blob);
    }
  } catch {
    // no storage here: defaults stay
  }
  return found;
}

// Phone photos are huge; shrink to something a polaroid needs before saving.
async function shrink(file, max = 1400) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.86));
}

export async function savePhoto(slot, file) {
  let blob = file;
  try {
    blob = (await shrink(file)) || file;
  } catch {
    // some formats can't be decoded by canvas; keep the original
  }
  try {
    await run("readwrite", (store) => store.put(blob, slot));
  } catch {
    // still show it for this visit even if it couldn't be kept
  }
  return URL.createObjectURL(blob);
}

export async function clearPhoto(slot) {
  try {
    await run("readwrite", (store) => store.delete(slot));
  } catch {
    // nothing stored, nothing to clear
  }
}
