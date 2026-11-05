import { useState, useEffect } from "react";
import { RefreshCw, Bell, ShieldCheck } from "lucide-react";
import { Tooltip } from "antd";

import { shiftInfo as defaultShiftInfo, alertsData } from "../dashboardData";
import { formatDate, formatTime } from "../utils/dashboardHelpers";

const DashboardHeader = ({ shiftInfo = defaultShiftInfo, alertsCount, onRefresh }) => {
  const [now, setNow] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const notificationCount = alertsCount ?? alertsData.length;

  const handleRefresh = () => {
    if (refreshing) return;
    setRefreshing(true);
    if (onRefresh) onRefresh();
    setTimeout(() => setRefreshing(false), 900);
  };

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #E2E8F0",
        borderRadius: 16,
        padding: "18px 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 16,
        boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
      }}
    >
      <style>{`
        .dh-icon-btn {
          width: 40px; height: 40px; border-radius: 10px; border: 1px solid #E2E8F0;
          background: #F8FAFC; display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: background .15s ease;
        }
        .dh-icon-btn:hover { background: #F1F5F9; }
        .dh-refresh-spin { animation: dh-spin 0.9s linear infinite; }
        @keyframes dh-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      <div>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#0F172A" }}>
          Welcome back, Administrator
        </div>
        <div style={{ fontSize: 13, color: "#64748B", marginTop: 3 }}>
          Monitor your PCB production in real time · {formatDate(now)} · {formatTime(now)}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "#ECFDF5",
            border: "1px solid #BBF7D0",
            padding: "7px 14px",
            borderRadius: 20,
          }}
        >
          <ShieldCheck size={15} color="#16A34A" />
          <span style={{ fontSize: 12.5, fontWeight: 600, color: "#16A34A" }}>
            All Systems Operational
          </span>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "6px 14px",
            borderRadius: 10,
            background: "#F8FAFC",
            border: "1px solid #E2E8F0",
          }}
        >
          <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.3 }}>
            Current Shift
          </span>
          <span style={{ fontSize: 13, color: "#0F172A", fontWeight: 600 }}>
            {shiftInfo.currentShift} · {shiftInfo.shiftTime}
          </span>
        </div>

        <Tooltip title="Notifications">
          <div className="dh-icon-btn" style={{ position: "relative" }}>
            <Bell size={18} color="#334155" />
            {notificationCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: -4,
                  right: -4,
                  background: "#DC2626",
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: 700,
                  borderRadius: 20,
                  minWidth: 16,
                  height: 16,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0 3px",
                  border: "2px solid #fff",
                }}
              >
                {notificationCount}
              </span>
            )}
          </div>
        </Tooltip>

        <Tooltip title="Refresh dashboard">
          <div className="dh-icon-btn" onClick={handleRefresh}>
            <RefreshCw size={17} color="#334155" className={refreshing ? "dh-refresh-spin" : ""} />
          </div>
        </Tooltip>
      </div>
    </div>
  );
};

export default DashboardHeader;