package in.org.quicko.sheet.generator.util;

import tools.jackson.databind.ObjectMapper;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

/**
 * A single class that: 1) Parses an Excel file to find "list" or "table" blocks 2) Builds a JSON schema object
 * ({@code Map<String, Object>}) with all the advanced properties 3) Deduplicates repeated blocks by referencing them in a
 * top-level "definitions".
 *
 * The primary method is generateSchema(File excelFile).
 */
public class ExcelToSchemaGeneratorUtil
{

	private ExcelToSchemaGeneratorUtil()
	{
		// Private constructor to hide implicit public one
	}

	// -------------------------------------------------------------------------
	// PUBLIC ENTRY POINT
	// -------------------------------------------------------------------------

	/**
	 * High-level API: parse the Excel and return a JSON-schema as a {@code Map<String,Object>}. Then you can serialize it (e.g.
	 * with Jackson) as needed.
	 *
	 * @param excelFile
	 *            The Excel file to parse
	 * @param workbookName
	 *            The name of the workbook
	 * @return A map representing the JSON schema
	 * @throws IOException
	 *             If there is an error reading the file
	 */
	public static Map<String, Object> generate(File excelFile, String workbookName) throws IOException
	{
		// 1) Parse the workbook
		WorkbookModel workbookModel = parseExcelToModel(excelFile, workbookName);

		// 2) Build the schema from that model
		Map<String, Object> schema = buildJsonSchema(workbookModel);

		// 3) De-duplicate repeated block definitions
		Map<String, Object> definitions = deduplicateBlocks(schema);

		// If any duplicates found, attach them
		if (!definitions.isEmpty())
		{
			schema.put("definitions", definitions);
		}

		return schema;
	}

	// -------------------------------------------------------------------------
	// PART 1: PARSE EXCEL → MODEL
	// -------------------------------------------------------------------------

	/**
	 * Read the Excel file, discover "list" or "table" blocks, and build a simple internal model: WorkbookModel →
	 * multiple SheetModel → each SheetModel has multiple BlockModel
	 */
	private static WorkbookModel parseExcelToModel(File excelFile, String workbookName) throws IOException
	{
		WorkbookModel workbook = new WorkbookModel();
		if (workbookName == null)
		{
			workbookName = excelFile.getName().replaceFirst("[.][^.]+$", "");
		}
		workbook.setName(workbookName);
		workbook.setEntity("workbook");
		List<SheetModel> sheets = new ArrayList<>();

		try (FileInputStream fis = new FileInputStream(excelFile); XSSFWorkbook poiWorkbook = new XSSFWorkbook(fis))
		{

			int numberOfSheets = poiWorkbook.getNumberOfSheets();
			for (int s = 0; s < numberOfSheets; s++)
			{
				org.apache.poi.ss.usermodel.Sheet poiSheet = poiWorkbook.getSheetAt(s);
				if (poiSheet == null)
					continue;

				SheetModel sheetModel = new SheetModel();
				sheetModel.setName(poiSheet.getSheetName());
				sheetModel.setEntity("sheet");

				List<BlockModel> blocks = parseBlocksInSheet(poiSheet);
				sheetModel.setBlocks(blocks);

				sheets.add(sheetModel);
			}
		}
		workbook.setSheets(sheets);
		return workbook;
	}

