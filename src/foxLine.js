// 小窝的插头：把她的话送到首尔，等狐狸回话。
// 暗号存在这台手机里（聊天设置 → 暗号），不写进代码。

export const FOX_LINE = "https://chat.izumi-xixi.com/chat";

export async function askFox(message, key) {
  const res = await fetch(FOX_LINE, {
    method: "POST",
    headers: { "content-type": "application/json", "x-xiaowo-key": key },
    body: JSON.stringify({
      text: message.text,
      sticker: message.sticker,
      image: Boolean(message.image),
      voice: Boolean(message.voice),
    }),
  });
  if (res.status === 401) throw new Error("暗号不对");
  if (!res.ok) throw new Error("狐狸没接上");
  const data = await res.json();
  return Array.isArray(data.messages) ? data.messages : [];
}
