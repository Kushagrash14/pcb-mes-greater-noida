import { useEffect, useState } from "react";
import { Modal, Form, Select, InputNumber, Radio, DatePicker, Alert, message } from "antd";
import dayjs from "dayjs";
import api from "../../../services/API/api";

const CREATE_ENDPOINT = "/production-orders/create";
const UPDATE_ENDPOINT = (id) => `/production-orders/${id}/update`;
const LINES_ENDPOINT = "/production-lines/all";
const REUSABLE_QR_ENDPOINT = "/production-orders/reusable-qr";

const SEQUENCE_MODE_OPTIONS = [
  { label: "Non Sequential", value: "NON_SEQUENTIAL" },
  { label: "Sequential", value: "SEQUENTIAL" },
];

const ProductionOrderFormModal = ({
  open,
  mode = "create",
  record,
  products = [],
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [lines, setLines] = useState([]);
  const [linesLoading, setLinesLoading] = useState(false);

  // Unused QR identities left in cancelled orders (same product + line)
  const [reusable, setReusable] = useState(null);

  const isEdit = mode === "edit";

  const productIdValue = Form.useWatch("productId", form);
  const lineIdValue = Form.useWatch("lineId", form);

  const uniqueProducts = Array.from(
    new Map(products.map((p) => [p.id, p])).values()
  );

  useEffect(() => {
    if (!open) return;

    const loadLines = async () => {
      setLinesLoading(true);

      try {
        const res = await api.get(LINES_ENDPOINT);
        setLines(res?.data?.data || res?.data || []);
      } catch (err) {
        message.error("Failed to load production lines");
      } finally {
        setLinesLoading(false);
      }
    };

    loadLines();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    if (isEdit && record) {
      form.setFieldsValue({
        productId: record.product_id,
        lineId: record.line_id,
        targetQty: Number(record.target_qty || 0),
        sequenceMode: record.sequence_mode || "NON_SEQUENTIAL",
        plannedDate: record.planned_date
          ? dayjs(record.planned_date)
          : null,
      });
    } else {
      form.resetFields();
      setReusable(null);

      form.setFieldsValue({
        sequenceMode: "NON_SEQUENTIAL",
        plannedDate: dayjs(),
      });
    }
  }, [open, isEdit, record, form]);

  // ----------------------------------------------------------------
  // Once product + line are chosen, check for unused Product QR left
  // in cancelled orders. Only asked when creating, and only if there
  // is something to reuse.
  // ----------------------------------------------------------------
  useEffect(() => {
    if (!open || isEdit || !productIdValue || !lineIdValue) {
      setReusable(null);
      return undefined;
    }

    let stale = false;

    const loadReusable = async () => {
      try {
        const res = await api.get(REUSABLE_QR_ENDPOINT, {
          params: { productId: productIdValue, lineId: lineIdValue },
        });

        if (stale) return;

        setReusable(res?.data?.data || null);
        form.setFieldsValue({ qrSource: undefined });
      } catch (err) {
        if (!stale) setReusable(null);
      }
    };

    loadReusable();

    return () => {
      stale = true;
    };
  }, [open, isEdit, productIdValue, lineIdValue, form]);

  const hasReusable = !isEdit && (reusable?.availableCount || 0) > 0;

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      const payload = {
        productId: values.productId,
        lineId: values.lineId,
        targetQty: Number(values.targetQty),
        sequenceMode: values.sequenceMode,
        plannedDate: values.plannedDate
          ? values.plannedDate.format("YYYY-MM-DD")
          : undefined,
        ...(!isEdit
          ? { qrSource: hasReusable ? values.qrSource : "NEW" }
          : {}),
      };

      setSubmitting(true);

      if (isEdit) {
        await api.put(
          UPDATE_ENDPOINT(record.id),
          payload
        );

        message.success("Production order updated");
      } else {
        await api.post(
          CREATE_ENDPOINT,
          payload
        );

        message.success("Production order created");
      }

      onSuccess?.();

    } catch (err) {
      if (err?.errorFields) return;

      message.error(
        err?.response?.data?.message ||
        `Failed to ${isEdit ? "update" : "create"} production order`
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Re-check the quantity whenever the QR source changes
  const revalidateQty = () => {
    if (form.getFieldValue("targetQty")) {
      form.validateFields(["targetQty"]).catch(() => {});
    }
  };

  return (
    <Modal
      title={
        isEdit
          ? `Edit Production Order — ${record?.order_no || ""}`
          : "New Production Order"
      }
      open={open}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={submitting}
      okText={isEdit ? "Save Changes" : "Create Order"}
      destroyOnClose
      width={800}
    >
      {isEdit && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message="Editing will reassign Product QR identities for this order."
        />
      )}

      <Form
        form={form}
        layout="vertical"
      >
        <div style={{ display: "flex", gap: 16 }}>
          <Form.Item
            label="Product"
            name="productId"
            rules={[
              {
                required: true,
                message: "Product is required",
              },
            ]}
            style={{ flex: 1 }}
          >
            <Select
              placeholder="Select product"
              showSearch
              optionFilterProp="label"
              options={uniqueProducts.map((product) => ({
                value: product.id,
                label: product.erp_no
                  ? `${product.name} (${product.erp_no})`
                  : product.name,
              }))}
            />
          </Form.Item>

          <Form.Item
            label="Production Line"
            name="lineId"
            rules={[
              {
                required: true,
                message: "Production line is required",
              },
            ]}
            style={{ flex: 1 }}
          >
            <Select
              placeholder="Select production line"
              loading={linesLoading}
              showSearch
              optionFilterProp="label"
              options={lines.map((line) => ({
                value: line.id,
                label: line.code
                  ? `${line.name} (${line.code})`
                  : line.name,
              }))}
            />
          </Form.Item>
        </div>

        {hasReusable && (
          <div
            style={{
              marginBottom: 20,
              padding: "14px 16px",
              background: "#FFFBEB",
              border: "1px solid #FDE68A",
              borderRadius: 10,
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#92400E",
                marginBottom: 6,
              }}
            >
              Unused Product QR found in cancelled orders
            </div>

            <div style={{ marginBottom: 10 }}>
              {reusable.groups.map((group) => (
                <div
                  key={`${group.orderId}-${group.from}`}
                  style={{
                    fontSize: 12.5,
                    color: "#78350F",
                    lineHeight: 1.6,
                  }}
                >
                  {group.orderNo}: {group.count} unused
                  {" · "}
                  {group.from} → {group.to}
                </div>
              ))}
            </div>

            <Form.Item
              name="qrSource"
              label="How do you want to create this order?"
              rules={[
                {
                  required: true,
                  message: "Please choose which Product QR to use",
                },
              ]}
              style={{ marginBottom: 0 }}
            >
              <Radio.Group onChange={revalidateQty}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <Radio value="CANCELLED">
                    Use unused QR from cancelled orders ({reusable.availableCount} available)
                  </Radio>

                  <Radio value="NEW">
                    Continue with new QR serials ({reusable.freshAvailable} available)
                  </Radio>
                </div>
              </Radio.Group>
            </Form.Item>
          </div>
        )}

        <Form.Item
          label="Target Quantity"
          name="targetQty"
          rules={[
            {
              required: true,
              message: "Target quantity is required",
            },
            {
              validator: (_, value) => {
                if (
                  value === undefined ||
                  value === null ||
                  value === ""
                ) {
                  return Promise.resolve();
                }

                if (
                  !Number.isInteger(Number(value)) ||
                  Number(value) < 1
                ) {
                  return Promise.reject(
                    new Error(
                      "Target quantity must be a positive whole number"
                    )
                  );
                }

                const source = form.getFieldValue("qrSource");

                if (
                  hasReusable &&
                  source === "CANCELLED" &&
                  Number(value) > reusable.availableCount
                ) {
                  return Promise.reject(
                    new Error(
                      `Only ${reusable.availableCount} unused QR available from cancelled orders`
                    )
                  );
                }

                if (
                  hasReusable &&
                  source === "NEW" &&
                  Number(value) > reusable.freshAvailable
                ) {
                  return Promise.reject(
                    new Error(
                      `Only ${reusable.freshAvailable} new QR serials available. Generate more Product QR first.`
                    )
                  );
                }

                return Promise.resolve();
              },
            },
          ]}
        >
          <InputNumber
            min={1}
            precision={0}
            style={{ width: "100%" }}
            placeholder="Enter production quantity"
          />
        </Form.Item>

        <div
          style={{
            marginBottom: 20,
            padding: "14px 16px",
            background: "#F8FAFC",
            border: "1px solid #E2E8F0",
            borderRadius: 10,
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#64748B",
              marginBottom: 4,
            }}
          >
            Product QR Assignment
          </div>

          <div
            style={{
              fontSize: 13,
              color: "#334155",
              lineHeight: 1.5,
            }}
          >
            Product QR identities are assigned automatically from the
            generated Product QR pool when the order is created.
          </div>
        </div>

        <div style={{ display: "flex", gap: 16 }}>
          <Form.Item
            label="Sequence Mode"
            name="sequenceMode"
            rules={[
              {
                required: true,
                message: "Sequence mode is required",
              },
            ]}
            style={{ flex: 1 }}
          >
            <Radio.Group
              options={SEQUENCE_MODE_OPTIONS}
              optionType="button"
              buttonStyle="solid"
            />
          </Form.Item>

          <Form.Item
            label="Planned Date"
            name="plannedDate"
            rules={[
              {
                required: true,
                message: "Planned date is required",
              },
            ]}
            style={{ flex: 1 }}
          >
            <DatePicker
              style={{ width: "100%" }}
            />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
};

export default ProductionOrderFormModal;