package in.org.quicko.sheet.generator.util;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.json.JSONArray;

import in.org.quicko.sheet.beans.Block;
import in.org.quicko.sheet.beans.Sheet;
import in.org.quicko.sheet.beans.Table;
import in.org.quicko.sheet.beans.Workbook;

/**
 * Utility class to generate JSON Schema from a Workbook object.
 */
public class JsonToSchemaGeneratorUtil
{

	private JsonToSchemaGeneratorUtil()
	{
		// Private constructor to hide implicit public one
	}

	/**
	 * Takes a workbook object and produces a JSON Schema that: - uses oneOf for each block definition (for table vs
	 * list). - identifies identical block schemas that appear more than once across sheets and places them in a
	 * top-level "definitions" section, referencing them via $ref.
	 *
	 * @param data
	 *            The workbook data to generate schema from
	 * @return Generated JSON schema as a Map
	 * @throws JacksonException
	 *             If there is an error reading or writing JSON
	 */
	public static Map<String, Object> generate(Workbook data) throws JacksonException
	{
		// Basic validations
		if (data == null || data.getSheets() == null || data.getSheets().isEmpty())
		{
			throw new IllegalArgumentException("Invalid data: No sheets found.");
		}

		// Build the main schema
		Map<String, Object> schema = new HashMap<>();
		schema.put("$schema", "http://json-schema.org/draft-07/schema#");
		schema.put("type", "object");

		Map<String, Object> properties = new HashMap<>();
		properties.put("name", Map.of("type", "string", "enum", List.of(data.getName())));
		properties.put("@entity", Map.of("type", "string", "enum", List.of(data.getEntity())));
		properties.put("sheets", buildSheetsSchema(data.getSheets()));

		schema.put("properties", properties);
		schema.put("required", List.of("name", "@entity", "sheets"));

		// 1) Now we have a raw schema (with repeated block definitions).
		// 2) De-duplicate common blocks across all sheets.
		Map<String, Object> definitions = deduplicateBlocks(schema);

		// If we found any definitions, add them to the root schema
		if (!definitions.isEmpty())
		{
			schema.put("definitions", definitions);
		}

		return schema;
	}

	/**
	 * Build the "sheets" property schema (which is an array of items, each item is a oneOf for the different possible
	 * sheet schemas).
	 */
	private static Map<String, Object> buildSheetsSchema(List<Sheet> sheets)
	{
		// Build a oneOf schema for the "items" of the sheets array
		List<Map<String, Object>> sheetSchemas = new ArrayList<>();
		for (Sheet sheet : sheets)
		{
			if (sheet.getBlocks() == null || sheet.getBlocks().isEmpty())
			{
				throw new IllegalArgumentException(
				        "Invalid data: No blocks found in sheet \"" + sheet.getName() + "\".");
			}

			List<Map<String, Object>> blocksOneOf = new ArrayList<>();
			for (Block block : sheet.getBlocks())
			{
				String blockEntity = block.getEntity();
				if ("table".equals(blockEntity))
				{
					blocksOneOf.add(buildTableBlockSchema((Table) block));
				}
				else if ("list".equals(blockEntity))
				{
					blocksOneOf.add(buildListBlockSchema((in.org.quicko.sheet.beans.List) block));
				}
			}

			Map<String, Object> sheetSchema = new HashMap<>();
			sheetSchema.put("type", "object");

			Map<String, Object> sheetProps = new HashMap<>();
			sheetProps.put("name", Map.of("type", "string", "enum", List.of(sheet.getName())));
			sheetProps.put("@entity", Map.of("type", "string", "enum", List.of(sheet.getEntity())));
			// "blocks" is an array of items, each item is oneOf the possible block definitions
			sheetProps.put("blocks", Map.of("type", "array", "items", Map.of("oneOf", blocksOneOf)));

			sheetSchema.put("properties", sheetProps);
			sheetSchema.put("required", List.of("name", "@entity", "blocks"));

			sheetSchemas.add(sheetSchema);
		}

		return Map.of("type", "array", "items", Map.of("oneOf", sheetSchemas));
	}

