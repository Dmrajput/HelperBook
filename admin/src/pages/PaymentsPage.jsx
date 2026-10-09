import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminApi } from "../api/adminApi";

export default function PaymentsPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { adminApi.payments("range=last_30_days").then(setData).catch((loadError) => setError(loadError.message)); }, []);
  return (
    <main className="content">
      <h1>Subscription payments</h1>
      <p>These are HelperBook subscription charges, not employee salary payments.</p>
      {error ? <p className="error">{error} <button type="button" onClick={() => window.location.reload()}>Retry</button></p> : null}
      {!data && !error ? <p>Loading payments...</p> : null}
      {data && !data.payments.length ? <p>No subscription payments found.</p> : null}
      {data?.payments?.length ? <div className="panel"><table><thead><tr><th>Date</th><th>Plan</th><th>Amount</th><th>Status</th><th>Refund</th><th></th></tr></thead><tbody>
        {data.payments.map((payment) => <tr key={payment.id}><td>{new Date(payment.createdAt).toLocaleDateString("en-IN")}</td><td>{payment.planId}</td><td>₹{payment.amount}</td><td>{payment.status}</td><td>{payment.refundStatus}</td><td><Link to={`/payments/${payment.id}`}>View</Link></td></tr>)}
      </tbody></table></div> : null}
    </main>
  );
}
