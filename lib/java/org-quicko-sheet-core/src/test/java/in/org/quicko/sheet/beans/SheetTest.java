package in.org.quicko.sheet.beans;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import org.junit.jupiter.api.Test;

/**
 * Unit tests for Sheet class.
 */
public class SheetTest
{

	@Test
	public void testAddBlock()
	{
		Sheet sheet = new Sheet();
		Block block = new List();

		sheet.addBlock(block);
		assertEquals(1, sheet.size());
	}

	@Test
	public void testGetBlockByName()
	{
		Sheet sheet = new Sheet();
		Block block = new List();

		sheet.addBlock(block);
		assertNotNull(sheet.getBlock("list"));

	}

	/*
	 * @Test public void testGetBlockByName() { if (super.getBlock("movie_summary_list") == null) { super.addBlock(new
	 * MovieSummaryList()); } return (MovieSummaryList) super.getBlock("movie_summary_list"); }
	 */

	@Test
	public void testRemoveBlock()
	{
		Sheet sheet = new Sheet();
		Block block = new Table();

		sheet.addBlock(block);
		sheet.removeBlock("table");
		assertEquals(0, sheet.size());
	}

	@Test
	public void testSheetInitialization()
	{
		Sheet sheet = new Sheet();

		assertNotNull(sheet);
	}

	@Test
	public void testSetNameAndGetName()
	{
		Sheet sheet = new Sheet();

		assertEquals("sheet", sheet.getName());
	}

	@Test
	public void testSetEntityAndGetEntity()
	{
		Sheet sheet = new Sheet();

		assertEquals("sheet", sheet.getEntity());
	}

}
