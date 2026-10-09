import { useEffect, useState } from "react";
import { adminApi } from "../api/adminApi";
import { useAdminAuth } from "../context/AdminAuthContext";

export default function CouponsPage() {
  const { can } = useAdminAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ code: "", discountType: "percentage", discountValue: 10, startsAt: "", expiresAt: "" });
  const load = () => adminApi.coupons().then(setData).catch((loadError) => setError(loadError.message));
  useEffect(() => { load(); }, []);
  return (
    <main className="content">
      <h1>Coupons</h1>
      {error ? <p className="error">{error}</p> : null}
      {!data && !error ? <p>Loading coupons...</p> : null}
      {data && !data.coupons.length ? <p>No coupons have been created yet.</p> : null}
      {data?.coupons?.length ? <div className="panel"><table><thead><tr><th>Code</th><th>Discount</th><th>Status</th><th>Used</th></tr></thead><tbody>
        {data.coupons.map((coupon) => <tr key={coupon.id}><td>{coupon.code}</td><td>{coupon.discountType === "percentage" ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}</td><td>{coupon.status}</td><td>{coupon.redemptions}</td></tr>)}
      </tbody></table></div> : null}
      {can("coupons.create") ? <form className="panel" onSubmit={async (event) => {
        event.preventDefault();
        await adminApi.createCoupon({ ...form, applicablePlanIds: ["starter", "business", "pro"], applicableBillingIntervals: ["monthly"] });
        setForm({ code: "", discountType: "percentage", discountValue: 10, startsAt: "", expiresAt: "" });
        load();
      }}>
        <h2>Create coupon</h2>
        <input aria-label="Code" value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} required />
        <select aria-label="Discount type" value={form.discountType} onChange={(event) => setForm({ ...form, discountType: event.target.value })}><option value="percentage">Percentage</option><option value="fixed">Fixed rupees</option></select>
        <input aria-label="Discount value" type="number" value={form.discountValue} onChange={(event) => setForm({ ...form, discountValue: Number(event.target.value) })} />
        <input aria-label="Starts" type="datetime-local" value={form.startsAt} onChange={(event) => setForm({ ...form, startsAt: event.target.value })} required />
        <input aria-label="Expires" type="datetime-local" value={form.expiresAt} onChange={(event) => setForm({ ...form, expiresAt: event.target.value })} required />
        <button type="submit">Create</button>
      </form> : null}
    </main>
  );
}
