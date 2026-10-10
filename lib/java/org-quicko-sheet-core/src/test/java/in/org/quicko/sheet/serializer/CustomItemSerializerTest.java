package in.org.quicko.sheet.serializer;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.json.JsonMapper;
import tools.jackson.databind.module.SimpleModule;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import in.org.quicko.sheet.beans.Item;

class CustomItemSerializerTest
{

	private JsonMapper mapper;

	@BeforeEach
	void setUp()
	{
		SimpleModule module = new SimpleModule();
		module.addSerializer(Item.class, new CustomItemSerializer());
		mapper = new in.org.quicko.sheet.mapper.JsonMapper().rebuild().addModule(module).build();
	}

	@Test
	void testSerializeItem() throws JacksonException
	{
		// Arrange
		Item item = new Item("id", "123");

		// Act
		String json = mapper.writeValueAsString(item);

		// Assert
		assertEquals("{\"id\":\"123\"}", json);
	}

	@Test
	void testSerializeItemWithNumericValue() throws JacksonException
	{
		// Arrange
		Item item = new Item("count", 42);

		// Act
		String json = mapper.writeValueAsString(item);

		// Assert
		assertEquals("{\"count\":42}", json);
	}

	@Test
	void testSerializeItemWithBooleanValue() throws JacksonException
	{
		// Arrange
		Item item = new Item("active", true);

		// Act
		String json = mapper.writeValueAsString(item);

		// Assert
		assertEquals("{\"active\":true}", json);
	}

	@Test
	void testSerializeItemWithNullValue() throws JacksonException
	{

		Object value = null;

		// Arrange
		Item item = new Item("data", value);

		// Act
		String json = mapper.writeValueAsString(item);

		// Assert
		assertEquals("{\"data\":null}", json);
	}

	@Test
	void testSerializeItemWithNullKey()
	{
		// Arrange
		Item item = new Item(null, "value");

		// Act & Assert
		Exception exception = assertThrows(JacksonException.class, () -> {
			mapper.writeValueAsString(item);
		});

		// Verify the exception contains the expected message
		String expectedMessage = "Cannot serialize Item with null key";
		String actualMessage = exception.getMessage();
		assert (actualMessage.contains(expectedMessage));
	}

	@ParameterizedTest
	@ValueSource(strings = {"key1", "key_with_underscore", "complex-key-123"})
	void testSerializeItemWithDifferentKeyFormats(String key) throws JacksonException
	{
		// Arrange
		Item item = new Item(key, "test-value");

		// Act
		String json = mapper.writeValueAsString(item);

		// Assert
		assertEquals("{\"" + key + "\":\"test-value\"}", json);
	}

	@Test
	void testSerializeItemWithComplexValue() throws JacksonException
	{
		// Arrange
		Item nestedItem = new Item("nested", "value");
		Item item = new Item("complex", nestedItem);

		// Act
		String json = mapper.writeValueAsString(item);

		// Assert
		// The nested item should be serialized as a JSON object
		assertEquals("{\"complex\":{\"nested\":\"value\"}}", json);
	}
}
