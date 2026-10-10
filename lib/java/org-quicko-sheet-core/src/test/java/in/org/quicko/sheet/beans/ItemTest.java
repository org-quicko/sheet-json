package in.org.quicko.sheet.beans;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

/**
 * Unit tests for Item class.
 */
public class ItemTest
{

	@Test
	public void testGetKey()
	{
		Item item = new Item("key1", "value1");
		assertEquals("key1", item.getKey());
	}

	@Test
	public void testGetValue()
	{
		Item item = new Item("key1", "value1");
		assertEquals("value1", item.getValue());
	}

	@Test
	public void testEquals()
	{
		Item item1 = new Item("key1", "value1");
		Item item2 = new Item("key1", "value1");
		assertTrue(item1.equals(item2));
	}

	@Test
	public void testNotEquals()
	{
		Item item1 = new Item("key1", "value1");
		Item item2 = new Item("key2", "value2");
		assertFalse(item1.equals(item2));
	}
}
