 
const models = [
  { code: "MDL1", name: "Model Alpha" },
  { code: "MDL2", name: "Model Beta" },
  { code: "MDL3", name: "Model Gamma" },
  { code: "MDL4", name: "Model Delta" }
];

const parts = [
  "Brake Pad",
  "Oil Seal",
  "Clutch Plate",
  "Fuel Pump",
  "Shock Absorber",
  "Alternator"
];

const causeCodes = ["CC1", "CC2", "CC3", "CC4"];
const natureCodes = ["NC1", "NC2", "NC3"];
const systems = ["SYS1", "SYS2", "SYS3"];

const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

const randomNumber = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const randomDate = (start, end) =>
  new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

export const generateWarrantyMockData = (count = 100) => {
  const data = [];

  for (let i = 1; i <= count; i++) {
    const model = randomItem(models);
    const part = randomItem(parts);

    const productionDate = randomDate(
      new Date("2021-01-01"),
      new Date("2024-12-31")
    );

    const repairDate = randomDate(
      new Date(productionDate.getTime() + 30 * 24 * 60 * 60 * 1000),
      new Date(productionDate.getTime() + 700 * 24 * 60 * 60 * 1000)
    );

    const usedMonths = Math.floor(
      (repairDate - productionDate) / (30 * 24 * 60 * 60 * 1000)
    );

    const partCost = randomNumber(2000, 15000);
    const laborCost = randomNumber(500, 5000);
    const subletCost = randomNumber(0, 3000);

    data.push({
      Row_No: i,
      HK: `HK${String(i).padStart(8, "0")}`,
      Domestic_Export: Math.random() > 0.5 ? "Domestic" : "Export",
      System_Code: randomItem(systems),
      Period_Code: `${productionDate.getFullYear()}Q${Math.ceil(
        (productionDate.getMonth() + 1) / 3
      )}`,
      Sequence_No: i,
      Order_Type: ["A", "B", "C"][randomNumber(0, 2)],
      Order_Description: `${part} failure`,
      VIN: `VIN${String(i).padStart(20, "0")}`,
      Plant_Code: ["A", "B", "C"][randomNumber(0, 2)],

      Model_Code: model.code,
      Model_Name: model.name,

      Part_Number: `PN${String(randomNumber(1, 9999)).padStart(6, "0")}`,
      Part_Name: part,
      Old_Part_Number: `OPN${String(randomNumber(1, 9999)).padStart(6, "0")}`,

      Cause_Code: randomItem(causeCodes),
      Nature_Code: randomItem(natureCodes),

      Production_Date: productionDate.toISOString(),
      Repair_Date: repairDate.toISOString(),
      Sales_Date: productionDate.toISOString(),

      Used_Month: usedMonths,
      Mileage: randomNumber(1000, 120000),

      Supply_Ratio: Math.random().toFixed(2),
      Burden_Ratio: Math.random().toFixed(2),
      Apply_Ratio: Math.random().toFixed(2),

      Part_Cost: partCost,
      Labor_Cost: laborCost,
      Sublet_Cost: subletCost,
      Total_Cost: partCost + laborCost + subletCost
    });
  }

  return data;
};
