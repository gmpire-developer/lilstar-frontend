import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FiCheck,
  FiEdit2,
  FiLock,
  FiSave,
  FiPlus,
  FiX,
  FiTrash2,
  FiUserCheck,
  FiUserPlus
} from "react-icons/fi";

import Loader from "../components/Loader";
import Pagination from "../components/Pagination";
import { useAuth } from "../context/AuthContext";
import { changeOwnPassword, updateOwnProfile } from "../services/authService";
import {
  createCategory,
  fetchCategories,
  updateCategory,
  removeCategory
} from "../services/categoryService";
import { fetchProducts, removeProduct } from "../services/productService";
import {
  approvePasswordResetRequest,
  createUser as createUserAccount,
  fetchPasswordResetRequests,
  fetchUsers,
  removeUser,
  updateUserRole
} from "../services/userService";

const PASSWORD_POLICY = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const PASSWORD_POLICY_MESSAGE =
  "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.";

const CATEGORY_PAGE_SIZE = 8;
const PRODUCT_PAGE_SIZE = 10;

function AdminDashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setUserState } = useAuth();
  const currentPasswordRef = useRef(null);
  const newUserNameRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [resetRequests, setResetRequests] = useState([]);

  const [newCategory, setNewCategory] = useState("");
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");
  const [categoryPage, setCategoryPage] = useState(1);

  const [productFilter, setProductFilter] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState("");
  const [productStatusFilter, setProductStatusFilter] = useState("all");
  const [productPage, setProductPage] = useState(1);
  const [analysisCategory, setAnalysisCategory] = useState("");

  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState("staff");

  const [currentPassword, setCurrentPassword] = useState("");
  const [profileName, setProfileName] = useState(user?.name || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const filteredCategories = useMemo(() => {
    const term = categoryFilter.trim().toLowerCase();

    return categories.filter((category) => {
      if (!term) {
        return true;
      }

      return category.name.toLowerCase().includes(term);
    });
  }, [categories, categoryFilter]);

  const filteredProducts = useMemo(() => {
    const term = productFilter.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !term ||
        product.name.toLowerCase().includes(term) ||
        (product.category_name || "").toLowerCase().includes(term);

      const matchesCategory =
        !productCategoryFilter || String(product.category_id || "") === productCategoryFilter;

      const matchesStatus =
        productStatusFilter === "all" ||
        (productStatusFilter === "active" && Boolean(product.is_active)) ||
        (productStatusFilter === "inactive" && !Boolean(product.is_active));

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, productFilter, productCategoryFilter, productStatusFilter]);

  const activeProductsCount = useMemo(
    () => products.filter((product) => Boolean(product.is_active)).length,
    [products]
  );

  const selectedCategoryProductCount = useMemo(() => {
    if (!analysisCategory) {
      return products.length;
    }

    return products.filter((product) => String(product.category_id || "") === analysisCategory).length;
  }, [analysisCategory, products]);

  const selectedCategoryName = useMemo(() => {
    if (!analysisCategory) {
      return "All Categories";
    }

    const matched = categories.find((category) => String(category.id) === analysisCategory);
    return matched ? matched.name : "Selected Category";
  }, [analysisCategory, categories]);

  const categoryTotalPages = Math.max(1, Math.ceil(filteredCategories.length / CATEGORY_PAGE_SIZE));
  const safeCategoryPage = Math.min(categoryPage, categoryTotalPages);
  const paginatedCategories = useMemo(() => {
    const start = (safeCategoryPage - 1) * CATEGORY_PAGE_SIZE;
    return filteredCategories.slice(start, start + CATEGORY_PAGE_SIZE);
  }, [filteredCategories, safeCategoryPage]);

  const productTotalPages = Math.max(1, Math.ceil(filteredProducts.length / PRODUCT_PAGE_SIZE));
  const safeProductPage = Math.min(productPage, productTotalPages);
  const paginatedProducts = useMemo(() => {
    const start = (safeProductPage - 1) * PRODUCT_PAGE_SIZE;
    return filteredProducts.slice(start, start + PRODUCT_PAGE_SIZE);
  }, [filteredProducts, safeProductPage]);

  useEffect(() => {
    setCategoryPage(1);
  }, [categoryFilter, filteredCategories.length]);

  useEffect(() => {
    setProductPage(1);
  }, [productFilter, productCategoryFilter, productStatusFilter, filteredProducts.length]);

  const loadData = async ({ silent } = { silent: false }) => {
    try {
      if (!silent) {
        setLoading(true);
      } else {
        setSyncing(true);
      }

      setError("");

      const requests = [fetchProducts(), fetchCategories()];
      if (user?.role === "admin") {
        requests.push(fetchUsers(), fetchPasswordResetRequests());
      }

      const response = await Promise.all(requests);
      const [productsData, categoriesData, usersData, resetData] = response;

      setProducts(productsData);
      setCategories(categoriesData);
      setUsers(usersData || []);
      setResetRequests(resetData || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.role]);

  useEffect(() => {
    if (!location.hash) {
      return;
    }

    window.setTimeout(() => {
      if (location.hash === "#password-section") {
        currentPasswordRef.current?.focus();
      }

      if (location.hash === "#users-section") {
        newUserNameRef.current?.focus();
      }
    }, 0);
  }, [location.hash]);

  useEffect(() => {
    setProfileName(user?.name || "");
  }, [user?.name]);

  const handleAddCategory = async (event) => {
    event.preventDefault();

    if (!newCategory.trim()) {
      return;
    }

    const duplicate = categories.some(
      (category) => category.name.trim().toLowerCase() === newCategory.trim().toLowerCase()
    );

    if (duplicate) {
      setError("Category already exists.");
      return;
    }

    try {
      setSyncing(true);
      setError("");
      setMessage("");
      await createCategory({ name: newCategory.trim() });
      setNewCategory("");
      setShowAddCategoryModal(false);
      await loadData({ silent: true });
      setMessage("Category added.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Could not add category");
      setSyncing(false);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    const confirmed = window.confirm(
      "Delete this category? Linked products will become uncategorized."
    );

    if (!confirmed) {
      return;
    }

    try {
      setSyncing(true);
      setError("");
      setMessage("");
      await removeCategory(categoryId);
      await loadData({ silent: true });
      setMessage("Category deleted.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Could not delete category");
      setSyncing(false);
    }
  };

  const handleStartEditCategory = (category) => {
    setEditingCategoryId(category.id);
    setEditingCategoryName(category.name);
  };

  const handleCancelEditCategory = () => {
    setEditingCategoryId(null);
    setEditingCategoryName("");
  };

  const handleSaveCategoryEdit = async (categoryId) => {
    const name = editingCategoryName.trim();

    if (!name) {
      setError("Category name is required.");
      return;
    }

    try {
      setSyncing(true);
      setError("");
      setMessage("");

      await updateCategory(categoryId, { name });
      await loadData({ silent: true });
      handleCancelEditCategory();
      setMessage("Category updated.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Could not update category");
      setSyncing(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    const confirmed = window.confirm("Delete this product?");

    if (!confirmed) {
      return;
    }

    try {
      setSyncing(true);
      setError("");
      setMessage("");
      await removeProduct(productId);
      await loadData({ silent: true });
      setMessage("Product deleted.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Could not delete product");
      setSyncing(false);
    }
  };

  const handleAddUser = async (event) => {
    event.preventDefault();

    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) {
      return;
    }

    if (!PASSWORD_POLICY.test(newUserPassword)) {
      setError(PASSWORD_POLICY_MESSAGE);
      return;
    }

    const isTransfer = newUserRole === "admin";
    if (isTransfer) {
      const confirmed = window.confirm(
        "Creating a new admin will transfer admin role and downgrade your account to staff. Continue?"
      );
      if (!confirmed) {
        return;
      }
    }

    try {
      setSyncing(true);
      setError("");
      setMessage("");

      const result = await createUserAccount({
        name: newUserName.trim(),
        email: newUserEmail.trim(),
        password: newUserPassword,
        role: newUserRole
      });

      setNewUserName("");
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserRole("staff");

      if (result.warning) {
        window.alert(result.warning);
      }

      if (result.force_logout) {
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_user");
        setUserState(null);
        navigate("/manage/login", { replace: true });
        return;
      }

      await loadData({ silent: true });
      setMessage("User created.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Could not create user");
      setSyncing(false);
    }
  };

  const handleTransferAdmin = async (userId, email) => {
    const confirmed = window.confirm(
      `Transfer admin role to ${email}? You will be downgraded to staff and signed out.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setSyncing(true);
      setError("");
      setMessage("");

      const result = await updateUserRole(userId, "admin");

      if (result.warning) {
        window.alert(result.warning);
      }

      if (result.force_logout) {
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_user");
        setUserState(null);
        navigate("/manage/login", { replace: true });
        return;
      }

      await loadData({ silent: true });
      setMessage("Admin role transferred.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Could not transfer admin role");
      setSyncing(false);
    }
  };

  const handleRemoveStaff = async (rowUser) => {
    const confirmed = window.confirm(`Remove staff user ${rowUser.email}?`);
    if (!confirmed) {
      return;
    }

    try {
      setSyncing(true);
      setError("");
      setMessage("");
      await removeUser(rowUser.id);
      await loadData({ silent: true });
      setMessage("Staff user removed.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Could not remove user");
      setSyncing(false);
    }
  };

  const handleProfileNameUpdate = async (event) => {
    event.preventDefault();

    if (!profileName.trim()) {
      setError("Name is required.");
      return;
    }

    try {
      setSyncing(true);
      setError("");
      setMessage("");

      const result = await updateOwnProfile({ name: profileName.trim() });
      if (result.user) {
        setUserState(result.user);
      }
      setMessage("Name updated successfully.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Could not update profile name");
    } finally {
      setSyncing(false);
    }
  };

  const handleApproveResetRequest = async (requestId) => {
    try {
      setSyncing(true);
      setError("");
      setMessage("");

      const result = await approvePasswordResetRequest(requestId);
      await loadData({ silent: true });
      setMessage(result.message || "Reset request approved.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Could not approve reset request");
      setSyncing(false);
    }
  };

  const handlePasswordChange = async (event) => {
    event.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Please complete all password fields.");
      return;
    }

    if (!PASSWORD_POLICY.test(newPassword)) {
      setError(PASSWORD_POLICY_MESSAGE);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    try {
      setSyncing(true);
      setError("");
      setMessage("");

      await changeOwnPassword({
        current_password: currentPassword,
        new_password: newPassword
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage("Password updated successfully.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Could not update password");
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return <Loader text="Loading admin dashboard..." />;
  }

  const getTrimmedName = (name, limit = 26) => {
    const value = String(name || "");
    if (value.length <= limit) {
      return value;
    }

    return `${value.slice(0, limit - 3)}...`;
  };

  return (
    <section className="panel reveal admin-dashboard">
      <div className="panel__head">
        <div>
          <h2>Control Panel</h2>
          <p>
            {user?.name || user?.email} ({user?.role})
          </p>
        </div>
      </div>

      {syncing && <div className="alert">Refreshing data...</div>}
      {message && <div className="alert">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="stats-grid">
        <article className="stat-card">
          <p>Total Products</p>
          <h3>{products.length}</h3>
        </article>
        <article className="stat-card">
          <p>Active Products</p>
          <h3>{activeProductsCount}</h3>
        </article>
        <article className="stat-card">
          <p>Total Categories</p>
          <h3>{categories.length}</h3>
        </article>
        <article className="stat-card">
          <p>Category Wise Products</p>
          <select
            value={analysisCategory}
            onChange={(event) => setAnalysisCategory(event.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={String(category.id)}>
                {category.name}
              </option>
            ))}
          </select>
          <h3>{selectedCategoryProductCount}</h3>
          <span className="subtle-text">{selectedCategoryName}</span>
        </article>
      </div>

      <div className="admin-section-grid">
        <article className="panel panel--inner">
          <h3>Categories</h3>

          <button
            type="button"
            className="btn btn-primary icon-btn"
            onClick={() => {
              setError("");
              setNewCategory("");
              setShowAddCategoryModal(true);
            }}
          >
            <FiPlus /> Add Category
          </button>

          <div className="inline-form">
            <input
              type="text"
              placeholder="Filter categories"
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
            />
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setCategoryFilter("")}
              disabled={syncing}
            >
              Clear
            </button>
          </div>

          <div className="table-wrap table-wrap--category">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCategories.length === 0 ? (
                  <tr>
                    <td colSpan={2}>No categories found.</td>
                  </tr>
                ) : (
                  paginatedCategories.map((category) => (
                    <tr key={category.id}>
                      <td>
                        {editingCategoryId === category.id ? (
                          <input
                            type="text"
                            value={editingCategoryName}
                            onChange={(event) => setEditingCategoryName(event.target.value)}
                          />
                        ) : (
                          category.name
                        )}
                      </td>
                      <td>
                        <div className="actions-cell actions-cell--nowrap">
                          {editingCategoryId === category.id ? (
                            <>
                              <button
                                type="button"
                                className="btn btn-primary icon-btn"
                                onClick={() => handleSaveCategoryEdit(category.id)}
                                disabled={syncing}
                                title="Save"
                              >
                                <FiCheck />
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline icon-btn"
                                onClick={handleCancelEditCategory}
                                disabled={syncing}
                                title="Cancel"
                              >
                                <FiLock />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                className="btn btn-outline icon-btn"
                                onClick={() => handleStartEditCategory(category)}
                                disabled={syncing}
                                title="Edit"
                              >
                                <FiEdit2 />
                              </button>
                              <button
                                type="button"
                                className="btn btn-danger icon-btn"
                                onClick={() => handleDeleteCategory(category.id)}
                                disabled={syncing}
                                title="Delete"
                              >
                                <FiTrash2 />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={safeCategoryPage}
            totalPages={categoryTotalPages}
            onPageChange={setCategoryPage}
          />
        </article>

        <article className="panel panel--inner">
          <h3>Products</h3>
          <Link to="/manage/products/new" className="btn btn-primary section-action-btn">
            <FiPlus /> Add Product
          </Link>

          <div className="filters-grid admin-filters-grid">
            <input
              type="text"
              placeholder="Filter by product or category"
              value={productFilter}
              onChange={(event) => setProductFilter(event.target.value)}
            />

            <select
              value={productCategoryFilter}
              onChange={(event) => setProductCategoryFilter(event.target.value)}
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={String(category.id)}>
                  {category.name}
                </option>
              ))}
            </select>

            <select
              value={productStatusFilter}
              onChange={(event) => setProductStatusFilter(event.target.value)}
            >
              <option value="all">All status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                setProductFilter("");
                setProductCategoryFilter("");
                setProductStatusFilter("all");
              }}
              disabled={syncing}
            >
              Clear
            </button>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6}>No products found.</td>
                  </tr>
                ) : (
                  paginatedProducts.map((product) => (
                    <tr key={product.id}>
                      <td title={product.name} className="table-name-trim">
                        {getTrimmedName(product.name)}
                      </td>
                      <td>{product.category_name || "Uncategorized"}</td>
                      <td>${Number(product.price).toFixed(2)}</td>
                      <td>{product.stock}</td>
                      <td>{product.is_active ? "Active" : "Inactive"}</td>
                      <td className="actions-cell actions-cell--nowrap">
                        <Link
                          className="btn btn-outline icon-btn"
                          to={`/manage/products/${product.id}/edit`}
                          title="Edit"
                        >
                          <FiEdit2 />
                        </Link>
                        <button
                          type="button"
                          className="btn btn-danger icon-btn"
                          onClick={() => handleDeleteProduct(product.id)}
                          disabled={syncing}
                          title="Delete"
                        >
                          <FiTrash2 />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={safeProductPage}
            totalPages={productTotalPages}
            onPageChange={setProductPage}
          />
        </article>
      </div>

      <div className="admin-section-grid admin-section-grid--secondary">
        <article className="panel panel--inner" id="password-section">
          <h3>Security</h3>

          <form className="form" onSubmit={handleProfileNameUpdate}>
            <label htmlFor="profile-name">Name</label>
            <input
              id="profile-name"
              type="text"
              value={profileName}
              onChange={(event) => setProfileName(event.target.value)}
              required
            />

            <button type="submit" className="btn btn-primary icon-btn" disabled={syncing}>
              <FiSave /> Save Name
            </button>
          </form>

          <h3>Change Password</h3>

          <form className="form" onSubmit={handlePasswordChange}>
            <label htmlFor="current-password">Current Password</label>
            <input
              id="current-password"
              type="password"
              ref={currentPasswordRef}
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              required
            />

            <label htmlFor="new-password">New Password</label>
            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              minLength={8}
              required
            />
            <p className="subtle-text">{PASSWORD_POLICY_MESSAGE}</p>

            <label htmlFor="confirm-password">Confirm New Password</label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              minLength={8}
              required
            />

            <button type="submit" className="btn btn-primary icon-btn" disabled={syncing}>
              <FiLock /> Update Password
            </button>
          </form>
        </article>

        {user?.role === "admin" ? (
          <article className="panel panel--inner" id="users-section">
            <h3>Users</h3>

            <form className="form user-form" onSubmit={handleAddUser}>
              <label htmlFor="new-user-name">Name</label>
              <input
                id="new-user-name"
                type="text"
                ref={newUserNameRef}
                value={newUserName}
                onChange={(event) => setNewUserName(event.target.value)}
                required
              />

              <label htmlFor="new-user-email">User Email</label>
              <input
                id="new-user-email"
                type="email"
                value={newUserEmail}
                onChange={(event) => setNewUserEmail(event.target.value)}
                required
              />

              <label htmlFor="new-user-password">Temp Password</label>
              <input
                id="new-user-password"
                type="password"
                value={newUserPassword}
                onChange={(event) => setNewUserPassword(event.target.value)}
                minLength={8}
                required
              />
              <p className="subtle-text">{PASSWORD_POLICY_MESSAGE}</p>

              <label htmlFor="new-user-role">Role</label>
              <select
                id="new-user-role"
                value={newUserRole}
                onChange={(event) => setNewUserRole(event.target.value)}
              >
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>

              <button type="submit" className="btn btn-primary icon-btn" disabled={syncing}>
                <FiUserPlus /> Add User
              </button>
            </form>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={4}>No users found.</td>
                    </tr>
                  ) : (
                    users.map((rowUser) => (
                      <tr key={rowUser.id}>
                        <td>{rowUser.name || "-"}</td>
                        <td>{rowUser.email}</td>
                        <td>{rowUser.role}</td>
                        <td>
                          {rowUser.role === "admin" ? (
                            <span className="status-pill is-active">Admin</span>
                          ) : (
                            <div className="actions-cell actions-cell--nowrap">
                              <button
                                type="button"
                                className="btn btn-outline icon-btn"
                                disabled={syncing}
                                onClick={() => handleTransferAdmin(rowUser.id, rowUser.email)}
                              >
                                <FiUserCheck /> Make Admin
                              </button>
                              <button
                                type="button"
                                className="btn btn-danger icon-btn"
                                disabled={syncing}
                                onClick={() => handleRemoveStaff(rowUser)}
                              >
                                <FiTrash2 /> Remove
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <h3>Password Reset Requests</h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Staff</th>
                    <th>Status</th>
                    <th>Requested</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {resetRequests.length === 0 ? (
                    <tr>
                      <td colSpan={4}>No reset requests.</td>
                    </tr>
                  ) : (
                    resetRequests.map((row) => (
                      <tr key={row.id}>
                        <td>{row.user?.email || "Unknown"}</td>
                        <td>{row.status}</td>
                        <td>{new Date(row.requested_at).toLocaleString()}</td>
                        <td>
                          {row.status === "pending" ? (
                            <button
                              type="button"
                              className="btn btn-primary icon-btn"
                              disabled={syncing}
                              onClick={() => handleApproveResetRequest(row.id)}
                            >
                              <FiCheck /> Approve
                            </button>
                          ) : (
                            <span className="status-pill is-active">Processed</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </article>
        ) : null}
      </div>

      {showAddCategoryModal ? (
        createPortal(
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="panel__head">
              <h3>Add Category</h3>
              <button
                type="button"
                className="btn btn-outline icon-btn"
                onClick={() => setShowAddCategoryModal(false)}
              >
                <FiX />
              </button>
            </div>

            <form className="form" onSubmit={handleAddCategory}>
              <label htmlFor="new-category-modal">Category Name</label>
              <input
                id="new-category-modal"
                type="text"
                value={newCategory}
                onChange={(event) => setNewCategory(event.target.value)}
                required
              />

              <div className="actions-row">
                <button type="submit" className="btn btn-primary icon-btn" disabled={syncing}>
                  <FiPlus /> Create
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowAddCategoryModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body)
      ) : null}
    </section>
  );
}

export default AdminDashboardPage;
