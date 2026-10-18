import React, { useEffect, useRef, useState } from "react";
import { useAvatars, useChatBackground } from "./useAvatars";
import { clearPhoto, loadPhotos, saveBlob, savePhoto } from "./photoStore";
import { useVoiceRecorder } from "./useVoiceRecorder";
import ChatMessages from "./ChatMessages";
import { burstFrom } from "./burst";
import {
  STICKER_BASE,
  defaultSettings,
  loadLog,
  loadSettings,
  preview,
  saveLog,
  saveSettings,
  stickers,
} from "./chatLog";
import wangshu from "./assets/chat/wangshu.webp";

// Our chat, by the same window as home: the weather outside shows through,
// the bubbles are frosted glass, and the paw opens the little fox stickers.

function PawIcon() {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true">
      <ellipse cx="20" cy="25" rx="8" ry="7" />
      <ellipse cx="10" cy="17" rx="4" ry="5" />
      <ellipse cx="17" cy="12" rx="4" ry="5" />
      <ellipse cx="25" cy="12" rx="4" ry="5" />
      <ellipse cx="32" cy="17" rx="4" ry="5" />
    </svg>
  );
}

// thin line icons, so every button speaks the same quiet language
const icons = {
  back: <path d="M15 5l-7 7 7 7" />,
  more: (
    <>
      <circle cx="5" cy="12" r="1.3" />
      <circle cx="12" cy="12" r="1.3" />
      <circle cx="19" cy="12" r="1.3" />
    </>
  ),
  photo: (
    <>
      <rect x="3.5" y="5" width="17" height="14" rx="3" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="M4 17l5-4.5 4 3.5 3-2.5 4 3.5" />
    </>
  ),
  send: <path d="M12 19V5M6 11l6-6 6 6" />,
  mic: (
    <>
      <rect x="9" y="3.5" width="6" height="11" rx="3" />
      <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v2.5" />
    </>
  ),
  keyboard: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="3" />
      <path d="M7 10h.01M10.5 10h.01M14 10h.01M17.5 10h.01M8 14h8" />
    </>
  ),
};

function Icon({ name }) {
  return (
    <svg className="chat-icon" viewBox="0 0 24 24" aria-hidden="true">
      {icons[name]}
    </svg>
  );
}

function Avatar({ src, fallback }) {
  return (
    <span className="chat-avatar">
      {src ? <img src={src} alt="" /> : <b>{fallback}</b>}
    </span>
  );
}

function PictureSetting({ label, src, fallback, custom, onPick, onReset, wide }) {
  const input = useRef(null);
  return (
    <div className="chat-setting-row">
      {wide ? (
        <span className="chat-setting-bg" style={src ? { backgroundImage: `url("${src}")` } : undefined}>
          {!src && "窗"}
        </span>
      ) : (
        <Avatar src={src} fallback={fallback} />
      )}
      <span>{label}</span>
      <button onClick={() => input.current?.click()}>换一张</button>
      {custom && <button onClick={onReset}>换回来</button>}
      <input
        ref={input}
        type="file"
        accept="image/*"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onPick(file);
          event.target.value = "";
        }}
      />
    </div>
  );
}

