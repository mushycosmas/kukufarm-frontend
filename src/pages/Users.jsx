import React, { useEffect, useMemo, useState } from "react";
import PageHeader from "../components/common/PageHeader";
import api from "../services/api";

const initialForm = {
  username: "",
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  job_title: "",
  role: "",
  password: "",
  active: true,
};

function getList(data) {
  if (Array.isArray(data)) return data;

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  return [];
}

function extractError(error) {
  const data = error?.response?.data;

  if (!data) {
    return error?.message || "Something went wrong.";
  }

  if (typeof data === "string") {
    return data;
  }

  if (data.detail) {
    return data.detail;
  }

  if (typeof data === "object") {
    return Object.entries(data)
      .map(([field, message]) => {
        const value = Array.isArray(message)
          ? message.join(", ")
          : String(message);

        return `${field}: ${value}`;
      })
      .join(" | ");
  }

  return "Something went wrong.";
}

function getUserName(user) {
  const fullName = `${user?.first_name || ""} ${
    user?.last_name || ""
  }`.trim();

  return fullName || user?.username || "Unknown User";
}

function getInitial(user) {
  const name = getUserName(user);

  return name.charAt(0).toUpperCase() || "U";
}

function getRole(user) {
  return (
    user?.profile?.role ||
    user?.role ||
    ""
  );
}

function getRoleLabel(user, roles) {
  const role = getRole(user);

  const found = roles.find((item) => item.value === role);

  return found?.label || role || "No Role";
}

function isUserActive(user) {
  if (typeof user?.profile?.active === "boolean") {
    return user.profile.active;
  }

  if (typeof user?.active === "boolean") {
    return user.active;
  }

  return user?.is_active !== false;
}

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString();
}

