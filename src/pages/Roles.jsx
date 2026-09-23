import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import PageHeader from "../components/common/PageHeader";
import api from "../services/api";

/*
|--------------------------------------------------------------------------
| Initial Form
|--------------------------------------------------------------------------
*/

const initialForm = {
  name: "",
  code: "",
  description: "",
  permissions: [],
};

/*
|--------------------------------------------------------------------------
| Permission Groups
|--------------------------------------------------------------------------
*/

const permissionGroups = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: "bi-grid-1x2-fill",
  },
  {
    key: "flocks",
    label: "Flocks",
    icon: "bi-egg-fried",
  },
  {
    key: "production",
    label: "Egg Production",
    icon: "bi-egg",
  },
  {
    key: "feed",
    label: "Feed Management",
    icon: "bi-basket2-fill",
  },
  {
    key: "health",
    label: "Health & Vaccination",
    icon: "bi-heart-pulse-fill",
  },
  {
    key: "mortality",
    label: "Mortality",
    icon: "bi-clipboard2-x-fill",
  },
  {
    key: "sales",
    label: "Sales",
    icon: "bi-cash-stack",
  },
  {
    key: "customers",
    label: "Customers",
    icon: "bi-people-fill",
  },
  {
    key: "expenses",
    label: "Expenses",
    icon: "bi-wallet2",
  },
  {
    key: "suppliers",
    label: "Suppliers",
    icon: "bi-truck",
  },
  {
    key: "reports",
    label: "Reports",
    icon: "bi-bar-chart-fill",
  },
  {
    key: "users",
    label: "Users",
    icon: "bi-person-gear",
  },
  {
    key: "roles",
    label: "Roles & Permissions",
    icon: "bi-shield-check",
  },
  {
    key: "settings",
    label: "Settings",
    icon: "bi-gear-fill",
  },
];

/*
|--------------------------------------------------------------------------
| Error Helper
|--------------------------------------------------------------------------
*/

function extractError(error) {
  const data = error?.response?.data;

  if (!data) {
    return (
      error?.message ||
      "Something went wrong. Please try again."
    );
  }

  if (typeof data === "string") {
    return data;
  }

  if (data.detail) {
    return String(data.detail);
  }

  if (data.message) {
    return String(data.message);
  }

  if (typeof data === "object") {
    return Object.entries(data)
      .map(([field, message]) => {
        let value;

        if (Array.isArray(message)) {
          value = message.join(", ");
        } else if (
          typeof message === "object" &&
          message !== null
        ) {
          value = JSON.stringify(message);
        } else {
          value = String(message);
        }

        return `${field}: ${value}`;
      })
      .join(" | ");
  }

  return "Something went wrong.";
}

/*
|--------------------------------------------------------------------------
| Permission Normalization
|--------------------------------------------------------------------------
|
| The backend may return:
|
| {
|   id: 1,
|   code: "flocks.view",
|   name: "Can view flock"
| }
|
| or simply:
|
| 1
|
| or:
|
| "flocks.view"
|
|--------------------------------------------------------------------------
*/

function normalizePermission(permission) {
  if (
    typeof permission === "number" ||
    typeof permission === "string"
  ) {
    return {
      id:
        typeof permission === "number"
          ? permission
          : null,

      code:
        typeof permission === "string"
          ? permission
          : String(permission),

      name:
        typeof permission === "string"
          ? permission
          : String(permission),

      codename:
        typeof permission === "string"
          ? permission.split(".").pop()
          : String(permission),
    };
  }

  if (!permission || typeof permission !== "object") {
    return null;
  }

  return {
    id:
      permission.id !== undefined &&
      permission.id !== null
        ? Number(permission.id)
        : null,

    code:
      permission.code ||
      permission.permission_code ||
      "",

    name:
      permission.name ||
      permission.label ||
      "",

    codename:
      permission.codename ||
      "",
  };
}

/*
|--------------------------------------------------------------------------
| Role Normalization
|--------------------------------------------------------------------------
*/

