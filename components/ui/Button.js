"use client";

const VARIANTS = {
  primary: "bg-primary text-white hover:bg-primary-dark focus-visible:outline-primary",
  secondary: "bg-white text-ink border border-line hover:bg-cream focus-visible:outline-primary",
  ghost: "text-ink hover:bg-primary-soft focus-visible:outline-primary",
  danger: "bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600",
  dangerSoft: "bg-red-50 text-red-700 hover:bg-red-100 focus-visible:outline-red-600",
};

const SIZES = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  className = "",
  children,
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
      )}
      {children}
    </button>
  );
}
