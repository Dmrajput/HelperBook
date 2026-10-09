import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { adminApi } from "../api/adminApi";
import { useAdminAuth } from "../context/AdminAuthContext";

export default function PaymentDetailPage() {
  const { id } = useParams();
  const { can } = useAdminAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [reason, setReason] = useState("");
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const load = () => adminApi.payment(id).then(setData).catch((loadError) => setError(loadError.message));
  useEffect(() => { load(); }, [id]);
  const payment = data?.payment;
  return (
    <main className="content">
      <h1>Payment</h1>
      {error ? <p className="error">{error}</p> : null}
      {notice ? <p>{notice}</p> : null}
      {!payment && !error ? <p>Loading payment...</p> : null}
      {payment ? (
        <section className="panel">
          <p>Amount ₹{payment.amount}</p>
          <p>Status {payment.status}</p>
          <p>Refund {payment.refundStatus}</p>
          <p>Plan {payment.planId} · {payment.billingInterval}</p>
          <p>Order {payment.razorpayOrderId || "—"}</p>
          <p>Provider payment {payment.razorpayPaymentId || "Not captured"}</p>
          {can("payments.refund") && payment.status === "paid" && payment.refundStatus !== "processed" ? <button type="button" onClick={() => setOpen(true)}>Request refund</button> : null}
        </section>
      ) : null}
      {open && payment ? (
        <div className="modal"><form className="panel" onSubmit={async (event) => {
          event.preventDefault();
          const result = await adminApi.refund(id, { reason });
          setNotice(result.message || `Refund status: ${result.refundStatus}`);
          setOpen(false);
          load();
        }}>
          <h2>Refund ₹{payment.amount}</h2>
          <p>The payment stays paid until the provider confirms the refund.</p>
          <textarea aria-label="Refund reason" value={reason} onChange={(event) => setReason(event.target.value)} required />
          <div className="row"><button type="submit">Confirm</button><button className="secondary" type="button" onClick={() => setOpen(false)}>Cancel</button></div>
        </form></div>
      ) : null}
    </main>
  );
}
