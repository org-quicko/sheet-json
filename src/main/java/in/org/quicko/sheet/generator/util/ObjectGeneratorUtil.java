package in.org.quicko.sheet.generator.util;

import tools.jackson.databind.JsonNode;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;

/**
 * Utility class to generate Java objects from JSON Schema.
 */
public class ObjectGeneratorUtil
{

	private ObjectGeneratorUtil()
	{
		// Private constructor to hide implicit public one
	}

	/**
	 * Generate Java classes from a JSON Schema.
	 *
	 * @param schema
	 *            The root JSON Schema (with 'definitions', etc.)
	 * @param outputDir
	 *            Where to write generated files
	 * @param packageName
	 *            Package name for generated classes
	 * @throws IOException
	 *             If there is an error writing files
	 */
	public static void generate(JsonNode schema, String outputDir, String packageName) throws IOException
	{
		// Create class name tracking objects
		Map<String, String[]> classNames = new HashMap<>();
		classNames.put("workbook", new String[0]);
		classNames.put("sheet", new String[0]);
		classNames.put("table", new String[0]);
		classNames.put("list", new String[0]);
		classNames.put("row", new String[0]);

		// Make output directories
		var baseDir = outputDir;
		var workbookDir = Paths.get(baseDir, "workbooks").toString();
		var sheetsDir = Paths.get(baseDir, "sheets").toString();
		var tablesDir = Paths.get(baseDir, "tables").toString();
		var listsDir = Paths.get(baseDir, "lists").toString();
		var mixinsDir = Paths.get(baseDir, "mixins").toString();
		createDirectories(baseDir, workbookDir, sheetsDir, tablesDir, listsDir, mixinsDir);

		// Resolve "sheets" node from root
		var sheetsSchema = schema.path("properties").path("sheets");
		if (sheetsSchema.isMissingNode() || !"array".equals(sheetsSchema.path("type").asText())
		        || !sheetsSchema.has("items"))
		{
			throw new IllegalArgumentException("Invalid JSON Schema: \"sheets\" definition not found or malformed.");
		}

		// The schema for the "items" of "sheets"
		var itemsNode = sheetsSchema.path("items");
		// Sometimes it's "items.oneOf", sometimes direct "items". We'll unify:
		var sheetSchemas = itemsNode.has("oneOf") ? itemsNode.path("oneOf") : itemsNode;

		// Generate workbook class
		WorkbookGeneratorUtil.generate(schema, sheetSchemas, workbookDir, classNames, packageName);

		// Generate each sheet variant
		for (var sheetSchema : sheetSchemas)
		{
			// Pass in the root schema for possible $ref resolution
			SheetGeneratorUtil.generate(sheetSchema, schema, sheetsDir, tablesDir, listsDir, classNames, packageName);
		}

		// Generate mixin classes (one per type)
		MixinGeneratorUtil.generate(mixinsDir, classNames, packageName);
	}

	private static void createDirectories(String... dirs) throws IOException
	{
		for (String dir : dirs)
		{
			Files.createDirectories(Path.of(dir));
		}
	}
}
