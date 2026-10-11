package in.org.quicko.sheet.generator.util;

import tools.jackson.databind.JsonNode;

import java.util.List;
import java.util.Map;
import java.util.stream.StreamSupport;

class GeneratorUtil
{

	public static final String AUTO_GEN_COMMENT = "// This file was auto-generated. Do not modify it manually";

	/**
	 * Get the first enum value from a schema property
	 * 
	 * @param schema
	 *            The schema to get the enum from
	 * @param propertyName
	 *            The name of the property containing the enum
	 * @return The first enum value, or null if not found
	 */
	public static String getFirstEnum(JsonNode schema, String propertyName)
	{
		JsonNode enumNode = schema.path("properties").path(propertyName).path("enum");
		if (!enumNode.isMissingNode() && enumNode.isArray() && enumNode.size() > 0)
		{
			return enumNode.get(0).asText();
		}
		return null;
	}

	/**
	 * Convert a string to camelCase
	 * 
	 * @param str
	 *            The string to convert
	 * @return The camelCase version of the string
	 */
	public static String toCamelCase(String str)
	{
		if (str == null || str.isEmpty())
		{
			return str;
		}

		StringBuilder result = new StringBuilder();
		boolean capitalizeNext = false;

		for (char c : str.toCharArray())
		{
			if (c == '_' || c == '-' || c == ' ')
			{
				capitalizeNext = true;
			}
			else if (capitalizeNext)
			{
				result.append(Character.toUpperCase(c));
				capitalizeNext = false;
			}
			else
			{
				result.append(Character.toLowerCase(c));
			}
		}

		return result.toString();
	}

	/**
	 * Capitalize the first letter of a string
	 * 
	 * @param str
	 *            The string to capitalize
	 * @return The capitalized string
	 */
	public static String capitalize(String str)
	{
		if (str == null || str.isEmpty())
		{
			return str;
		}
		return Character.toUpperCase(str.charAt(0)) + str.substring(1);
	}

	/**
	 * Sanitize a name by ensuring it ends with a suffix
	 * 
	 * @param name
	 *            The name to sanitize
	 * @param suffix
	 *            The suffix to ensure
	 * @return The sanitized name
	 */
	public static String sanitizeName(String name, String suffix)
	{
		if (name == null || name.isEmpty())
		{
			return name;
		}
		return name.endsWith(suffix) ? name : name + suffix;
	}

	/**
	 * Converts a JSON Schema type to its corresponding Java type. This method handles both single types and arrays of
	 * types. For arrays containing a type and null (e.g., ["type", "null"]), it returns the non-null type. For other
	 * arrays, it defaults to Object.
	 *
	 * @param type
	 *            The JSON Schema type, which can be a string or an array of strings.
	 * @return The corresponding Java type as a String.
	 */
	public static String getJavaType(JsonNode type, String format)
	{
		if (type == null || type.isNull())
		{
			return "Object";
		}

		if (type.isArray())
		{
			return handleTypeArray(type, format);
		}

		if (type.isTextual())
		{
			return mapBasicType(type.asText(), format);
		}

		// Fallback for unexpected JsonNode types
		return "Object";
	}

	/**
	 * Handles the conversion when the JSON Schema type is an array.
	 *
	 * @param typeArray
	 *            The JsonNode representing an array of types.
	 * @return The corresponding Java type as a String.
	 */
	private static String handleTypeArray(JsonNode typeArray, String format)
	{
		// Filter out "null" to determine non-null types
		List<String> nonNullTypes = StreamSupport.stream(typeArray.spliterator(), false)
		        .filter(node -> node.isTextual() && !"null".equals(node.asText())).map(JsonNode::asText).toList();

		if (nonNullTypes.size() == 1)
		{
			return mapBasicType(nonNullTypes.get(0), format);
		}

		// If multiple non-null types are present, default to Object or consider advanced mapping
		return "Object";
	}

	/**
	 * Maps a basic JSON Schema type to its corresponding Java type.
	 *
	 * @param jsonType
	 *            The JSON Schema type as a String.
	 * @param format
	 *            The format of the type, if specified.
	 * @return The corresponding Java type as a String.
	 */
	private static String mapBasicType(String jsonType, String format)
	{
		if ("number".equalsIgnoreCase(jsonType))
		{
			if ("BigDecimal".equalsIgnoreCase(format))
			{
				return "java.math.BigDecimal";
			}
			else
			{
				return "Double";
			}
		}
		else if ("integer".equalsIgnoreCase(jsonType))
		{
			if ("BigInteger".equalsIgnoreCase(format))
			{
				return "java.math.BigInteger";
			}
			else if ("Long".equalsIgnoreCase(format))
			{
				return "Long";
			}
			else
			{
				return "Integer";
			}
		}

		return switch (jsonType)
		{
			case "string" -> "String";
			case "epoch" -> "Long";
			case "long" -> "Long";
			case "boolean" -> "Boolean";
			case "array" -> "List<Object>";
			case "object" -> "Map<String, Object>";
			default -> "Object";
		};
	}

	/**
	 * Generate a random serialVersionUID
	 * 
	 * @return A random long value suitable for use as serialVersionUID
	 */
	public static long generateSerialVersionUID()
	{
		return new java.util.Random().nextLong();
	}

	/**
	 * Appends a new fully qualified class name to the classNames map for the given type key.
	 *
	 * @param classNames
	 *            The map of type → array of fully qualified class names
	 * @param typeKey
	 *            Which key to update (e.g. "row", "sheet", etc.)
	 * @param packageName
	 *            The package prefix (e.g. "in.org.quicko.sheet.core.generator.output.sheets.movie_sheet")
	 * @param shortClassName
	 *            The simple class name (e.g. "MovieSheet")
	 */
	public static void updateClassNames(Map<String, String[]> classNames, String typeKey, String packageName,
	        String shortClassName)
	{
		// Get the current array for this type (e.g. "row", "sheet", etc.)
		String[] existing = classNames.get(typeKey);
		if (existing == null)
		{
			existing = new String[0];
		}

		// Build the FQN: "packageName.shortClassName"
		String fullyQualified = packageName + "." + shortClassName;

		// Create a new array with one additional slot
		String[] updated = new String[existing.length + 1];
		System.arraycopy(existing, 0, updated, 0, existing.length);

		// Put the new FQN at the end
		updated[existing.length] = fullyQualified;

		// Store back into the map
		classNames.put(typeKey, updated);
	}

}
