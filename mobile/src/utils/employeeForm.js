import { SALARY_LIMITS } from "../constants/employees";
import { dateFromApi, toCalendarDate } from "./employeeFormat";

export function createEmptyEmployeeForm() {
  return {
    name: "",
    phone: "",
    role: "helper",
    customRole: "",
    joiningDate: new Date(),
    salaryType: "monthly",
    salaryAmount: "",
    notes: "",
  };
}

export function formFromEmployee(employee) {
  const digits = String(employee.phone || "").replace(/\D/g, "");
  return {
    name: employee.name || "",
    phone: digits.length >= 10 ? digits.slice(-10) : "",
    role: employee.role || "helper",
    customRole: employee.customRole || "",
    joiningDate: dateFromApi(employee.joiningDate),
    salaryType: employee.salary?.type || "monthly",
    salaryAmount: employee.salary?.amount === undefined ? "" : String(employee.salary.amount),
    notes: employee.notes || "",
  };
}

export function buildEmployeePayload(form) {
  return {
    name: form.name.trim(),
    phone: form.phone.trim(),
    role: form.role,
    customRole: form.role === "other" ? form.customRole.trim() : null,
    joiningDate: toCalendarDate(form.joiningDate),
    salary: {
      type: form.salaryType,
      amount: Number(form.salaryAmount),
    },
    notes: form.notes.trim(),
  };
}

export function validateEmployeeForm(form) {
  const errors = {};
  const name = form.name.trim();
  if (!name) {
    errors.name = "Employee name is required.";
  } else if (name.length < 2 || name.length > 100) {
    errors.name = "Employee name must be between 2 and 100 characters.";
  }

  if (form.phone && !/^[6-9]\d{9}$/.test(form.phone)) {
    errors.phone = "Enter a valid 10-digit mobile number.";
  }

  if (!form.role) {
    errors.role = "Please select a role.";
  }

  if (form.role === "other") {
    const customRole = form.customRole.trim();
    if (!customRole) {
      errors.customRole = "Please enter a custom role.";
    } else if (customRole.length < 2 || customRole.length > 80) {
      errors.customRole = "Custom role must be between 2 and 80 characters.";
    }
  }

  const joining = new Date(form.joiningDate);
  joining.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (Number.isNaN(joining.getTime())) {
    errors.joiningDate = "Please select a valid joining date.";
  } else if (joining > today) {
    errors.joiningDate = "Joining date cannot be in the future.";
  }

  const limit = SALARY_LIMITS[form.salaryType] || SALARY_LIMITS.monthly;
  if (!form.salaryAmount) {
    errors.salaryAmount = "Salary amount is required.";
  } else if (!/^\d+(\.\d{1,2})?$/.test(form.salaryAmount)) {
    errors.salaryAmount = "Enter a valid salary amount.";
  } else if (Number(form.salaryAmount) <= 0) {
    errors.salaryAmount = "Salary must be greater than 0.";
  } else if (Number(form.salaryAmount) > limit) {
    errors.salaryAmount = "Salary amount is too large.";
  }

  if (form.notes.trim().length > 500) {
    errors.notes = "Notes must be 500 characters or less.";
  }

  return errors;
}

