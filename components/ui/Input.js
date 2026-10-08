"use client";

const base =
  "w-full rounded-lg border bg-white px-3 text-sm text-ink placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:bg-gray-50";

export function Field({ label, error, hint, children, htmlFor }) {
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={htmlFor} className="block text-sm font-medium text-ink">
          {label}
        </label>
      )}
      {children}
      {hint && !error && <p className="text-xs text-muted">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function Input({ label, error, hint, className = "", id, ...props }) {
  const inputId = id || props.name;
  return (
    <Field label={label} error={error} hint={hint} htmlFor={inputId}>
      <input id={inputId} className={`${base} h-10 ${error ? "border-red-400" : "border-line"} ${className}`} {...props} />
    </Field>
  );
}

export function Textarea({ label, error, hint, className = "", id, rows = 3, ...props }) {
  const inputId = id || props.name;
  return (
    <Field label={label} error={error} hint={hint} htmlFor={inputId}>
      <textarea id={inputId} rows={rows} className={`${base} py-2 ${error ? "border-red-400" : "border-line"} ${className}`} {...props} />
    </Field>
  );
}

export function Select({ label, error, hint, className = "", id, children, ...props }) {
  const inputId = id || props.name;
  return (
    <Field label={label} error={error} hint={hint} htmlFor={inputId}>
      <select id={inputId} className={`${base} h-10 ${error ? "border-red-400" : "border-line"} ${className}`} {...props}>
        {children}
      </select>
    </Field>
  );
}

export function Checkbox({ label, className = "", ...props }) {
  return (
    <label className={`flex cursor-pointer items-center gap-2 text-sm text-ink ${className}`}>
      <input type="checkbox" className="h-4 w-4 rounded border-line accent-primary" {...props} />
      {label}
    </label>
  );
}
