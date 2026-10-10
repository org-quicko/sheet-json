package in.org.quicko.sheet.generator.util;

import tools.jackson.databind.JsonNode;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

class SheetGeneratorUtil
{

	/**
	 * Generate sheet class with all block types
	 *
	 * @param sheetSchema
	 *            The possibly partial or $ref-based node describing this sheet
	 * @param rootSchema
	 *            The entire root schema (needed for $ref resolution)
	 */
	public static void generate(JsonNode sheetSchema, JsonNode rootSchema, String sheetsDir, String tablesDir,
	        String listsDir, Map<String, String[]> classNames, String packageName) throws IOException
	{
		// First, resolve if `sheetSchema` is a $ref
		sheetSchema = SchemaRefResolverUtil.resolveIfRef(sheetSchema, rootSchema);

		// Now we can safely navigate the properties
		JsonNode blocksSchema = sheetSchema.path("properties").path("blocks");
		if (blocksSchema.isMissingNode() || !"array".equals(blocksSchema.path("type").asText())
		        || !blocksSchema.has("items"))
		{
			throw new IllegalArgumentException("Invalid JSON Schema: \"blocks\" definition not found or malformed.");
		}

		// Resolve blocksSchema if it has a $ref
		blocksSchema = SchemaRefResolverUtil.resolveIfRef(blocksSchema, rootSchema);

		JsonNode blockItems = blocksSchema.path("items");
		blockItems = SchemaRefResolverUtil.resolveIfRef(blockItems, rootSchema);

		JsonNode blockOneOf = blockItems.path("oneOf");
		if (blockOneOf.isMissingNode() || !blockOneOf.isArray())
		{
			throw new IllegalArgumentException("Invalid JSON Schema: `blocks.items.oneOf` not found or not an array.");
		}

		// We have a resolved sheet node
		String sheetNameEnum = GeneratorUtil.getFirstEnum(sheetSchema, "name");
		String sheetClassName =
		        GeneratorUtil.sanitizeName(GeneratorUtil.capitalize(GeneratorUtil.toCamelCase(sheetNameEnum)), "Sheet");

		List<String> blockImports = new ArrayList<>();
		List<String> blockMethods = new ArrayList<>();

		// For each block variation in the oneOf
		for (JsonNode blockSchema : blockOneOf)
		{
			Boolean isCommon = blockSchema.has("$ref");

			// Resolve if it is just a $ref
			blockSchema = SchemaRefResolverUtil.resolveIfRef(blockSchema, rootSchema);

			String blockNameEnum = GeneratorUtil.getFirstEnum(blockSchema, "name");
			String blockEntityEnum = GeneratorUtil.getFirstEnum(blockSchema, "@entity");

			String blockClassName =
			        GeneratorUtil.sanitizeName(GeneratorUtil.capitalize(GeneratorUtil.toCamelCase(blockNameEnum)),
			                blockEntityEnum.equals("list") ? "List" : "Table");

			String importDir = (blockEntityEnum.equals("list") ? "lists." : "tables.");
			String blockDir = "table".equals(blockEntityEnum) ? tablesDir : listsDir;

			if (isCommon)
			{
				importDir = importDir + "common.";
				blockDir = blockDir + "/common";
			}

			importDir = importDir + blockNameEnum + ".beans";

			blockImports.add(String.format("import %s.%s.%s;", packageName, importDir, blockClassName));

			String capitalizedName = GeneratorUtil.capitalize(GeneratorUtil.toCamelCase(blockNameEnum));
			String camelCaseName = GeneratorUtil.toCamelCase(blockNameEnum);

			blockMethods.add(String.format("""
			        \tpublic void add%s(%s %s)
			        \t{
			        \t\tthis.addBlock(%s);
			        \t}

			        \t@JsonIgnore
			        \tpublic %s get%s()
			        \t{
			        \t\tif (super.getBlock("%s") == null)
			        \t\t{
			        \t\t\tsuper.addBlock(new %s());
			        \t\t}
			        \t\treturn (%s) super.getBlock("%s");
			        \t}
			        """, capitalizedName, blockClassName, camelCaseName, camelCaseName, blockClassName, capitalizedName,
			        blockNameEnum, blockClassName, blockClassName, blockNameEnum));

			// Generate table or list class from the block schema
			if ("table".equals(blockEntityEnum))
			{
				TableGeneratorUtil.generate(blockSchema, blockClassName, blockDir, classNames, packageName, isCommon);
			}
			else if ("list".equals(blockEntityEnum))
			{
				ListGeneratorUtil.generate(blockSchema, blockNameEnum, blockDir, classNames, packageName, isCommon);
			}
		}

		String sheetPackage = packageName + ".sheets." + sheetNameEnum + ".beans";

		// Finally, write out the sheet class
		String sheetClass = String
		        .format("""
		                package %s;

		                %s

		                import com.fasterxml.jackson.annotation.JsonIgnore;
		                import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
		                import com.fasterxml.jackson.annotation.JsonTypeInfo;
		                import com.fasterxml.jackson.annotation.JsonTypeName;

		                import in.org.quicko.sheet.beans.Sheet;
		                %s

		                @JsonTypeName("%s")
		                @JsonIgnoreProperties(ignoreUnknown = true)
		                @JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.EXISTING_PROPERTY, property = "name", visible = true)
		                public class %s extends Sheet
		                {

		                \tprivate static final long serialVersionUID = %dL;

		                %s
		                }
		                """,
		                sheetPackage, GeneratorUtil.AUTO_GEN_COMMENT, String.join("\n", blockImports), sheetNameEnum,
		                sheetClassName, GeneratorUtil.generateSerialVersionUID(), String.join("\n\n\t", blockMethods))
		        .trim();

		String sheetDirectory = sheetsDir + "/" + sheetNameEnum + "/beans";

		Files.createDirectories(Paths.get(sheetDirectory));
		Files.writeString(Paths.get(sheetDirectory, sheetClassName + ".java"), sheetClass);

		// track for mixin generation
		GeneratorUtil.updateClassNames(classNames, "sheet", sheetPackage, sheetClassName);
	}
}
