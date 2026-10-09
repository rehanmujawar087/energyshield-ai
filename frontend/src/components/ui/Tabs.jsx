import { useRef } from "react";

/**
 * WAI-ARIA tabs pattern: role="tablist"/"tab", arrow-key navigation,
 * Home/End support, roving tabindex. Renders only the tab buttons —
 * the parent renders the matching tabpanel for `activeId`.
 *
 * @param {{ items: Array<{id: string, label: string, icon?: any}>, activeId: string, onChange: (id: string) => void }} props
 */
export function Tabs({ items, activeId, onChange }) {
  const buttonRefs = useRef({});

  function focusTab(id) {
    buttonRefs.current[id]?.focus();
  }

  function handleKeyDown(e, index) {
    const lastIndex = items.length - 1;
    let nextIndex = null;
    if (e.key === "ArrowRight") nextIndex = index === lastIndex ? 0 : index + 1;
    else if (e.key === "ArrowLeft") nextIndex = index === 0 ? lastIndex : index - 1;
    else if (e.key === "Home") nextIndex = 0;
    else if (e.key === "End") nextIndex = lastIndex;

    if (nextIndex !== null) {
      e.preventDefault();
      const next = items[nextIndex];
      onChange(next.id);
      focusTab(next.id);
    }
  }

  return (
    <div className="tabs" role="tablist" aria-label="Dashboard sections">
      {items.map(({ id, label, icon: Icon }, index) => {
        const selected = id === activeId;
        return (
          <button
            key={id}
            ref={(el) => (buttonRefs.current[id] = el)}
            role="tab"
            id={`tab-${id}`}
            aria-selected={selected}
            aria-controls={`tabpanel-${id}`}
            tabIndex={selected ? 0 : -1}
            className={`tabs__button ${selected ? "tabs__button--active" : ""}`}
            data-testid={`tab-button-${id}`}
            onClick={() => onChange(id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
          >
            {Icon && <Icon size={14} aria-hidden="true" />}
            {label}
          </button>
        );
      })}
    </div>
  );
}

/** Wraps a tab's content with the matching ARIA tabpanel attributes. */
export function TabPanel({ id, activeId, children }) {
  if (id !== activeId) return null;
  return (
    <div role="tabpanel" id={`tabpanel-${id}`} aria-labelledby={`tab-${id}`} tabIndex={0} data-testid={`tab-panel-${id}`}>
      {children}
    </div>
  );
}