export default function Users() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState(initialForm);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/accounts/users/");

      setUsers(getList(response.data));
    } catch (err) {
      setError(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const response = await api.get("/auth/roles/");

      const roleList = getList(response.data);

      setRoles(roleList);

      if (roleList.length > 0) {
        setForm((current) => ({
          ...current,
          role: current.role || roleList[0].value,
        }));
      }
    } catch (err) {
      setError(extractError(err));
    }
  };

  useEffect(() => {
    loadUsers();
    loadRoles();
  }, []);

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return users;
    }

    return users.filter((user) => {
      const values = [
        user?.username,
        user?.first_name,
        user?.last_name,
        user?.email,
        user?.profile?.phone,
        user?.profile?.job_title,
        getRole(user),
      ];

      return values.some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(keyword)
      );
    });
  }, [users, search]);

  const totalUsers = users.length;

  const activeUsers = users.filter((user) =>
    isUserActive(user)
  ).length;

  const inactiveUsers = totalUsers - activeUsers;

  const openCreateForm = () => {
    setEditingId(null);

    setForm({
      ...initialForm,
      role: roles[0]?.value || "",
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const openEditForm = (user) => {
    setEditingId(user.id);

    setForm({
      username: user?.username || "",
      first_name: user?.first_name || "",
      last_name: user?.last_name || "",
      email: user?.email || "",
      phone: user?.profile?.phone || user?.phone || "",
      job_title:
        user?.profile?.job_title ||
        user?.job_title ||
        "",
      role: getRole(user),
      password: "",
      active: isUserActive(user),
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    setEditingId(null);
    setForm({
      ...initialForm,
      role: roles[0]?.value || "",
    });
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const saveUser = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const username = form.username.trim();

    if (!username) {
      setError("Username is required.");
      return;
    }

    if (!form.email.trim()) {
      setError("Email is required.");
      return;
    }

    if (!form.role) {
      setError("Please select a role.");
      return;
    }

    if (!editingId && !form.password) {
      setError("Password is required when creating a user.");
      return;
    }

    if (form.password && form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    const payload = {
      username,
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      job_title: form.job_title.trim(),
      role: form.role,
      active: form.active,
    };

    /*
     * Password is only sent when entered.
     *
     * This is important when editing because leaving the
     * password field empty should keep the existing password.
     */
    if (form.password.trim()) {
      payload.password = form.password;
    }

    try {
      setSaving(true);

      if (editingId) {
        await api.patch(
          `/accounts/users/${editingId}/`,
          payload
        );

        setSuccess("User updated successfully.");
      } else {
        await api.post("/accounts/users/", payload);

        setSuccess("User created successfully.");
      }

      await loadUsers();

      setShowForm(false);
      setEditingId(null);

      setForm({
        ...initialForm,
        role: roles[0]?.value || "",
      });
    } catch (err) {
      setError(extractError(err));
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async (user) => {
    const name = getUserName(user);

    const confirmed = window.confirm(
      `Are you sure you want to delete "${name}"?`
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await api.delete(`/accounts/users/${user.id}/`);

      setSuccess("User deleted successfully.");

      await loadUsers();
    } catch (err) {
      setError(extractError(err));
    }
  };

  const toggleUserStatus = async (user) => {
    const currentStatus = isUserActive(user);

    const confirmed = window.confirm(
      `${currentStatus ? "Deactivate" : "Activate"} ${getUserName(
        user
      )}?`
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await api.patch(`/accounts/users/${user.id}/`, {
        active: !currentStatus,
      });

      setSuccess(
        `User ${
          currentStatus ? "deactivated" : "activated"
        } successfully.`
      );

      await loadUsers();
    } catch (err) {
      setError(extractError(err));
    }
  };

  return (
    <>
      <PageHeader
        title="Users & Roles"
        subtitle="Manage system users and access roles."
        action={
          <button
            type="button"
            className="btn btn-success"
            onClick={openCreateForm}
          >
            <i className="bi bi-person-plus me-2"></i>
            Add User
          </button>
        }
      />

      {error && (
        <div
          className="alert alert-danger alert-dismissible fade show"
          role="alert"
        >
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}

          <button
            type="button"
            className="btn-close"
            onClick={() => setError("")}
          ></button>
        </div>
      )}

      {success && (
        <div
          className="alert alert-success alert-dismissible fade show"
          role="alert"
        >
          <i className="bi bi-check-circle me-2"></i>
          {success}

          <button
            type="button"
            className="btn-close"
            onClick={() => setSuccess("")}
          ></button>
        </div>
      )}

      {/* Summary */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <small className="text-muted">
                    Total Users
                  </small>

                  <h3 className="mb-0 mt-1">
                    {totalUsers}
                  </h3>
                </div>

                <div className="fs-2 text-primary">
                  <i className="bi bi-people"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <small className="text-muted">
                    Active Users
                  </small>

                  <h3 className="mb-0 mt-1 text-success">
                    {activeUsers}
                  </h3>
                </div>

                <div className="fs-2 text-success">
                  <i className="bi bi-person-check"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <small className="text-muted">
                    Inactive Users
                  </small>

                  <h3 className="mb-0 mt-1 text-danger">
                    {inactiveUsers}
                  </h3>
                </div>

                <div className="fs-2 text-danger">
                  <i className="bi bi-person-x"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User Form */}
      {showForm && (
        <div className="form-card mb-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h5 className="mb-1">
                {editingId
                  ? "Edit User"
                  : "Add New User"}
              </h5>

              <small className="text-muted">
                {editingId
                  ? "Update user account and access details."
                  : "Create a new KukuFarm system user."}
              </small>
            </div>

            <button
              type="button"
              className="btn btn-light"
              onClick={closeForm}
              disabled={saving}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          <form onSubmit={saveUser}>
            <div className="row g-3">
              {/* Username */}
              <div className="col-md-3">
                <label className="form-label">
                  Username <span className="text-danger">*</span>
                </label>

                <input
                  type="text"
                  name="username"
                  className="form-control"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="e.g. kelvin"
                  required
                />

                <small className="text-muted">
                  Username can be changed when editing.
                </small>
              </div>

              {/* First Name */}
              <div className="col-md-3">
                <label className="form-label">
                  First Name
                </label>

                <input
                  type="text"
                  name="first_name"
                  className="form-control"
                  value={form.first_name}
                  onChange={handleChange}
                  placeholder="First name"
                />
              </div>

              {/* Last Name */}
              <div className="col-md-3">
                <label className="form-label">
                  Last Name
                </label>

                <input
                  type="text"
                  name="last_name"
                  className="form-control"
                  value={form.last_name}
                  onChange={handleChange}
                  placeholder="Last name"
                />
              </div>

              {/* Email */}
              <div className="col-md-3">
                <label className="form-label">
                  Email <span className="text-danger">*</span>
                </label>

                <input
                  type="email"
                  name="email"
                  className="form-control"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="user@example.com"
                  required
                />
              </div>

              {/* Phone */}
              <div className="col-md-3">
                <label className="form-label">
                  Phone
                </label>

                <input
                  type="text"
                  name="phone"
                  className="form-control"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+255..."
                />
              </div>

              {/* Job Title */}
              <div className="col-md-3">
                <label className="form-label">
                  Job Title
                </label>

                <input
                  type="text"
                  name="job_title"
                  className="form-control"
                  value={form.job_title}
                  onChange={handleChange}
                  placeholder="e.g. Farm Manager"
                />
              </div>

              {/* Role */}
              <div className="col-md-3">
                <label className="form-label">
                  Role <span className="text-danger">*</span>
                </label>

                <select
                  name="role"
                  className="form-select"
                  value={form.role}
                  onChange={handleChange}
                  required
                >
                  <option value="">
                    Select Role
                  </option>

                  {roles.map((role) => (
                    <option
                      key={role.value}
                      value={role.value}
                    >
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Password */}
              <div className="col-md-3">
                <label className="form-label">
                  Password{" "}
                  {!editingId && (
                    <span className="text-danger">
                      *
                    </span>
                  )}
                </label>

                <input
                  type="password"
                  name="password"
                  className="form-control"
                  value={form.password}
                  onChange={handleChange}
                  placeholder={
                    editingId
                      ? "Leave blank to keep current"
                      : "Minimum 8 characters"
                  }
                  minLength={8}
                  required={!editingId}
                />

                {editingId && (
                  <small className="text-muted">
                    Leave blank to keep the current password.
                  </small>
                )}
              </div>

              {/* Active */}
              <div className="col-md-3">
                <label className="form-label d-block">
                  Account Status
                </label>

                <div className="form-check form-switch mt-2">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    role="switch"
                    id="user-active"
                    name="active"
                    checked={form.active}
                    onChange={handleChange}
                  />

                  <label
                    className="form-check-label"
                    htmlFor="user-active"
                  >
                    {form.active
                      ? "Active"
                      : "Inactive"}
                  </label>
                </div>
              </div>

              {/* Buttons */}
              <div className="col-12">
                <hr />

                <div className="d-flex gap-2">
                  <button
                    type="submit"
                    className="btn btn-success"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                        ></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-lg me-2"></i>
                        {editingId
                          ? "Update User"
                          : "Save User"}
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={closeForm}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Users Table */}
      <div className="table-card">
        <div className="p-3 border-bottom">
          <div className="row g-2 align-items-center">
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text bg-white">
                  <i className="bi bi-search"></i>
                </span>

                <input
                  type="text"
                  className="form-control"
                  placeholder="Search username, name, email, role..."
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                />
              </div>
            </div>

            <div className="col-md-6 text-md-end">
              <span className="text-muted">
                Showing {filteredUsers.length} of{" "}
                {totalUsers} users
              </span>
            </div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead>
              <tr>
                <th>User</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Joined</th>
                <th className="text-end">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="8"
                    className="text-center py-5"
                  >
                    <div
                      className="spinner-border text-success"
                      role="status"
                    ></div>

                    <div className="mt-2 text-muted">
                      Loading users...
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    className="text-center py-5"
                  >
                    <i className="bi bi-people fs-1 text-muted"></i>

                    <div className="mt-2">
                      <strong>
                        No users found
                      </strong>
                    </div>

                    <small className="text-muted">
                      {search
                        ? "Try a different search."
                        : "No system users have been created yet."}
                    </small>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const active = isUserActive(user);

                  return (
                    <tr key={user.id}>
                      {/* User */}
                      <td>
                        <div className="d-flex align-items-center">
                          <div
                            className="avatar me-2 d-flex align-items-center justify-content-center rounded-circle"
                            style={{
                              width: "40px",
                              height: "40px",
                              minWidth: "40px",
                            }}
                          >
                            <strong>
                              {getInitial(user)}
                            </strong>
                          </div>

                          <div>
                            <strong>
                              {getUserName(user)}
                            </strong>

                            {user?.profile?.job_title && (
                              <div>
                                <small className="text-muted">
                                  {
                                    user.profile
                                      .job_title
                                  }
                                </small>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Username */}
                      <td>
                        <code>
                          {user.username}
                        </code>
                      </td>

                      {/* Email */}
                      <td>
                        {user.email || "-"}
                      </td>

                      {/* Role */}
                      <td>
                        <span className="role-badge">
                          {getRoleLabel(
                            user,
                            roles
                          )}
                        </span>
                      </td>

                      {/* Phone */}
                      <td>
                        {user?.profile?.phone ||
                          user?.phone ||
                          "-"}
                      </td>

                      {/* Status */}
                      <td>
                        <span
                          className={`status ${
                            active
                              ? "active"
                              : "inactive"
                          }`}
                        >
                          {active
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </td>

                      {/* Joined */}
                      <td>
                        <small>
                          {formatDate(
                            user.date_joined
                          )}
                        </small>
                      </td>

                      {/* Actions */}
                      <td className="text-end">
                        <div className="btn-group">
                          <button
                            type="button"
                            className="btn btn-sm btn-light"
                            title="Edit User"
                            onClick={() =>
                              openEditForm(user)
                            }
                          >
                            <i className="bi bi-pencil"></i>
                          </button>

                          <button
                            type="button"
                            className={`btn btn-sm ${
                              active
                                ? "btn-light"
                                : "btn-outline-success"
                            }`}
                            title={
                              active
                                ? "Deactivate User"
                                : "Activate User"
                            }
                            onClick={() =>
                              toggleUserStatus(
                                user
                              )
                            }
                          >
                            <i
                              className={`bi ${
                                active
                                  ? "bi-person-x"
                                  : "bi-person-check"
                              }`}
                            ></i>
                          </button>

                          <button
                            type="button"
                            className="btn btn-sm btn-light text-danger"
                            title="Delete User"
                            onClick={() =>
                              deleteUser(user)
                            }
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