	/**
	 * Builds the schema for a "table" block
	 */
	private static Map<String, Object> buildTableBlockSchema(Table block)
	{
		String blockName = block.getName();

		// Derive the column types for each column in the table
		List<Map<String, Object>> columnTypes = null;
		if (block.getHeader() != null && !block.getHeader().isEmpty())
		{
			columnTypes = new ArrayList<>();
			for (int colIndex = 0; colIndex < block.getHeader().length(); colIndex++)
			{
				Set<String> uniqueTypes = new HashSet<>();
				if (block.getRows() != null)
				{
					for (int i = 0; i < block.getRows().length(); i++)
					{

						JSONArray row = block.getRow(i);

						Object cellValue = null;
						// Guard against row having fewer columns than header
						if (row.length() > colIndex)
						{
							cellValue = row.get(colIndex);
						}
						String type = deriveJsonSchemaType(cellValue);
						uniqueTypes.add(type);
					}
				}
				// Convert set to list
				List<String> typesList = new ArrayList<>(uniqueTypes);

				// If only one type in the column, simpler
				if (typesList.size() == 1)
				{
					columnTypes.add(Map.of("type", typesList.get(0)));
				}
				else
				{
					// multiple possible types (e.g. ["string", "null"])
					columnTypes.add(Map.of("type", typesList));
				}
			}
		}

		Map<String, Object> blockSchema = new LinkedHashMap<>();
		blockSchema.put("type", "object");

		Map<String, Object> properties = new LinkedHashMap<>();
		properties.put("name", Map.of("type", "string", "enum", List.of(blockName)));
		properties.put("@entity", Map.of("type", "string", "enum", List.of("table")));
		properties.put("header", Map.of("type", "array", "items", Map.of("type", "string"), "enum",
		        List.of(block.getHeader() != null ? block.getHeader() : Collections.emptyList())));

		Map<String, Object> rows = new LinkedHashMap<>();
		rows.put("type", "array");
		rows.put("items", Map.of("type", "array", "items", columnTypes != null ? columnTypes : Collections.emptyList(),
		        "additionalItems", false));
		properties.put("rows", rows);

		blockSchema.put("properties", properties);
		blockSchema.put("required", List.of("name", "@entity", "header", "rows"));

		return blockSchema;
	}

	/**
	 * Builds the schema for a "list" block
	 */
	@SuppressWarnings("unchecked")
	private static Map<String, Object> buildListBlockSchema(in.org.quicko.sheet.beans.List block)
	{
		String blockName = block.getName();

		// For a list block, we gather item property names & types from block.getItems()
		Map<String, Object> properties = new LinkedHashMap<>();
		if (block.getItems() != null && !block.getItems().isEmpty())
		{
			// Example assumption: each item is a single-entry map {key -> value}
			// Adjust if your real data has a different structure
			for (Object item : block.getItems())
			{
				Map<String, Object> itemMap = (Map<String, Object>) item;
				for (Map.Entry<String, Object> entry : itemMap.entrySet())
				{
					String key = entry.getKey();
					Object val = entry.getValue();
					properties.put(key, Map.of("type", deriveJsonSchemaType(val)));
				}
			}
		}

		Map<String, Object> blockSchema = new LinkedHashMap<>();
		blockSchema.put("type", "object");

		Map<String, Object> blockProperties = new LinkedHashMap<>();
		blockProperties.put("name", Map.of("type", "string", "enum", List.of(blockName)));
		blockProperties.put("@entity", Map.of("type", "string", "enum", List.of("list")));
		blockProperties.put("items", Map.of("type", "array", "items",
		        Map.of("type", "object", "properties", properties, "additionalProperties", false)));

		blockSchema.put("properties", blockProperties);
		blockSchema.put("required", List.of("name", "@entity", "items"));

		return blockSchema;
	}

	/**
	 * Try to guess the JSON Schema type from a sample cell value
	 */
	private static String deriveJsonSchemaType(Object value)
	{
		if (value == null)
		{
			return "null";
		}
		if (value instanceof Boolean)
		{
			return "boolean";
		}
		if (value instanceof Number)
		{
			return "number";
		}
		if (value instanceof List)
		{
			return "array";
		}
		if (value instanceof Map)
		{
			return "object";
		}
		return "string";
	}

	// --------------------------------------------------------------------
	// DEDUPLICATION LOGIC
	// --------------------------------------------------------------------

