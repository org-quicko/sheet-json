package in.org.quicko.sheet.beans;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import org.json.JSONArray;
import org.junit.jupiter.api.Test;

/**
 * Unit tests for Table class.
 */
public class TableTest
{

	@Test
	public void testAddRow()
	{
		Table table = new Table();
		JSONArray row = new JSONArray().put("value1");
		table.addRow(row);
		assertEquals(1, table.size());
	}

	@Test
	public void testReplaceRow()
	{
		Table table = new Table();
		JSONArray row = new JSONArray().put("value1");
		table.addRow(row);
		JSONArray newRow = new JSONArray().put("value2");
		table.replaceRow(0, newRow);
		assertEquals("value2", table.getRow(0).getString(0));
	}

	@Test
	public void testRemoveRow()
	{
		Table table = new Table();
		JSONArray row = new JSONArray().put("value1");
		table.addRow(row);
		table.removeRow(0);
		assertEquals(0, table.size());
	}

	@Test
	public void testTableInitialization()
	{
		Block block = new Table();

		assertNotNull(block);
	}

	@Test
	public void testSetNameAndGetName()
	{
		Block obj = new Table();

		assertEquals("table", obj.getName());
	}

	@Test
	public void testSetEntityAndGetEntity()
	{
		Block obj = new Table();

		assertEquals("table", obj.getEntity());
	}

}
