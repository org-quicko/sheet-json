import { describe, expect, it } from "vitest";
import { List } from "../../src/beans/List";
import { Sheet } from "../../src/beans/Sheet";
import { Table } from "../../src/beans/Table";
import { Workbook } from "../../src/beans/Workbook";

@Reflect.metadata("name", "orders_table")
class OrdersTable extends Table {}

@Reflect.metadata("name", "summary_list")
class SummaryList extends List {}

@Reflect.metadata("name", "orders_sheet")
class OrdersSheet extends Sheet {}

@Reflect.metadata("name", "summary_sheet")
class SummarySheet extends Sheet {}

describe("Sheet", () => {
    it("finds blocks by index or by name, ignoring case", () => {
        const sheet = new OrdersSheet();
        const table = new OrdersTable();
        const list = new SummaryList();
        sheet.addBlock(table);
        sheet.addBlock(list);

        expect(sheet.length()).toBe(2);
        expect(sheet.getBlock(1)).toBe(list);
        expect(sheet.getBlock("ORDERS_TABLE")).toBe(table);
        expect(sheet.getBlock("missing")).toBeNull();
        expect(() => sheet.getBlock(2)).toThrow(RangeError);
    });

    it("replaces and removes blocks by name", () => {
        const sheet = new OrdersSheet();
        sheet.addBlock(new OrdersTable());
        sheet.addBlock(new SummaryList());

        const replacement = new OrdersTable();
        sheet.replaceBlock(replacement);
        sheet.removeBlock("summary_list");

        expect(sheet.getBlocks()).toEqual([replacement]);
        expect(sheet.getBlocks()[0]).toBe(replacement);
    });

    it("ignores removing a block it doesn't have", () => {
        const sheet = new OrdersSheet();
        sheet.addBlock(new OrdersTable());

        sheet.removeBlock("missing");

        expect(sheet.length()).toBe(1);
    });
});

describe("Workbook", () => {
    it("finds sheets by index or by name, ignoring case", () => {
        const workbook = new Workbook();
        const orders = new OrdersSheet();
        const summary = new SummarySheet();
        workbook.addSheet(orders);
        workbook.addSheet(summary);

        expect(workbook.length()).toBe(2);
        expect(workbook.getSheet(0)).toBe(orders);
        expect(workbook.getSheet("Summary_Sheet")).toBe(summary);
        expect(workbook.getSheet("missing")).toBeNull();
        expect(() => workbook.getSheet(2)).toThrow(RangeError);
    });

    it("replaces sheets by name", () => {
        const workbook = new Workbook();
        workbook.addSheet(new OrdersSheet());

        const replacement = new OrdersSheet();
        workbook.replaceSheet(replacement);

        expect(workbook.getSheet(0)).toBe(replacement);
    });

    it("removes sheets by name, and throws for a name it doesn't have", () => {
        const workbook = new Workbook();
        workbook.addSheet(new OrdersSheet());
        workbook.addSheet(new SummarySheet());

        workbook.removeSheet("orders_sheet");

        expect(workbook.getSheets().map((sheet) => sheet.getName())).toEqual(["summary_sheet"]);
        expect(() => workbook.removeSheet("missing")).toThrow(RangeError);
    });
});