	/**
	 * Post-processes the fully built schema to: 1) identify repeated block definitions by comparing a canonical JSON
	 * representation, 2) if repeated > 1, move them to top-level "definitions" and replace inlined block with `{"$ref":
	 * "#/definitions/..."}`
	 *
	 * @param schema
	 *            The fully built schema
	 * @return A map of definitions that should be attached to the root schema
	 * @throws JacksonException
	 */
	@SuppressWarnings("unchecked")
	private static Map<String, Object> deduplicateBlocks(Map<String, Object> schema) throws JacksonException
	{
		// This will hold all block definitions that appear more than once
		// Key: canonical JSON of the block definition
		// Value: definition name (we'll assign something like "BlockDef1", "BlockDef2", etc.)
		Map<String, String> blockDefNames = new LinkedHashMap<>();

		// Keep a count of how many times each block definition appears
		Map<String, Integer> definitionUsageCount = new HashMap<>();

		// 1. Collect all block definitions from each sheet's blocksOneOf
		// structure. We'll store the parent list + index so that we can
		// replace them if needed.
		List<BlockLocation> blockLocations = findAllBlockSchemas(schema);

		// 2. For each block schema, compute a canonical representation
		// and count usage.
		for (BlockLocation loc : blockLocations)
		{
			String canonical = toCanonicalJson(loc.blockSchema);
			definitionUsageCount.put(canonical, definitionUsageCount.getOrDefault(canonical, 0) + 1);
		}

		// 3. For each block definition that appears more than once,
		// create a definition name and store in blockDefNames
		for (Map.Entry<String, Integer> entry : definitionUsageCount.entrySet())
		{
			String canonical = entry.getKey();
			int count = entry.getValue();
			if (count > 1)
			{
				// Extract block name from the canonical JSON and append a short hash
				Map<String, Object> blockSchema = fromCanonicalJson(canonical);
				Map<String, Object> properties = (Map<String, Object>) blockSchema.get("properties");
				Map<String, Object> nameProperty = (Map<String, Object>) properties.get("name");
				List<String> enumValues = (List<String>) nameProperty.get("enum");
				String blockName = enumValues.get(0);

				// Generate a short hash from canonical string
				String hash = String.valueOf(Math.abs(canonical.hashCode()));
				blockDefNames.put(canonical, blockName + "_" + hash);
			}
		}

		// 4. Build the actual definitions to store in schema
		Map<String, Object> definitionsMap = new LinkedHashMap<>();
		for (String canonical : blockDefNames.keySet())
		{
			String defName = blockDefNames.get(canonical);
			// Turn canonical string back into a Map
			Map<String, Object> blockSchema = fromCanonicalJson(canonical);
			definitionsMap.put(defName, blockSchema);
		}

		// 5. Replace the repeated definitions inlined in the sheets with
		// references to "#/definitions/BlockDefX"
		for (BlockLocation loc : blockLocations)
		{
			String canonical = toCanonicalJson(loc.blockSchema);
			if (blockDefNames.containsKey(canonical))
			{
				// The block schema is repeated, so replace with a $ref
				String defName = blockDefNames.get(canonical);
				Map<String, Object> refObj = new HashMap<>();
				refObj.put("$ref", "#/definitions/" + defName);

				// Replace in the parent
				loc.blocksOneOf.set(loc.indexInBlocksOneOf, refObj);
			}
		}

		return definitionsMap;
	}