	/**
	 * Scans a single POI sheet row-by-row: - If cell A ends with "_list" or "_table", we start a new block - The next
	 * row is the "metadata header" row (null_allowed, type, minLength, etc.) - Subsequent rows are each field
	 * definition until a blank row or a new block heading
	 */
	private static List<BlockModel> parseBlocksInSheet(org.apache.poi.ss.usermodel.Sheet poiSheet)
	{
		List<BlockModel> blocks = new ArrayList<>();

		int lastRow = poiSheet.getLastRowNum();
		int currentRow = 0;
		while (currentRow <= lastRow)
		{
			Row row = poiSheet.getRow(currentRow);
			if (row == null)
			{
				currentRow++;
				continue;
			}

			String firstCellVal = getCellStringValue(row.getCell(0));
			if (firstCellVal.endsWith("_list") || firstCellVal.endsWith("_table"))
			{
				// Start of a new block
				BlockModel block = new BlockModel();
				block.setName(firstCellVal);
				if (firstCellVal.endsWith("_list"))
				{
					block.setEntity("list");
				}
				else
				{
					block.setEntity("table");
				}

				// Next row => metadata header row
				currentRow++;
				Row metaHeaderRow = poiSheet.getRow(currentRow);
				Map<String, Integer> metaCols = findMetaColumns(metaHeaderRow);

				// Gather field rows
				currentRow++;
				List<BlockField> fields = new ArrayList<>();
				while (currentRow <= lastRow)
				{
					Row dataRow = poiSheet.getRow(currentRow);
					if (isBlankRow(dataRow))
					{
						// end of this block
						currentRow++;
						break;
					}

					String maybeBlockName = getCellStringValue(dataRow.getCell(0));
					if (maybeBlockName.endsWith("_list") || maybeBlockName.endsWith("_table"))
					{
						// new block
						break;
					}

					// This row is a field definition
					BlockField field = parseFieldRow(dataRow, metaCols);
					fields.add(field);

					currentRow++;
				}

				// Store the fields in the block
				block.setFields(fields);

				blocks.add(block);
			}
			else
			{
				currentRow++;
			}
		}

		return blocks;
	}

	/**
	 * The "field row" has something like: A=fieldName, B=nullAllowed, C=type, D=minimum, E=maximum, F=minLength,
	 * G=maxLength, H=pattern, I=enum, J=description, K=examples Adjust to match your actual Excel layout/column
	 * indices.
	 */
	private static BlockField parseFieldRow(Row row, Map<String, Integer> metaCols)
	{
		BlockField field = new BlockField();
		field.setFieldName(getCellStringValue(row.getCell(0)));

		field.setNullAllowed(getCellStringValue(row.getCell(metaCols.getOrDefault("null_allowed", -1))));
		field.setType(getCellStringValue(row.getCell(metaCols.getOrDefault("type", -1))));
		field.setFormat(getCellStringValue(row.getCell(metaCols.getOrDefault("format", -1))));
		field.setMinimum(getCellStringValue(row.getCell(metaCols.getOrDefault("minimum", -1))));
		field.setMaximum(getCellStringValue(row.getCell(metaCols.getOrDefault("maximum", -1))));
		field.setMinLength(getCellStringValue(row.getCell(metaCols.getOrDefault("minLength", -1))));
		field.setMaxLength(getCellStringValue(row.getCell(metaCols.getOrDefault("maxLength", -1))));
		field.setPattern(getCellStringValue(row.getCell(metaCols.getOrDefault("pattern", -1))));
		field.setEnumValues(getCellStringValue(row.getCell(metaCols.getOrDefault("enum", -1))));
		field.setDescription(getCellStringValue(row.getCell(metaCols.getOrDefault("description", -1))));
		field.setExamples(getCellStringValue(row.getCell(metaCols.getOrDefault("examples", -1))));

		return field;
	}

	/**
	 * Reads the meta-header row to identify which columns hold "null_allowed", "type", "pattern", etc.
	 */
	private static Map<String, Integer> findMetaColumns(Row metaHeaderRow)
	{
		Map<String, Integer> map = new HashMap<>();
		if (metaHeaderRow == null)
			return map;

		short lastCellNum = metaHeaderRow.getLastCellNum();
		for (int c = 0; c < lastCellNum; c++)
		{
			String val = getCellStringValue(metaHeaderRow.getCell(c)).trim().toLowerCase();
			if (val.equals("null_allowed"))
				map.put("null_allowed", c);
			else if (val.equals("type"))
				map.put("type", c);
			else if (val.equals("format"))
				map.put("format", c);
			else if (val.equals("minimum"))
				map.put("minimum", c);
			else if (val.equals("maximum"))
				map.put("maximum", c);
			else if (val.equals("minlength"))
				map.put("minLength", c);
			else if (val.equals("maxlength"))
				map.put("maxLength", c);
			else if (val.equals("pattern"))
				map.put("pattern", c);
			else if (val.equals("enum"))
				map.put("enum", c);
			else if (val.equals("description"))
				map.put("description", c);
			else if (val.equals("examples"))
				map.put("examples", c);
		}
		return map;
	}

