package in.org.quicko.sheet.beans;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import com.fasterxml.jackson.annotation.JsonTypeName;

import org.junit.jupiter.api.Test;

/**
 * Unit tests for Block class.
 */
public class BlockTest
{

	@JsonTypeName("test_block")
	class TestBlock extends Block
	{

		/** TODO Auto-generated JavaDoc */
		private static final long serialVersionUID = 1L;

		TestBlock()
		{
			super("block");
		}
	};

	@Test
	public void testBlockInitialization()
	{
		Block block = new TestBlock();

		assertNotNull(block);
	}

	@Test
	public void testSetNameAndGetName()
	{
		Block obj = new TestBlock();

		assertEquals("test_block", obj.getName());
	}

	@Test
	public void testSetEntityAndGetEntity()
	{
		Block obj = new TestBlock();

		assertEquals("block", obj.getEntity());
	}
}
