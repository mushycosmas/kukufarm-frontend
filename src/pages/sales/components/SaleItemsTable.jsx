import React from "react";

const SaleItemsTable = ({
  items = [],
  units = [],
  saving = false,
  eggStock = 0,
  totalEggsInForm = 0,
  hasEnoughEggStock = true,
  remainingEggStock = 0,
  loadingEggStock = false,
  calculateItemTotal,
  calculateEggQuantity,
  formatMoney,
  handleItemChange,
  addItem,
  removeItem,
}) => {
  return (
    <div className="col-12">

      <div className="d-flex justify-content-between align-items-center mb-2">

        <div>

          <h6 className="mb-0">
            Sale Items
          </h6>

          <small className="text-muted">
            Mark an item as Egg so its quantity is checked against available egg stock.
          </small>

        </div>

        <button
          type="button"
          className="btn btn-outline-success btn-sm"
          onClick={addItem}
          disabled={saving}
        >
          <i className="bi bi-plus-lg me-1"></i>
          Add Item
        </button>

      </div>

      <div className="table-responsive">

        <table className="table table-bordered align-middle mb-0">

          <thead>

            <tr>

              <th>
                Product
              </th>

              <th
                style={{
                  width: "120px",
                }}
              >
                Egg Item
              </th>

              <th
                style={{
                  width: "130px",
                }}
              >
                Unit
              </th>

              <th
                style={{
                  width: "130px",
                }}
              >
                Quantity
              </th>

              <th
                style={{
                  width: "160px",
                }}
              >
                Unit Price
              </th>

              <th
                style={{
                  width: "170px",
                }}
              >
                Total
              </th>

              <th
                style={{
                  width: "60px",
                }}
              />

            </tr>

          </thead>

          <tbody>

            {items.map((item, index) => {

              const itemTotal =
                calculateItemTotal(item);

              const eggQuantity =
                calculateEggQuantity(item);

              const insufficientStock =
                item.is_egg &&
                totalEggsInForm > eggStock;

              return (
                <tr
                  key={
                    item.id ||
                    `new-${index}`
                  }
                >

                  {/* PRODUCT */}

                  <td>

                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Large Eggs"
                      value={item.product}
                      onChange={(e) =>
                        handleItemChange(
                          index,
                          "product",
                          e.target.value
                        )
                      }
                      disabled={saving}
                      required
                    />

                  </td>

                  {/* EGG ITEM */}

                  <td>

                    <select
                      className={`form-select ${
                        item.is_egg
                          ? "border-success"
                          : ""
                      }`}
                      value={
                        item.is_egg
                          ? "yes"
                          : "no"
                      }
                      onChange={(e) =>
                        handleItemChange(
                          index,
                          "is_egg",
                          e.target.value === "yes"
                        )
                      }
                      disabled={saving}
                    >

                      <option value="no">
                        No
                      </option>

                      <option value="yes">
                        Yes
                      </option>

                    </select>

                  </td>

                  {/* UNIT */}

                  <td>

                    <select
                      className="form-select"
                      value={
                        item.unit ||
                        "piece"
                      }
                      onChange={(e) =>
                        handleItemChange(
                          index,
                          "unit",
                          e.target.value
                        )
                      }
                      disabled={saving}
                    >

                      {units.map((unit) => (
                        <option
                          key={unit.value}
                          value={unit.value}
                        >
                          {unit.label}
                        </option>
                      ))}

                    </select>

                  </td>

                  {/* QUANTITY */}

                  <td>

                    <input
                      type="number"
                      min="0"
                      step={
                        item.unit === "tray"
                          ? "1"
                          : "0.01"
                      }
                      className={`form-control ${
                        insufficientStock
                          ? "is-invalid"
                          : ""
                      }`}
                      value={item.quantity}
                      onChange={(e) =>
                        handleItemChange(
                          index,
                          "quantity",
                          e.target.value
                        )
                      }
                      disabled={saving}
                      required
                    />

                    {item.is_egg &&
                      eggQuantity > 0 && (
                        <small className="text-success d-block mt-1">

                          <i className="bi bi-egg-fill me-1"></i>

                          {formatMoney(
                            eggQuantity
                          )}{" "}
                          eggs

                        </small>
                      )}

                  </td>

                  {/* UNIT PRICE */}

                  <td>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="form-control"
                      value={item.unit_price}
                      onChange={(e) =>
                        handleItemChange(
                          index,
                          "unit_price",
                          e.target.value
                        )
                      }
                      disabled={saving}
                      required
                    />

                  </td>

                  {/* TOTAL */}

                  <td>

                    <strong>
                      TZS{" "}
                      {formatMoney(
                        itemTotal
                      )}
                    </strong>

                  </td>

                  {/* REMOVE */}

                  <td>

                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm"
                      onClick={() =>
                        removeItem(index)
                      }
                      disabled={
                        saving ||
                        items.length === 1
                      }
                      title="Remove item"
                    >
                      <i className="bi bi-trash"></i>
                    </button>

                  </td>

                </tr>
              );
            })}

          </tbody>

        </table>

      </div>

      {/* STOCK WARNING */}

      {totalEggsInForm > 0 && (

        <div
          className={`alert mt-3 mb-0 ${
            hasEnoughEggStock
              ? "alert-success"
              : "alert-danger"
          }`}
        >

          <div className="d-flex align-items-start">

            <i
              className={`bi ${
                hasEnoughEggStock
                  ? "bi-egg-fill"
                  : "bi-exclamation-triangle-fill"
              } fs-5 me-2`}
            ></i>

            <div className="w-100">

              <strong>
                Egg Stock Check
              </strong>

              <div className="mt-1">

                Available stock:{" "}

                <strong>
                  {formatMoney(eggStock)} eggs
                </strong>

              </div>

              <div>

                This sale requires:{" "}

                <strong>
                  {formatMoney(
                    totalEggsInForm
                  )} eggs
                </strong>

              </div>

              {hasEnoughEggStock ? (

                <div className="mt-1 text-success">

                  <i className="bi bi-check-circle me-1"></i>

                  Stock is sufficient.

                  <br />

                  Remaining after sale:{" "}

                  <strong>
                    {formatMoney(
                      remainingEggStock
                    )} eggs
                  </strong>

                </div>

              ) : (

                <div className="mt-1">

                  <i className="bi bi-x-circle me-1"></i>

                  <strong>
                    Sale cannot be completed.
                  </strong>

                  <br />

                  You are short by{" "}

                  <strong>
                    {formatMoney(
                      totalEggsInForm - eggStock
                    )} eggs.
                  </strong>

                </div>

              )}

            </div>

          </div>

        </div>

      )}

    </div>
  );
};

export default SaleItemsTable;