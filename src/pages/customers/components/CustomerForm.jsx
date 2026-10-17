import React from "react";

export default function CustomerForm({ form, editingId, saving, onChange, onSubmit, onCancel }) {
  if (!form) return null;
  return <div className="card border-0 shadow-sm mb-4">
    <div className="card-header bg-white border-0 py-3 d-flex justify-content-between align-items-center">
      <div><h5 className="mb-1">{editingId ? "Edit Customer" : "Add Customer"}</h5><small className="text-muted">Enter customer information</small></div>
      <button type="button" className="btn-close" onClick={onCancel} aria-label="Close" />
    </div>
    <div className="card-body"><form onSubmit={onSubmit}><div className="row g-3">
      <div className="col-md-6"><label className="form-label">Customer Name <span className="text-danger">*</span></label><input className="form-control" name="name" value={form.name || ""} onChange={onChange} placeholder="Enter customer name" required /></div>
      <div className="col-md-6"><label className="form-label">Phone</label><input className="form-control" name="phone" value={form.phone || ""} onChange={onChange} placeholder="Enter phone number" /></div>
      <div className="col-md-6"><label className="form-label">Email</label><input type="email" className="form-control" name="email" value={form.email || ""} onChange={onChange} placeholder="Enter email address" /></div>
      <div className="col-md-6"><label className="form-label">Address</label><input className="form-control" name="address" value={form.address || ""} onChange={onChange} placeholder="Enter customer address" /></div>
      <div className="col-12"><div className="form-check"><input type="checkbox" id="customer-active" name="active" className="form-check-input" checked={form.active !== false} onChange={onChange} /><label className="form-check-label" htmlFor="customer-active">Active Customer</label></div></div>
      <div className="col-12 d-flex justify-content-end gap-2"><button type="button" className="btn btn-outline-secondary" onClick={onCancel} disabled={saving}>Cancel</button><button type="submit" className="btn btn-primary" disabled={saving}>{saving ? <><span className="spinner-border spinner-border-sm me-2" />Saving...</> : <><i className="bi bi-check-lg me-2" />{editingId ? "Update Customer" : "Save Customer"}</>}</button></div>
    </div></form></div>
  </div>;
}
