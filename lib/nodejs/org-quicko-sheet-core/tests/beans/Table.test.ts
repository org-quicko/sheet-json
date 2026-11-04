import { beforeEach, describe, expect, it } from "@jest/globals";
import { JSONArray } from "@org-quicko/core";
import { Table } from "../../src/beans/Table";

describe("Table", () => {
    let table: Table;

    beforeEach(() => {
        table = new Table();
        table.setHeader(new JSONArray(["id", "name"]));
        table.addRows([new JSONArray([1, "first"]), new JSONArray([2, "second"])]);
    });

    it("starts with an empty header and no rows", () => {
        const empty = new Table();

        expect(empty.getHeader()).toEqual([]);
        expect(empty.length()).toBe(0);
        expect(empty.getEntity()).toBe("table");
    });

    it("returns a copy of a row, so changing it leaves the table as it was", () => {
        const row = table.getRow(0);
        row.push("extra");

        expect(table.getRow(0)).toEqual([1, "first"]);
    });

    it("throws for a row index past the end", () => {
        expect(() => table.getRow(2)).toThrow(RangeError);
        expect(() => table.removeRow(2)).toThrow(RangeError);
    });

    it("adds, replaces, removes and pops rows", () => {
        table.addRow(new JSONArray([3, "third"]));
        table.replaceRow(0, new JSONArray([10, "tenth"]));
        table.removeRow(1);
        table.popRow();

        expect(table.getRows()).toEqual([[10, "tenth"]]);
    });

    it("builds one column per header, filling missing cells with null", () => {
        table.addRow(new JSONArray([3]));

        const columns = table.getColumns();

        expect(columns).toHaveLength(2);
        expect(columns[0].getColumnHeader()).toBe("id");
        expect([...columns[0]]).toEqual(["id", 1, 2, 3]);
        expect([...columns[1]]).toEqual(["name", "first", "second", undefined]);
    });

    it("has no columns without a header", () => {
        expect(new Table().getColumns()).toEqual([]);
    });
});
