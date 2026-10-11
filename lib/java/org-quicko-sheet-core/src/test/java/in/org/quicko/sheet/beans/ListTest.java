package in.org.quicko.sheet.beans;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import com.fasterxml.jackson.annotation.JsonTypeName;

import org.junit.jupiter.api.Test;

/**
 * Unit tests for List class.
 */
public class ListTest
{

	@Test
	public void testAddItem() throws Exception
	{
		List list = new List();
		Item item = new Item("key1", "value1");
		list.addItem(item);
		assertEquals(1, list.size());
	}

	@Test
	public void testGetItemByKey() throws Exception
	{
		List list = new List();
		list.addItem("key1", "value1");
		assertNotNull(list.getItem("key1"));
	}

	@Test
	public void testGetItemByIndex() throws Exception
	{
		List list = new List();
		list.addItem("key1", "value1");
		assertNotNull(list.getItem(0));
	}

	@Test
	public void testReplaceItem() throws Exception
	{
		List list = new List();
		Item item = new Item("key1", "value1");
		list.addItem(item);

		Item newItem = new Item("key1", "value2");
		list.replaceItem(0, newItem);

		assertEquals("value2", list.getItem("key1").getValue());
	}

	@Test
	public void testRemoveItemByKey() throws Exception
	{
		List list = new List();
		list.addItem("key1", "value1");
		list.removeItem("key1");
		assertEquals(0, list.size());
	}

	@Test
	public void testRemoveItemByIndex() throws Exception
	{
		List list = new List();
		list.addItem("key1", "value1");
		list.removeItem(0);
		assertEquals(0, list.size());
	}

	@Test
	public void testListInitialization()
	{
		Block block = new List();

		assertNotNull(block);
	}

	@JsonTypeName("test_list")
	class TestList extends List
	{

		/** TODO Auto-generated JavaDoc */
		private static final long serialVersionUID = 1L;

		public String valueOfName()
		{
			return super.getItem("name").getStringValue();
		}

	};

	@Test
	public void testSetNameAndGetName()
	{
		List list = new TestList();

		list.addItem(new Item("name", "test_name"));

		assertEquals("list", list.getEntity());

		assertEquals("test_list", list.getName());

		assertEquals("test_name", ((TestList) list).valueOfName());
	}

	@Test
	public void testSetEntityAndGetEntity()
	{
		Block obj = new List();

		assertEquals("list", obj.getEntity());
	}
}
