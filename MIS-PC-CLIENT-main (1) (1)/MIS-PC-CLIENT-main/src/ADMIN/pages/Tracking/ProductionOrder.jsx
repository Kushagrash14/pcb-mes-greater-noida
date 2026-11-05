import { useEffect, useMemo, useState } from "react";
import { Input, Select, Drawer, Descriptions, Modal, message, Spin, Pagination, Empty } from "antd";
import { Search, Eye, Pencil, Trash2, Package, ArrowLeft, ChevronRight, Plus } from "lucide-react";
import dayjs from "dayjs";
import api from "../../../services/API/api";
import MasterTable from "../Masters/components/MasterTable";
import ProductionOrderFormModal from "./CreateProductionOrderModal.jsx";

// ------------------------------------------------------------------
// Endpoints
// ------------------------------------------------------------------
const LIST_ENDPOINT = "/production-orders/all";

// Configuration endpoint: returns ALL active products, independent of
// running production orders.
const LIST_PRODUCTS_ENDPOINT = "/products/all-active-product";

const DETAIL_ENDPOINT = (id) => `/production-orders/${id}`;
const DELETE_ENDPOINT = (id) => `/production-orders/${id}`;
const ITEMS_ENDPOINT = (id) => `/production-orders/${id}/items`;
const TRANSITION_ENDPOINT = (id, action) => `/production-orders/${id}/${action}`;

const ITEMS_PAGE_SIZE = 50;

const STATUS_FILTER_OPTIONS = [
  { value: "All", label: "All Status" },
  { value: "PLANNED", label: "Planned" },
  { value: "RUNNING", label: "Running" },
  { value: "PAUSED", label: "Paused" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const STATUS_STYLES = {
  PLANNED: { bg: "#EFF6FF", text: "#2563EB", dot: "#3B82F6" },
  PENDING: { bg: "#EFF6FF", text: "#2563EB", dot: "#3B82F6" },
  RUNNING: { bg: "#ECFDF5", text: "#16A34A", dot: "#22C55E" },
  IN_PROGRESS: { bg: "#ECFDF5", text: "#16A34A", dot: "#22C55E" },
  PAUSED: { bg: "#FFFBEB", text: "#D97706", dot: "#F59E0B" },
  COMPLETED: { bg: "#F0FDFA", text: "#0D9488", dot: "#14B8A6" },
  CANCELLED: { bg: "#FEF2F2", text: "#DC2626", dot: "#EF4444" },
  REJECTED: { bg: "#FEF2F2", text: "#DC2626", dot: "#EF4444" },
};

const StatusPill = ({ status }) => {
  const style = STATUS_STYLES[status] || STATUS_STYLES.PLANNED;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "3px 10px",
        borderRadius: 20,
        background: style.bg,
        color: style.text,
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: style.dot,
        }}
      />
      {status}
    </span>
  );
};

const ACTION_TONES = {
  neutral: { bg: "#F8FAFC", color: "#64748B", border: "#F1F5F9" },
  start: { bg: "#ECFDF5", color: "#16A34A", border: "#DCFCE7" },
  pause: { bg: "#FFFBEB", color: "#D97706", border: "#FDE68A" },
  resume: { bg: "#EFF6FF", color: "#2563EB", border: "#DBEAFE" },
  cancel: { bg: "#FEF2F2", color: "#DC2626", border: "#FEE2E2" },
  edit: { bg: "#EFF6FF", color: "#2563EB", border: "#DBEAFE" },
  delete: { bg: "#FEF2F2", color: "#DC2626", border: "#FEE2E2" },
};

const ActionButton = ({ label, icon: Icon, tone = "neutral", onClick, title }) => {
  const style = ACTION_TONES[tone];
  const iconOnly = Icon && !label;

  return (
    <button
      onClick={onClick}
      title={title || label}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 5,
        height: 28,
        width: iconOnly ? 28 : "auto",
        padding: iconOnly ? 0 : "0 10px",
        borderRadius: 7,
        border: `1px solid ${style.border}`,
        background: style.bg,
        color: style.color,
        fontSize: 12,
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      {Icon && <Icon size={14} />}
      {label}
    </button>
  );
};

