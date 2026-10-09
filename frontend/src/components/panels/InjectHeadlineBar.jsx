import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { HEADLINE_PRESETS } from "../../mock/headlinePresets.js";

/**
 * @param {{ onSubmit: (headline: string) => void, submitting: boolean }} props
 */
export function InjectHeadlineBar({ onSubmit, submitting }) {
  const [value, setValue] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    const headline = value.trim();
    if (!headline) return;
    onSubmit(headline);
    setValue("");
  }

  return (
    <form className="panel inject-bar" onSubmit={handleSubmit} aria-label="Inject a headline">
      <label className="field-label" htmlFor="inject-headline-input">
        Inject a headline (demo)
      </label>

      <div className="inject-bar__presets">
        {HEADLINE_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            className="chip-button"
            onClick={() => setValue(p.text)}
            disabled={submitting}
          >
            {p.text}
          </button>
        ))}
      </div>

      <div className="inject-bar__row">
        <textarea
          id="inject-headline-input"
          data-testid="inject-headline-input"
          className="input inject-bar__textarea"
          rows={1}
          placeholder="e.g. Tanker seized near Strait of Hormuz"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={submitting}
        />
        <button
          type="submit"
          className="btn btn--primary"
          data-testid="inject-headline-submit"
          disabled={submitting || !value.trim()}
        >
          {submitting ? <Loader2 size={14} className="spin" aria-hidden="true" /> : <Send size={14} aria-hidden="true" />}
          {submitting ? "Injecting…" : "Inject"}
        </button>
      </div>
    </form>
  );
}