	/**
	 * Helper to find all block schema definitions within the top-level schema by looking at:
	 * schema.properties.sheets.items.oneOf[*].properties.blocks.items.oneOf[*]
	 *
	 * Returns a list of (parentList, indexInParentList, blockSchema).
	 */
	@SuppressWarnings("unchecked")
	private static List<BlockLocation> findAllBlockSchemas(Map<String, Object> root)
	{
		List<BlockLocation> results = new ArrayList<>();
		// Navigate to: properties -> sheets -> items -> oneOf
		Map<String, Object> properties = (Map<String, Object>) root.get("properties");
		if (properties == null)
		{
			return results;
		}

		Map<String, Object> sheetsSchema = (Map<String, Object>) properties.get("sheets");
		if (sheetsSchema == null)
		{
			return results;
		}

		Map<String, Object> sheetsItems = (Map<String, Object>) sheetsSchema.get("items");
		if (sheetsItems == null)
		{
			return results;
		}

		Object oneOfObj = sheetsItems.get("oneOf");
		if (!(oneOfObj instanceof List))
		{
			return results;
		}

		List<Map<String, Object>> sheetSchemas = (List<Map<String, Object>>) oneOfObj;
		for (Map<String, Object> sheetSchema : sheetSchemas)
		{
			// For each sheet schema, navigate to properties -> blocks -> items -> oneOf
			Map<String, Object> sheetProps = (Map<String, Object>) sheetSchema.get("properties");
			if (sheetProps == null)
				continue;

			Map<String, Object> blocksSchema = (Map<String, Object>) sheetProps.get("blocks");
			if (blocksSchema == null)
				continue;

			Map<String, Object> blocksItems = (Map<String, Object>) blocksSchema.get("items");
			if (blocksItems == null)
				continue;

			Object blocksOneOfObj = blocksItems.get("oneOf");
			if (!(blocksOneOfObj instanceof List))
			{
				continue;
			}

			List<Map<String, Object>> blocksOneOfList = (List<Map<String, Object>>) blocksOneOfObj;

			// This is the array of block definitions for this sheet
			for (int i = 0; i < blocksOneOfList.size(); i++)
			{
				Map<String, Object> blockSchema = blocksOneOfList.get(i);
				// This 'blockSchema' is the entire "table" or "list" block definition
				results.add(new BlockLocation(blocksOneOfList, i, blockSchema));
			}
		}

		return results;
	}

	/**
	 * A small holder to record where a block schema is in the "oneOf" list, so we can replace it later if needed.
	 */
	private static class BlockLocation
	{

		List<Map<String, Object>> blocksOneOf;

		int indexInBlocksOneOf;

		Map<String, Object> blockSchema;

		public BlockLocation(List<Map<String, Object>> blocksOneOf, int indexInBlocksOneOf,
		        Map<String, Object> blockSchema)
		{
			this.blocksOneOf = blocksOneOf;
			this.indexInBlocksOneOf = indexInBlocksOneOf;
			this.blockSchema = blockSchema;
		}
	}

	// --------------------------------------------------------------------
	// CANONICALIZATION UTILITIES
	// --------------------------------------------------------------------

	/**
	 * Convert the given block schema into a canonical string so we can detect duplicates. In real code, you might rely
	 * on a JSON library (Jackson, GSON) with sorted keys, etc. This example is simplistic and may need improvement for
	 * complex structures.
	 */
	private static String toCanonicalJson(Map<String, Object> blockSchema)
	{
		return toCanonicalJsonRecursive(blockSchema);
	}

	@SuppressWarnings("unchecked")
	private static String toCanonicalJsonRecursive(Object obj)
	{
		if (obj == null)
			return "null";
		if (obj instanceof String)
			return "\"" + escape((String) obj) + "\"";
		if (obj instanceof Number || obj instanceof Boolean)
			return String.valueOf(obj);

		if (obj instanceof Map)
		{
			// Sort by key for stable output
			Map<String, Object> map = (Map<String, Object>) obj;
			List<String> sortedKeys = new ArrayList<>(map.keySet());
			Collections.sort(sortedKeys);

			StringBuilder sb = new StringBuilder();
			sb.append("{");
			boolean first = true;
			for (String k : sortedKeys)
			{
				if (!first)
					sb.append(",");
				sb.append("\"").append(escape(k)).append("\":").append(toCanonicalJsonRecursive(map.get(k)));
				first = false;
			}
			sb.append("}");
			return sb.toString();
		}
		if (obj instanceof List)
		{
			List<Object> list = (List<Object>) obj;
			StringBuilder sb = new StringBuilder();
			sb.append("[");
			for (int i = 0; i < list.size(); i++)
			{
				if (i > 0)
					sb.append(",");
				sb.append(toCanonicalJsonRecursive(list.get(i)));
			}
			sb.append("]");
			return sb.toString();
		}

		// fallback to string
		return "\"" + escape(String.valueOf(obj)) + "\"";
	}

	private static String escape(String s)
	{
		// Minimal escape
		return s.replace("\"", "\\\"");
	}

	/**
	 * Inverse of toCanonicalJson(...) just enough to get back a Map structure. If you already use a JSON library, this
	 * is basically JSON parse.
	 *
	 * In real production code, you can parse via Jackson or GSON into a Map again.
	 * 
	 * @throws JacksonException
	 */
	@SuppressWarnings("unchecked")
	private static Map<String, Object> fromCanonicalJson(String canonical) throws JacksonException
	{
		return new ObjectMapper().readValue(canonical, Map.class);
	}
}
