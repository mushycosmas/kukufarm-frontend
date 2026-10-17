import React from "react";

export default function CustomerReport({ fromDate, toDate, setFromDate, setToDate, exporting, onExport }) {
  return <div className="card border-0 shadow-sm mb-4"><div className="card-body">
    <div className="d-flex justify-content-between align-items-center mb-3"><div><h5 className="mb-1">Customer Report</h5><p className="text-muted mb-0 small">Generate a PDF report containing customer purchases, payments and outstanding balances.</p></div><i className="bi bi-file-earmark-pdf fs-2 text-danger" /></div>
    <div className="row g-3 align-items-end">
      <div className="col-md-4"><label className="form-label">From Date</label><input type="date" className="form-control" value={fromDate || ""} onChange={(e) => setFromDate(e.target.value)} /></div>
      <div className="col-md-4"><label className="form-label">To Date</label><input type="date" className="form-control" value={toDate || ""} onChange={(e) => setToDate(e.target.value)} /></div>
      <div className="col-md-4"><button type="button" className="btn btn-success w-100" onClick={onExport} disabled={exporting}>{exporting ? <><span className="spinner-border spinner-border-sm me-2" />Generating PDF...</> : <><i className="bi bi-file-earmark-pdf me-2" />Generate PDF Report</>}</button></div>
    </div>
  </div></div>;
}