export default function Chat({ onBack, dayCount, scene }) {
  const avatars = useAvatars();
  const backdrop = useChatBackground();
  const background = backdrop.background;
  const dark = background ? background.dark : scene !== "day";
  const [log, setLog] = useState(loadLog);
  const [settings, setSettings] = useState(loadSettings);
  const [input, setInput] = useState("");
  const [panel, setPanel] = useState(null); // null | "stickers" | "settings"
  const [menuFor, setMenuFor] = useState(null); // the bubble whose menu is open
  const [quoting, setQuoting] = useState(null);
  const [images, setImages] = useState({}); // photo or voice slot -> url
  const [talking, setTalking] = useState(false); // the input is "hold to talk"
  const [toast, setToast] = useState("");
  const bottom = useRef(null);
  const photoInput = useRef(null);
  const sendKey = useRef(null);
  const pawKey = useRef(null);
  const field = useRef(null);

  // pictures in the chat live with the polaroid photos, not in the log
  useEffect(() => {
    const slots = log.filter((m) => m.image || m.voice).map((m) => m.image || m.voice);
    if (!slots.length) return undefined;
    let alive = true;
    loadPhotos(slots).then((found) => {
      if (alive) setImages((current) => ({ ...found, ...current }));
    });
    return () => {
      alive = false;
    };
    // only on arrival: new pictures add their own url when sent
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => saveLog(log), [log]);
  useEffect(() => saveSettings(settings), [settings]);
  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [log.length]);

  const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  function send(message) {
    const quote = quoting ? { from: quoting.from, text: preview(quoting) } : undefined;
    setLog((current) => [...current, { id: newId(), from: "me", at: Date.now(), ...(quote && { quote }), ...message }]);
    setQuoting(null);
  }

  async function sendPhoto(file) {
    if (!file) return;
    const slot = `chat-photo-${newId()}`;
    const url = await savePhoto(slot, file);
    setImages((current) => ({ ...current, [slot]: url }));
    burstFrom(sendKey.current, "sparkle");
    send({ image: slot });
  }

  async function sendVoice(blob, seconds) {
    const slot = `chat-voice-${newId()}`;
    const url = await saveBlob(slot, blob);
    setImages((current) => ({ ...current, [slot]: url }));
    burstFrom(sendKey.current, "sparkle");
    send({ voice: slot, seconds });
  }

  const voice = useVoiceRecorder(sendVoice, () => {
    setToast("没拿到麦克风，看看浏览器是不是不让用");
    setTimeout(() => setToast(""), 2600);
  });

  // 拍一拍: double tap an avatar
  function pat(who) {
    setLog((current) => [...current, { id: newId(), from: "pat", who, at: Date.now() }]);
  }

  function act(action, message) {
    setMenuFor(null);
    if (action === "heart") {
      setLog((current) => current.map((m) => (m.id === message.id ? { ...m, heart: !m.heart } : m)));
    } else if (action === "quote") {
      setQuoting(message);
      field.current?.focus();
    } else if (action === "copy") {
      navigator.clipboard?.writeText(message.text).catch(() => {});
    } else if (action === "recall") {
      if (message.image || message.voice) clearPhoto(message.image || message.voice);
      setLog((current) =>
        current.map((m) => (m.id === message.id ? { id: m.id, from: "recalled", at: m.at } : m))
      );
    } else if (action === "delete") {
      if (message.image || message.voice) clearPhoto(message.image || message.voice);
      setLog((current) => current.filter((m) => m.id !== message.id));
    }
  }

  function sendText() {
    const text = input.trim();
    if (!text) return;
    burstFrom(sendKey.current, "sparkle");
    send({ text });
    setInput("");
  }

  function sendSticker(file) {
    burstFrom(pawKey.current, "petal");
    send({ sticker: file });
    setPanel(null);
  }

  const toggle = (name) => setPanel((current) => (current === name ? null : name));

  return (
    <main className="chat-page" data-dark={dark || undefined}>
      {background && <div className="chat-backdrop" style={{ backgroundImage: `url("${background.url}")` }} />}

      <header className="glass chat-header">
        <button className="chat-key" onClick={onBack} aria-label="返回">
          <Icon name="back" />
        </button>
        <Avatar src={avatars.him || wangshu} />
        <div className="chat-title">
          <h1>{settings.name}</h1>
          <span>在一起的第 {dayCount} 天</span>
        </div>
        <button
          className={`chat-key ${panel === "settings" ? "active" : ""}`}
          onClick={() => toggle("settings")}
          aria-label="聊天设置"
          aria-expanded={panel === "settings"}
        >
          <Icon name="more" />
        </button>
      </header>

      {panel === "settings" && (
        <section className="glass chat-settings">
          <label className="chat-setting-row">
            <span>名字</span>
            <input
              value={settings.name}
              onChange={(event) => setSettings({ ...settings, name: event.target.value })}
              onBlur={() => !settings.name.trim() && setSettings(defaultSettings)}
            />
          </label>
          <PictureSetting
            label="他的头像"
            src={avatars.him || wangshu}
            custom={Boolean(avatars.him)}
            onPick={(file) => avatars.pick("him", file)}
            onReset={() => avatars.reset("him")}
          />
          <PictureSetting
            label="我的头像"
            src={avatars.me}
            fallback="曦"
            custom={Boolean(avatars.me)}
            onPick={(file) => avatars.pick("me", file)}
            onReset={() => avatars.reset("me")}
          />
          <PictureSetting
            wide
            label={background ? "聊天背景" : "聊天背景 · 窗外"}
            src={background?.url}
            custom={Boolean(background)}
            onPick={backdrop.pick}
            onReset={backdrop.reset}
          />
        </section>
      )}

      <section
        className="chat-messages"
        onClick={() => {
          setPanel(null);
          setMenuFor(null);
        }}
      >
        <ChatMessages
          log={log}
          images={images}
          name={settings.name}
          meAvatar={<Avatar src={avatars.me} fallback="曦" />}
          himAvatar={<Avatar src={avatars.him || wangshu} />}
          menuFor={menuFor}
          onMenu={setMenuFor}
          onAction={act}
          onPat={pat}
          bottomRef={bottom}
        />
      </section>

      <footer className="chat-compose">
        {panel === "stickers" && (
          <div className="glass chat-stickers" role="listbox" aria-label="表情">
            {stickers.map((file) => (
              <button key={file} onClick={() => sendSticker(file)} aria-label={file}>
                <img src={STICKER_BASE + file} alt="" loading="lazy" />
              </button>
            ))}
          </div>
        )}
        {quoting && (
          <p className="chat-quoting">
            <span>
              回复 {quoting.from === "me" ? "自己" : settings.name}：{preview(quoting)}
            </span>
            <button onClick={() => setQuoting(null)} aria-label="不引用了">
              ×
            </button>
          </p>
        )}
        <div className="glass chat-compose-bar">
          <button className="chat-key" onClick={() => photoInput.current?.click()} aria-label="发图片">
            <Icon name="photo" />
          </button>
          <input
            ref={photoInput}
            type="file"
            accept="image/*"
            hidden
            onChange={(event) => {
              sendPhoto(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
          <button
            ref={pawKey}
            className={`chat-key chat-paw ${panel === "stickers" ? "active" : ""}`}
            onClick={() => toggle("stickers")}
            aria-label="表情"
            aria-expanded={panel === "stickers"}
          >
            <PawIcon />
          </button>
          {talking ? (
            <button
              className={`chat-hold ${voice.state ? "is-down" : ""}`}
              onPointerDown={(event) => {
                event.currentTarget.setPointerCapture?.(event.pointerId);
                voice.start(event);
              }}
              onPointerMove={voice.move}
              onPointerUp={voice.stop}
              onPointerCancel={voice.stop}
              onContextMenu={(event) => event.preventDefault()}
            >
              {voice.state === "cancel" ? "松开手指，取消发送" : voice.state ? "松开 发送" : "按住 说话"}
            </button>
          ) : (
          <input
            ref={field}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.nativeEvent.isComposing) sendText();
            }}
            onFocus={() => setPanel(null)}
            placeholder="写点什么……"
            enterKeyHint="send"
          />
          )}
          <button
            className="chat-key"
            onClick={() => setTalking((current) => !current)}
            aria-label={talking ? "打字" : "说话"}
          >
            <Icon name={talking ? "keyboard" : "mic"} />
          </button>
          {!talking && (
            <button ref={sendKey} className="chat-key chat-send" onClick={sendText} disabled={!input.trim()} aria-label="发送">
              <Icon name="send" />
            </button>
          )}
        </div>
      </footer>

      {voice.state && (
        <div className={`chat-recording ${voice.state === "cancel" ? "is-cancel" : ""}`} aria-live="polite">
          <span className="chat-recording-bars">
            {Array.from({ length: 9 }, (_, i) => (
              <i key={i} style={{ animationDelay: `${i * 0.09}s` }} />
            ))}
          </span>
          <p>{voice.state === "cancel" ? "松开手指，取消发送" : "上滑取消"}</p>
        </div>
      )}
      {toast && <p className="chat-toast">{toast}</p>}
    </main>
  );
}