const PrimaryButton = ({ onClick, children }) => (
  <button
    onClick={onClick}
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      height: 36,
      padding: "0 14px",
      borderRadius: 9,
      border: "none",
      background: "#2563EB",
      color: "#fff",
      fontSize: 13,
      fontWeight: 600,
      cursor: "pointer",
    }}
  >
    <Plus size={15} />
    {children}
  </button>
);

const COUNT_CHIPS = [
  { key: "RUNNING", label: "Running" },
  { key: "PLANNED", label: "Planned" },
  { key: "PAUSED", label: "Paused" },
  { key: "COMPLETED", label: "Done" },
];

const ProductionOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);

  // Step control: null => Step 1 (products), otherwise Step 2 (that product's POs)
  const [selectedProductKey, setSelectedProductKey] = useState(null);

  // Step 1 filter
  const [productSearch, setProductSearch] = useState("");

  // Step 2 filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [lineFilter, setLineFilter] = useState("All");

  // Create / Edit modal
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [editRecord, setEditRecord] = useState(null);

  // View drawer
  const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
  const [viewOrder, setViewOrder] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewOrderId, setViewOrderId] = useState(null);
  const [itemsData, setItemsData] = useState({
    items: [],
    total: 0,
    summary: {},
    first_serial: null,
    last_serial: null,
  });
  const [itemsPage, setItemsPage] = useState(1);
  const [itemsStatus, setItemsStatus] = useState("ALL");
  const [itemsSearch, setItemsSearch] = useState("");
  const [itemsLoading, setItemsLoading] = useState(false);

  // ----------------------------------------------------------------
  // Fetch products (configuration, independent of production orders)
  // ----------------------------------------------------------------
  const fetchProducts = async () => {
    try {
      const res = await api.get(LIST_PRODUCTS_ENDPOINT);
      setProducts(res?.data?.data || res?.data || []);
    } catch (err) {
      console.error("ERR FETCHING CONFIGURABLE PRODUCTS:", err);
      message.error("Failed to load products");
    }
  };

  // ----------------------------------------------------------------
  // Fetch ALL production orders once. Step 1 needs them for counts,
  // Step 2 filters them client-side (no refetch on each keystroke).
  // ----------------------------------------------------------------
  const fetchOrders = async () => {
    setLoading(true);

    try {
      const res = await api.get(LIST_ENDPOINT);
      setOrders(res?.data?.data || res?.data || []);
    } catch (err) {
      message.error("Failed to load production orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchOrders();
  }, []);

  // ----------------------------------------------------------------
  // Build product cards (all active products + any product that only
  // appears on orders), with order stats.
  // ----------------------------------------------------------------
  const productCards = useMemo(() => {
    const map = new Map();

    products.forEach((p) => {
      map.set(p.id, {
        key: p.id,
        product_id: p.id,
        name: p.name,
        erp_no: p.erp_no,
        orders: [],
      });
    });

    orders.forEach((o) => {
      const key = o.product_id ?? "unassigned";

      if (!map.has(key)) {
        map.set(key, {
          key,
          product_id: o.product_id,
          name: o.product_name || "Unassigned Product",
          erp_no: o.product_erp_no,
          orders: [],
        });
      }

      map.get(key).orders.push(o);
    });

    return Array.from(map.values()).map((c) => {
      const counts = {};
      let totalQty = 0;

      c.orders.forEach((o) => {
        counts[o.status] = (counts[o.status] || 0) + 1;
        totalQty += Number(o.target_qty) || 0;
      });

      return { ...c, counts, totalQty };
    });
  }, [products, orders]);

  const visibleProductCards = useMemo(() => {
    const q = productSearch.trim().toLowerCase();

    return productCards
      .filter(
        (c) =>
          !q ||
          (c.name || "").toLowerCase().includes(q) ||
          String(c.erp_no || "").toLowerCase().includes(q)
      )
      .sort((a, b) => {
        // products with running orders first, then with orders, then by name
        const ar = a.counts.RUNNING || 0;
        const br = b.counts.RUNNING || 0;
        if (ar !== br) return br - ar;
        if (a.orders.length !== b.orders.length) return b.orders.length - a.orders.length;
        return (a.name || "").localeCompare(b.name || "");
      });
  }, [productCards, productSearch]);

  const selectedProduct = useMemo(
    () => productCards.find((c) => c.key === selectedProductKey) || null,
    [productCards, selectedProductKey]
  );

  // ----------------------------------------------------------------
  // Step 2 data: this product's orders + filters
  // ----------------------------------------------------------------
  const lineOptions = useMemo(() => {
    if (!selectedProduct) return [{ value: "All", label: "All Lines" }];

    const lines = Array.from(
      new Set(selectedProduct.orders.map((o) => o.line_name).filter(Boolean))
    ).sort();

    return [
      { value: "All", label: "All Lines" },
      ...lines.map((l) => ({ value: l, label: l })),
    ];
  }, [selectedProduct]);

  const filteredOrders = useMemo(() => {
    if (!selectedProduct) return [];

    const q = search.trim().toLowerCase();

    return selectedProduct.orders.filter((o) => {
      if (statusFilter !== "All" && o.status !== statusFilter) return false;
      if (lineFilter !== "All" && o.line_name !== lineFilter) return false;
      if (q && !String(o.order_no || "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [selectedProduct, search, statusFilter, lineFilter]);

  const filtersActive = search.trim() || statusFilter !== "All" || lineFilter !== "All";

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setLineFilter("All");
  };

  const openProduct = (card) => {
    resetFilters();
    setSelectedProductKey(card.key);
  };

  const backToProducts = () => {
    resetFilters();
    setSelectedProductKey(null);
  };

  // ----------------------------------------------------------------
  // Create / Edit
  // ----------------------------------------------------------------
  const openCreate = () => {
    setFormMode("create");
    setEditRecord(null);
    setFormOpen(true);
  };

  const openEdit = (record) => {
    setFormMode("edit");
    setEditRecord(record);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditRecord(null);
  };

  // ----------------------------------------------------------------
  // View
  // ----------------------------------------------------------------
  const loadItems = async (orderId, page = 1, status = "ALL", itemSearch = "") => {
    setItemsLoading(true);

    try {
      const res = await api.get(ITEMS_ENDPOINT(orderId), {
        params: {
          page,
          pageSize: ITEMS_PAGE_SIZE,
          status: status !== "ALL" ? status : undefined,
          search: itemSearch.trim() || undefined,
        },
      });

      setItemsData(
        res?.data?.data || {
          items: [],
          total: 0,
          summary: {},
          first_serial: null,
          last_serial: null,
        }
      );
      setItemsPage(page);
    } catch (err) {
      message.error("Failed to load serials");
    } finally {
      setItemsLoading(false);
    }
  };

  const handleView = async (record) => {
    setViewDrawerOpen(true);
    setViewLoading(true);
    setViewOrderId(record.id);
    setItemsStatus("ALL");
    setItemsSearch("");
    setItemsData({ items: [], total: 0, summary: {}, first_serial: null, last_serial: null });

    try {
      const res = await api.get(DETAIL_ENDPOINT(record.id));

      setViewOrder(res?.data?.data || res?.data || null);
      loadItems(record.id, 1, "ALL", "");
    } catch (err) {
      message.error("Failed to load order details");
    } finally {
      setViewLoading(false);
    }
  };

  const closeViewDrawer = () => {
    setViewDrawerOpen(false);
    setViewOrder(null);
    setViewOrderId(null);
  };

  // ----------------------------------------------------------------
  // Start / Pause / Resume / Cancel / Delete
  // ----------------------------------------------------------------
  const TRANSITION_LABELS = {
    start: "started",
    pause: "paused",
    resume: "resumed",
  };

  const handleTransition = async (record, action) => {
    try {
      await api.patch(TRANSITION_ENDPOINT(record.id, action));
      message.success(`Order ${TRANSITION_LABELS[action] || "updated"}`);
      fetchOrders();
    } catch (err) {
      message.error(err?.response?.data?.message || `Failed to ${action} order`);
    }
  };

  const handleCancel = (record) => {
    Modal.confirm({
      title: "Cancel production order?",
      content: `${record.order_no} will be marked CANCELLED. This cannot be undone.`,
      okText: "Cancel Order",
      okButtonProps: { danger: true },
      cancelText: "Keep Order",

      onOk: async () => {
        try {
          await api.patch(TRANSITION_ENDPOINT(record.id, "cancel"));
          message.success("Production order cancelled");
          fetchOrders();
        } catch (err) {
          message.error(err?.response?.data?.message || "Failed to cancel order");
        }
      },
    });
  };

  const handleDelete = (record) => {
    Modal.confirm({
      title: "Delete production order?",
      content: `${record.order_no} and its assigned Product QR items will be permanently deleted. This cannot be undone.`,
      okText: "Delete",
      okButtonProps: { danger: true },
      cancelText: "Keep Order",

      onOk: async () => {
        try {
          await api.delete(DELETE_ENDPOINT(record.id));
          message.success("Production order deleted");
          fetchOrders();
        } catch (err) {
          message.error(err?.response?.data?.message || "Failed to delete order");
        }
      },
    });
  };

  // ----------------------------------------------------------------
  // Row actions
  //
  // Product QR printing is intentionally NOT here. Product QR identities
  // are generated before Production Orders; a Production Order only
  // assigns existing identities from the QR pool to a line-specific job.
  // ----------------------------------------------------------------
  const renderActions = (record) => {
    const buttons = [
      <ActionButton key="view" icon={Eye} title="View" onClick={() => handleView(record)} />,
    ];

    if (record.status === "PLANNED") {
      buttons.push(
        <ActionButton key="edit" icon={Pencil} tone="edit" title="Edit" onClick={() => openEdit(record)} />,
        <ActionButton key="start" label="Start" tone="start" onClick={() => handleTransition(record, "start")} />,
        <ActionButton key="delete" icon={Trash2} tone="delete" title="Delete" onClick={() => handleDelete(record)} />
      );
    } else if (record.status === "RUNNING") {
      buttons.push(
        <ActionButton key="pause" label="Pause" tone="pause" onClick={() => handleTransition(record, "pause")} />,
        <ActionButton key="cancel" label="Cancel" tone="cancel" onClick={() => handleCancel(record)} />
      );
    } else if (record.status === "PAUSED") {
      buttons.push(
        <ActionButton key="resume" label="Resume" tone="resume" onClick={() => handleTransition(record, "resume")} />,
        <ActionButton key="cancel" label="Cancel" tone="cancel" onClick={() => handleCancel(record)} />
      );
    } else if (record.status === "CANCELLED") {
      buttons.push(
        <ActionButton key="delete" icon={Trash2} tone="delete" title="Delete" onClick={() => handleDelete(record)} />
      );
    }

    return <div style={{ display: "flex", gap: 6 }}>{buttons}</div>;
  };

  // ----------------------------------------------------------------
  // Step 2 table columns (Product column dropped: it's in the header)
  // ----------------------------------------------------------------
  const columns = [
    { title: "Order No", dataIndex: "order_no", key: "order_no" },
    { title: "Line", dataIndex: "line_name", key: "line_name", render: (v) => v || "—" },
    { title: "Target Qty", dataIndex: "target_qty", key: "target_qty" },
    { title: "Sequence", dataIndex: "sequence_mode", key: "sequence_mode" },
    {
      title: "Status",
      key: "status",
      render: (_, r) => <StatusPill status={r.status} />,
    },
    {
      title: "Planned Date",
      dataIndex: "planned_date",
      key: "planned_date",
      render: (v) => (v ? dayjs(v).format("DD MMM YYYY") : "—"),
    },
    {
      title: "Actions",
      key: "actions",
      width: 190,
      render: (_, r) => renderActions(r),
    },
  ];

  // ----------------------------------------------------------------
  // Step 1: product cards
  // ----------------------------------------------------------------
  const renderProductStep = () => (
    <>
      <div style={{ padding: "20px 20px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#0F172A" }}>Production Orders</div>
            <div style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>
              Select a product to view and manage its production orders
            </div>
          </div>

          <PrimaryButton onClick={openCreate}>New Production Order</PrimaryButton>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 20px",
          marginTop: 16,
          borderTop: "1px solid #F1F5F9",
          borderBottom: "1px solid #F1F5F9",
          background: "#FBFCFD",
        }}
      >
        <Input
          placeholder="Search product or ERP no..."
          prefix={<Search size={15} color="#94A3B8" />}
          value={productSearch}
          onChange={(e) => setProductSearch(e.target.value)}
          style={{ maxWidth: 300, borderRadius: 10, fontSize: 13 }}
          allowClear
        />
        <span style={{ fontSize: 12, color: "#64748B" }}>
          {visibleProductCards.length} product{visibleProductCards.length === 1 ? "" : "s"}
        </span>
      </div>

      <Spin spinning={loading}>
        <div style={{ padding: 20, minHeight: 200 }}>
          {visibleProductCards.length === 0 && !loading ? (
            <Empty description="No products found" />
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 16,
              }}
            >
              {visibleProductCards.map((card) => {
                const running = card.counts.RUNNING || 0;

                return (
                  <div
                    key={card.key}
                    className="po-product-card"
                    onClick={() => openProduct(card)}
                    style={{
                      border: "1px solid #E2E8F0",
                      borderRadius: 12,
                      padding: 16,
                      background: "#fff",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      gap: 14,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          background: "#EFF6FF",
                          color: "#2563EB",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Package size={20} />
                      </div>

                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: 14,
                            color: "#0F172A",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          title={card.name}
                        >
                          {card.name}
                        </div>
                        <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
                          {card.erp_no ? `ERP ${card.erp_no}` : "No ERP no."}
                        </div>
                      </div>

                      <ChevronRight size={18} color="#94A3B8" />
                    </div>

                    <div style={{ display: "flex", gap: 24 }}>
                      <div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: "#0F172A", lineHeight: 1.1 }}>
                          {card.orders.length}
                        </div>
                        <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 2 }}>Orders</div>
                      </div>

                      <div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: "#0F172A", lineHeight: 1.1 }}>
                          {card.totalQty.toLocaleString()}
                        </div>
                        <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 2 }}>Total target qty</div>
                      </div>

                      {running > 0 && (
                        <div>
                          <div style={{ fontSize: 20, fontWeight: 700, color: "#16A34A", lineHeight: 1.1 }}>
                            {running}
                          </div>
                          <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 2 }}>Running</div>
                        </div>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", minHeight: 22 }}>
                      {card.orders.length === 0 ? (
                        <span style={{ fontSize: 12, color: "#94A3B8" }}>No production orders yet</span>
                      ) : (
                        COUNT_CHIPS.filter((c) => card.counts[c.key]).map((c) => {
                          const s = STATUS_STYLES[c.key];
                          return (
                            <span
                              key={c.key}
                              style={{
                                fontSize: 11,
                                fontWeight: 600,
                                padding: "2px 9px",
                                borderRadius: 20,
                                background: s.bg,
                                color: s.text,
                              }}
                            >
                              {card.counts[c.key]} {c.label}
                            </span>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Spin>
    </>
  );

  // ----------------------------------------------------------------
  // Step 2: selected product's orders
  // ----------------------------------------------------------------
  const renderOrdersStep = () => (
    <>
      <div style={{ padding: "20px 20px 0" }}>
        <button
          onClick={backToProducts}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            border: "none",
            background: "transparent",
            color: "#2563EB",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            padding: 0,
            marginBottom: 12,
          }}
        >
          <ArrowLeft size={15} />
          All products
        </button>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 11,
                background: "#EFF6FF",
                color: "#2563EB",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Package size={22} />
            </div>

            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#0F172A" }}>
                {selectedProduct?.name || "Product"}
              </div>
              <div style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>
                {selectedProduct?.erp_no ? `ERP ${selectedProduct.erp_no} · ` : ""}
                {selectedProduct?.orders.length ?? 0} production order
                {(selectedProduct?.orders.length ?? 0) === 1 ? "" : "s"}
              </div>
            </div>
          </div>

          <PrimaryButton onClick={openCreate}>New Production Order</PrimaryButton>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 20px",
          marginTop: 16,
          borderTop: "1px solid #F1F5F9",
          borderBottom: "1px solid #F1F5F9",
          background: "#FBFCFD",
          flexWrap: "wrap",
        }}
      >
        <Input
          placeholder="Search by order no..."
          prefix={<Search size={15} color="#94A3B8" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 260, borderRadius: 10, fontSize: 13 }}
          allowClear
        />

        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          style={{ width: 160 }}
          options={STATUS_FILTER_OPTIONS}
        />

        <Select
          value={lineFilter}
          onChange={setLineFilter}
          style={{ width: 160 }}
          options={lineOptions}
        />

        {filtersActive && (
          <button
            onClick={resetFilters}
            style={{
              border: "none",
              background: "transparent",
              color: "#2563EB",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Clear filters
          </button>
        )}

        <span style={{ marginLeft: "auto", fontSize: 12, color: "#64748B" }}>
          Showing {filteredOrders.length} of {selectedProduct?.orders.length ?? 0}
        </span>
      </div>

      <div style={{ padding: "0 4px" }}>
        <MasterTable
          columns={columns}
          data={filteredOrders}
          loading={loading}
          rowKey="id"
        />
      </div>
    </>
  );

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 5,
        border: "1px solid #F1F5F9",
      }}
    >
      <style>{`
        .po-product-card {
          transition: border-color .15s ease, box-shadow .15s ease, transform .15s ease;
        }
        .po-product-card:hover {
          border-color: #BFDBFE !important;
          box-shadow: 0 6px 18px rgba(37, 99, 235, 0.08);
          transform: translateY(-1px);
        }
      `}</style>

      {selectedProductKey === null || !selectedProduct
        ? renderProductStep()
        : renderOrdersStep()}

      <ProductionOrderFormModal
        open={formOpen}
        mode={formMode}
        record={editRecord}
        products={products}
        onCancel={closeForm}
        onSuccess={() => {
          closeForm();
          fetchOrders();
        }}
      />

      <Drawer
        title={viewOrder ? `Order ${viewOrder.order_no}` : "Production Order"}
        open={viewDrawerOpen}
        onClose={closeViewDrawer}
        width={460}
      >
        {viewLoading ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <Spin />
          </div>
        ) : (
          viewOrder && (
            <>
              <Descriptions column={1} size="small" bordered>
                <Descriptions.Item label="Product">
                  {viewOrder.product_name}
                  {viewOrder.product_erp_no ? ` (${viewOrder.product_erp_no})` : ""}
                </Descriptions.Item>

                <Descriptions.Item label="Line">{viewOrder.line_name || "—"}</Descriptions.Item>

                <Descriptions.Item label="Target Qty">{viewOrder.target_qty}</Descriptions.Item>

                <Descriptions.Item label="Product QR">
                  <span style={{ wordBreak: "break-all", fontSize: 12 }}>
                    {!itemsData.first_serial
                      ? "—"
                      : itemsData.first_serial === itemsData.last_serial
                        ? itemsData.first_serial
                        : `${itemsData.first_serial} → ${itemsData.last_serial}`}
                  </span>
                </Descriptions.Item>

                <Descriptions.Item label="Sequence Mode">{viewOrder.sequence_mode}</Descriptions.Item>

                <Descriptions.Item label="Status">
                  <StatusPill status={viewOrder.status} />
                </Descriptions.Item>

                <Descriptions.Item label="Planned Date">
                  {viewOrder.planned_date ? dayjs(viewOrder.planned_date).format("DD MMM YYYY") : "—"}
                </Descriptions.Item>

                <Descriptions.Item label="QR Identities Assigned">
                  {viewOrder.item_count ?? "—"}
                </Descriptions.Item>
              </Descriptions>

              <div style={{ marginTop: 22, fontWeight: 700, fontSize: 13, color: "#0F172A" }}>
                Serials to Scan
              </div>

              <div style={{ marginTop: 6, fontSize: 12, color: "#64748B" }}>
                {itemsData.summary.PENDING ?? 0} pending
                {" · "}
                {itemsData.summary.IN_PROGRESS ?? 0} in progress
                {" · "}
                {itemsData.summary.COMPLETED ?? 0} completed
                {(itemsData.summary.REJECTED ?? 0) > 0 && ` · ${itemsData.summary.REJECTED} rejected`}
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <Select
                  value={itemsStatus}
                  onChange={(value) => {
                    setItemsStatus(value);
                    loadItems(viewOrderId, 1, value, itemsSearch);
                  }}
                  style={{ width: 140 }}
                  options={[
                    { value: "ALL", label: "All" },
                    { value: "PENDING", label: "Pending" },
                    { value: "IN_PROGRESS", label: "In progress" },
                    { value: "COMPLETED", label: "Completed" },
                    { value: "REJECTED", label: "Rejected" },
                  ]}
                />

                <Input.Search
                  placeholder="Search serial..."
                  allowClear
                  onSearch={(value) => {
                    setItemsSearch(value);
                    loadItems(viewOrderId, 1, itemsStatus, value);
                  }}
                />
              </div>

              <Spin spinning={itemsLoading}>
                <div
                  style={{
                    marginTop: 8,
                    border: "1px solid #F1F5F9",
                    borderRadius: 8,
                    minHeight: 60,
                  }}
                >
                  {itemsData.items.length === 0 ? (
                    <div style={{ padding: 12, fontSize: 13, color: "#94A3B8" }}>No serials found</div>
                  ) : (
                    itemsData.items.map((item) => (
                      <div
                        key={item.serial_no}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: 8,
                          padding: "7px 12px",
                          borderBottom: "1px solid #F1F5F9",
                          fontSize: 12.5,
                          color: "#334155",
                        }}
                      >
                        <span style={{ wordBreak: "break-all" }}>
                          {item.sequence_no}. {item.serial_no}
                        </span>

                        <StatusPill status={item.status} />
                      </div>
                    ))
                  )}
                </div>
              </Spin>

              <Pagination
                size="small"
                current={itemsPage}
                pageSize={ITEMS_PAGE_SIZE}
                total={itemsData.total}
                showSizeChanger={false}
                hideOnSinglePage
                style={{ marginTop: 10, textAlign: "right" }}
                onChange={(page) => loadItems(viewOrderId, page, itemsStatus, itemsSearch)}
              />

              <div style={{ marginTop: 22, fontWeight: 700, fontSize: 13, color: "#0F172A" }}>
                Stage Flow
              </div>

              <div style={{ marginTop: 8 }}>
                {(viewOrder.stages || []).map((stage) => (
                  <div
                    key={stage.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 0",
                      borderBottom: "1px solid #F1F5F9",
                      fontSize: 13,
                      color: "#334155",
                    }}
                  >
                    <span>
                      {stage.sequence_order}. {stage.stage_name}
                    </span>

                    <StatusPill status={stage.status} />
                  </div>
                ))}
              </div>
            </>
          )
        )}
      </Drawer>
    </div>
  );
};

export default ProductionOrdersPage;