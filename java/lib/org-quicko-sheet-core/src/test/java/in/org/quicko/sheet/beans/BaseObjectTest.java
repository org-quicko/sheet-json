
package in.org.quicko.sheet.beans;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.fasterxml.jackson.annotation.JsonTypeName;

import org.junit.jupiter.api.Test;

/**
 * Unit tests for BaseObject class.
 */
public class BaseObjectTest
{

	@JsonTypeName("test_base_object")
	class TestBaseObject extends BaseObject
	{

		/** TODO Auto-generated JavaDoc */
		private static final long serialVersionUID = 1L;

		TestBaseObject()
		{
			super("test_base_object");
		}
	};

	@Test
	public void testSetNameAndGetgetName()
	{
		BaseObject obj = new TestBaseObject();

		assertEquals("test_base_object", obj.getName());
	}

	@Test
	public void testSetMetadataAndGetMetadata()
	{
		BaseObject obj = new TestBaseObject();

		obj.getMetadata().put("key", "value");

		assertEquals("value", obj.getMetadata().get("key"));
	}

	@Test
	public void testSetEntityAndGetEntity()
	{
		BaseObject obj = new TestBaseObject();

		assertEquals("test_base_object", obj.getEntity());
	}
}
