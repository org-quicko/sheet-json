package in.org.quicko.sheet.serializer;

import tools.jackson.core.JacksonException;
import tools.jackson.core.JsonGenerator;
import tools.jackson.databind.SerializationContext;
import tools.jackson.databind.ValueSerializer;
import tools.jackson.databind.jsontype.TypeSerializer;

import in.org.quicko.sheet.beans.Item;

public class CustomItemSerializer extends ValueSerializer<Item>
{

	@Override
	public void serialize(final Item item, final JsonGenerator gen, final SerializationContext serializers)
	        throws JacksonException
	{

		if (item.getKey() == null)
		{
			serializers.reportBadDefinition(serializers.constructType(Item.class),
			        "Cannot serialize Item with null key: " + item.toString());
		}

		gen.writeStartObject(); // Start a new JSON object

		// Dynamically write the key-value pair based on the item's key
		gen.writePOJOProperty(item.getKey(), item.getValue());

		gen.writeEndObject(); // End the JSON object
	}

	@Override
	public void serializeWithType(final Item item, final JsonGenerator gen, final SerializationContext serializers,
	        final TypeSerializer typeSer) throws JacksonException
	{
		serialize(item, gen, serializers);
	}

}