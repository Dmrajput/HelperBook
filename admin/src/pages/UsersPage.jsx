import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminApi } from "../api/adminApi";

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const load = () => adminApi.users(new URLSearchParams({ search, status, page: "1" })).then(setData).catch((loadError) => setError(loadError.message));
  useEffect(() => { load(); }, [status]);
  return (
    <main className="content">
      <h1>Users</h1>
      <form className="row" onSubmit={(event) => { event.preventDefault(); load(); }}>
        <input aria-label="Search users" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name or phone" />
        <select aria-label="Status" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">All</option><option value="active">Active</option><option value="suspended">Suspended</option>
        </select>
        <button type="submit">Search</button>
      </form>
      {error ? <p className="error">{error}</p> : null}
      {!data && !error ? <p>Loading users...</p> : null}
      {data && !data.users.length ? <p>No users match your filters.</p> : null}
      {data?.users?.length ? (
        <div className="panel"><table><thead><tr><th>Name</th><th>Phone</th><th>Status</th><th>Plan</th><th></th></tr></thead><tbody>
          {data.users.map((user) => <tr key={user.id}><td>{user.name}</td><td>{user.phone}</td><td>{user.status}</td><td>{user.planId || "—"}</td><td><Link to={`/users/${user.id}`}>View</Link></td></tr>)}
        </tbody></table></div>
      ) : null}
    </main>
  );
}