	private static String getCellStringValue(Cell cell)
	{
		if (cell == null)
			return "";
		return cell.toString().trim();
	}

	private static boolean isBlankRow(Row row)
	{
		if (row == null)
			return true;
		for (int i = row.getFirstCellNum(); i < row.getLastCellNum(); i++)
		{
			Cell c = row.getCell(i);
			if (c != null && !c.toString().trim().isEmpty())
			{
				return false;
			}
		}
		return true;
	}

	// -------------------------------------------------------------------------
	// PART 2: BUILD JSON SCHEMA (FROM OUR MODEL)
	// -------------------------------------------------------------------------

	/**
	 * Creates a top-level JSON schema with structure:
	 *
	 * { "$schema": "http://json-schema.org/draft-07/schema#", "type": "object", "properties": { "name": {...},
	 * "@entity": {...}, "sheets": { "type": "array", "items": { "oneOf": [ {... sheet schema ...}, ... ] } } },
	 * "required": ["name","@entity","sheets"] }
	 */
	private static Map<String, Object> buildJsonSchema(WorkbookModel workbook)
	{
		Map<String, Object> rootSchema = new LinkedHashMap<>();
		rootSchema.put("$schema", "http://json-schema.org/draft-07/schema#");
		rootSchema.put("type", "object");

		// root properties
		Map<String, Object> rootProps = new LinkedHashMap<>();
		rootProps.put("name", Map.of("type", "string", "enum", List.of(workbook.getName())));
		rootProps.put("@entity", Map.of("type", "string", "enum", List.of(workbook.getEntity())));

		// Build the "sheets" schema
		Map<String, Object> sheetsSchema = new LinkedHashMap<>();
		sheetsSchema.put("type", "array");
		List<Map<String, Object>> sheetOneOf = new ArrayList<>();
		for (SheetModel sheet : workbook.getSheets())
		{
			sheetOneOf.add(buildSheetSchema(sheet));
		}
		sheetsSchema.put("items", Map.of("oneOf", sheetOneOf));

		rootProps.put("sheets", sheetsSchema);

		rootSchema.put("properties", rootProps);
		rootSchema.put("required", List.of("name", "@entity", "sheets"));

		return rootSchema;
	}

	/**
	 * A "sheet" is something like: { "type": "object", "properties": { "name": {...}, "@entity": {...}, "blocks": {
	 * "type": "array", "items": { "oneOf": [ {... block schema ...}, ... ] } } }, "required": [...] }
	 */
	private static Map<String, Object> buildSheetSchema(SheetModel sheet)
	{
		Map<String, Object> schema = new LinkedHashMap<>();
		schema.put("type", "object");
		Map<String, Object> props = new LinkedHashMap<>();

		props.put("name", Map.of("type", "string", "enum", List.of(sheet.getName())));
		props.put("@entity", Map.of("type", "string", "enum", List.of(sheet.getEntity())));

		// blocks -> array -> items -> oneOf
		List<Map<String, Object>> blocksOneOf = new ArrayList<>();
		for (BlockModel block : sheet.getBlocks())
		{
			if ("list".equals(block.getEntity()))
			{
				blocksOneOf.add(buildListBlockSchema(block));
			}
			else
			{
				blocksOneOf.add(buildTableBlockSchema(block));
			}
		}
		Map<String, Object> blocksSchema = new LinkedHashMap<>();
		blocksSchema.put("type", "array");
		blocksSchema.put("items", Map.of("oneOf", blocksOneOf));

		props.put("blocks", blocksSchema);

		schema.put("properties", props);
		schema.put("required", List.of("name", "@entity", "blocks"));

		return schema;
	}

