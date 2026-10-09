import { useEffect, useState } from "react";
import { adminApi } from "../api/adminApi";

export default function ReportsPage() {
  const [data, setData] = useState(null);
  const [payments, setPayments] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    Promise.all([adminApi.registrations("last_30_days"), adminApi.paymentReport("last_30_days")])
      .then(([registrations, paymentData]) => { setData(registrations); setPayments(paymentData); })
      .catch((loadError) => setError(loadError.message));
  }, []);
  return (
    <main className="content">
      <h1>Reports</h1>
      {error ? <p className="error">{error}</p> : null}
      {!data && !error ? <p>Loading reports...</p> : null}
      {data ? <section className="cards"><article className="card"><span>New owners</span><strong>{data.owners}</strong></article><article className="card"><span>New shops</span><strong>{data.shops}</strong></article><article className="card"><span>New employees</span><strong>{data.employees}</strong></article></section> : null}
      {payments ? <section className="panel"><h2>Collected subscription revenue</h2><p>₹{payments.collected}</p><p>Pending and failed payments are not included.</p></section> : null}
    </main>
  );
}
