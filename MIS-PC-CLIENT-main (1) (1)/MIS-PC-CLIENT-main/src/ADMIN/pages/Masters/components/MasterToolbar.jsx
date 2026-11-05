import { Search } from "lucide-react";
import { Input, Select } from "antd";

const MasterToolbar = ({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  statusValue,
  onStatusChange,
  extra,
}) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "14px 20px",
        borderTop: "1px solid #F1F5F9",
        borderBottom: "1px solid #F1F5F9",
        background: "#FBFCFD",
        flexWrap: "wrap",
      }}
    >
      <Input
        placeholder={searchPlaceholder}
        prefix={<Search size={15} color="#94A3B8" />}
        value={searchValue}
        onChange={(e) => onSearchChange(e.target.value)}
        style={{ maxWidth: 260, borderRadius: 10, fontSize: 13 }}
        allowClear
      />
      <Select
        value={statusValue}
        onChange={onStatusChange}
        style={{ width: 150 }}
        options={[
          { value: "All", label: "All Status" },
          { value: "Active", label: "Active" },
          { value: "Inactive", label: "Inactive" },
          { value: "Draft", label: "Draft" },
        ]}
      />
      {extra}
    </div>
  );
};

export default MasterToolbar;