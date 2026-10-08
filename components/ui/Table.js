export function Table({ children, className = "" }) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full min-w-[560px] text-left text-sm">{children}</table>
    </div>
  );
}

export const THead = ({ children }) => (
  <thead className="border-b border-line bg-cream/60 text-xs uppercase tracking-wide text-muted">{children}</thead>
);
export const TH = ({ children, className = "" }) => <th className={`px-4 py-3 font-semibold ${className}`}>{children}</th>;
export const TBody = ({ children }) => <tbody className="divide-y divide-line">{children}</tbody>;
export const TR = ({ children, className = "" }) => <tr className={`hover:bg-cream/40 ${className}`}>{children}</tr>;
export const TD = ({ children, className = "" }) => <td className={`px-4 py-3 align-top ${className}`}>{children}</td>;
