import { useEffect, useState } from "react";
import { adminApi } from "../api/adminApi";

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { adminApi.analytics("revenue", "last_30_days").then(setData).catch((loadError) => setError(loadError.message)); }, []);
  return (
    <main className="content">
      <h1>Analytics</h1>
      {error ? <p className="error">{error}</p> : null}
      {!data && !error ? <p>Loading analytics...</p> : null}
      {data ? <section className="panel">
        <h2>Collected revenue</h2>
        <p>₹{data.collected}</p>
        <p>{data.definitions?.monthlyCollectedRevenue}</p>
        <p>{data.definitions?.activePaidSubscriptions}</p>
        <p>{data.definitions?.trialConversionRate}</p>
        <p>{data.definitions?.churnRate}</p>
      </section> : null}
    </main>
  );
}
