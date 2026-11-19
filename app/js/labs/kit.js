// Small control kit shared by all labs.
import { h, texHTML, L } from "../ui.js";

export function segmented(options, value, onChange, cls = "") {
  const el = h(`div.seg${cls ? "." + cls : ""}`, { role: "tablist" });
  const render = () => {
    el.replaceChildren(...options.map((o) => h("button", {
      class: o.value === value ? "on" : "", role: "tab", "aria-selected": o.value === value ? "true" : "false",
      onclick: () => { value = o.value; render(); onChange(value); }, html: o.tex ? texHTML(o.tex) : undefined, title: o.title || "",
    }, o.tex ? null : L(o.label))));
  };
  render();
  el.set = (v) => { value = v; render(); };
  return el;
}

export function slider({ label, min, max, step = 0.01, value, fmt = (v) => v, onInput }) {
  const out = h("output"); const inp = h("input", { type: "range", min, max, step, value });
  const sync = () => { out.innerHTML = typeof fmt(+inp.value) === "string" && fmt(+inp.value).startsWith("$") ? texHTML(fmt(+inp.value).slice(1, -1)) : fmt(+inp.value); };
  inp.addEventListener("input", () => { sync(); onInput(+inp.value); });
  sync();
  const el = h("label.slider", h("span.slider-label", { html: label.startsWith("$") ? texHTML(label.slice(1, -1)) : label }), inp, out);
  el.set = (v) => { inp.value = v; sync(); }; el.input = inp;
  return el;
}

export function toggle(label, value, onChange) {
  const inp = h("input", { type: "checkbox" }); inp.checked = !!value;
  inp.addEventListener("change", () => onChange(inp.checked));
  const el = h("label.toggle", inp, h("span.track", h("span.knob")), h("span", L(label)));
  el.set = (v) => { inp.checked = !!v; }; return el;
}

/** Readout rows: [[labelTex, valueTex, colorVar?], ...] */
export function readout(rows) {
  return h("div.readout", rows.filter(Boolean).map(([k, v, c]) => h("div.ro-row", { style: c ? { "--dot": `var(${c})` } : null },
    h("span.ro-k", { html: c ? `<i class="dot"></i>${texHTML(k)}` : texHTML(k) }), h("span.ro-v", { html: texHTML(v) }))));
}

export function note(html, kind = "") { return h(`div.lab-note${kind ? "." + kind : ""}`, { html }); }

export function button(label, onClick, cls = "") { return h(`button.btn${cls ? "." + cls : ""}`, { onclick: onClick, type: "button" }, label); }

/** Standard lab shell: stage (one or two planes) + side panel. */
export function shell(host, { dual = false, compact = false } = {}) {
  host.classList.add("lab"); if (compact) host.classList.add("compact");
  const stage = h(`div.lab-stage${dual ? ".dual" : ""}`);
  const p1 = h("div.plane-box"); stage.append(p1);
  let p2 = null; if (dual) { p2 = h("div.plane-box"); stage.append(h("div.map-arrow", { html: "<span>f</span>" }), p2); }
  const controls = h("div.lab-controls"); const info = h("div.lab-info");
  const panel = h("div.lab-panel", controls, info);
  host.append(stage, panel);
  return { stage, p1, p2, controls, info, panel };
}