	/**
	 * For a list block, we generate: { "type": "object", "properties": { "name": {...enum [blockName]}, "@entity": {
	 * "type":"string", "enum":["list"] }, "items": { "type": "array", "items": { "type": "object", "properties": {
	 * ...all fields... }, "additionalProperties": false } } }, "required":["name","@entity","items"] }
	 *
	 * We gather all field definitions into "properties".
	 */
	private static Map<String, Object> buildListBlockSchema(BlockModel block)
	{
		Map<String, Object> schema = new LinkedHashMap<>();
		schema.put("type", "object");

		Map<String, Object> props = new LinkedHashMap<>();
		props.put("name", Map.of("type", "string", "enum", List.of(block.getName())));
		props.put("@entity", Map.of("type", "string", "enum", List.of("list")));

		// We'll treat all "fields" as "properties" in the item object
		Map<String, Object> itemProps = new LinkedHashMap<>();
		for (BlockField bf : block.getFields())
		{
			Map<String, Object> fieldSchema = buildFieldSchema(bf);
			itemProps.put(bf.getFieldName(), fieldSchema);
		}

		Map<String, Object> itemsObj = new LinkedHashMap<>();
		itemsObj.put("type", "array");
		itemsObj.put("items", Map.of("type", "object", "properties", itemProps, "additionalProperties", false));

		props.put("items", itemsObj);

		schema.put("properties", props);
		schema.put("required", List.of("name", "@entity", "items"));

		return schema;
	}

	/**
	 * For the "header", we construct an array of items, where each item is e.g. {"type":"string","enum":["actor_id"]}
	 * for the first column, {"type":"string","enum":["name"]} for the second, etc.
	 * 
	 * That enforces the exact sequence and that each position is a string, matching one of the known column names.
	 */
	private static Map<String, Object> buildTableBlockSchema(BlockModel block)
	{
		Map<String, Object> schema = new LinkedHashMap<>();
		schema.put("type", "object");

		Map<String, Object> props = new LinkedHashMap<>();
		props.put("name", Map.of("type", "string", "enum", List.of(block.getName())));
		props.put("@entity", Map.of("type", "string", "enum", List.of("table")));

		// 1) Build the header as a fixed-length array of string items, each with an enum constraint:
		List<Map<String, Object>> headerItems = new ArrayList<>();
		for (BlockField bf : block.getFields())
		{
			Map<String, Object> colSchema = new LinkedHashMap<>();
			colSchema.put("type", "string");
			colSchema.put("enum", Collections.singletonList(bf.getFieldName()));
			headerItems.add(colSchema);
		}
		var headerSize = headerItems.size();

		// Then wrap that in an array schema with no extra items allowed:
		Map<String, Object> headerSchema = new LinkedHashMap<>();
		headerSchema.put("type", "array");
		headerSchema.put("items", headerItems);
		headerSchema.put("additionalItems", false);
		// enforce exact minItems/maxItems to match the # of columns:
		headerSchema.put("minItems", headerSize);
		headerSchema.put("maxItems", headerSize);

		props.put("header", headerSchema);

		// 2) "rows" is the same as before—an array of arrays.
		// Each column’s constraints come from buildFieldSchema(bf).
		List<Map<String, Object>> columnSchemas = new ArrayList<>();
		for (BlockField bf : block.getFields())
		{
			columnSchemas.add(buildFieldSchema(bf));
		}
		Map<String, Object> rowItemsSchema = new LinkedHashMap<>();
		rowItemsSchema.put("type", "array");
		rowItemsSchema.put("items", columnSchemas);
		rowItemsSchema.put("additionalItems", false);
		// enforce exact minItems/maxItems to match the # of columns:
		rowItemsSchema.put("minItems", headerSize);
		rowItemsSchema.put("maxItems", headerSize);

		props.put("rows", Map.of("type", "array", "items", rowItemsSchema));

		schema.put("properties", props);
		schema.put("required", List.of("name", "@entity", "header", "rows"));
		return schema;
	}

