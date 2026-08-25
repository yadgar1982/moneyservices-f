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
        /* ==================================================
           PRINT LAYOUT
        ================================================== */

        @media print {

          @page {
            /*
             * Do not force orientation.
             * Chrome will provide the Portrait/Landscape
             * option in the print window.
             */
            size: auto;
            margin: 5mm;
          }


          /* ==================================================
             PAGE
          ================================================== */

          html,
          body {
            margin: 0 !important;
            padding: 0 !important;

            width: 100% !important;
            height: auto !important;

            min-height: 0 !important;
            max-height: none !important;

            overflow: visible !important;

            background: #ffffff !important;
          }


          /* ==================================================
             PRINTABLE CONTENT MUST BE VISIBLE
          ================================================== */

          .print-layout,
          .print-layout *,
          .print-layout > * {
            visibility: visible !important;
          }


          /* ==================================================
             PRINT ROOT
          ================================================== */

          .print-layout {
            width: 100% !important;

            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;

            margin: 0 auto !important;

            padding-bottom: ${
              landscape ? "10mm" : "5mm"
            } !important;

            overflow: visible !important;

            box-sizing: border-box !important;

            page-break-after: auto !important;
            break-after: auto !important;

            page-break-inside: auto !important;
            break-inside: auto !important;

            background: #ffffff !important;
          }


          /* ==================================================
             TABLE CONTAINER
          ================================================== */

          .print-table-container {
            width: 100% !important;

            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;

            display: block !important;

            overflow: visible !important;

            flex: none !important;

            page-break-inside: auto !important;
            break-inside: auto !important;
          }


          /* ==================================================
             TABLE
          ================================================== */

          .print-table-container table {
            width: 100% !important;

            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;

            margin: 0 !important;

            border-collapse: collapse !important;

            overflow: visible !important;

            page-break-inside: auto !important;
            break-inside: auto !important;
          }


          /* ==================================================
             REPEAT TABLE HEADER
          ================================================== */

          .print-table-container thead {
            display: table-header-group !important;
          }

          .print-table-container tbody {
            display: table-row-group !important;
          }


          /* ==================================================
             KEEP ROWS TOGETHER
          ================================================== */

          .print-table-container tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }


          /* ==================================================
             TABLE CELLS
          ================================================== */

          .print-table-container th,
          .print-table-container td {
            overflow: visible !important;
          }


          /* ==================================================
             BOTTOM SUMMARY
          ================================================== */

          .print-bottom-summary {
            page-break-inside: avoid !important;
            break-inside: avoid !important;

            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;

            overflow: visible !important;

            visibility: visible !important;
          }


          /* ==================================================
             RECEIPT / REPORT FOOTER
          ================================================== */

          /*
           * IMPORTANT:
           * Do NOT use display:none here.
           *
           * Account Statement does not pass a footer,
           * so nothing is rendered there.
           *
           * TransactionReceipt DOES pass a footer,
           * so it remains visible.
           */

          .print-footer {
            display: block !important;

            visibility: visible !important;

            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;

            overflow: visible !important;

            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }


          .print-footer,
          .print-footer * {
            visibility: visible !important;
          }


          /* ==================================================
             IMAGES / LOGOS
          ================================================== */

          .print-layout img {
            max-width: 100% !important;
            max-height: none !important;

            visibility: visible !important;

            overflow: visible !important;
          }


          /* ==================================================
             REMOVE SCREEN SHADOWS
          ================================================== */

          .print-layout,
          .print-layout * {
            box-shadow: none !important;
          }


          /* ==================================================
             PRINT COLORS
          ================================================== */

          .print-layout,
          .print-layout * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
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

          ${
            landscape
              ? "max-w-[297mm]"
              : "max-w-[210mm]"
          }

          ${
            compact
              ? ""
              : landscape
              ? ""
              : "min-h-[297mm]"
          }
        `}
        style={{
          boxSizing: "border-box",
          overflow: "visible",
          background: "#ffffff",
        }}
      >

        {/* ==================================================
            HEADER
        ================================================== */}

        {header}


        {/* ==================================================
            INFORMATION
        ================================================== */}

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


        {/* ==================================================
            TOP SUMMARY
        ================================================== */}

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


        {/* ==================================================
            TABLE
        ================================================== */}

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


        {/* ==================================================
            BOTTOM SUMMARY
        ================================================== */}

        {bottomSummary && (
          <div
            className={`
              print-bottom-summary
              ${
                landscape
                  ? "mt-2 pt-2"
                  : "mt-3 pt-2"
              }
            `}
            style={{
              pageBreakInside: "avoid",
              breakInside: "avoid",
            }}
          >
            {bottomSummary}
          </div>
        )}


        {/* ==================================================
            FOOTER
        ================================================== */}

        {footer && (
          <div
            className="print-footer"
            style={{
              pageBreakInside: "avoid",
              breakInside: "avoid",
              visibility: "visible",
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