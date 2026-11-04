import { describe, expect, it } from "vitest";
import { Item } from "../../src/beans/Item";

describe("Item", () => {
    it("returns its value as a boolean, number or string", () => {
        const item = new Item("count", "42");

        expect(item.getKey()).toBe("count");
        expect(item.getValue()).toBe("42");
        expect(item.getNumberValue()).toBe(42);
        expect(item.getStringValue()).toBe("42");
        expect(item.getBooleanValue()).toBe(true);
    });

    it("returns NaN for a value that isn't a number", () => {
        expect(new Item("name", "first").getNumberValue()).toBeNaN();
    });

    it("treats empty and zero values as false", () => {
        expect(new Item("a", "").getBooleanValue()).toBe(false);
        expect(new Item("b", 0).getBooleanValue()).toBe(false);
        expect(new Item("c", null).getBooleanValue()).toBe(false);
    });

    it("equals another item with the same key, ignoring case, and the same value", () => {
        const item = new Item("Total", 2);

        expect(item.equals(new Item("total", 2))).toBe(true);
        expect(item.equals(new Item("total", "2"))).toBe(false);
        expect(item.equals(new Item("count", 2))).toBe(false);
    });
});