	/**
	 * Converts a single "BlockField" (nullAllowed, pattern, enum, etc.) into a JSON Schema snippet. In a real
	 * implementation, you might also set "required" at a higher level if nullAllowed=No, but here we handle it by
	 * making the type either the declared type or [declaredType,"null"].
	 */
	private static Map<String, Object> buildFieldSchema(BlockField bf)
	{
		Map<String, Object> fieldSchema = new LinkedHashMap<>();

		// Type
		if ("No".equalsIgnoreCase(bf.getNullAllowed()))
		{
			fieldSchema.put("type", bf.getType());
		}
		else
		{
			// e.g. ["string","null"]
			List<String> typeList = new ArrayList<>();
			typeList.add(bf.getType());
			typeList.add("null");
			fieldSchema.put("type", typeList);
		}

		// numeric fields
		if (!isNullOrEmpty(bf.getMinimum()))
		{
			try
			{
				fieldSchema.put("minimum", Double.parseDouble(bf.getMinimum()));
			}
			catch (NumberFormatException e)
			{
				/* ignore */ }
		}
		if (!isNullOrEmpty(bf.getMaximum()))
		{
			try
			{
				fieldSchema.put("maximum", Double.parseDouble(bf.getMaximum()));
			}
			catch (NumberFormatException e)
			{
				/* ignore */ }
		}

		// string lengths
		if (!isNullOrEmpty(bf.getMinLength()))
		{
			try
			{
				fieldSchema.put("minLength", Integer.valueOf(bf.getMinLength()));
			}
			catch (NumberFormatException e)
			{
				/* ignore */ }
		}
		if (!isNullOrEmpty(bf.getMaxLength()))
		{
			try
			{
				fieldSchema.put("maxLength", Integer.valueOf(bf.getMaxLength()));
			}
			catch (NumberFormatException e)
			{
				/* ignore */ }
		}

		if (!isNullOrEmpty(bf.getFormat()))
		{
			fieldSchema.put("format", bf.getFormat());
		}
		if (!isNullOrEmpty(bf.getPattern()))
		{
			fieldSchema.put("pattern", bf.getPattern());
		}
		if (!isNullOrEmpty(bf.getEnumValues()))
		{
			String[] arr = bf.getEnumValues().split("\\s*,\\s*");
			fieldSchema.put("enum", Arrays.asList(arr));
		}
		if (!isNullOrEmpty(bf.getDescription()))
		{
			fieldSchema.put("description", bf.getDescription());
		}
		if (!isNullOrEmpty(bf.getExamples()))
		{
			// If you want multiple examples, you could parse them into a list. For now, store as single item.
			fieldSchema.put("examples", List.of(bf.getExamples()));
		}

		return fieldSchema;
	}

	private static boolean isNullOrEmpty(String s)
	{
		return (s == null || s.trim().isEmpty());
	}

	// -------------------------------------------------------------------------
	// PART 3: DE-DUPLICATE BLOCK SCHEMAS
	// -------------------------------------------------------------------------

	/**
	 * Walk the final schema, find all block definitions in
	 * "sheets->items->oneOf[*]->properties->blocks->items->oneOf[*]", canonicalize them, detect duplicates, and
	 * reference them from a top-level definitions instead of inlining.
	 */
	@SuppressWarnings("unchecked")
	private static Map<String, Object> deduplicateBlocks(Map<String, Object> rootSchema)
	{
		// 1) Collect all block schemas
		List<BlockLocation> blockLocations = findAllBlockSchemas(rootSchema);

		// 2) Count usage by canonical JSON
		Map<String, Integer> usageCount = new HashMap<>();
		for (BlockLocation loc : blockLocations)
		{
			String canon = toCanonicalJson(loc.blockSchema);
			usageCount.put(canon, usageCount.getOrDefault(canon, 0) + 1);
		}

		// 3) For any repeated definition, we'll assign a definition name
		Map<String, String> repeatedCanonToDefName = new LinkedHashMap<>();
		for (Map.Entry<String, Integer> e : usageCount.entrySet())
		{
			if (e.getValue() > 1)
			{
				String canon = e.getKey();
				// find the block name from the schema
				Map<String, Object> blockMap = fromCanonicalJson(canon);
				Map<String, Object> props = (Map<String, Object>) blockMap.get("properties");
				Map<String, Object> nameProp = (Map<String, Object>) props.get("name");
				List<String> blockNameEnum = (List<String>) nameProp.get("enum");
				String blockName = blockNameEnum.get(0);
				// generate a short hash
				int hash = Math.abs(canon.hashCode());
				repeatedCanonToDefName.put(canon, blockName + "_" + hash);
			}
		}

		// 4) Build the definitions map
		Map<String, Object> definitions = new LinkedHashMap<>();
		for (String canon : repeatedCanonToDefName.keySet())
		{
			String defName = repeatedCanonToDefName.get(canon);
			Map<String, Object> blockMap = fromCanonicalJson(canon);
			definitions.put(defName, blockMap);
		}

		// 5) Replace inlined repeated blocks with $ref
		for (BlockLocation loc : blockLocations)
		{
			String canon = toCanonicalJson(loc.blockSchema);
			if (repeatedCanonToDefName.containsKey(canon))
			{
				String defName = repeatedCanonToDefName.get(canon);
				// replace with {"$ref":"#/definitions/defName"}
				Map<String, Object> refObj = new HashMap<>();
				refObj.put("$ref", "#/definitions/" + defName);
				loc.blocksOneOf.set(loc.index, refObj);
			}
		}

		return definitions;
	}

