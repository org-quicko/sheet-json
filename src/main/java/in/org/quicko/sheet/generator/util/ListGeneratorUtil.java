package in.org.quicko.sheet.generator.util;

import tools.jackson.databind.JsonNode;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

class ListGeneratorUtil
{

	/**
	 * Generate list class from block schema
	 * 
	 * @param blockSchema
	 *            The block schema to generate from
	 * @param blockName
	 *            The name of the block
	 * @param listsDir
	 *            The directory to output list classes to
	 * @param classNames
	 *            Map to track generated class names
	 * @throws IOException
	 *             If there's an error writing files
	 */
	public static void generate(JsonNode blockSchema, String blockName, String listsDir,
	        Map<String, String[]> classNames, String packageName, Boolean isCommon) throws IOException
	{

		String listDirectory = listsDir + "/" + blockName + "/beans";
		String listPackage = packageName + (isCommon ? ".lists.common." : ".lists.") + blockName + ".beans";

		String className =
		        GeneratorUtil.sanitizeName(GeneratorUtil.capitalize(GeneratorUtil.toCamelCase(blockName)), "List");

		// Get properties from schema
		JsonNode properties = blockSchema.path("properties").path("items").path("items").path("properties");
		if (properties.isMissingNode())
		{
			return;
		}

		// Generate getters and setters for each property
		List<String> gettersSetters = new ArrayList<>();
		properties.properties().forEach(field -> {
			String key = field.getKey();
			String type =
			        GeneratorUtil.getJavaType(field.getValue().path("type"), field.getValue().path("format").asText());
			String camelKey = GeneratorUtil.toCamelCase(key);
			String capitalizedKey = GeneratorUtil.capitalize(camelKey);

			gettersSetters.add(generateGetterSetter(key, type, capitalizedKey, camelKey));
		});

		String listClass = generateListClass(listPackage, blockName, className, gettersSetters);

		Files.createDirectories(Paths.get(listDirectory));
		Files.writeString(Paths.get(listDirectory, className + ".java"), listClass);

		// track for mixin generation
		GeneratorUtil.updateClassNames(classNames, "list", listPackage, className);
	}

	private static String generateGetterSetter(String key, String type, String capitalizedKey, String camelKey)
	{
		String listGetter = switch (type)
		{
			case "String" -> "getStringValue()";
			case "BigDecimal", "java.math.BigDecimal" -> "getBigDecimalValue()";
			case "BigInteger", "java.math.BigInteger" -> "getBigIntegerValue()";
			case "Long" -> "getLongValue()";
			case "Boolean" -> "getBooleanValue()";
			case "Integer", "int" -> "getIntegerValue()";
			case "Double", "double" -> "getDoubleValue()";
			default -> "getValue()";
		};

		return String.format("""
		        \t// "%s"
		        \tpublic %s valueOf%s()
		        \t{
		        \t\tItem item = this.getItem("%s");
		        \t\treturn item != null ? item.%s : null;
		        \t}

		        \tpublic void add%s(%s %s)
		        \t{
		        \t\tthis.addItem("%s", %s);
		        \t}""", key, type, capitalizedKey, key, listGetter, capitalizedKey, type, camelKey, key, camelKey);
	}

	private static String generateListClass(String listPackage, String blockName, String className,
	        List<String> gettersSetters)
	{

		return String
		        .format("""
		                package %s;

		                import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
		                import com.fasterxml.jackson.annotation.JsonTypeInfo;
		                import com.fasterxml.jackson.annotation.JsonTypeName;

		                import in.org.quicko.sheet.beans.List;
		                import in.org.quicko.sheet.beans.Item;

		                @JsonTypeName("%s")
		                @JsonIgnoreProperties(ignoreUnknown = true)
		                @JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.EXISTING_PROPERTY, property = "name", visible = true)
		                public class %s extends List
		                {

		                \tprivate static final long serialVersionUID = %dL;

		                \tpublic static final String name = "%s";

		                %s
		                }
		                """,
		                listPackage, blockName, className, GeneratorUtil.generateSerialVersionUID(), blockName,
		                String.join("\n\n", gettersSetters))
		        .trim();
	}
}
