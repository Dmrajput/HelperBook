import { useEffect, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { adminApi } from "../api/adminApi";

const RANGES = ["today", "last_7_days", "last_30_days", "this_month", "previous_month"];

export default function DashboardPage() {
  const [range, setRange] = useState("last_30_days");
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState(null);
  const [activity, setActivity] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setError("");
    Promise.all([adminApi.summary(range), adminApi.trends(range), adminApi.activity()])
      .then(([nextSummary, nextTrends, nextActivity]) => {
        if (!active) return;
        setSummary(nextSummary);
        setTrends(nextTrends);
        setActivity(nextActivity);
      })
      .catch((loadError) => active && setError(loadError.message));
    return () => { active = false; };
  }, [range]);

  return (
    <main className="content">
      <div className="row">
        <h1>Dashboard</h1>
        <select aria-label="Date range" value={range} onChange={(event) => setRange(event.target.value)}>
          {RANGES.map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}
        </select>
      </div>
      {error ? <p className="error">{error} <button type="button" onClick={() => setRange(range)}>Retry</button></p> : null}
      {!summary && !error ? <p>Loading dashboard...</p> : null}
      {summary ? (
        <section className="cards">
          {[
            ["Owners", summary.owners],
            ["Shops", summary.shops],
            ["Employees", summary.employees],
            ["Paid subscriptions", summary.activePaidSubscriptions],
            ["Trials", summary.activeTrials],
            ["Expired", summary.expiredSubscriptions],
            ["Collected revenue", `₹${summary.capturedRevenue}`],
            ["Successful payments", summary.successfulPayments],
            ["Failed payments", summary.failedPayments],
            ["Open tickets", summary.openTickets],
            ["New registrations", summary.newRegistrations],
            ["Coupon redemptions", summary.couponRedemptions],
          ].map(([label, value]) => <article key={label} className="card"><span>{label}</span><strong>{value}</strong></article>)}
        </section>
      ) : null}
      {trends ? (
        <section className="panel">
          <h2>New owners</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={trends.registrations.map((row) => ({ day: row._id, count: row.count }))}>
              <XAxis dataKey="day" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="count" fill="#146C54" />
            </BarChart>
          </ResponsiveContainer>
        </section>
      ) : null}
      {activity ? (
        <section className="panel">
          <h2>Recent registrations</h2>
          {activity.owners.length ? activity.owners.map((owner) => <p key={owner.id}>{owner.name} · {owner.phone}</p>) : <p>No recent registrations.</p>}
        </section>
      ) : null}
    </main>
  );
}
