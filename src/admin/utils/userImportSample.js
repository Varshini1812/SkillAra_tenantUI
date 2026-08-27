export const USER_IMPORT_SAMPLE_HEADERS = [
  "FirstName",
  "LastName",
  "Email",
  "Role",
  "Phone",
  "Department",
  "Password",
];

export function buildUserImportSampleCsv({ roleName = "", departmentName = "" } = {}) {
  const header = USER_IMPORT_SAMPLE_HEADERS.join(",");
  const rows = [
    ["Jane", "Doe", "jane.doe@example.com", roleName, "", departmentName, ""],
    ["John", "Smith", "john.smith@example.com", roleName, "", departmentName, ""],
  ];
  return `${header}\n${rows.map((row) => row.join(",")).join("\n")}\n`;
}

export function downloadUserImportSample(options = {}) {
  const blob = new Blob([buildUserImportSampleCsv(options)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "user-import-sample.csv";
  link.click();
  URL.revokeObjectURL(url);
}
