import { describe, expect, it } from "vitest";
import { ConverterException, JSONArray } from "@org-quicko/core";
import * as XLSX from "xlsx";
import { Item } from "../../src/beans/Item";
import { List } from "../../src/beans/List";
import { Sheet } from "../../src/beans/Sheet";
import { Table } from "../../src/beans/Table";
import { Workbook } from "../../src/beans/Workbook";
import { WorkbookConverter } from "../../src/converters/WorkbookConverter";

// 2026-11-03T20:15:00Z, which is 2026-11-04 01:45 in Asia/Kolkata (UTC+05:30)
const EPOCH = Date.UTC(2026, 10, 3, 20, 15, 0);

@Reflect.metadata("name", "orders_table")
class OrdersTable extends Table {}

@Reflect.metadata("name", "summary_list")
class SummaryList extends List {}

@Reflect.metadata("name", "com.example.reports.orders_sheet")
class OrdersSheet extends Sheet {}

@Reflect.metadata("name", "orders_workbook")
class OrdersWorkbook extends Workbook {}

function buildWorkbook(): OrdersWorkbook {
    const table = new OrdersTable();
    table.setHeader(new JSONArray(["id", "name", "created_at_epoch"]));
    table.addRow(new JSONArray([1, "first", EPOCH]));
    table.addRow(new JSONArray([2, "second", null]));

    const list = new SummaryList();
    list.addItem(new Item("total", 2));
    list.addItem(new Item("generated_at_epoch", EPOCH));

    const sheet = new OrdersSheet();
    sheet.addBlock(table);
    sheet.addBlock(list);

    const workbook = new OrdersWorkbook();
    workbook.addSheet(sheet);
    return workbook;
}

function cells(xlsx: XLSX.WorkBook, sheetName: string): unknown[][] {
    return XLSX.utils.sheet_to_json(xlsx.Sheets[sheetName], { header: 1, raw: true, defval: null, blankrows: true });
}

function toBuffer(rows: unknown[][]): Buffer {
    const xlsx = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(xlsx, XLSX.utils.aoa_to_sheet(rows), "Sheet1");
    return XLSX.write(xlsx, { type: "buffer", bookType: "xlsx" });
}

