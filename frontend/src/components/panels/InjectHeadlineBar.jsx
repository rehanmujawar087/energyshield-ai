import { useState } from "react";

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
      <div className="inject-bar__row">
        <input
          id="inject-headline-input"
          className="input"
          type="text"
          placeholder="e.g. Tanker seized near Strait of Hormuz"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={submitting}
        />
        <button type="submit" className="btn btn--primary" disabled={submitting || !value.trim()}>
          {submitting ? "Injecting…" : "Inject"}
        </button>
      </div>
    </form>
  );
}
