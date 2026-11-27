// Little pages of their own (the cookie tin, the bookstore) are shown in a
// frame; the handwriting and serif fonts the app already carries are handed
// to them so they need nothing from outside.
const FAMILIES = /Long Cang|Noto Serif SC|La Belle Aurore/;

export function shareFonts(frame) {
  try {
    let css = "";
    for (const sheet of document.styleSheets) {
      let rules;
      try {
        rules = sheet.cssRules;
      } catch {
        continue;
      }
      for (const rule of rules) {
        if (rule.type === CSSRule.FONT_FACE_RULE && FAMILIES.test(rule.style.fontFamily)) css += rule.cssText;
      }
    }
    const doc = frame.contentDocument;
    const style = doc.createElement("style");
    style.textContent = css;
    doc.head.appendChild(style);
  } catch {
    // the letters still read fine in the phone's own fonts
  }
}
