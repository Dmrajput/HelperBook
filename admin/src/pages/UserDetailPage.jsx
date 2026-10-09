import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { adminApi } from "../api/adminApi";
import { useAdminAuth } from "../context/AdminAuthContext";

export default function UserDetailPage() {
  const { id } = useParams();
  const { can } = useAdminAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [reason, setReason] = useState("");
  const [confirming, setConfirming] = useState(false);
  const load = () => adminApi.user(id).then(setData).catch((loadError) => setError(loadError.message));
  useEffect(() => { load(); }, [id]);
  const user = data?.user;
  return (
    <main className="content">
      <h1>Owner</h1>
      {error ? <p className="error">{error}</p> : null}
      {!user && !error ? <p>Loading user...</p> : null}
      {user ? (
        <section className="panel">
          <p>{user.name}</p>
          <p>Phone {user.phone}</p>
          <p>Status {user.status}</p>
          <p>Registered {new Date(user.createdAt).toLocaleDateString("en-IN")}</p>
          <p>Last login {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString("en-IN") : "Not recorded"}</p>
          {data.shop ? <p>Shop {data.shop.name}</p> : <p>No shop yet.</p>}
          {data.subscription ? <p>Plan {data.subscription.planId} · {data.subscription.status}</p> : null}
          {can("users.suspend") && user.status === "active" ? <button type="button" onClick={() => setConfirming(true)}>Suspend account</button> : null}
          {can("users.update") && user.status === "suspended" ? <button type="button" onClick={() => setConfirming("active")}>Reactivate account</button> : null}
        </section>
      ) : null}
      {confirming ? (
        <div className="modal"><form className="panel" onSubmit={async (event) => {
          event.preventDefault();
          await adminApi.userStatus(id, { status: confirming === "active" ? "active" : "suspended", reason });
          setConfirming(false);
          setReason("");
          load();
        }}>
          <h2>{confirming === "active" ? "Reactivate account" : "Suspend account"}</h2>
          <p>This keeps business records and stops owner sign-in while suspended.</p>
          <textarea aria-label="Reason" value={reason} onChange={(event) => setReason(event.target.value)} required />
          <div className="row"><button type="submit">Confirm</button><button className="secondary" type="button" onClick={() => setConfirming(false)}>Cancel</button></div>
        </form></div>
      ) : null}
    </main>
  );
}
