export const shiftInfo = {
  currentShift: "Shift A",
  shiftTime: "06:00 AM - 02:00 PM",
  supervisor: "Rajesh Kumar",
  nextShift: "Shift B (02:00 PM - 10:00 PM)",
};

export const kpiData = [
  {
    id: 1,
    title: "Today's Production",
    value: 2560,
    unit: "PCB",
    trendValue: 8.5,
    trendDirection: "up",
    isPositive: true,
    icon: "Boxes",
    accent: "#2563EB",
  },
  {
    id: 2,
    title: "Completed PCB",
    value: 2018,
    unit: "PCB",
    trendValue: 11,
    trendDirection: "up",
    isPositive: true,
    icon: "CheckCircle2",
    accent: "#16A34A",
  },
  {
    id: 3,
    title: "Work In Progress",
    value: 542,
    unit: "PCB",
    trendValue: 3.2,
    trendDirection: "up",
    isPositive: true,
    icon: "Activity",
    accent: "#F59E0B",
  },
  {
    id: 4,
    title: "Rejected",
    value: 12,
    unit: "PCB",
    trendValue: 1.1,
    trendDirection: "down",
    isPositive: true,
    icon: "XCircle",
    accent: "#DC2626",
  },
  {
    id: 5,
    title: "Efficiency",
    value: 98.7,
    unit: "%",
    trendValue: 2.4,
    trendDirection: "up",
    isPositive: true,
    icon: "Gauge",
    accent: "#7C3AED",
  },
  {
    id: 6,
    title: "Today's Target",
    value: 3000,
    unit: "PCB",
    trendValue: null,
    trendDirection: null,
    isPositive: null,
    icon: "Target",
    accent: "#0F172A",
  },
];

export const summaryData = {
  runningLines: 6,
  totalLines: 8,
  idleLines: 2,
  machineUtilization: 87,
  operatorsWorking: 42,
  pendingPCB: 156,
  criticalAlerts: 3,
};

export const factoryOverviewData = {
  factoryHealth: 94,
  shiftLabel: "Shift A - 06:00 AM to 02:00 PM",
  currentProduction: 2560,
  targetProduction: 3000,
  machineUtilization: 87,
  overallEfficiency: 98.7,
};

export const productionFlowData = [
  { id: 1, stage: "QR Applied", code: "QR", count: 2680, status: "Active", progress: 100 },
  { id: 2, stage: "SMT Line", code: "SMT", count: 2560, status: "Active", progress: 92 },
  { id: 3, stage: "AI Process", code: "AI", count: 2340, status: "Active", progress: 84 },
  { id: 4, stage: "DIP MI Line", code: "DIP", count: 2140, status: "Active", progress: 76 },
  { id: 5, stage: "Packaging", code: "PKG", count: 2018, status: "Active", progress: 70 },
];

export const pipelineStages = [
  { id: 1, name: "SMT Line", running: 320, waiting: 150, completed: 2018, rejected: 5, progress: 92 },
  { id: 2, name: "AI Process", running: 210, waiting: 90, completed: 1870, rejected: 4, progress: 84 },
  { id: 3, name: "DIP MI Line", running: 180, waiting: 70, completed: 1650, rejected: 2, progress: 76 },
  { id: 4, name: "Packaging", running: 95, waiting: 40, completed: 2018, rejected: 1, progress: 70 },
];

export const lineStatusData = [
  { id: 1, lineName: "SMT Line 1", type: "SMT", status: "Running", operator: "Amit Sharma", todayOutput: 850 },
  { id: 2, lineName: "SMT Line 2", type: "SMT", status: "Fault", operator: "Suresh Yadav", todayOutput: 410 },
  { id: 3, lineName: "AI Line 1", type: "AI", status: "Running", operator: "Priya Singh", todayOutput: 760 },
  { id: 4, lineName: "DIP MI Line 1", type: "DIP", status: "Running", operator: "Vikas Patel", todayOutput: 640 },
  { id: 5, lineName: "DIP MI Line 2", type: "DIP", status: "Idle", operator: "-", todayOutput: 0 },
  { id: 6, lineName: "Packaging Line 1", type: "Packaging", status: "Running", operator: "Neha Verma", todayOutput: 900 },
  { id: 7, lineName: "SMT Line 3", type: "SMT", status: "Maintenance", operator: "-", todayOutput: 0 },
  { id: 8, lineName: "AI Line 2", type: "AI", status: "Running", operator: "Rohit Gupta", todayOutput: 580 },
];

