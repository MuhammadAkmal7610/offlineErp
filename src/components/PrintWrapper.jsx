import { useRef } from 'react';

export default function PrintWrapper({ title, printLabel, children }) {
  const printRef = useRef(null);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>${printLabel}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .print-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <h2>${printLabel}</h2>
          ${content.innerHTML}
          <script>window.onload = () => { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-panel sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">{title}</p>
        </div>
        <button type="button" onClick={handlePrint} className="rounded-2xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
          Print {printLabel}
        </button>
      </div>
      <div ref={printRef} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-panel">
        {children}
      </div>
    </div>
  );
}