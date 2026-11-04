import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { ExcelToSchemaGeneratorUtil, JsonToSchemaGeneratorUtil, ObjectGeneratorUtil } from "../src/utils";

const PACKAGE_DIR = path.resolve(__dirname, "..");

// A sheet-json workbook, as json-to-schema reads it
const ORDERS_JSON = {
	name: "orders_workbook",
	"@entity": "workbook",
	sheets: [
		{
			name: "orders_sheet",
			"@entity": "sheet",
			blocks: [
				{
					name: "orders_table",
					"@entity": "table",
					header: ["order_id", "amount", "is_paid"],
					rows: [["ORD-1", 250.5, true]],
				},
				{
					name: "summary_list",
					"@entity": "list",
					items: [
						{ total_orders: 1 },
						{ generated_by: "system" },
					],
				},
			],
		},
	],
};

let workDir: string;

beforeEach(() => {
	workDir = fs.mkdtempSync(path.join(os.tmpdir(), "sheet-generator-"));
});

afterEach(() => {
	fs.rmSync(workDir, { recursive: true, force: true });
});

/** Writes an Excel schema definition: a block name row, a meta-header row, then one row per field. */
function writeExcelDefinition(rows: unknown[][]): string {
	const file = path.join(workDir, "orders_workbook.xlsx");
	const workbook = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), "orders_sheet");
	XLSX.writeFile(workbook, file);
	return file;
}

/** Finds the schema of the block with the given name, whether inline or in definitions. */
function blockSchema(schema: Record<string, any>, name: string): Record<string, any> {
	const blocks: Record<string, any>[] = [
		...Object.values<Record<string, any>>(schema.definitions ?? {}),
		...schema.properties.sheets.items.oneOf.flatMap((sheet) => sheet.properties.blocks.items.oneOf),
	];
	const block = blocks.find((candidate) => candidate.properties?.name?.enum?.[0] === name);
	if (!block) throw new Error(`No block schema named ${name}`);
	return block;
}

function read(...segments: string[]): string {
	return fs.readFileSync(path.join(workDir, ...segments), "utf-8");
}

describe("JsonToSchemaGeneratorUtil", () => {
	it("describes the workbook, sheet and block names and entities", () => {
		const schema = JsonToSchemaGeneratorUtil.generate(ORDERS_JSON as any);

		expect(schema.properties.name.enum).toEqual(["orders_workbook"]);
		expect(schema.properties["@entity"].enum).toEqual(["workbook"]);
		expect(schema.properties.sheets.items.oneOf[0].properties.name.enum).toEqual(["orders_sheet"]);
	});

	it("derives the table header and column types from the first row", () => {
		const table = blockSchema(JsonToSchemaGeneratorUtil.generate(ORDERS_JSON as any), "orders_table");

		expect(table.properties.header.items.map((item) => item.enum[0])).toEqual(["order_id", "amount", "is_paid"]);
		expect(table.properties.rows.items.items.map((item) => item.type)).toEqual(["string", "number", "boolean"]);
	});

	it("throws for a workbook without sheets", () => {
		expect(() => JsonToSchemaGeneratorUtil.generate({ name: "empty", "@entity": "workbook", sheets: [] })).toThrow(
			"No sheets found",
		);
	});
});

describe("ExcelToSchemaGeneratorUtil", () => {
	it("reads field types, nullability and enums from the definition rows", () => {
		const file = writeExcelDefinition([
			["orders_table"],
			["field", "null_allowed", "type", "enum"],
			["order_id", "No", "string"],
			["status", "No", "string", "paid,unpaid"],
			["amount", "Yes", "number"],
		]);

		const table = blockSchema(ExcelToSchemaGeneratorUtil.generate(file), "orders_table");
		const header = table.properties.header.items.map((item) => item.enum[0]);
		const columns = table.properties.rows.items.items;

		expect(header).toEqual(["order_id", "status", "amount"]);
		expect(columns[1].enum).toEqual(expect.arrayContaining(["paid", "unpaid"]));
		expect([columns[2].type].flat()).toEqual(expect.arrayContaining(["number", "null"]));
	});

	it("names the workbook after the file and treats blocks ending in _list as lists", () => {
		const file = writeExcelDefinition([
			["summary_list"],
			["field", "null_allowed", "type"],
			["total_orders", "No", "number"],
		]);

		const schema = ExcelToSchemaGeneratorUtil.generate(file);

		expect(schema.properties.name.enum).toEqual(["orders_workbook"]);
		expect(blockSchema(schema, "summary_list").properties["@entity"].enum).toEqual(["list"]);
	});
});

describe("ObjectGeneratorUtil", () => {
	function generateOrders(): void {
		ObjectGeneratorUtil.generate(JsonToSchemaGeneratorUtil.generate(ORDERS_JSON as any) as any, workDir);
	}

	it("writes one class per workbook, sheet, table, row and list", () => {
		generateOrders();

		for (const file of [
			"index.ts",
			"workbook/OrdersWorkbook.ts",
			"sheets/orders-sheet/OrdersSheet.ts",
			"tables/orders-table/OrdersTable.ts",
			"tables/orders-table/OrdersRow.ts",
			"lists/summary-list/SummaryList.ts",
		]) {
			expect(fs.existsSync(path.join(workDir, file)), file).toBe(true);
		}
	});

	it("names each class with Reflect metadata and extends the @org-quicko/sheet beans", () => {
		generateOrders();

		const table = read("tables", "orders-table", "OrdersTable.ts");
		expect(table).toContain("from '@org-quicko/sheet'");
		expect(table).toContain("@Reflect.metadata('name', 'orders_table')");
		expect(table).toContain("extends Table");
		expect(read("lists", "summary-list", "SummaryList.ts")).toContain("extends List");
	});

	it("adds typed accessors for each table column and list item", () => {
		generateOrders();

		const row = read("tables", "orders-table", "OrdersRow.ts");
		expect(row).toContain("getOrderId(): string");
		expect(row).toContain("getAmount(): number");
		expect(row).toContain("getIsPaid(): boolean");

		const list = read("lists", "summary-list", "SummaryList.ts");
		expect(list).toContain("valueOfTotalOrders(): number");
		expect(list).toContain("addGeneratedBy(generatedBy: string)");
	});

	it("generates code that compiles against the installed @org-quicko/sheet", () => {
		generateOrders();
		const nodeModules = path.join(PACKAGE_DIR, "node_modules").replaceAll("\\", "/");
		fs.writeFileSync(
			path.join(workDir, "tsconfig.json"),
			JSON.stringify({
				compilerOptions: {
					target: "ES2022",
					module: "esnext",
					moduleResolution: "bundler",
					strict: true,
					noImplicitAny: false,
					experimentalDecorators: true,
					emitDecoratorMetadata: true,
					useDefineForClassFields: false,
					skipLibCheck: true,
					noEmit: true,
					paths: { "*": [`${nodeModules}/*`] },
					types: [`${nodeModules}/reflect-metadata`],
				},
				include: ["**/*.ts"],
			}),
		);

		const tsc = path.join(PACKAGE_DIR, "node_modules", "typescript-native", "bin", "tsc");
		expect(() => execFileSync(process.execPath, [tsc, "-p", workDir], { encoding: "utf-8" })).not.toThrow();
	});
});
