import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { adminApi } from "../api/adminApi";
import { useAdminAuth } from "../context/AdminAuthContext";

export default function ShopDetailPage() {
  const { id } = useParams();
  const { can } = useAdminAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [reason, setReason] = useState("");
  const load = () => adminApi.shop(id).then(setData).catch((loadError) => setError(loadError.message));
  useEffect(() => { load(); }, [id]);
  const shop = data?.shop;
  return (
    <main className="content">
      <h1>Shop</h1>
      {error ? <p className="error">{error}</p> : null}
      {shop ? <section className="panel">
        <p>{shop.name}</p>
        <p>{shop.businessType} · {shop.city}, {shop.state}</p>
        <p>Access {shop.accessSuspended ? "Suspended" : "Active"}</p>
        <p>Active employees {shop.activeEmployees}</p>
        {data.owner ? <p><Link to={`/users/${data.owner.id}`}>Owner {data.owner.name}</Link></p> : null}
        {data.subscription ? <p>Subscription {data.subscription.planId} · {data.subscription.status}</p> : null}
        <p>Shop suspension is separate from the owner account and the subscription.</p>
        {can("shops.suspend") ? <form className="row" onSubmit={async (event) => { event.preventDefault(); await adminApi.shopStatus(id, { status: shop.accessSuspended ? "active" : "suspended", reason }); setReason(""); load(); }}>
          <input aria-label="Reason" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Reason" required />
          <button type="submit">{shop.accessSuspended ? "Reactivate shop" : "Suspend shop"}</button>
        </form> : null}
      </section> : null}
    </main>
  );
}
