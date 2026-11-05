
import React, { useEffect, useState } from "react";
import {
  Drawer,
  Button,
  Card,
  Input,
  Select,
  Radio,
  Space,
  Typography,
  Divider,
  message,
  Popconfirm,
} from "antd";
import {
  Wrench,
  Ban,
  ArrowLeft,
  CheckCircle,
} from "lucide-react";
import api from "../../services/API/api";

const { Text, Title } = Typography;
const { TextArea } = Input;

export default function QualityActionsDrawer({ open, onClose }) {
  const [action, setAction] = useState(null);
  const [reworkMode, setReworkMode] = useState("START");
  const [serialNo, setSerialNo] = useState("");
  const [stationId, setStationId] = useState(null);
  const [reason, setReason] = useState("");
  const [stations, setStations] = useState([]);
  const [loadingStations, setLoadingStations] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setAction(null);
    setReworkMode("START");
    setSerialNo("");
    setStationId(null);
    setReason("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  useEffect(() => {
    if (!open) return;

    const loadStations = async () => {
      try {
        const res = await api.get("/quality/stations");

        console.log("QUALITY STATIONS RESPONSE:", res.data);

        const stationData = res?.data?.data;

        setStations(
            Array.isArray(stationData)
            ? stationData.filter(
                (station) => station && station.id != null
                )
            : []
        );
        } catch (error) {
        console.error("QUALITY STATIONS ERROR:", error.response?.data || error);

        message.error(
            error?.response?.data?.message ||
            "Unable to load rework stations"
        );
        } finally {
        setLoadingStations(false);
        }
    };

    loadStations();
  }, [open]);

  const submitRework = async () => {
    if (!serialNo.trim()) {
      message.warning("Scan or enter the product serial number");
      return;
    }

    if (!stationId) {
      message.warning("Select a rework station");
      return;
    }

    if (reworkMode === "START" && !reason.trim()) {
      message.warning("Enter the rework reason");
      return;
    }

    setSubmitting(true);

    try {
      const endpoint =
        reworkMode === "START"
          ? "/quality/rework/start"
          : "/quality/rework/complete";

      const payload = {
        serial_no: serialNo.trim().toUpperCase(),
        station_id: stationId,
        ...(reworkMode === "START" && { reason: reason.trim() }),
      };

      const res = await api.post(endpoint, payload);

      message.success(
        res?.data?.message ||
        (reworkMode === "START"
          ? "Product moved to rework"
          : "Rework completed successfully")
      );

      resetForm();
      onClose();
    } catch (error) {
      message.error(
        error?.response?.data?.message ||
        "Rework operation failed"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const submitReject = async () => {
    if (!serialNo.trim()) {
      message.warning("Scan or enter the product serial number");
      return;
    }

    if (!reason.trim()) {
      message.warning("Enter the rejection reason");
      return;
    }

    setSubmitting(true);

    try {
      const res = await api.post("/quality/reject", {
        serial_no: serialNo.trim().toUpperCase(),
        reason: reason.trim(),
      });

      message.success(
        res?.data?.message || "Product rejected successfully"
      );

      resetForm();
      onClose();
    } catch (error) {
      message.error(
        error?.response?.data?.message ||
        "Product rejection failed"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderActionForm = () => {
    if (!action) return null;

    return (
      <div>
        <Button
          type="text"
          icon={<ArrowLeft size={16} />}
          onClick={resetForm}
          style={{ paddingLeft: 0, marginBottom: 16 }}
        >
          Back to Quality Actions
        </Button>

        <Title level={5}>
          {action === "REWORK" ? "Rework Product" : "Reject Product"}
        </Title>

        {action === "REWORK" && (
          <>
            <Text type="secondary">Rework operation</Text>
            <Radio.Group
              value={reworkMode}
              onChange={(e) => setReworkMode(e.target.value)}
              optionType="button"
              buttonStyle="solid"
              style={{ display: "flex", margin: "10px 0 20px" }}
              options={[
                { label: "Start Rework", value: "START" },
                { label: "Complete Rework", value: "COMPLETE" },
              ]}
            />
          </>
        )}

        <Space direction="vertical" size={6} style={{ width: "100%" }}>
          <Text strong>Product Serial Number</Text>
          <Input
            size="large"
            placeholder="Scan or enter serial number"
            value={serialNo}
            onChange={(e) => setSerialNo(e.target.value)}
            onPressEnter={() => {
              if (action === "REWORK") submitRework();
            }}
            autoFocus
          />

          {action === "REWORK" && (
            <>
              <Text strong style={{ marginTop: 12 }}>
                Rework Station
              </Text>
              <Select
                size="large"
                style={{ width: "100%" }}
                placeholder="Select rework station"
                loading={loadingStations}
                value={stationId}
                onChange={setStationId}
                options={stations.map((station) => ({
                  value: station.id,
                  label: station.name,
                }))}
              />
            </>
          )}

          {(action === "REJECT" || reworkMode === "START") && (
            <>
              <Text strong style={{ marginTop: 12 }}>
                {action === "REJECT" ? "Rejection Reason" : "Rework Reason"}
              </Text>
              <TextArea
                rows={4}
                placeholder="Enter reason..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={500}
                showCount
              />
            </>
          )}
        </Space>

        <Divider />

        {action === "REWORK" ? (
          <Button
            type="primary"
            block
            size="large"
            loading={submitting}
            icon={<CheckCircle size={16} />}
            onClick={submitRework}
          >
            {reworkMode === "START"
              ? "Move to Rework"
              : "Complete Rework"}
          </Button>
        ) : (
          <Popconfirm
            title="Permanently reject this product?"
            description="A rejected product cannot continue through production."
            okText="Reject Product"
            cancelText="Cancel"
            okButtonProps={{ danger: true, loading: submitting }}
            onConfirm={submitReject}
          >
            <Button
              danger
              block
              size="large"
              loading={submitting}
              icon={<Ban size={16} />}
            >
              Reject Product
            </Button>
          </Popconfirm>
        )}
      </div>
    );
  };

  return (
    <Drawer
      title="Quality Actions"
      placement="right"
      width={420}
      open={open}
      onClose={handleClose}
      destroyOnClose
    >
      {!action ? (
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          <Text type="secondary">
            Select an action to manage product quality.
          </Text>

          <Card
            hoverable
            onClick={() => setAction("REWORK")}
            style={{ borderRadius: 10, cursor: "pointer" }}
          >
            <Space align="center" size={14}>
              <Wrench size={26} color="#d97706" />
              <div>
                <Title level={5} style={{ margin: 0 }}>
                  Rework
                </Title>
                <Text type="secondary">
                  Start or complete product rework
                </Text>
              </div>
            </Space>
          </Card>

          <Card
            hoverable
            onClick={() => setAction("REJECT")}
            style={{ borderRadius: 10, cursor: "pointer" }}
          >
            <Space align="center" size={14}>
              <Ban size={26} color="#dc2626" />
              <div>
                <Title level={5} style={{ margin: 0 }}>
                  Reject
                </Title>
                <Text type="secondary">
                  Permanently reject a defective product
                </Text>
              </div>
            </Space>
          </Card>
        </Space>
      ) : (
        renderActionForm()
      )}
    </Drawer>
  );
}
