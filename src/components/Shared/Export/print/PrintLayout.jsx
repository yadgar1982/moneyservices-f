const PrintLayout = ({
  header,
  info,
  summary,
  table,
  bottomSummary,
  footer,
  compact = false,
}) => {
  return (
    <div
      className={`bg-white w-full max-w-[210mm] mx-auto px-6 py-5 flex flex-col ${
        compact ? "" : "min-h-[297mm]"
      }`}
    >
      {/* Header */}
      {header}

      {/* Report Information */}
      {info && <div className="mb-5">{info}</div>}

      {/* Top Summary */}
      {summary && <div className="mb-5">{summary}</div>}

      {/* Table */}
      {table && (
        <div className="flex-1">
          {table}
        </div>
      )}

      {/* Bottom Summary */}
     {bottomSummary && (
  <div
    className="mt-3 pt-2"
    style={{
      pageBreakInside: "avoid",
    }}
  >
    {bottomSummary}
  </div>
)}

      {/* Footer */}
      {footer && (
        <div
          className={compact ? "mt-1" : "mt-4 pt-3 border-t border-gray-300"}
          style={{
            pageBreakInside: "avoid",
          }}
        >
          {footer}
        </div>
      )}
    </div>
  );
};

export default PrintLayout;