describe("WorkbookConverter", () => {
    const converter = new WorkbookConverter();

    describe("toXlsx", () => {
        it("names the sheet after the last segment of the sheet name", () => {
            const xlsx = converter.toXlsx(buildWorkbook());

            expect(xlsx.SheetNames).toEqual(["orders_sheet"]);
            expect(xlsx.Props?.Title).toBe("orders_workbook");
        });

        it("keeps only the last 31 characters of a long sheet name", () => {
            @Reflect.metadata("name", "a_sheet_name_that_is_longer_than_thirty_one_chars")
            class LongSheet extends Sheet {}

            const workbook = new OrdersWorkbook();
            workbook.addSheet(new LongSheet());

            const [name] = converter.toXlsx(workbook).SheetNames;
            expect(name).toHaveLength(31);
            expect("a_sheet_name_that_is_longer_than_thirty_one_chars".endsWith(name)).toBe(true);
        });

        it("writes a table and a list with two blank lines between them", () => {
            const rows = cells(converter.toXlsx(buildWorkbook()), "orders_sheet");

            expect(rows[0]).toEqual(["orders_table", null, null]);
            expect(rows[1]).toEqual(["id", "name", "created_at_epoch"]);
            expect(rows[2][0]).toBe(1);
            expect(rows[3]).toEqual([2, "second", null]);
            expect(rows[4]).toEqual([null, null, null]);
            expect(rows[5]).toEqual([null, null, null]);
            expect(rows[6][0]).toBe("summary_list");
            expect(rows[7].slice(0, 2)).toEqual(["total", 2]);
        });

        it("prints epoch table cells as ISO dates in Asia/Kolkata", () => {
            const rows = cells(converter.toXlsx(buildWorkbook()), "orders_sheet");

            expect(rows[2]).toEqual([1, "first", "2026-11-04T01:45:00+05:30"]);
        });

        it("prints epoch list values as ISO dates with milliseconds in Asia/Kolkata", () => {
            const rows = cells(converter.toXlsx(buildWorkbook()), "orders_sheet");

            expect(rows[8].slice(0, 2)).toEqual(["generated_at_epoch", "2026-11-04T01:45:00.000+05:30"]);
        });
    });

    describe("toWorkbook", () => {
        it("reads back the table rows and list items written by toXlsx", () => {
            const buffer = XLSX.write(converter.toXlsx(buildWorkbook()), { type: "buffer", bookType: "xlsx" });

            const workbook = converter.toWorkbook(buffer, OrdersWorkbook);
            const [table, list] = workbook.getSheet(0).getBlocks();

            expect(table).toBeInstanceOf(Table);
            expect((table as Table).getHeader()).toEqual(["id", "name", "created_at_epoch"]);
            expect((table as Table).getRow(0)).toEqual([1, "first", EPOCH]);
            expect((table as Table).getRow(1)).toEqual([2, "second", null]);

            expect(list).toBeInstanceOf(List);
            const items = (list as List).getItems().map((item) => [item.getKey(), item.getValue()]);
            expect(items).toEqual([
                ["total", 2],
                ["generated_at_epoch", EPOCH],
            ]);
        });

        it("reads MM/dd/yyyy cells as midnight in Asia/Kolkata", () => {
            const buffer = toBuffer([["dates_table"], ["joined_on"], ["11/04/2026"]]);

            const table = converter.toWorkbook(buffer, Workbook).getSheet(0).getBlock(0) as Table;

            // 2026-11-04T00:00:00+05:30
            expect(table.getRow(0)).toEqual([Date.UTC(2026, 10, 3, 18, 30, 0)]);
        });

        it("keeps text that isn't a valid date as text", () => {
            const buffer = toBuffer([["dates_table"], ["joined_on", "created_epoch"], ["13/40/2026", "yesterday"]]);

            const table = converter.toWorkbook(buffer, Workbook).getSheet(0).getBlock(0) as Table;

            expect(table.getRow(0)).toEqual(["13/40/2026", "yesterday"]);
        });

        it("splits blocks on blank lines and treats names ending in 'list' as lists", () => {
            const buffer = toBuffer([
                ["first_table"],
                ["a"],
                [1],
                [],
                ["details_list"],
                ["key", "value"],
            ]);

            const blocks = converter.toWorkbook(buffer, Workbook).getSheet(0).getBlocks();

            expect(blocks).toHaveLength(2);
            expect(blocks[0]).toBeInstanceOf(Table);
            expect(blocks[1]).toBeInstanceOf(List);
            expect((blocks[1] as List).getItems().map((item) => item.getValue())).toEqual(["value"]);
        });

        it("reads a table with a header and no rows as empty", () => {
            const buffer = toBuffer([["empty_table"], ["a", "b"]]);

            const table = converter.toWorkbook(buffer, Workbook).getSheet(0).getBlock(0) as Table;

            expect(table.getHeader()).toEqual(["a", "b"]);
            expect(table.length()).toBe(0);
        });

        it("is what Workbook.fromXlsx and Workbook.toXlsx use", () => {
            const xlsx = Workbook.toXlsx(buildWorkbook());
            const workbook = Workbook.fromXlsx(XLSX.write(xlsx, { type: "buffer", bookType: "xlsx" }));

            expect(xlsx.SheetNames).toEqual(["orders_sheet"]);
            expect((workbook.getSheet(0).getBlock(0) as Table).getRow(0)).toEqual([1, "first", EPOCH]);
        });

        it("throws a ConverterException for a block whose first cell isn't text", () => {
            const buffer = toBuffer([[123], ["a"], [1]]);

            expect(() => converter.toWorkbook(buffer, Workbook)).toThrow(ConverterException);
        });
    });
});
