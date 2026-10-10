package in.org.quicko.sheet.generator.util;

import tools.jackson.databind.JsonNode;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

class RowGeneratorUtil
{

	public static void generate(JsonNode blockSchema, String rowClassName, String rowsDir,
	        Map<String, String[]> classNames, String packageName) throws IOException
	{

		JsonNode headerItems = blockSchema.path("properties").path("header").path("items");

		JsonNode rowsSchema = blockSchema.path("properties").path("rows").path("items").path("items");

		List<String> indices = new ArrayList<>();
		List<String> gettersSetters = new ArrayList<>();

		// 3) Generate indices + getters/setters for each column
		if (headerItems.isArray())
		{
			for (int i = 0; i < headerItems.size(); i++)
			{
				JsonNode columnSchema = headerItems.get(i);
				// The column name is in columnSchema.enum[0]
				JsonNode colEnumNode = columnSchema.path("enum");
				String headerText = "";
				if (colEnumNode.isArray() && colEnumNode.size() > 0)
				{
					headerText = colEnumNode.get(0).asText();
				}

				int index = i;
				String camelCaseHeader = GeneratorUtil.toCamelCase(headerText);
				String upperCaseHeader = camelCaseHeader.toUpperCase();
				String capitalizedHeader = GeneratorUtil.capitalize(camelCaseHeader);

				// For each column, define a static INDEX constant
				indices.add(String.format("\tprivate static final int %s_INDEX = %d;", upperCaseHeader, index));

				// Determine the Java type based on rowsSchema[i].type
				JsonNode typeNode = rowsSchema.get(index);
				String javaType = GeneratorUtil.getJavaType(typeNode.path("type"), typeNode.path("format").asText());

				// Add the getter/setter methods for this column
				gettersSetters.add(generateGetterSetter(camelCaseHeader, upperCaseHeader, capitalizedHeader, javaType));
			}
		}

		// Generate the final Row class
		String rowClass = generateRowClass(packageName, rowClassName, indices, gettersSetters);
		Files.createDirectories(Paths.get(rowsDir));
		Files.writeString(Paths.get(rowsDir, rowClassName + ".java"), rowClass);

		// Track for mixin generation
		GeneratorUtil.updateClassNames(classNames, "row", packageName, rowClassName);
	}

	/**
	 * Create getter & setter methods for a single column.
	 */
	private static String generateGetterSetter(String camelCaseHeader, String upperCaseHeader, String capitalizedHeader,
	        String javaType)
	{
		String getter = switch (javaType)
		{
			case "String" -> "getString";
			case "BigDecimal", "java.math.BigDecimal" -> "getBigDecimal";
			case "BigInteger", "java.math.BigInteger" -> "getBigInteger";
			case "Long", "long" -> "getLong";
			case "Double", "double" -> "getLong";
			case "Boolean" -> "getBoolean";
			case "Integer", "int" -> "getInt";
			case "List<Object>" -> "getJSONArray";
			case "Map<String, Object>" -> "getJSONObject";
			default -> "get";
		};

		return String.format("""
		        \tpublic %s get%s()
		        \t{
		        \t\treturn this.isNull(%s_INDEX) ? null : this.%s(%s_INDEX);
		        \t}

		        \tpublic void set%s(%s %s)
		        \t{
		        \t\tthis.put(%s_INDEX, %s);
		        \t}
		        """, javaType, capitalizedHeader, upperCaseHeader, getter, upperCaseHeader, capitalizedHeader, javaType,
		        camelCaseHeader, upperCaseHeader, camelCaseHeader);
	}

	/**
	 * Generates the row class with the given indices (static final int...) and getters/setters.
	 */
	private static String generateRowClass(String packageName, String rowClassName, List<String> indices,
	        List<String> gettersSetters)
	{
		return String.format("""
		        package %s;

		        import java.io.Serializable;
		        import org.json.JSONArray;

		        public class %s extends JSONArray implements Serializable
		        {
		        \tprivate static final long serialVersionUID = %dL;

		        \tpublic %s()
		        \t{
		        \t\tsuper();
		        \t}

		        \tpublic %s(JSONArray jsonArray)
		        \t{
		        \t\tsuper(jsonArray);
		        \t}

		        %s

		        %s
		        }
		        """, packageName, rowClassName, GeneratorUtil.generateSerialVersionUID(), rowClassName, rowClassName,
		        String.join("\n\n", indices), String.join("\n\n", gettersSetters)).trim();
	}
}
