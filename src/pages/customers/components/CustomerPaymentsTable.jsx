import React from "react";
import { formatDate, formatMoney } from "../utils/customerUtils";

export default function CustomerPaymentsTable({ payments = [], totalPayments = 0, getPaymentDate, getPaymentAmount, getPaymentMethod }) {
  return <div className="card border-0 shadow-sm mb-4"><div className="card-header bg-white border-0 py-3"><h5 className="mb-1">Payment History</h5><small className="text-muted">Payments received against this customer's sales</small></div><div className="card-body p-0">
    {payments.length === 0 ? <div className="text-center py-5"><i className="bi bi-cash-stack fs-1 text-muted" /><h6 className="mt-3">No payments found</h6><p className="text-muted mb-0">No payment transactions are available for this customer.</p></div> : <div className="table-responsive"><table className="table table-hover align-middle mb-0"><thead className="table-light"><tr><th>#</th><th>Date</th><th>Sale / Invoice</th><th>Payment Method</th><th>Reference</th><th className="text-end">Amount</th></tr></thead><tbody>
      {payments.map((payment, index) => { const sale = payment.sale && typeof payment.sale === "object" ? payment.sale : null; return <tr key={payment.id ?? index}><td>{index + 1}</td><td>{formatDate(getPaymentDate(payment))}</td><td>{payment.invoice_number || payment.sale_invoice || sale?.invoice_number || sale?.invoice_no || (sale?.id ? `SALE-${sale.id}` : payment.sale_id || payment.sale || "-")}</td><td>{getPaymentMethod(payment) || "-"}</td><td>{payment.reference || payment.transaction_reference || payment.receipt_number || "-"}</td><td className="text-end text-success fw-semibold">TZS {formatMoney(getPaymentAmount(payment))}</td></tr>; })}
    </tbody><tfoot className="table-light"><tr><th colSpan="5" className="text-end">Total Payments:</th><th className="text-end text-success">TZS {formatMoney(totalPayments)}</th></tr></tfoot></table></div>}
  </div></div>;
}
