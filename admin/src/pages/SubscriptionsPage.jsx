import { useEffect, useState } from "react";
import { adminApi } from "../api/adminApi";

export default function SubscriptionsPage() {
  const [planId, setPlanId] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { adminApi.subscriptions(new URLSearchParams({ planId })).then(setData).catch((loadError) => setError(loadError.message)); }, [planId]);
  return (
    <main className="content">
      <h1>Subscriptions</h1>
      <select aria-label="Plan" value={planId} onChange={(event) => setPlanId(event.target.value)}>
        <option value="">All plans</option><option>free</option><option>starter</option><option>business</option><option>pro</option>
      </select>
      {error ? <p className="error">{error}</p> : null}
      {!data && !error ? <p>Loading subscriptions...</p> : null}
      {data && !data.subscriptions.length ? <p>No subscriptions found for this period.</p> : null}
      {data?.subscriptions?.length ? <div className="panel"><table><thead><tr><th>Shop</th><th>Plan</th><th>Status</th><th>Trial</th><th>Employees</th><th>Limit</th></tr></thead><tbody>
        {data.subscriptions.map((item) => <tr key={item.id}><td>{item.shop}</td><td>{item.planId}</td><td>{item.status}</td><td>{item.isTrial ? "Yes" : "No"}</td><td>{item.activeEmployees}</td><td>{item.employeeLimit}</td></tr>)}
      </tbody></table></div> : null}
    </main>
  );
}
