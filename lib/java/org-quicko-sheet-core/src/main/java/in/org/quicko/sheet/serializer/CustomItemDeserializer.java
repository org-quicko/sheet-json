package in.org.quicko.sheet.serializer;

import tools.jackson.core.JacksonException;
import tools.jackson.core.JsonParser;
import tools.jackson.core.JsonToken;
import tools.jackson.databind.DeserializationContext;
import tools.jackson.databind.ValueDeserializer;

import in.org.quicko.sheet.beans.Item;

public class CustomItemDeserializer extends ValueDeserializer<Item>
{

	@Override
	public Item deserialize(JsonParser p, DeserializationContext ctxt) throws JacksonException
	{
		String key = null;
		Object value = null;

		// If we're at the start of an object, advance to the first field name.
		if (p.currentToken() == JsonToken.START_OBJECT)
		{
			p.nextToken();
		}

		// Process each field
		while (p.currentToken() == JsonToken.PROPERTY_NAME)
		{
			key = p.currentName(); // get the current key name
			p.nextToken(); // move to the value token

			JsonToken token = p.currentToken();
			switch (token)
			{
				case VALUE_NUMBER_INT:
				case VALUE_NUMBER_FLOAT:
					// Use BigDecimal for all number point values.
					value = p.getDecimalValue();
					break;
				case VALUE_STRING:
					value = p.getString();
					break;
				case VALUE_TRUE:
				case VALUE_FALSE:
					value = p.getBooleanValue();
					break;
				case START_OBJECT:
				case START_ARRAY:
					// Recursively deserialize objects or arrays.
					value = p.readValueAs(Object.class);
					break;
				case VALUE_NULL:
					value = null;
					break;
				default:
					// Fallback: Read value as a generic Object.
					value = p.readValueAs(Object.class);
					break;
			}
			p.nextToken(); // move to the next field or END_OBJECT
		}

		return new Item(key, value);
	}
}
