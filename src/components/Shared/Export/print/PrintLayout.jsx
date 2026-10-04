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
    html,
    body {
      margin: 0 !important;
      padding: 0 !important;
      width: auto !important;
      height: auto !important;
      min-height: 0 !important;
      max-height: none !important;
      overflow: visible !important;
      background: #fff !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

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
      box-sizing: border-box !important;
      background: #fff !important;
      page-break-inside: auto !important;
      break-inside: auto !important;
    }

    .print-table-container {
      display: block !important;
      position: static !important;
      width: 100% !important;
      min-width: 0 !important;
      max-width: 100% !important;
      height: auto !important;
      max-height: none !important;
      margin: 0 !important;
      padding: 0 !important;
      overflow: visible !important;
      page-break-inside: auto !important;
      break-inside: auto !important;
    }

    .print-table-container table {
      width: 100% !important;
      min-width: 0 !important;
      max-width: 100% !important;
      height: auto !important;
      margin: 0 !important;
      padding: 0 !important;
      border-collapse: collapse !important;
      table-layout: fixed !important;
      page-break-inside: auto !important;
      break-inside: auto !important;
    }

    .print-table-container thead {
      display: table-header-group !important;
    }

    .print-table-container tbody {
      display: table-row-group !important;
    }

    .print-table-container tr {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }

    .print-table-container th,
    .print-table-container td {
      box-sizing: border-box !important;
      overflow-wrap: anywhere !important;
      word-break: normal !important;
      overflow: visible !important;
    }

    .print-layout > div {
      max-height: none !important;
      overflow: visible !important;
    }

    .print-layout .print-summary {
      height: auto !important;
      max-height: none !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }

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

    .print-layout img {
      max-width: 100% !important;
      height: auto !important;
    }

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