	@SuppressWarnings("unchecked")
	private static List<BlockLocation> findAllBlockSchemas(Map<String, Object> rootSchema)
	{
		List<BlockLocation> results = new ArrayList<>();
		Map<String, Object> props = (Map<String, Object>) rootSchema.get("properties");
		if (props == null)
			return results;
		Map<String, Object> sheets = (Map<String, Object>) props.get("sheets");
		if (sheets == null)
			return results;
		Map<String, Object> sheetsItems = (Map<String, Object>) sheets.get("items");
		if (sheetsItems == null)
			return results;
		Object oneOfSheetsObj = sheetsItems.get("oneOf");
		if (!(oneOfSheetsObj instanceof List))
			return results;
		List<Map<String, Object>> sheetSchemas = (List<Map<String, Object>>) oneOfSheetsObj;

		for (Map<String, Object> sheetSchema : sheetSchemas)
		{
			Map<String, Object> sheetProps = (Map<String, Object>) sheetSchema.get("properties");
			if (sheetProps == null)
				continue;
			Map<String, Object> blocks = (Map<String, Object>) sheetProps.get("blocks");
			if (blocks == null)
				continue;
			Map<String, Object> blocksItems = (Map<String, Object>) blocks.get("items");
			if (blocksItems == null)
				continue;
			Object blocksOneOfObj = blocksItems.get("oneOf");
			if (!(blocksOneOfObj instanceof List))
				continue;
			List<Map<String, Object>> blocksOneOfList = (List<Map<String, Object>>) blocksOneOfObj;

			for (int i = 0; i < blocksOneOfList.size(); i++)
			{
				Map<String, Object> blockSchema = blocksOneOfList.get(i);
				results.add(new BlockLocation(blocksOneOfList, i, blockSchema));
			}
		}

		return results;
	}

	private static class BlockLocation
	{

		List<Map<String, Object>> blocksOneOf;

		int index;

		Map<String, Object> blockSchema;

		public BlockLocation(List<Map<String, Object>> blocksOneOf, int index, Map<String, Object> blockSchema)
		{
			this.blocksOneOf = blocksOneOf;
			this.index = index;
			this.blockSchema = blockSchema;
		}
	}

	// -------------------------------------------------------------------------
	// CANONICAL JSON UTILS (to detect duplicates)
	// -------------------------------------------------------------------------
	private static String toCanonicalJson(Map<String, Object> map)
	{
		// Easiest is to rely on Jackson with a sorted keys factory or do your own recursion.
		// We'll do a short approach with Jackson's "ObjectMapper" but with stable key ordering.
		try
		{
			ObjectMapper om = new ObjectMapper();
			// You could register a SortedMap module or do something else for stable ordering,
			// but for demonstration let's do a small manual step:
			// 1) Convert map to "TreeMap" recursively
			// 2) Then write as JSON
			Map<String, Object> stableMap = toTreeMapRecursive(map);
			return om.writeValueAsString(stableMap);
		}
		catch (Exception e)
		{
			throw new RuntimeException(e);
		}
	}

	@SuppressWarnings("unchecked")
	private static Map<String, Object> fromCanonicalJson(String canonical)
	{
		try
		{
			ObjectMapper om = new ObjectMapper();
			return om.readValue(canonical, Map.class);
		}
		catch (Exception e)
		{
			throw new RuntimeException(e);
		}
	}

	private static Map<String, Object> toTreeMapRecursive(Map<String, Object> original)
	{
		Map<String, Object> tree = new TreeMap<>();
		for (Map.Entry<String, Object> e : original.entrySet())
		{
			Object val = e.getValue();
			tree.put(e.getKey(), convertValue(val));
		}
		return tree;
	}

