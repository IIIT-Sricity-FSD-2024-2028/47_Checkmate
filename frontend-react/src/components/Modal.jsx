import React, { useEffect } from "react";
import { X } from "lucide-react";
import "../styles/components/modal.css";

/**
 * Generic overlay dialog.
 *
 * Closes on backdrop click, the X button, or Escape. Renders nothing when `open` is false,
 * so form state inside resets naturally when the parent remounts its contents.
 *
 * @param {boolean} open
 * @param {string} title
 * @param {Function} onClose
 * @param {React.ReactNode} footer - Optional action row (buttons), right-aligned.
 * @param {number|string} width - Max width of the window (default 480).
 * @param {boolean} flush - Remove body padding (for list-style content like notifications).
 */
function Modal({ open, title, onClose, footer, width = 480, flush = false, children }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-window" role="dialog" aria-label={title} style={{ maxWidth: width }}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className={`modal-body ${flush ? "modal-body--flush" : ""}`.trim()}>{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

export default Modal;
