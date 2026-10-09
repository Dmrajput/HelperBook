import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { adminApi } from "../api/adminApi";
import { useAdminAuth } from "../context/AdminAuthContext";

export default function EmployeeDetailPage() {
  const { id } = useParams();
  const { admin } = useAdminAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [reason, setReason] = useState("");
  const [open, setOpen] = useState(false);
  const load = () => adminApi.employee(id).then(setData).catch((loadError) => setError(loadError.message));
  useEffect(() => { load(); }, [id]);
  const employee = data?.employee;
  return (
    <main className="content">
      <h1>Employee</h1>
      <p>Salary and advance amounts are not shown in the admin panel.</p>
      {error ? <p className="error">{error}</p> : null}
      {!employee && !error ? <p>Loading employee...</p> : null}
      {employee ? (
        <section className="panel">
          <p>{employee.name}</p>
          <p>Role {employee.role}</p>
          <p>Status {employee.status}</p>
          <p>Shop {data.shop?.name || "—"}</p>
          <p>Owner {data.shop?.owner || "—"}</p>
          <p>Phone {employee.phone || "Not available"}</p>
          <p>Login {employee.loginEnabled ? "Enabled" : "Disabled"}</p>
          <p>Last login {employee.lastLoginAt ? new Date(employee.lastLoginAt).toLocaleString("en-IN") : "Not recorded"}</p>
          {admin?.role === "super_admin" ? <button type="button" onClick={() => setOpen(true)}>{employee.loginEnabled ? "Disable login" : "Enable login"}</button> : null}
        </section>
      ) : null}
      {open && employee ? (
        <div className="modal"><form className="panel" onSubmit={async (event) => {
          event.preventDefault();
          await adminApi.employeeLogin(id, { loginEnabled: !employee.loginEnabled, reason });
          setOpen(false);
          setReason("");
          load();
        }}>
          <h2>{employee.loginEnabled ? "Disable employee login" : "Enable employee login"}</h2>
          <p>This records the reason and revokes active employee sessions when login is turned off.</p>
          <textarea aria-label="Reason" value={reason} onChange={(event) => setReason(event.target.value)} required />
          <div className="row"><button type="submit">Confirm</button><button className="secondary" type="button" onClick={() => setOpen(false)}>Cancel</button></div>
        </form></div>
      ) : null}
    </main>
  );
}