function normalizeRole(role) {
  const normalizedPermissions = Array.isArray(
    role?.permissions
  )
    ? role.permissions
        .map((permission) => {
          if (
            typeof permission === "number"
          ) {
            return permission;
          }

          if (
            typeof permission === "string"
          ) {
            return permission;
          }

          if (
            permission &&
            typeof permission === "object"
          ) {
            return (
              permission.id ??
              permission.pk ??
              permission.permission_id ??
              permission.code ??
              permission.codename ??
              null
            );
          }

          return null;
        })
        .filter(
          (permission) =>
            permission !== null &&
            permission !== undefined
        )
    : [];

  return {
    id: role?.id ?? null,

    name:
      role?.name ||
      role?.label ||
      "",

    code:
      role?.code ||
      role?.slug ||
      "",

    description:
      role?.description ||
      "",

    active:
      role?.active !== false,

    permissions:
      normalizedPermissions,
  };
}

/*
|--------------------------------------------------------------------------
| Main Component
|--------------------------------------------------------------------------
*/

export default function Roles() {
  /*
  |--------------------------------------------------------------------------
  | Data
  |--------------------------------------------------------------------------
  */

  const [roles, setRoles] = useState([]);

  const [permissions, setPermissions] =
    useState([]);

  /*
  |--------------------------------------------------------------------------
  | Loading / Saving
  |--------------------------------------------------------------------------
  */

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  /*
  |--------------------------------------------------------------------------
  | Modal
  |--------------------------------------------------------------------------
  */

  const [showModal, setShowModal] =
    useState(false);

  const [editingId, setEditingId] =
    useState(null);

  /*
  |--------------------------------------------------------------------------
  | Form
  |--------------------------------------------------------------------------
  */

  const [form, setForm] =
    useState(initialForm);

  /*
  |--------------------------------------------------------------------------
  | Search
  |--------------------------------------------------------------------------
  */

  const [search, setSearch] =
    useState("");

  /*
  |--------------------------------------------------------------------------
  | Groups
  |--------------------------------------------------------------------------
  */

  const [expandedGroups, setExpandedGroups] =
    useState({});

  /*
  |--------------------------------------------------------------------------
  | Messages
  |--------------------------------------------------------------------------
  */

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  /*
  |--------------------------------------------------------------------------
  | Load Roles + Permissions
  |--------------------------------------------------------------------------
  */

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        rolesResponse,
        permissionsResponse,
      ] = await Promise.all([
        api.get("/accounts/roles/"),
        api.get("/accounts/permissions/"),
      ]);

      /*
      |--------------------------------------------------------------------------
      | Roles
      |--------------------------------------------------------------------------
      */

      const rolesData = Array.isArray(
        rolesResponse.data
      )
        ? rolesResponse.data
        : rolesResponse.data?.results ||
          [];

      /*
      |--------------------------------------------------------------------------
      | Permissions
      |--------------------------------------------------------------------------
      */

      const permissionsData =
        Array.isArray(
          permissionsResponse.data
        )
          ? permissionsResponse.data
          : permissionsResponse.data
              ?.results || [];

      const normalizedPermissions =
        permissionsData
          .map(normalizePermission)
          .filter(Boolean);

      setRoles(
        rolesData.map(normalizeRole)
      );

      setPermissions(
        normalizedPermissions
      );
    } catch (err) {
      setError(
        extractError(err)
      );
    } finally {
      setLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Initial Load
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    loadData();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Filter Roles
  |--------------------------------------------------------------------------
  */

  const filteredRoles = useMemo(() => {
    const value =
      search.trim().toLowerCase();

    if (!value) {
      return roles;
    }

    return roles.filter((role) => {
      return (
        role.name
          .toLowerCase()
          .includes(value) ||

        role.code
          .toLowerCase()
          .includes(value) ||

        role.description
          .toLowerCase()
          .includes(value)
      );
    });
  }, [roles, search]);

  /*
  |--------------------------------------------------------------------------
  | Permissions By Group
  |--------------------------------------------------------------------------
  */

  const permissionsByGroup =
    useMemo(() => {
      const result = {};

      permissionGroups.forEach(
        (group) => {
          result[group.key] =
            permissions.filter(
              (permission) => {
                const code =
                  permission.code ||
                  "";

                return code.startsWith(
                  `${group.key}.`
                );
              }
            );
        }
      );

      return result;
    }, [permissions]);

  /*
  |--------------------------------------------------------------------------
  | Generate Role Code
  |--------------------------------------------------------------------------
  */

  const generateCode = (name) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  };

  /*
  |--------------------------------------------------------------------------
  | Open Create Modal
  |--------------------------------------------------------------------------
  */

  const openCreateModal = () => {
    setEditingId(null);

    setForm({
      ...initialForm,
      permissions: [],
    });

    /*
    | Open all groups by default
    */

    const expanded = {};

    permissionGroups.forEach(
      (group) => {
        expanded[group.key] = true;
      }
    );

    setExpandedGroups(expanded);

    setError("");
    setSuccess("");

    setShowModal(true);
  };

  /*
  |--------------------------------------------------------------------------
  | Open Edit Modal
  |--------------------------------------------------------------------------
  */

  const openEditModal = (role) => {
    setEditingId(role.id);

    setForm({
      name: role.name,
      code: role.code,
      description: role.description,
      permissions: [...role.permissions],
    });

    /*
    | Open all groups by default
    */

    const expanded = {};

    permissionGroups.forEach(
      (group) => {
        expanded[group.key] = true;
      }
    );

    setExpandedGroups(expanded);

    setError("");
    setSuccess("");

    setShowModal(true);
  };

  /*
  |--------------------------------------------------------------------------
  | Close Modal
  |--------------------------------------------------------------------------
  */

  const closeModal = () => {
    if (saving) {
      return;
    }

    setShowModal(false);

    setEditingId(null);

    setForm({
      ...initialForm,
      permissions: [],
    });

    setError("");
  };

  /*
  |--------------------------------------------------------------------------
  | Input Change
  |--------------------------------------------------------------------------
  */

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  /*
  |--------------------------------------------------------------------------
  | Role Name Change
  |--------------------------------------------------------------------------
  */

  const handleNameChange = (
    event
  ) => {
    const value =
      event.target.value;

    setForm((current) => ({
      ...current,

      name: value,

      /*
      | Automatically generate code only
      | while creating a new role.
      */

      code: editingId
        ? current.code
        : generateCode(value),
    }));
  };

  /*
  |--------------------------------------------------------------------------
  | Toggle Permission
  |--------------------------------------------------------------------------
  */

  const togglePermission = (
    permission
  ) => {
    const permissionId =
      permission?.id;

    /*
    | If backend does not provide IDs,
    | don't add invalid values.
    */

    if (
      permissionId === null ||
      permissionId === undefined ||
      Number.isNaN(permissionId)
    ) {
      return;
    }

    setForm((current) => {
      const exists =
        current.permissions.includes(
          permissionId
        );

      return {
        ...current,

        permissions: exists
          ? current.permissions.filter(
              (id) =>
                id !== permissionId
            )
          : [
              ...current.permissions,
              permissionId,
            ],
      };
    });
  };

  /*
  |--------------------------------------------------------------------------
  | Permission Selected
  |--------------------------------------------------------------------------
  */

  const isPermissionSelected = (
    permission
  ) => {
    return form.permissions.includes(
      permission.id
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Toggle Group
  |--------------------------------------------------------------------------
  */

  const toggleGroup = (
    groupKey
  ) => {
    setExpandedGroups(
      (current) => ({
        ...current,

        [groupKey]:
          current[groupKey] === false,
      })
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Select Group
  |--------------------------------------------------------------------------
  */

  const selectGroupPermissions = (
    groupKey
  ) => {
    const groupPermissions =
      permissionsByGroup[groupKey] ||
      [];

    const ids = groupPermissions
      .map(
        (permission) =>
          permission.id
      )
      .filter(
        (id) =>
          id !== null &&
          id !== undefined &&
          !Number.isNaN(id)
      );

    setForm((current) => {
      const existing = new Set(
        current.permissions
      );

      ids.forEach((id) => {
        existing.add(id);
      });

      return {
        ...current,

        permissions:
          Array.from(existing),
      };
    });
  };

  /*
  |--------------------------------------------------------------------------
  | Clear Group
  |--------------------------------------------------------------------------
  */

  const clearGroupPermissions = (
    groupKey
  ) => {
    const groupPermissions =
      permissionsByGroup[groupKey] ||
      [];

    const ids = new Set(
      groupPermissions
        .map(
          (permission) =>
            permission.id
        )
        .filter(
          (id) =>
            id !== null &&
            id !== undefined
        )
    );

    setForm((current) => ({
      ...current,

      permissions:
        current.permissions.filter(
          (id) => !ids.has(id)
        ),
    }));
  };

  /*
  |--------------------------------------------------------------------------
  | Group Fully Selected
  |--------------------------------------------------------------------------
  */

  const isGroupFullySelected = (
    groupKey
  ) => {
    const groupPermissions =
      permissionsByGroup[groupKey] ||
      [];

    const validPermissions =
      groupPermissions.filter(
        (permission) =>
          permission.id !== null &&
          permission.id !== undefined
      );

    if (!validPermissions.length) {
      return false;
    }

    return validPermissions.every(
      (permission) =>
        form.permissions.includes(
          permission.id
        )
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Toggle All
  |--------------------------------------------------------------------------
  */

  const toggleAllPermissions = () => {
    const validIds = permissions
      .map(
        (permission) =>
          permission.id
      )
      .filter(
        (id) =>
          id !== null &&
          id !== undefined &&
          !Number.isNaN(id)
      );

    const allSelected =
      validIds.length > 0 &&
      validIds.every((id) =>
        form.permissions.includes(id)
      );

    setForm((current) => ({
      ...current,

      permissions: allSelected
        ? []
        : validIds,
    }));
  };

  /*
  |--------------------------------------------------------------------------
  | Permission Display Helpers
  |--------------------------------------------------------------------------
  */

  const getPermissionAction = (
    permission
  ) => {
    const code =
      permission?.code || "";

    const parts =
      code.split(".");

    return (
      parts[1] ||
      permission?.codename ||
      permission?.name ||
      code
    );
  };

  const formatActionLabel = (
    action
  ) => {
    return String(action)
      .replace(/_/g, " ")
      .replace(
        /\b\w/g,
        (char) =>
          char.toUpperCase()
      );
  };

  /*
  |--------------------------------------------------------------------------
  | Save Role
  |--------------------------------------------------------------------------
  */

  const saveRole = async (
    event
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const name =
      form.name.trim();

    const code =
      form.code.trim();

    /*
    | Validation
    */

    if (!name) {
      setError(
        "Role name is required."
      );
      return;
    }

    if (!code) {
      setError(
        "Role code is required."
      );
      return;
    }

    if (
      !/^[a-z0-9_]+$/.test(code)
    ) {
      setError(
        "Role code may contain only lowercase letters, numbers and underscores."
      );
      return;
    }

    /*
    |--------------------------------------------------------------------------
    | Check Duplicate Code
    |--------------------------------------------------------------------------
    */

    const duplicate = roles.some(
      (role) =>
        role.code.toLowerCase() ===
          code.toLowerCase() &&
        role.id !== editingId
    );

    if (duplicate) {
      setError(
        `The role code "${code}" is already in use.`
      );
      return;
    }

    /*
    |--------------------------------------------------------------------------
    | Validate Permission IDs
    |--------------------------------------------------------------------------
    */

    const permissionIds =
      form.permissions
        .map(Number)
        .filter(
          (id) =>
            Number.isInteger(id) &&
            id > 0
        );

    try {
      setSaving(true);

      /*
      |--------------------------------------------------------------------------
      | Django ManyToManyField expects permission IDs
      |--------------------------------------------------------------------------
      */

      const payload = {
        name,
        code,
        description:
          form.description.trim(),

        permissions:
          permissionIds,
      };

      let response;

      if (editingId) {
        response =
          await api.patch(
            `/accounts/roles/${editingId}/`,
            payload
          );
      } else {
        response =
          await api.post(
            "/accounts/roles/",
            payload
          );
      }

      const savedRole =
        normalizeRole(
          response.data
        );

      /*
      |--------------------------------------------------------------------------
      | Update Local State
      |--------------------------------------------------------------------------
      */

      setRoles((current) => {
        if (editingId) {
          return current.map(
            (role) =>
              role.id === editingId
                ? savedRole
                : role
          );
        }

        return [
          ...current,
          savedRole,
        ];
      });

      /*
      |--------------------------------------------------------------------------
      | Success
      |--------------------------------------------------------------------------
      */

      setSuccess(
        editingId
          ? "Role updated successfully."
          : "Role created successfully."
      );

      /*
      |--------------------------------------------------------------------------
      | Close Modal
      |--------------------------------------------------------------------------
      */

      setShowModal(false);

      setEditingId(null);

      setForm({
        ...initialForm,
        permissions: [],
      });
    } catch (err) {
      setError(
        extractError(err)
      );
    } finally {
      setSaving(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Delete Role
  |--------------------------------------------------------------------------
  */

  const deleteRole = async (
    role
  ) => {
    const confirmed =
      window.confirm(
        `Are you sure you want to delete the "${role.name}" role?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await api.delete(
        `/accounts/roles/${role.id}/`
      );

      setRoles((current) =>
        current.filter(
          (item) =>
            item.id !== role.id
        )
      );

      setSuccess(
        `Role "${role.name}" deleted successfully.`
      );
    } catch (err) {
      setError(
        extractError(err)
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Selected Permission Count
  |--------------------------------------------------------------------------
  */

  const selectedPermissionCount =
    form.permissions.length;

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <>
      <PageHeader
        title="Roles & Permissions"
        subtitle="Manage system roles and control what each role can access."
      />

      {/* ==========================================================
          ALERTS
      ========================================================== */}

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
            onClick={() =>
              setError("")
            }
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
            onClick={() =>
              setSuccess("")
            }
          ></button>
        </div>
      )}

      {/* ==========================================================
          HEADER
      ========================================================== */}

      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
        <div>
          <h5 className="mb-1">
            System Roles
          </h5>

          <p className="text-muted mb-0">
            {roles.length} role
            {roles.length === 1
              ? ""
              : "s"} configured
          </p>
        </div>

        <button
          type="button"
          className="btn btn-success"
          onClick={
            openCreateModal
          }
        >
          <i className="bi bi-plus-lg me-2"></i>
          Add Role
        </button>
      </div>

      {/* ==========================================================
          SEARCH
      ========================================================== */}

      <div className="form-card mb-3">
        <div className="input-group">
          <span className="input-group-text">
            <i className="bi bi-search"></i>
          </span>

          <input
            type="search"
            className="form-control"
            placeholder="Search roles..."
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
          />

          {search && (
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() =>
                setSearch("")
              }
            >
              <i className="bi bi-x-lg"></i>
            </button>
          )}
        </div>
      </div>

      {/* ==========================================================
          ROLES TABLE
      ========================================================== */}

      {loading ? (
        <div className="form-card text-center py-5">
          <div
            className="spinner-border text-success"
            role="status"
          ></div>

          <div className="mt-2 text-muted">
            Loading roles...
          </div>
        </div>
      ) : filteredRoles.length ===
        0 ? (
        <div className="form-card text-center py-5">
          <i className="bi bi-shield-x fs-1 text-muted"></i>

          <h5 className="mt-3">
            {search
              ? "No roles found"
              : "No roles configured"}
          </h5>

          <p className="text-muted">
            {search
              ? "Try another search term."
              : "Create your first system role."}
          </p>

          {!search && (
            <button
              type="button"
              className="btn btn-success"
              onClick={
                openCreateModal
              }
            >
              <i className="bi bi-plus-lg me-2"></i>
              Add Role
            </button>
          )}
        </div>
      ) : (
        <div className="form-card">
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Code</th>
                  <th>Permissions</th>
                  <th>Description</th>
                  <th className="text-end">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredRoles.map(
                  (role) => (
                    <tr
                      key={role.id}
                    >
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className="rounded-circle bg-light d-flex align-items-center justify-content-center flex-shrink-0"
                            style={{
                              width:
                                "40px",
                              height:
                                "40px",
                            }}
                          >
                            <i className="bi bi-shield-check text-success"></i>
                          </div>

                          <div>
                            <strong>
                              {role.name ||
                                "-"}
                            </strong>

                            {role.code && (
                              <small className="d-block text-muted">
                                {
                                  role.code
                                }
                              </small>
                            )}
                          </div>
                        </div>
                      </td>

                      <td>
                        <code>
                          {role.code ||
                            "-"}
                        </code>
                      </td>

                      <td>
                        <span className="badge bg-success-subtle text-success">
                          {
                            role
                              .permissions
                              .length
                          }{" "}
                          permission
                          {role
                            .permissions
                            .length ===
                          1
                            ? ""
                            : "s"}
                        </span>
                      </td>

                      <td>
                        <span className="text-muted">
                          {role.description ||
                            "-"}
                        </span>
                      </td>

                      <td className="text-end">
                        <div className="d-flex justify-content-end gap-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() =>
                              openEditModal(
                                role
                              )
                            }
                            title="Edit Role"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>

                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() =>
                              deleteRole(
                                role
                              )
                            }
                            title="Delete Role"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==========================================================
          ROLE MODAL
      ========================================================== */}

      {showModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          role="dialog"
          aria-modal="true"
          style={{
            backgroundColor:
              "rgba(0,0,0,0.5)",
          }}
        >
          <div
            className="modal-dialog modal-xl modal-dialog-centered"
            role="document"
            style={{
              width:
                "calc(100% - 20px)",
              maxWidth:
                "1200px",
              height:
                "calc(100vh - 30px)",
              maxHeight:
                "calc(100vh - 30px)",
              margin:
                "15px auto",
            }}
          >
            <div
              className="modal-content"
              style={{
                height: "100%",
                display:
                  "flex",
                flexDirection:
                  "column",
                overflow:
                  "hidden",
              }}
            >
              {/* ==================================================
                  MODAL HEADER
              ================================================== */}

              <div className="modal-header flex-shrink-0">
                <div>
                  <h5 className="modal-title mb-1">
                    <i className="bi bi-shield-check me-2"></i>

                    {editingId
                      ? "Edit Role"
                      : "Create Role"}
                  </h5>

                  <small className="text-muted">
                    Configure role details and permissions.
                  </small>
                </div>

                <button
                  type="button"
                  className="btn-close"
                  onClick={
                    closeModal
                  }
                  disabled={saving}
                ></button>
              </div>

              {/* ==================================================
                  FORM
              ================================================== */}

              <form
                onSubmit={saveRole}
                className="d-flex flex-column flex-grow-1 overflow-hidden"
              >
                {/* =================================================
                    MODAL BODY
                ================================================= */}

                <div
                  className="modal-body flex-grow-1 overflow-auto"
                  style={{
                    minHeight: 0,
                  }}
                >
                  {/* ===============================================
                      ROLE DETAILS
                  =============================================== */}

                  <div className="row g-3 mb-4">
                    {/* Role Name */}

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">
                        Role Name
                        <span className="text-danger">
                          {" "}
                          *
                        </span>
                      </label>

                      <input
                        type="text"
                        name="name"
                        className="form-control"
                        value={
                          form.name
                        }
                        onChange={
                          handleNameChange
                        }
                        placeholder="e.g. Farm Manager"
                        required
                        disabled={
                          saving
                        }
                      />
                    </div>

                    {/* Role Code */}

                    <div className="col-md-6">
                      <label className="form-label fw-semibold">
                        Role Code
                        <span className="text-danger">
                          {" "}
                          *
                        </span>
                      </label>

                      <input
                        type="text"
                        name="code"
                        className="form-control"
                        value={
                          form.code
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="e.g. farm_manager"
                        required
                        disabled={
                          saving
                        }
                      />

                      <small className="text-muted">
                        Lowercase letters, numbers and underscores only.
                      </small>
                    </div>

                    {/* Description */}

                    <div className="col-12">
                      <label className="form-label fw-semibold">
                        Description
                      </label>

                      <textarea
                        name="description"
                        className="form-control"
                        rows="2"
                        value={
                          form.description
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="Describe what this role is responsible for..."
                        disabled={
                          saving
                        }
                      ></textarea>
                    </div>
                  </div>

                  {/* ===============================================
                      PERMISSION HEADER
                  =============================================== */}

                  <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                    <div>
                      <h6 className="mb-1 fw-semibold">
                        <i className="bi bi-key-fill me-2"></i>
                        Permissions
                      </h6>

                      <small className="text-muted">
                        {
                          selectedPermissionCount
                        }{" "}
                        of{" "}
                        {
                          permissions.length
                        }{" "}
                        selected
                      </small>
                    </div>

                    <button
                      type="button"
                      className="btn btn-sm btn-outline-success"
                      onClick={
                        toggleAllPermissions
                      }
                      disabled={
                        saving ||
                        !permissions.length
                      }
                    >
                      <i className="bi bi-check2-all me-1"></i>

                      {selectedPermissionCount ===
                        permissions.filter(
                          (permission) =>
                            permission.id !==
                              null &&
                            permission.id !==
                              undefined
                        ).length &&
                      selectedPermissionCount >
                        0
                        ? "Clear All"
                        : "Select All"}
                    </button>
                  </div>

                  {/* ===============================================
                      PERMISSIONS
                  =============================================== */}

                  {permissions.length ===
                  0 ? (
                    <div className="alert alert-warning">
                      <i className="bi bi-exclamation-triangle me-2"></i>

                      No permissions were returned by the server.
                    </div>
                  ) : (
                    <div
                      className="border rounded bg-white"
                      style={{
                        height:
                          "clamp(300px, 55vh, 600px)",
                        minHeight:
                          "300px",
                        overflowY:
                          "auto",
                        overflowX:
                          "hidden",
                      }}
                    >
                      <div className="p-3">
                        <div className="row g-3">
                          {permissionGroups.map(
                            (group) => {
                              const groupPermissions =
                                permissionsByGroup[
                                  group.key
                                ] || [];

                              if (
                                !groupPermissions.length
                              ) {
                                return null;
                              }

                              const expanded =
                                expandedGroups[
                                  group.key
                                ] !== false;

                              const fullySelected =
                                isGroupFullySelected(
                                  group.key
                                );

                              return (
                                <div
                                  className="col-12"
                                  key={
                                    group.key
                                  }
                                >
                                  <div className="border rounded overflow-hidden">
                                    {/* ==================================
                                        GROUP HEADER
                                    ================================== */}

                                    <div className="p-3 bg-light d-flex flex-wrap justify-content-between align-items-center gap-2">
                                      <button
                                        type="button"
                                        className="btn btn-link text-decoration-none text-dark p-0 text-start"
                                        onClick={() =>
                                          toggleGroup(
                                            group.key
                                          )
                                        }
                                      >
                                        <i
                                          className={`bi ${
                                            expanded
                                              ? "bi-chevron-down"
                                              : "bi-chevron-right"
                                          } me-2`}
                                        ></i>

                                        <i
                                          className={`bi ${group.icon} me-2`}
                                        ></i>

                                        <strong>
                                          {
                                            group.label
                                          }
                                        </strong>

                                        <span className="badge bg-secondary ms-2">
                                          {
                                            groupPermissions.length
                                          }
                                        </span>
                                      </button>

                                      <div className="d-flex gap-2">
                                        <button
                                          type="button"
                                          className="btn btn-sm btn-outline-success"
                                          onClick={() =>
                                            selectGroupPermissions(
                                              group.key
                                            )
                                          }
                                          disabled={
                                            saving
                                          }
                                        >
                                          <i className="bi bi-check2 me-1"></i>
                                          Select All
                                        </button>

                                        <button
                                          type="button"
                                          className="btn btn-sm btn-outline-secondary"
                                          onClick={() =>
                                            clearGroupPermissions(
                                              group.key
                                            )
                                          }
                                          disabled={
                                            saving
                                          }
                                        >
                                          <i className="bi bi-x-lg me-1"></i>
                                          Clear
                                        </button>
                                      </div>
                                    </div>

                                    {/* ==================================
                                        PERMISSION ITEMS
                                    ================================== */}

                                    {expanded && (
                                      <div className="p-3">
                                        <div className="row g-2">
                                          {groupPermissions.map(
                                            (
                                              permission
                                            ) => {
                                              const action =
                                                getPermissionAction(
                                                  permission
                                                );

                                              const actionLabel =
                                                formatActionLabel(
                                                  action
                                                );

                                              const selected =
                                                isPermissionSelected(
                                                  permission
                                                );

                                              return (
                                                <div
                                                  className="col-12 col-sm-6 col-md-4 col-lg-3"
                                                  key={
                                                    permission.id ??
                                                    permission.code
                                                  }
                                                >
                                                  <label
                                                    className={`border rounded p-2 d-flex align-items-center gap-2 h-100 ${
                                                      selected
                                                        ? "border-success bg-success-subtle"
                                                        : "bg-white"
                                                    }`}
                                                    style={{
                                                      cursor:
                                                        permission.id
                                                          ? "pointer"
                                                          : "not-allowed",

                                                      minHeight:
                                                        "68px",

                                                      opacity:
                                                        permission.id
                                                          ? 1
                                                          : 0.6,
                                                    }}
                                                  >
                                                    <input
                                                      type="checkbox"
                                                      className="form-check-input mt-0 flex-shrink-0"
                                                      checked={
                                                        selected
                                                      }
                                                      onChange={() =>
                                                        togglePermission(
                                                          permission
                                                        )
                                                      }
                                                      disabled={
                                                        saving ||
                                                        !permission.id
                                                      }
                                                    />

                                                    <span
                                                      style={{
                                                        minWidth:
                                                          0,
                                                      }}
                                                    >
                                                      <strong className="d-block">
                                                        {
                                                          actionLabel
                                                        }
                                                      </strong>

                                                      <small
                                                        className="text-muted d-block text-truncate"
                                                        title={
                                                          permission.code ||
                                                          permission.name
                                                        }
                                                      >
                                                        {permission.code ||
                                                          permission.name ||
                                                          permission.codename ||
                                                          "-"}
                                                      </small>
                                                    </span>
                                                  </label>
                                                </div>
                                              );
                                            }
                                          )}
                                        </div>
                                      </div>
                                    )}

                                    {/* ==================================
                                        FULLY SELECTED
                                    ================================== */}

                                    {fullySelected && (
                                      <div className="px-3 pb-2">
                                        <small className="text-success">
                                          <i className="bi bi-check-circle me-1"></i>

                                          All permissions selected
                                        </small>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            }
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ===============================================
                      PERMISSION WARNING
                  =============================================== */}

                  {permissions.some(
                    (permission) =>
                      !permission.id
                  ) && (
                    <div className="alert alert-info mt-3 mb-0">
                      <i className="bi bi-info-circle me-2"></i>

                      Some permissions returned by the server do not
                      have an ID and cannot be assigned until the
                      backend provides their permission ID.
                    </div>
                  )}
                </div>

                {/* =================================================
                    MODAL FOOTER
                ================================================= */}

                <div
                  className="modal-footer flex-shrink-0 bg-white border-top"
                  style={{
                    zIndex: 5,
                  }}
                >
                  <div className="me-auto d-none d-md-block">
                    <small className="text-muted">
                      <i className="bi bi-shield-check me-1"></i>

                      {
                        selectedPermissionCount
                      }{" "}
                      permission
                      {selectedPermissionCount ===
                      1
                        ? ""
                        : "s"}{" "}
                      selected
                    </small>
                  </div>

                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={
                      closeModal
                    }
                    disabled={
                      saving
                    }
                  >
                    <i className="bi bi-x-lg me-1"></i>
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="btn btn-success"
                    disabled={
                      saving
                    }
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
                          ? "Update Role"
                          : "Create Role"}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