export const recentActivityData = [
  { id: 1, qrCode: "PGEL2407A0562", model: "AC Indoor 1.5T", stage: "PCB Soldering", line: "SMT Line 1", operator: "Amit Sharma", time: "2 mins ago", status: "In Progress" },
  { id: 2, qrCode: "PGEL2407A0561", model: "AC Outdoor 2T", stage: "AI Output Scanning", line: "AI Line 1", operator: "Priya Singh", time: "4 mins ago", status: "Completed" },
  { id: 3, qrCode: "PGEL2407A0560", model: "AC Indoor 1T", stage: "Programming", line: "DIP MI Line 1", operator: "Vikas Patel", time: "6 mins ago", status: "In Progress" },
  { id: 4, qrCode: "PGEL2407A0559", model: "AC Indoor 1.5T", stage: "SMI Input", line: "SMT Line 2", operator: "Suresh Yadav", time: "8 mins ago", status: "Rejected" },
  { id: 5, qrCode: "PGEL2407A0558", model: "AC Outdoor 2T", stage: "Packaging", line: "Packaging Line 1", operator: "Neha Verma", time: "11 mins ago", status: "Completed" },
  { id: 6, qrCode: "PGEL2407A0557", model: "AC Indoor 1T", stage: "FCT / NOP", line: "DIP MI Line 1", operator: "Vikas Patel", time: "14 mins ago", status: "In Progress" },
  { id: 7, qrCode: "PGEL2407A0556", model: "AC Indoor 1.5T", stage: "PCB Grouping", line: "SMT Line 1", operator: "Amit Sharma", time: "17 mins ago", status: "Pending" },
  { id: 8, qrCode: "PGEL2407A0555", model: "AC Outdoor 2T", stage: "AI Input Scanning", line: "AI Line 2", operator: "Rohit Gupta", time: "20 mins ago", status: "Completed" },
];

export const alertsData = [
  { id: 1, type: "Machine Fault", message: "SMT Line 2 - Conveyor motor overheating", time: "5 mins ago", severity: "critical" },
  { id: 2, type: "Delayed PCB", message: "12 PCBs delayed at AI Output Scanning beyond SLA", time: "9 mins ago", severity: "warning" },
  { id: 3, type: "Pending Scan", message: "8 units waiting for QR scan at DIP MI Input", time: "15 mins ago", severity: "warning" },
  { id: 4, type: "Rejected PCB", message: "PGEL2407A0559 rejected at SMI Input - solder defect", time: "18 mins ago", severity: "critical" },
  { id: 5, type: "System Warning", message: "Scanner at SMT Line 3 offline for maintenance", time: "26 mins ago", severity: "info" },
];

export const hourlyProductionData = [
  { hour: "06:00", target: 250, actual: 230 },
  { hour: "07:00", target: 250, actual: 245 },
  { hour: "08:00", target: 250, actual: 260 },
  { hour: "09:00", target: 250, actual: 240 },
  { hour: "10:00", target: 250, actual: 255 },
  { hour: "11:00", target: 250, actual: 265 },
  { hour: "12:00", target: 250, actual: 210 },
  { hour: "13:00", target: 250, actual: 235 },
  { hour: "14:00", target: 250, actual: 220 },
];

export const dailyProductionData = [
  { day: "Mon", produced: 2820, target: 3000 },
  { day: "Tue", produced: 2950, target: 3000 },
  { day: "Wed", produced: 2680, target: 3000 },
  { day: "Thu", produced: 3040, target: 3000 },
  { day: "Fri", produced: 2910, target: 3000 },
  { day: "Sat", produced: 2560, target: 3000 },
  { day: "Sun", produced: 1420, target: 1500 },
];

export const efficiencyTrendData = [
  { day: "Mon", efficiency: 96.2 },
  { day: "Tue", efficiency: 97.8 },
  { day: "Wed", efficiency: 94.5 },
  { day: "Thu", efficiency: 98.9 },
  { day: "Fri", efficiency: 97.1 },
  { day: "Sat", efficiency: 98.7 },
  { day: "Sun", efficiency: 95.4 },
];

export const stageDistributionData = [
  { name: "SMT", value: 2560, color: "#2563EB" },
  { name: "AI Process", value: 2340, color: "#7C3AED" },
  { name: "DIP MI", value: 2140, color: "#F59E0B" },
  { name: "Packaging", value: 2018, color: "#16A34A" },
];