	@SuppressWarnings("unchecked")
	private static Object convertValue(Object val)
	{
		if (val instanceof Map)
		{
			return toTreeMapRecursive((Map<String, Object>) val);
		}
		else if (val instanceof List)
		{
			List<Object> list = (List<Object>) val;
			List<Object> newList = new ArrayList<>();
			for (Object o : list)
			{
				newList.add(convertValue(o));
			}
			return newList;
		}
		return val;
	}

	// -------------------------------------------------------------------------
	// SIMPLE MODEL CLASSES
	// -------------------------------------------------------------------------

	private static class WorkbookModel
	{

		private String name;

		private String entity;

		private List<SheetModel> sheets;

		public String getName()
		{
			return name;
		}

		public void setName(String name)
		{
			this.name = name;
		}

		public String getEntity()
		{
			return entity;
		}

		public void setEntity(String entity)
		{
			this.entity = entity;
		}

		public List<SheetModel> getSheets()
		{
			return sheets;
		}

		public void setSheets(List<SheetModel> sheets)
		{
			this.sheets = sheets;
		}
	}

	private static class SheetModel
	{

		private String name;

		private String entity;

		private List<BlockModel> blocks;

		public String getName()
		{
			return name;
		}

		public void setName(String name)
		{
			this.name = name;
		}

		public String getEntity()
		{
			return entity;
		}

		public void setEntity(String entity)
		{
			this.entity = entity;
		}

		public List<BlockModel> getBlocks()
		{
			return blocks;
		}

		public void setBlocks(List<BlockModel> blocks)
		{
			this.blocks = blocks;
		}
	}

	private static class BlockModel
	{

		private String name;

		private String entity;

		private List<BlockField> fields;

		public String getName()
		{
			return name;
		}

		public void setName(String name)
		{
			this.name = name;
		}

		public String getEntity()
		{
			return entity;
		}

		public void setEntity(String entity)
		{
			this.entity = entity;
		}

		public List<BlockField> getFields()
		{
			return fields;
		}

		public void setFields(List<BlockField> fields)
		{
			this.fields = fields;
		}
	}

	private static class BlockField
	{

		private String fieldName;

		private String nullAllowed;

		private String type;

		private String format;

		private String minimum;

		private String maximum;

		private String minLength;

		private String maxLength;

		private String pattern;

		private String enumValues;

		private String description;

		private String examples;

		public String getFieldName()
		{
			return fieldName;
		}

		public void setFieldName(String fieldName)
		{
			this.fieldName = fieldName;
		}

		public String getFormat()
		{
			return format;
		}

		public void setFormat(String format)
		{
			this.format = format;
		}

		public String getNullAllowed()
		{
			if (this.nullAllowed == null)
			{
				this.nullAllowed = "Yes";
			}
			return nullAllowed;
		}

		public void setNullAllowed(String nullAllowed)
		{
			this.nullAllowed = nullAllowed;
		}

		public String getType()
		{
			return type;
		}

		public void setType(String type)
		{
			this.type = type;
		}

		public String getMinimum()
		{
			return minimum;
		}

		public void setMinimum(String minimum)
		{
			this.minimum = minimum;
		}

		public String getMaximum()
		{
			return maximum;
		}

		public void setMaximum(String maximum)
		{
			this.maximum = maximum;
		}

		public String getMinLength()
		{
			return minLength;
		}

		public void setMinLength(String minLength)
		{
			this.minLength = minLength;
		}

		public String getMaxLength()
		{
			return maxLength;
		}

		public void setMaxLength(String maxLength)
		{
			this.maxLength = maxLength;
		}

		public String getPattern()
		{
			return pattern;
		}

		public void setPattern(String pattern)
		{
			this.pattern = pattern;
		}

		public String getEnumValues()
		{
			return enumValues;
		}

		public void setEnumValues(String enumValues)
		{
			this.enumValues = enumValues;
		}

		public String getDescription()
		{
			return description;
		}

		public void setDescription(String description)
		{
			this.description = description;
		}

		public String getExamples()
		{
			return examples;
		}

		public void setExamples(String examples)
		{
			this.examples = examples;
		}
	}
}
