import { useEffect, useState } from "react";
import { adminApi } from "../api/adminApi";

export default function AuditPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { adminApi.audit().then(setData).catch((loadError) => setError(loadError.message)); }, []);
  return (
    <main className="content">
      <h1>Audit logs</h1>
      {error ? <p className="error">{error}</p> : null}
      {!data && !error ? <p>Loading audit logs...</p> : null}
      {data && !data.logs.length ? <p>No admin actions have been recorded yet.</p> : null}
      {data?.logs?.length ? <div className="panel"><table><thead><tr><th>When</th><th>Action</th><th>Resource</th><th>Reason</th></tr></thead><tbody>
        {data.logs.map((log) => <tr key={log._id}><td>{new Date(log.createdAt).toLocaleString("en-IN")}</td><td>{log.action}</td><td>{log.resourceType}</td><td>{log.reason}</td></tr>)}
      </tbody></table></div> : null}
    </main>
  );
}
