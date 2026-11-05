export const linesData = [
  { id: 1, lineName: "SMT Line 1", lineCode: "SMT-01", plant: "NGM", capacity: 500, status: "Active" },
  { id: 2, lineName: "SMT Line 2", lineCode: "SMT-02", plant: "PGTL", capacity: 450, status: "Active" },
  { id: 3, lineName: "AI Line 1", lineCode: "AI-01", plant: "NGM", capacity: 600, status: "Active" },
  { id: 4, lineName: "DIP MI Line 1", lineCode: "DIP-01", plant: "Triumph", capacity: 400, status: "Inactive" },
  { id: 5, lineName: "SMT Line 3", lineCode: "SMT-03", plant: "Vihaan", capacity: 480, status: "Draft" },
];

export const stagesData = [
  { id: 1, stageName: "PCB Grouping", stageCode: "PCB-GRP", lineType: "SMT", sequence: 1, status: "Active" },
  { id: 2, stageName: "SMI Input", stageCode: "SMI-IN", lineType: "SMT", sequence: 2, status: "Active" },
  { id: 3, stageName: "PCB Soldering", stageCode: "PCB-SLD", lineType: "SMT", sequence: 3, status: "Active" },
  { id: 4, stageName: "SMI Output", stageCode: "SMI-OUT", lineType: "SMT", sequence: 4, status: "Active" },
  { id: 5, stageName: "AI Input Scanning", stageCode: "AI-IN", lineType: "AI", sequence: 5, status: "Active" },
  { id: 6, stageName: "AI Output Scanning", stageCode: "AI-OUT", lineType: "AI", sequence: 6, status: "Active" },
  { id: 7, stageName: "Programming Stage", stageCode: "PRG", lineType: "DIP", sequence: 7, status: "Active" },
  { id: 8, stageName: "FCT / NOP Stage", stageCode: "FCT-NOP", lineType: "DIP", sequence: 8, status: "Draft" },
  { id: 9, stageName: "Output / Packaging", stageCode: "PKG", lineType: "DIP", sequence: 9, status: "Active" },
];

export const modelsData = [
  { id: 1, modelName: "AC Indoor Unit - 1.5T", modelCode: "IDU-15T", description: "1.5 Ton indoor PCB unit", status: "Active" },
  { id: 2, modelName: "AC Outdoor Unit - 2T", modelCode: "ODU-2T", description: "2 Ton outdoor PCB unit", status: "Active" },
  { id: 3, modelName: "AC Indoor Unit - 1T", modelCode: "IDU-1T", description: "1 Ton indoor PCB unit", status: "Draft" },
];

export const qrMasterData = [
  { id: 1, qrPrefix: "PGEL", qrLength: 22, qrFormat: "SAP10+MM2+YY2+WW2+SER6", autoGenerate: true, status: "Active" },
  { id: 2, qrPrefix: "NGM", qrLength: 18, qrFormat: "SAP8+DATE6+SER4", autoGenerate: false, status: "Inactive" },
];

export const plantOptions = ["NGM", "PGTL", "Triumph", "Vihaan", "D111"];
export const lineTypeOptions = ["SMT", "AI", "DIP"];

export const categoryData = [
  {
    id: 1,
    categoryName: "PCB Assembly",
    categoryDescription: "Surface Mount PCB Components",
    status: "Active",
  },
  {
    id: 2,
    categoryName: "Programming",
    categoryDescription: "Firmware Programming",
    status: "Active",
  },
];

export const productData = [
  {
    id: 1,
    category_id: 1,
    categoryName: "PCB Assembly",
    name: "Outdoor PCB",
    description: "Outdoor AC PCB",
    remarks: "High Priority",
    status: "Active",
    createdDate: "15 Jul 2026",
  },
  {
    id: 2,
    category_id: 2,
    categoryName: "Programming",
    name: "Indoor PCB",
    description: "Indoor AC PCB",
    remarks: "Normal",
    status: "Active",
    createdDate: "15 Jul 2026",
  },
];

