import React, { useEffect, useState } from "react";
import api from "../services/api";

const initialForm = {
  username: "",
  email: "",
  first_name: "",
  last_name: "",
  phone: "",
  job_title: "",
  role_id: "",
  password: "",
  active: true,
};

function Users() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [form, setForm] = useState(initialForm);

  // --------------------------------------------------
  // Load users
  // --------------------------------------------------
  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/accounts/users/");

      const data = response.data;

      if (Array.isArray(data)) {
        setUsers(data);
      } else if (Array.isArray(data.results)) {
        setUsers(data.results);
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error("Failed to load users:", err);

      setError(
        err.response?.data?.detail ||
          "Unable to load users. Please make sure the Django API is running."
      );
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // Load roles
  // --------------------------------------------------
  const loadRoles = async () => {
    try {
      const response = await api.get("/accounts/roles/");

      const data = response.data;

      if (Array.isArray(data)) {
        setRoles(data);
      } else if (Array.isArray(data.results)) {
        setRoles(data.results);
      } else {
        setRoles([]);
      }
    } catch (err) {
      console.error("Failed to load roles:", err);

      setError(
        err.response?.data?.detail ||
          "Unable to load system roles."
      );
    }
  };

  // --------------------------------------------------
  // Initial load
  // --------------------------------------------------
  useEffect(() => {
    loadUsers();
    loadRoles();
  }, []);

  // --------------------------------------------------
  // Handle form input
  // --------------------------------------------------
  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // --------------------------------------------------
  // Open Add User modal
  // --------------------------------------------------
  const openAddModal = () => {
    setEditingUser(null);

    setForm({
      ...initialForm,
    });

    setError("");
    setSuccess("");

    setShowModal(true);
  };

  // --------------------------------------------------
  // Open Edit User modal
  // --------------------------------------------------
  const openEditModal = (user) => {
    setEditingUser(user);

    const roleId =
      user.role_id ??
      user.role?.id ??
      "";

    setForm({
      username: user.username || "",
      email: user.email || "",
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      phone: user.phone || "",
      job_title: user.job_title || "",
      role_id: roleId ? String(roleId) : "",
      password: "",
      active:
        typeof user.active === "boolean"
          ? user.active
          : user.is_active !== false,
    });

    setError("");
    setSuccess("");

    setShowModal(true);
  };

  // --------------------------------------------------
  // Close modal
  // --------------------------------------------------
  const closeModal = () => {
    if (saving) {
      return;
    }

    setShowModal(false);
    setEditingUser(null);
    setForm(initialForm);
    setError("");
  };

  // --------------------------------------------------
  // Save user
  // --------------------------------------------------
  const saveUser = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.username.trim()) {
      setError("Username is required.");
      return;
    }

    if (!form.role_id) {
      setError("Please select a role.");
      return;
    }

    if (!editingUser && !form.password.trim()) {
      setError("Password is required when creating a user.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        username: form.username.trim(),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        job_title: form.job_title.trim(),
        role_id: Number(form.role_id),
        active: form.active,
      };

      // Password is only sent when supplied.
      if (form.password.trim()) {
        payload.password = form.password;
      }

      if (editingUser) {
        await api.put(
          `/accounts/users/${editingUser.id}/`,
          payload
        );

        setSuccess("User updated successfully.");
      } else {
        await api.post(
          "/accounts/users/",
          payload
        );

        setSuccess("User created successfully.");
      }

      await loadUsers();

      setTimeout(() => {
        setShowModal(false);
        setEditingUser(null);
        setForm(initialForm);
        setSuccess("");
      }, 700);
    } catch (err) {
      console.error("Failed to save user:", err);

      const responseData = err.response?.data;

      let message =
        "Unable to save user. Please check the information and try again.";

      if (responseData) {
        if (typeof responseData.detail === "string") {
          message = responseData.detail;
        } else if (typeof responseData === "string") {
          message = responseData;
        } else if (typeof responseData === "object") {
          const messages = [];

          Object.entries(responseData).forEach(
            ([field, value]) => {
              if (Array.isArray(value)) {
                messages.push(
                  `${field}: ${value.join(", ")}`
                );
              } else if (typeof value === "string") {
                messages.push(
                  `${field}: ${value}`
                );
              }
            }
          );

          if (messages.length > 0) {
            message = messages.join(" | ");
          }
        }
      }

      setError(message);
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------------
  // Delete user
  // --------------------------------------------------
  const deleteUser = async (user) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete user "${user.username}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await api.delete(
        `/accounts/users/${user.id}/`
      );

      setSuccess("User deleted successfully.");

      await loadUsers();

      setTimeout(() => {
        setSuccess("");
      }, 2500);
    } catch (err) {
      console.error("Failed to delete user:", err);

      setError(
        err.response?.data?.detail ||
          "Unable to delete user."
      );
    }
  };

  // --------------------------------------------------
  // Filter users
  // --------------------------------------------------
  const filteredUsers = users.filter((user) => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return true;
    }

    const roleName =
      user.role?.name ||
      "";

    const roleCode =
      user.role?.code ||
      "";

    return (
      user.username
        ?.toLowerCase()
        .includes(query) ||
      user.first_name
        ?.toLowerCase()
        .includes(query) ||
      user.last_name
        ?.toLowerCase()
        .includes(query) ||
      user.email
        ?.toLowerCase()
        .includes(query) ||
      user.phone
        ?.toLowerCase()
        .includes(query) ||
      user.job_title
        ?.toLowerCase()
        .includes(query) ||
      roleName
        .toLowerCase()
        .includes(query) ||
      roleCode
        .toLowerCase()
        .includes(query)
    );
  });

  // --------------------------------------------------
  // Get role name
  // --------------------------------------------------
  const getRoleName = (user) => {
    if (user.role?.name) {
      return user.role.name;
    }

    return "No Role";
  };

  // --------------------------------------------------
  // Render
  // --------------------------------------------------
  return (
    <div className="container-fluid py-4">

      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1">
            Users
          </h4>

          <p className="text-muted mb-0">
            Manage KukuFarm system users and their roles.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-success"
          onClick={openAddModal}
        >
          <i className="bi bi-person-plus me-2"></i>
          Add User
        </button>
      </div>

      {/* Success Alert */}
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

      {/* Error Alert */}
      {error && !showModal && (
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

      {/* Search */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <label
                htmlFor="user-search"
                className="form-label fw-semibold"
              >
                Search Users
              </label>

              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-search"></i>
                </span>

                <input
                  id="user-search"
                  type="text"
                  className="form-control"
                  placeholder="Search username, name, email, role..."
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                />

                {search && (
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setSearch("")}
                  >
                    <i className="bi bi-x-lg"></i>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white py-3">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h5 className="mb-0 fw-bold">
                System Users
              </h5>

              <small className="text-muted">
                {filteredUsers.length} user
                {filteredUsers.length !== 1
                  ? "s"
                  : ""}
              </small>
            </div>
          </div>
        </div>

        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div
                className="spinner-border text-success"
                role="status"
              >
                <span className="visually-hidden">
                  Loading...
                </span>
              </div>

              <p className="text-muted mt-3 mb-0">
                Loading users...
              </p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-people fs-1 text-muted"></i>

              <h6 className="mt-3">
                No users found
              </h6>

              <p className="text-muted mb-3">
                {search
                  ? "No users match your search."
                  : "There are no users available."}
              </p>

              {!search && (
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={openAddModal}
                >
                  <i className="bi bi-person-plus me-2"></i>
                  Add User
                </button>
              )}
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="px-3">
                      #
                    </th>

                    <th>
                      User
                    </th>

                    <th>
                      Email
                    </th>

                    <th>
                      Phone
                    </th>

                    <th>
                      Job Title
                    </th>

                    <th>
                      Role
                    </th>

                    <th>
                      Status
                    </th>

                    <th className="text-end px-3">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredUsers.map(
                    (user, index) => {
                      const isActive =
                        user.active ??
                        user.is_active ??
                        false;

                      return (
                        <tr key={user.id}>
                          <td className="px-3">
                            {index + 1}
                          </td>

                          <td>
                            <div className="d-flex align-items-center">
                              <div
                                className="bg-success bg-opacity-10 text-success rounded-circle d-flex align-items-center justify-content-center me-2"
                                style={{
                                  width: "40px",
                                  height: "40px",
                                }}
                              >
                                <i className="bi bi-person"></i>
                              </div>

                              <div>
                                <div className="fw-semibold">
                                  {user.username}
                                </div>

                                <small className="text-muted">
                                  {user.first_name ||
                                  user.last_name
                                    ? `${user.first_name || ""} ${
                                        user.last_name || ""
                                      }`.trim()
                                    : "No name"}
                                </small>
                              </div>
                            </div>
                          </td>

                          <td>
                            {user.email || (
                              <span className="text-muted">
                                —
                              </span>
                            )}
                          </td>

                          <td>
                            {user.phone || (
                              <span className="text-muted">
                                —
                              </span>
                            )}
                          </td>

                          <td>
                            {user.job_title || (
                              <span className="text-muted">
                                —
                              </span>
                            )}
                          </td>

                          <td>
                            {user.role ? (
                              <span className="badge bg-primary-subtle text-primary">
                                {getRoleName(user)}
                              </span>
                            ) : (
                              <span className="badge bg-secondary-subtle text-secondary">
                                No Role
                              </span>
                            )}
                          </td>

                          <td>
                            {isActive ? (
                              <span className="badge bg-success">
                                Active
                              </span>
                            ) : (
                              <span className="badge bg-secondary">
                                Inactive
                              </span>
                            )}
                          </td>

                          <td className="text-end px-3">
                            <div className="btn-group">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-primary"
                                title="Edit User"
                                onClick={() =>
                                  openEditModal(user)
                                }
                              >
                                <i className="bi bi-pencil"></i>
                              </button>

                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
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
                    }
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ==================================================
          BOOTSTRAP USER MODAL
          ================================================== */}

      {showModal && (
        <>
          <div
            className="modal fade show d-block"
            tabIndex="-1"
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
              <div className="modal-content">

                {/* Modal Header */}
                <div className="modal-header">
                  <div>
                    <h5 className="modal-title fw-bold mb-1">
                      {editingUser
                        ? "Edit User"
                        : "Add New User"}
                    </h5>

                    <small className="text-muted">
                      {editingUser
                        ? "Update user account information and role."
                        : "Create a new KukuFarm system user."}
                    </small>
                  </div>

                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Close"
                    onClick={closeModal}
                    disabled={saving}
                  ></button>
                </div>

                {/* Modal Body */}
                <div className="modal-body">

                  {/* Modal Error */}
                  {error && (
                    <div
                      className="alert alert-danger"
                      role="alert"
                    >
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      {error}
                    </div>
                  )}

                  <form
                    id="user-form"
                    onSubmit={saveUser}
                  >

                    <div className="row g-3">

                      {/* Username */}
                      <div className="col-md-6">
                        <label
                          htmlFor="user-username"
                          className="form-label fw-semibold"
                        >
                          Username
                          <span className="text-danger">
                            {" "}*
                          </span>
                        </label>

                        <div className="input-group">
                          <span className="input-group-text">
                            <i className="bi bi-person"></i>
                          </span>

                          <input
                            id="user-username"
                            type="text"
                            name="username"
                            className="form-control"
                            value={form.username}
                            onChange={handleChange}
                            placeholder="Enter username"
                            required
                          />
                        </div>
                      </div>

                      {/* Email */}
                      <div className="col-md-6">
                        <label
                          htmlFor="user-email"
                          className="form-label fw-semibold"
                        >
                          Email
                        </label>

                        <div className="input-group">
                          <span className="input-group-text">
                            <i className="bi bi-envelope"></i>
                          </span>

                          <input
                            id="user-email"
                            type="email"
                            name="email"
                            className="form-control"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="Enter email address"
                          />
                        </div>
                      </div>

                      {/* First Name */}
                      <div className="col-md-6">
                        <label
                          htmlFor="user-first-name"
                          className="form-label fw-semibold"
                        >
                          First Name
                        </label>

                        <input
                          id="user-first-name"
                          type="text"
                          name="first_name"
                          className="form-control"
                          value={form.first_name}
                          onChange={handleChange}
                          placeholder="Enter first name"
                        />
                      </div>

                      {/* Last Name */}
                      <div className="col-md-6">
                        <label
                          htmlFor="user-last-name"
                          className="form-label fw-semibold"
                        >
                          Last Name
                        </label>

                        <input
                          id="user-last-name"
                          type="text"
                          name="last_name"
                          className="form-control"
                          value={form.last_name}
                          onChange={handleChange}
                          placeholder="Enter last name"
                        />
                      </div>

                      {/* Phone */}
                      <div className="col-md-6">
                        <label
                          htmlFor="user-phone"
                          className="form-label fw-semibold"
                        >
                          Phone
                        </label>

                        <div className="input-group">
                          <span className="input-group-text">
                            <i className="bi bi-telephone"></i>
                          </span>

                          <input
                            id="user-phone"
                            type="text"
                            name="phone"
                            className="form-control"
                            value={form.phone}
                            onChange={handleChange}
                            placeholder="+255..."
                          />
                        </div>
                      </div>

                      {/* Job Title */}
                      <div className="col-md-6">
                        <label
                          htmlFor="user-job-title"
                          className="form-label fw-semibold"
                        >
                          Job Title
                        </label>

                        <input
                          id="user-job-title"
                          type="text"
                          name="job_title"
                          className="form-control"
                          value={form.job_title}
                          onChange={handleChange}
                          placeholder="e.g. Farm Manager"
                        />
                      </div>

                      {/* Role */}
                      <div className="col-md-6">
                        <label
                          htmlFor="user-role"
                          className="form-label fw-semibold"
                        >
                          Role
                          <span className="text-danger">
                            {" "}*
                          </span>
                        </label>

                        <select
                          id="user-role"
                          name="role_id"
                          className="form-select"
                          value={form.role_id}
                          onChange={handleChange}
                          required
                        >
                          <option value="">
                            -- Select Role --
                          </option>

                          {roles.map((role) => (
                            <option
                              key={role.id}
                              value={role.id}
                            >
                              {role.name}
                            </option>
                          ))}
                        </select>

                        <div className="form-text">
                          Select the system role assigned to this user.
                        </div>
                      </div>

                      {/* Password */}
                      <div className="col-md-6">
                        <label
                          htmlFor="user-password"
                          className="form-label fw-semibold"
                        >
                          Password
                          {!editingUser && (
                            <span className="text-danger">
                              {" "}*
                            </span>
                          )}
                        </label>

                        <div className="input-group">
                          <span className="input-group-text">
                            <i className="bi bi-lock"></i>
                          </span>

                          <input
                            id="user-password"
                            type="password"
                            name="password"
                            className="form-control"
                            value={form.password}
                            onChange={handleChange}
                            placeholder={
                              editingUser
                                ? "Leave blank to keep current password"
                                : "Enter password"
                            }
                            required={!editingUser}
                          />
                        </div>

                        {editingUser && (
                          <div className="form-text">
                            Leave blank if you do not want to change the password.
                          </div>
                        )}
                      </div>

                      {/* Account Status */}
                      <div className="col-12">
                        <div className="card bg-light border-0">
                          <div className="card-body">

                            <div className="form-check form-switch">
                              <input
                                id="user-active"
                                type="checkbox"
                                name="active"
                                className="form-check-input"
                                role="switch"
                                checked={form.active}
                                onChange={handleChange}
                              />

                              <label
                                htmlFor="user-active"
                                className="form-check-label fw-semibold"
                              >
                                Active Account
                              </label>
                            </div>

                            <small className="text-muted">
                              Inactive users will not be able to use the system.
                            </small>

                          </div>
                        </div>
                      </div>

                    </div>
                  </form>
                </div>

                {/* Modal Footer */}
                <div className="modal-footer">

                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={closeModal}
                    disabled={saving}
                  >
                    <i className="bi bi-x-lg me-2"></i>
                    Cancel
                  </button>

                  <button
                    type="submit"
                    form="user-form"
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

                        {editingUser
                          ? "Update User"
                          : "Save User"}
                      </>
                    )}
                  </button>

                </div>

              </div>
            </div>
          </div>

          {/* Modal Backdrop */}
          <div
            className="modal-backdrop fade show"
            onClick={closeModal}
          ></div>
        </>
      )}

    </div>
  );
}

export default Users;