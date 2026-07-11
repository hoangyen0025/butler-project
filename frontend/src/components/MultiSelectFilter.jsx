import { useState, useRef, useEffect } from 'react';

export function MultiSelectFilter({ label, options, selected, onChange, placeholder, hint }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (value) => {
    if (selected.includes(value)) {
      onChange(selected.filter((item) => item !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const clearSelection = (event) => {
    event.stopPropagation();
    onChange([]);
  };

  const displayLabel =
    selected.length === 0
      ? placeholder
      : selected.length === 1
        ? selected[0]
        : `${selected.length} selected`;

  return (
    <div className="filter-group multi-select" ref={containerRef}>
      <label>{label}</label>
      <div
        className={`multi-select__control${
          selected.length > 0 ? ' multi-select__control--active' : ''
        }${open ? ' multi-select__control--open' : ''}`}
      >
        <button
          type="button"
          className="multi-select__trigger"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          aria-haspopup="listbox"
        >
          <span className="multi-select__label">{displayLabel}</span>
          <span className="multi-select__chevron" aria-hidden="true">
            ▼
          </span>
        </button>
        {selected.length > 0 && (
          <button
            type="button"
            className="multi-select__trigger-clear"
            onClick={clearSelection}
            aria-label={`Clear ${label} filter`}
            title="Clear filter"
          >
            ×
          </button>
        )}
      </div>

      {open && (
        <div className="multi-select__dropdown" role="listbox" aria-label={label}>
          <div className="multi-select__hint">{hint}</div>
          {options.map((option) => (
            <label key={option} className="multi-select__option">
              <input
                type="checkbox"
                checked={selected.includes(option)}
                onChange={() => toggleOption(option)}
              />
              <span>{option}</span>
            </label>
          ))}
          {selected.length > 0 && (
            <button type="button" className="multi-select__clear" onClick={clearSelection}>
              Clear selection
            </button>
          )}
        </div>
      )}

      {selected.length > 1 && (
        <div className="multi-select__tags">
          {selected.map((value) => (
            <span key={value} className="multi-select__tag">
              {value}
              <button
                type="button"
                className="multi-select__tag-remove"
                onClick={() => toggleOption(value)}
                aria-label={`Remove ${value}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
