import { useEffect, useState } from "react";
import { adminApi } from "../api/adminApi";
import { useAdminAuth } from "../context/AdminAuthContext";

const emptyEdit = {
  planId: "",
  monthlyPrice: "",
  monthlyDiscountPrice: "",
  yearlyPrice: "",
  yearlyDiscountPrice: "",
  employeeLimit: "",
};

function formatPrice(value) {
  if (value === null || value === undefined) return "—";
  return `₹${value}`;
}

export default function PlanPricingPage() {
  const { can } = useAdminAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [edit, setEdit] = useState(emptyEdit);

  const load = () =>
    adminApi
      .planPricing()
      .then(setData)
      .catch((loadError) => setError(loadError.message));

  useEffect(() => {
    load();
  }, []);

  function startEdit(plan) {
    setError("");
    setEdit({
      planId: plan.planId,
      monthlyPrice: String(plan.monthlyPrice ?? ""),
      monthlyDiscountPrice: plan.monthlyDiscountPrice === null || plan.monthlyDiscountPrice === undefined ? "" : String(plan.monthlyDiscountPrice),
      yearlyPrice: plan.yearlyPrice === null || plan.yearlyPrice === undefined ? "" : String(plan.yearlyPrice),
      yearlyDiscountPrice: plan.yearlyDiscountPrice === null || plan.yearlyDiscountPrice === undefined ? "" : String(plan.yearlyDiscountPrice),
      employeeLimit: String(plan.employeeLimit ?? ""),
    });
  }

  async function save(event) {
    event.preventDefault();
    if (!edit.planId || saving) return;
    setSaving(true);
    setError("");
    try {
      await adminApi.updatePlanPricing(edit.planId, {
        monthlyPrice: Number(edit.monthlyPrice),
        monthlyDiscountPrice: edit.monthlyDiscountPrice === "" ? null : Number(edit.monthlyDiscountPrice),
        yearlyPrice: edit.yearlyPrice === "" ? null : Number(edit.yearlyPrice),
        yearlyDiscountPrice: edit.yearlyDiscountPrice === "" ? null : Number(edit.yearlyDiscountPrice),
        employeeLimit: Number(edit.employeeLimit),
      });
      setEdit(emptyEdit);
      await load();
    } catch (saveError) {
      setError(saveError.message || "Unable to save plan pricing.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="content">
      <h1>Plan pricing</h1>
      <p>Set regular and optional discount prices for each paid plan. Shop owners see the discount price in the app, and checkout charges that amount.</p>
      {error ? <p className="error">{error}</p> : null}
      {!data && !error ? <p>Loading plan pricing...</p> : null}
      {data?.plans?.length ? (
        <div className="panel">
          <table>
            <thead>
              <tr>
                <th>Plan</th>
                <th>Employees</th>
                <th>Monthly</th>
                <th>Yearly</th>
                <th>Shop sees</th>
                {can("subscriptions.update") ? <th /> : null}
              </tr>
            </thead>
            <tbody>
              {data.plans.map((plan) => (
                <tr key={plan.planId}>
                  <td>
                    <strong>{plan.name}</strong>
                    <div>{plan.planId}</div>
                  </td>
                  <td>{plan.employeeLimit}</td>
                  <td>
                    {plan.hasMonthlyDiscount ? (
                      <>
                        <s>{formatPrice(plan.monthlyPrice)}</s> {formatPrice(plan.effectiveMonthlyPrice)}
                      </>
                    ) : (
                      formatPrice(plan.effectiveMonthlyPrice)
                    )}
                  </td>
                  <td>
                    {plan.effectiveYearlyPrice === null ? (
                      "Not offered"
                    ) : plan.hasYearlyDiscount ? (
                      <>
                        <s>{formatPrice(plan.yearlyPrice)}</s> {formatPrice(plan.effectiveYearlyPrice)}
                      </>
                    ) : (
                      formatPrice(plan.effectiveYearlyPrice)
                    )}
                  </td>
                  <td>
                    {plan.planId === "free"
                      ? "Free"
                      : `₹${plan.effectiveMonthlyPrice}/mo${plan.hasMonthlyDiscount ? " (discounted)" : ""}`}
                  </td>
                  {can("subscriptions.update") ? (
                    <td>
                      {plan.planId === "free" ? null : (
                        <button type="button" className="secondary" onClick={() => startEdit(plan)}>
                          Edit
                        </button>
                      )}
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {edit.planId && can("subscriptions.update") ? (
        <form className="panel" onSubmit={save}>
          <h2>Edit {edit.planId}</h2>
          <label>
            Regular monthly price (₹)
            <input
              aria-label="Monthly price"
              type="number"
              min="1"
              step="1"
              required
              value={edit.monthlyPrice}
              onChange={(event) => setEdit({ ...edit, monthlyPrice: event.target.value })}
            />
          </label>
          <label>
            Discounted monthly price (₹, optional)
            <input
              aria-label="Monthly discount price"
              type="number"
              min="1"
              step="1"
              value={edit.monthlyDiscountPrice}
              onChange={(event) => setEdit({ ...edit, monthlyDiscountPrice: event.target.value })}
              placeholder="Leave blank for no discount"
            />
          </label>
          <label>
            Regular yearly price (₹, optional)
            <input
              aria-label="Yearly price"
              type="number"
              min="1"
              step="1"
              value={edit.yearlyPrice}
              onChange={(event) => setEdit({ ...edit, yearlyPrice: event.target.value })}
              placeholder="Leave blank to hide yearly"
            />
          </label>
          <label>
            Discounted yearly price (₹, optional)
            <input
              aria-label="Yearly discount price"
              type="number"
              min="1"
              step="1"
              value={edit.yearlyDiscountPrice}
              onChange={(event) => setEdit({ ...edit, yearlyDiscountPrice: event.target.value })}
              placeholder="Leave blank for no discount"
            />
          </label>
          <label>
            Employee limit
            <input
              aria-label="Employee limit"
              type="number"
              min="1"
              max="500"
              required
              value={edit.employeeLimit}
              onChange={(event) => setEdit({ ...edit, employeeLimit: event.target.value })}
            />
          </label>
          <div className="row">
            <button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save prices"}
            </button>
            <button type="button" className="secondary" onClick={() => setEdit(emptyEdit)} disabled={saving}>
              Cancel
            </button>
          </div>
        </form>
      ) : null}
    </main>
  );
}
