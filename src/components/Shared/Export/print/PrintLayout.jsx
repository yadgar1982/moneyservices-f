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
  margin: 8mm 10mm 15mm 10mm;
}

          html,
          body {
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            overflow: visible !important;
          }

          /*
           * PRINT ROOT
           */
          .print-layout {
            width: 100% !important;
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;

            overflow: visible !important;

            box-sizing: border-box !important;

            margin: 0 auto !important;

            /*
             * Bottom breathing room.
             * Landscape gets a little more.
             */
            padding-bottom: ${landscape ? "15mm" : "5mm"} !important;

            /*
             * IMPORTANT:
             * Do NOT force a page break here.
             */
            page-break-after: auto !important;
            break-after: auto !important;
          }

          /*
           * The table must be allowed to grow
           * beyond the first physical page.
           */
          .print-table-container {
            width: 100% !important;

            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;

            overflow: visible !important;

            display: block !important;

            flex: none !important;

            page-break-inside: auto !important;
            break-inside: auto !important;
          }

          /*
           * TABLE PAGINATION
           */
          .print-table-container table {
            width: 100% !important;
            height: auto !important;
            max-height: none !important;

            overflow: visible !important;

            border-collapse: collapse !important;

            page-break-inside: auto !important;
            break-inside: auto !important;
          }

          /*
           * Repeat table header on every page.
           */
          .print-table-container thead {
            display: table-header-group !important;
          }

          .print-table-container tbody {
            display: table-row-group !important;
          }

          /*
           * Don't split an individual transaction
           * between two pages.
           */
          .print-table-container tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          /*
           * Keep table cells from creating
           * unexpected clipping.
           */
          .print-table-container th,
          .print-table-container td {
            overflow: visible !important;
          }

          /*
           * Never clip the statement.
           */
          .print-layout,
          .print-layout > *,
          .print-layout * {
            max-height: none !important;
          }

          /*
           * Bottom totals must stay together.
           */
          .print-bottom-summary {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          /*
           * Footer is intentionally not used
           * for the account statement.
           */
          .print-footer {
            display: none !important;
          }
        }
      `}</style>

      <div
        className={`
          print-layout
          bg-white
          w-full
          mx-auto
          px-6
          py-5

          ${landscape
            ? "max-w-[297mm]"
            : "max-w-[210mm]"}

          ${compact
            ? ""
            : landscape
            ? ""
            : "min-h-[297mm]"}
        `}
        style={{
          boxSizing: "border-box",
          overflow: "visible",
        }}
      >
        {/* HEADER */}

        {header}

        {/* REPORT INFORMATION */}

        {info && (
          <div
            className={
              landscape
                ? "mb-3"
                : "mb-5"
            }
          >
            {info}
          </div>
        )}

        {/* TOP SUMMARY */}

        {summary && (
          <div
            className={
              landscape
                ? "mb-3"
                : "mb-5"
            }
            style={{
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
              minWidth: 0,
              overflow: "visible",
            }}
          >
            {table}
          </div>
        )}

        {/* BOTTOM SUMMARY */}

        {bottomSummary && (
          <div
            className={`
              print-bottom-summary
              ${landscape
                ? "mt-2 pt-2"
                : "mt-3 pt-2"}
            `}
            style={{
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