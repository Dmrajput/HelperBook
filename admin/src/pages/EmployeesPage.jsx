import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminApi } from "../api/adminApi";

export default function EmployeesPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { adminApi.employees("page=1").then(setData).catch((loadError) => setError(loadError.message)); }, []);
  return (
    <main className="content">
      <h1>Employees</h1>
      <p>Platform view. Salary and advance details are not shown here.</p>
      {error ? <p className="error">{error}</p> : null}
      {!data && !error ? <p>Loading employees...</p> : null}
      {data && !data.employees.length ? <p>No employees found.</p> : null}
      {data?.employees?.length ? <div className="panel"><table><thead><tr><th>Name</th><th>Shop</th><th>Role</th><th>Status</th><th>Login</th><th></th></tr></thead><tbody>
        {data.employees.map((employee) => <tr key={employee.id}><td>{employee.name}</td><td>{employee.shop}</td><td>{employee.role}</td><td>{employee.status}</td><td>{employee.loginEnabled ? "Enabled" : "Disabled"}</td><td><Link to={`/employees/${employee.id}`}>View</Link></td></tr>)}
      </tbody></table></div> : null}
    </main>
  );
}
