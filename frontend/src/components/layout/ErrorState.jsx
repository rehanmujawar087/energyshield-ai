export function ErrorState({ message = "Something went wrong loading this panel.", onRetry }) {
  return (
    <div className="state-block state-block--error" role="alert">
      <span className="state-block__icon" aria-hidden="true">
        ⚠️
      </span>
      <strong>{message}</strong>
      {onRetry && (
        <button className="btn" onClick={onRetry} aria-label="Retry loading this panel">
          Retry
        </button>
      )}
    </div>
  );
}
