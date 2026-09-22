const PrintLayout = ({
  header,
  info,
  summary,
  table,
  bottomSummary,
  footer,
  compact = false,
  landscape = false,
}) => {
  return (
    <>
      <style>{`
        @media print {
          @page {
            size: A4 ${landscape ? "landscape" : "portrait"};
            margin: 8mm 5mm;
          }

          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            overflow: visible !important;
            background: #fff !important;
          }

          /*
           * MAIN PRINT ROOT
           */
          .print-layout {
            display: block !important;
            position: static !important;

            width: 100% !important;
            max-width: none !important;

            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;

            margin: 0 !important;
            padding: 0 !important;

            overflow: visible !important;

            background: #fff !important;

            page-break-before: auto !important;
            page-break-after: auto !important;
            page-break-inside: auto !important;

            break-before: auto !important;
            break-after: auto !important;
            break-inside: auto !important;
          }

          /*
           * Do NOT force the whole layout to stay together.
           * The table must be allowed to continue onto page 2, 3, etc.
           */
          .print-table-container {
            display: block !important;
            position: static !important;

            width: 100% !important;
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;

            margin: 0 !important;
            padding: 0 !important;

            overflow: visible !important;

            page-break-before: auto !important;
            page-break-after: auto !important;
            page-break-inside: auto !important;

            break-before: auto !important;
            break-after: auto !important;
            break-inside: auto !important;
          }

          /*
           * TABLE
           */
          .print-table-container table {
            display: table !important;

            width: 100% !important;
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;

            margin: 0 !important;
            padding: 0 !important;

            border-collapse: collapse !important;

            page-break-before: auto !important;
            page-break-after: auto !important;
            page-break-inside: auto !important;

            break-before: auto !important;
            break-after: auto !important;
            break-inside: auto !important;
          }

          /*
           * Repeat header on every page.
           */
          .print-table-container thead {
            display: table-header-group !important;
          }

          .print-table-container tbody {
            display: table-row-group !important;
          }

          /*
           * Keep each transaction row together.
           */
          .print-table-container tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          .print-table-container th,
          .print-table-container td {
            overflow: visible !important;
          }

          /*
           * Header / information / balance should not create
           * artificial full-page blocks.
           */
          .print-layout > div {
            max-height: none !important;
            overflow: visible !important;
          }

          /*
           * Balance should stay together.
           */
          .print-layout .print-summary {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          /*
           * Totals row / footer should stay together,
           * but must NOT create an extra empty page.
           */
          .print-bottom-summary,
          .print-footer {
            display: block !important;

            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;

            margin-bottom: 0 !important;

            overflow: visible !important;

            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          /*
           * Images must never force a page.
           */
          .print-layout img {
            max-width: 100% !important;
            height: auto !important;
          }

          /*
           * Remove visual effects only.
           */
          .print-layout,
          .print-layout * {
            box-shadow: none !important;
          }
        }
      `}</style>

      <div
        className="print-layout bg-white w-full mx-auto"
        style={{
          boxSizing: "border-box",
          width: "100%",
          maxWidth: landscape ? "297mm" : "210mm",
          height: "auto",
          minHeight: 0,
          maxHeight: "none",
          overflow: "visible",
          margin: 0,
          padding: 0,
          background: "#ffffff",
        }}
      >
        {/* HEADER */}
        {header}

        {/* INFORMATION */}
        {info && (
          <div
            style={{
              marginBottom: landscape ? "10px" : "20px",
              height: "auto",
              minHeight: 0,
            }}
          >
            {info}
          </div>
        )}

        {/* BALANCE */}
        {summary && (
          <div
            className="print-summary"
            style={{
              marginBottom: landscape ? "10px" : "20px",
              height: "auto",
              minHeight: 0,
              pageBreakInside: "avoid",
              breakInside: "avoid",
            }}
          >
            {summary}
          </div>
        )}

        {/* TABLE */}
        {table && (
          <div
            className="print-table-container"
            style={{
              width: "100%",
              minWidth: 0,
              height: "auto",
              minHeight: 0,
              maxHeight: "none",
              overflow: "visible",
              margin: 0,
              padding: 0,
            }}
          >
            {table}
          </div>
        )}

        {/* BOTTOM SUMMARY */}
        {bottomSummary && (
          <div
            className="print-bottom-summary"
            style={{
              marginTop: landscape ? "8px" : "12px",
              paddingTop: "8px",
              height: "auto",
              minHeight: 0,
              maxHeight: "none",
              pageBreakInside: "avoid",
              breakInside: "avoid",
            }}
          >
            {bottomSummary}
          </div>
        )}

        {/* FOOTER */}
        {footer && (
          <div
            className="print-footer"
            style={{
              height: "auto",
              minHeight: 0,
              maxHeight: "none",
              margin: 0,
              padding: 0,
              pageBreakInside: "avoid",
              breakInside: "avoid",
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </>
  );
};

export default PrintLayout;