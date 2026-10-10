package in.org.quicko.sheet.generator.util;

import tools.jackson.databind.JsonNode;

class SchemaRefResolverUtil
{

	/**
	 * Recursively resolves local $ref if present, returning the *real* schema node. If no $ref is present, returns the
	 * original node.
	 */
	public static JsonNode resolveIfRef(JsonNode node, JsonNode rootSchema)
	{
		// Defensive: null checks
		if (node == null || node.isMissingNode())
		{
			return node;
		}

		// While we have a $ref in the node, follow it
		while (node.has("$ref"))
		{
			String ref = node.get("$ref").asText();
			// Typically something like "#/definitions/block_name_hash"
			if (ref.startsWith("#/"))
			{
				node = resolvePointer(ref.substring(2), rootSchema);
			}
			else
			{
				// We'll assume local references only.
				throw new IllegalArgumentException("Unsupported $ref format (expected local ref): " + ref);
			}
		}

		return node;
	}

	/**
	 * Resolve something like "definitions/block_name_hash" within the rootSchema.
	 */
	private static JsonNode resolvePointer(String pointer, JsonNode rootSchema)
	{
		String[] parts = pointer.split("/");
		JsonNode current = rootSchema;
		for (String part : parts)
		{
			current = current.path(part);
		}
		return current;
	}
}
