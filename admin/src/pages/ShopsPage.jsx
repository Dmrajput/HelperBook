import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminApi } from "../api/adminApi";

export default function ShopsPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { adminApi.shops("page=1").then(setData).catch((loadError) => setError(loadError.message)); }, []);
  return (
    <main className="content">
      <h1>Shops</h1>
      {error ? <p className="error">{error}</p> : null}
      {!data && !error ? <p>Loading shops...</p> : null}
      {data && !data.shops.length ? <p>No shops found.</p> : null}
      {data?.shops?.length ? <div className="panel"><table><thead><tr><th>Shop</th><th>Owner</th><th>Type</th><th>City</th><th>Employees</th><th>Plan</th><th></th></tr></thead><tbody>
        {data.shops.map((shop) => <tr key={shop.id}><td>{shop.name}</td><td>{shop.owner}</td><td>{shop.businessType}</td><td>{shop.city}</td><td>{shop.activeEmployees}</td><td>{shop.planId || "—"}</td><td><Link to={`/shops/${shop.id}`}>View</Link></td></tr>)}
      </tbody></table></div> : null}
    </main>
  );
}
