export function EmptyState({ icon = "🗂️", title = "Nothing here yet", message }) {
  return (
    <div className="state-block" role="status">
      <span className="state-block__icon" aria-hidden="true">
        {icon}
      </span>
      <strong>{title}</strong>
      {message && <span>{message}</span>}
    </div>
  );
}
