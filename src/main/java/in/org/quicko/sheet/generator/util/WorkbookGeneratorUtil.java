package in.org.quicko.sheet.generator.util;

import tools.jackson.databind.JsonNode;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFCell;
import org.apache.poi.xssf.usermodel.XSSFRow;
import org.apache.poi.xssf.usermodel.XSSFSheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Utility class to generate Workbook classes.
 */
public class WorkbookGeneratorUtil
{

	private WorkbookGeneratorUtil()
	{
		// Private constructor to hide implicit public one
	}

	/**
	 * Generate workbook class with all sheet types
	 *
	 * @param schema
	 *            The JSON Schema to generate from
	 * @param sheetSchemas
	 *            The sheet schemas to include
	 * @param workbookDir
	 *            The directory to output the workbook class to
	 * @param classNames
	 *            Map to track generated class names
	 * @param packageName
	 *            The package name for the generated classes
	 * @throws IOException
	 *             If there's an error writing files
	 */
	public static void generate(JsonNode schema, JsonNode sheetSchemas, String workbookDir,
	        Map<String, String[]> classNames, String packageName) throws IOException
	{

		String workbookNameEnum = GeneratorUtil.getFirstEnum(schema, "name");
		String workbookClassName = GeneratorUtil
		        .sanitizeName(GeneratorUtil.capitalize(GeneratorUtil.toCamelCase(workbookNameEnum)), "Workbook");

		List<String> sheetImports = new ArrayList<>();
		List<String> sheetMethods = new ArrayList<>();

		for (JsonNode sheetSchema : sheetSchemas)
		{
			String sheetNameEnum = GeneratorUtil.getFirstEnum(sheetSchema, "name");
			String sheetClassName = GeneratorUtil
			        .sanitizeName(GeneratorUtil.capitalize(GeneratorUtil.toCamelCase(sheetNameEnum)), "Sheet");

			sheetImports
			        .add(String.format("import %s.sheets.%s.beans.%s;", packageName, sheetNameEnum, sheetClassName));

			String capitalizedName = GeneratorUtil.capitalize(GeneratorUtil.toCamelCase(sheetNameEnum));
			String camelCaseName = GeneratorUtil.toCamelCase(sheetNameEnum);
			sheetMethods.add(String.format("""
			        \t@JsonIgnore
			        \tpublic %s get%s()
			        \t{
			        \t\tif (super.getSheet(\"%s\") == null)
			        \t\t{
			        \t\t\tsuper.addSheet(new %s());
			        \t\t}
			        \t\treturn (%s) super.getSheet(\"%s\");
			        \t}

			        \tpublic void add%s(%s %s)
			        \t{
			        \t\tsuper.addSheet(%s);
			        \t}
			        """, sheetClassName, capitalizedName, sheetNameEnum, sheetClassName, sheetClassName, sheetNameEnum,
			        capitalizedName, sheetClassName, camelCaseName, camelCaseName));
		}

		String workbookClass = String
		        .format("""
		                package %s.workbooks.beans;

		                %s

		                import com.fasterxml.jackson.annotation.JsonIgnore;
		                import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
		                import com.fasterxml.jackson.annotation.JsonTypeInfo;
		                import com.fasterxml.jackson.annotation.JsonTypeName;
		                import in.org.quicko.sheet.beans.Workbook;
		                %s

		                @JsonTypeName(\"%s\")
		                @JsonIgnoreProperties(ignoreUnknown = true)
		                @JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.EXISTING_PROPERTY, property = \"name\", visible = true)
		                public class %s extends Workbook {

		                \tprivate static final long serialVersionUID = %dL;

		                %s
		                }
		                                  """,
		                packageName, GeneratorUtil.AUTO_GEN_COMMENT, String.join("\n", sheetImports), workbookNameEnum,
		                workbookClassName, GeneratorUtil.generateSerialVersionUID(),
		                String.join("\n\n    ", sheetMethods))
		        .trim();

		Files.createDirectories(Paths.get(workbookDir + "/beans"));
		Files.writeString(Paths.get(workbookDir + "/beans", workbookClassName + ".java"), workbookClass);

		// track for mixin generation
		GeneratorUtil.updateClassNames(classNames, "workbook", packageName + ".workbooks.beans", workbookClassName);
	}

	/**
	 * Converts an Excel workbook into the JSON structure:
	 *
	 * { "name": &lt;workbookName&gt;, "@entity": "workbook", "sheets": [ { "name": &lt;sheetName&gt;, "@entity": "sheet", "blocks":
	 * [ { "name": &lt;blockTitle&gt;, "@entity": "table", "header": [...], "rows": [ [...], [...], ... ] }, { "name":
	 * &lt;blockTitle&gt;, "@entity": "list", "items": [ {key1: val1}, {key2: val2}, ... ] } ... ] }, ... ] }
	 *
	 * This version does *not* assume the block title is in column A, nor does it skip a fixed number of rows. It simply
	 * finds a merged region row =&gt; sees it as a block title =&gt; looks immediately at the following rows to parse a table
	 * or list, stopping when it hits a blank row or the next merged-region block title.
	 *
	 * @param file
	 *            The Excel file to parse
	 * @return A JSONObject representing the workbook
	 * @throws IOException
	 *             If there is an error reading the file
	 */
	public static JSONObject fromExcel(File file) throws IOException
	{

		String workbookName = file.getName();
		if (workbookName.contains("."))
		{
			workbookName = workbookName.substring(0, workbookName.lastIndexOf('.'));
		}

		XSSFWorkbook excelWorkbook = new XSSFWorkbook(new FileInputStream(file));

		// Top-level JSON
		JSONObject workbookJson = new JSONObject();
		workbookJson.put("name", workbookName);
		workbookJson.put("@entity", "workbook");

		JSONArray sheetsArray = new JSONArray();

		for (int s = 0; s < excelWorkbook.getNumberOfSheets(); s++)
		{
			XSSFSheet excelSheet = excelWorkbook.getSheetAt(s);

			JSONObject sheetJson = new JSONObject();
			sheetJson.put("name", excelSheet.getSheetName());
			sheetJson.put("@entity", "sheet");

			JSONArray blocksArray = new JSONArray();

			int rowIndex = 0;
			while (rowIndex <= excelSheet.getLastRowNum())
			{
				XSSFRow row = excelSheet.getRow(rowIndex);
				if (row == null)
				{
					rowIndex++;
					continue;
				}

				// Check if this row is a "block title row" by scanning merged regions
				String blockTitle = getMergedRegionTitle(excelSheet, rowIndex, row);
				if (blockTitle != null)
				{
					// We found a block's title in this row
					rowIndex++;

					// move forward until we find a non-empty row, that row decides if it's a table or list
					while (rowIndex <= excelSheet.getLastRowNum())
					{
						XSSFRow nextRow = excelSheet.getRow(rowIndex);
						if (nextRow == null || isRowCompletelyEmpty(nextRow))
						{
							rowIndex++;
							continue;
						}

						int nonEmptyCells = countNonEmptyCells(nextRow);

						// If the row has multiple columns, treat it as a table header
						int cellCount = nextRow.getLastCellNum();
						if (nonEmptyCells <= 2)
						{
							// Parse as a LIST
							JSONObject listJson = parseList(excelSheet, rowIndex, blockTitle);
							blocksArray.put(listJson);
							rowIndex = listJson.optInt("__lastRowRead", rowIndex);
							listJson.remove("__lastRowRead");
						}
						else
						{
							// Parse as a TABLE
							JSONObject tableJson = parseTable(excelSheet, rowIndex, blockTitle);
							blocksArray.put(tableJson);
							rowIndex = tableJson.optInt("__lastRowRead", rowIndex);
							tableJson.remove("__lastRowRead");
						}

						// Once we parse one block, break out so we resume from
						// the new rowIndex in the outer loop
						break;
					}
				}
				else
				{
					// not a block title row
					rowIndex++;
				}
			}

			sheetJson.put("blocks", blocksArray);
			sheetsArray.put(sheetJson);
		}

		workbookJson.put("sheets", sheetsArray);
		excelWorkbook.close();
		return workbookJson;
	}

	/**
	 * Helper to detect if rowIndex is the start of a merged region containing a textual title. We read the *first cell*
	 * in that merged region (whatever column it might be).
	 */
	private static String getMergedRegionTitle(XSSFSheet sheet, int rowIndex, XSSFRow row)
	{
		for (CellRangeAddress merged : sheet.getMergedRegions())
		{
			if (merged.getFirstRow() == rowIndex)
			{
				// read the cell at (rowIndex, merged.getFirstColumn())
				int colIndex = merged.getFirstColumn();
				XSSFCell cell = row.getCell(colIndex);
				if (cell != null && cell.getCellType() == CellType.STRING)
				{
					String title = cell.getStringCellValue().trim();
					if (!title.isEmpty())
					{
						return title;
					}
				}
			}
		}
		return null;
	}

	/**
	 * Parse a table block: { "name": blockTitle, "@entity": "table", "header": [...], "rows": [ [...], [...] ] }
	 *
	 * We assume rowIndex points to the "header" row. Then each subsequent row is data until we hit a blank row or a new
	 * block title.
	 */
	private static JSONObject parseTable(XSSFSheet sheet, int rowIndex, String blockTitle)
	{
		JSONObject tableJson = new JSONObject();
		tableJson.put("name", blockTitle);
		tableJson.put("@entity", "table");

		XSSFRow headerRow = sheet.getRow(rowIndex);
		// build header
		JSONArray headerArr = new JSONArray();
		if (headerRow != null)
		{
			for (int c = 0; c < headerRow.getLastCellNum(); c++)
			{
				XSSFCell cell = headerRow.getCell(c);
				String colName = cellToString(cell);
				headerArr.put(colName);
			}
		}
		tableJson.put("header", headerArr);

		// gather rows
		JSONArray rowsArr = new JSONArray();
		int currentRow = rowIndex + 1;
		while (currentRow <= sheet.getLastRowNum())
		{
			XSSFRow dataRow = sheet.getRow(currentRow);
			if (dataRow == null || isRowCompletelyEmpty(dataRow))
			{
				// blank => end of table
				break;
			}
			// if we see a new block's merged region => also stop
			String maybeBlockTitle = getMergedRegionTitle(sheet, currentRow, dataRow);
			if (maybeBlockTitle != null)
			{
				// new block => end here
				break;
			}

			// parse the data row
			JSONArray rowData = new JSONArray();
			for (int c = 0; c < headerArr.length(); c++)
			{
				XSSFCell cell = dataRow.getCell(c);
				rowData.put(getCellValue(cell));
			}
			rowsArr.put(rowData);
			currentRow++;
		}
		tableJson.put("rows", rowsArr);

		// store how far we read
		tableJson.put("__lastRowRead", currentRow);
		return tableJson;
	}

	/**
	 * Parse a list block: { "name": blockTitle, "@entity": "list", "items": [ {"key": value}, {"key2": value2}, ... ] }
	 *
	 * rowIndex points to the first (key,value) row. We read until a blank row or next block's merged region.
	 */
	private static JSONObject parseList(XSSFSheet sheet, int rowIndex, String blockTitle)
	{
		JSONObject listJson = new JSONObject();
		listJson.put("name", blockTitle);
		listJson.put("@entity", "list");

		JSONArray itemsArr = new JSONArray();
		int currentRow = rowIndex;
		while (currentRow <= sheet.getLastRowNum())
		{
			XSSFRow dataRow = sheet.getRow(currentRow);
			if (dataRow == null || isRowCompletelyEmpty(dataRow))
			{
				// blank => done
				break;
			}

			// new block?
			String maybeBlockTitle = getMergedRegionTitle(sheet, currentRow, dataRow);
			if (maybeBlockTitle != null)
			{
				// new block => stop
				break;
			}

			XSSFCell keyCell = dataRow.getCell(0);
			XSSFCell valueCell = dataRow.getCell(1);

			String key = cellToString(keyCell);
			Object value = getCellValue(valueCell);

			if (key.isEmpty() && value == null)
			{
				break;
			}

			JSONObject itemObj = new JSONObject();
			itemObj.put(key, value);
			itemsArr.put(itemObj);

			currentRow++;
		}

		listJson.put("items", itemsArr);
		listJson.put("__lastRowRead", currentRow);
		return listJson;
	}

	/** Returns true if row is completely empty (all cells null or blank). */
	private static boolean isRowCompletelyEmpty(XSSFRow row)
	{
		if (row == null)
			return true;
		for (int c = row.getFirstCellNum(); c < row.getLastCellNum(); c++)
		{
			XSSFCell cell = row.getCell(c);
			if (cell != null && cell.getCellType() != CellType.BLANK)
			{
				// If it’s a string cell with non-empty text, not empty
				if (cell.getCellType() == CellType.STRING && !cell.getStringCellValue().trim().isEmpty())
				{
					return false;
				}
				// If it’s numeric/boolean/formula with a value, not empty
				if (cell.getCellType() == CellType.NUMERIC || cell.getCellType() == CellType.BOOLEAN
				        || cell.getCellType() == CellType.FORMULA)
				{
					return false;
				}
			}
		}
		return true;
	}

	/**
	 * Convert a cell to a string, handling numeric/boolean/formula cells so we do not get "Cannot get a STRING value
	 * from a NUMERIC cell."
	 */
	private static String cellToString(Cell cell)
	{
		if (cell == null)
			return "";
		switch (cell.getCellType())
		{
			case STRING:
				return cell.getStringCellValue();
			case NUMERIC:
				double num = cell.getNumericCellValue();
				// if it’s an integer-like value, drop .0
				if (num == Math.floor(num))
				{
					return String.valueOf((long) num);
				}
				return String.valueOf(num);
			case BOOLEAN:
				return String.valueOf(cell.getBooleanCellValue());
			case FORMULA:
				// Could evaluate or just use cell.toString():
				return cell.toString();
			default:
				return "";
		}
	}

	/** Convert cell to an Object typed as Number/Boolean/String/Null. */
	private static Object getCellValue(Cell cell)
	{
		if (cell == null)
			return null;
		switch (cell.getCellType())
		{
			case STRING:
				return cell.getStringCellValue();
			case NUMERIC:
				double num = cell.getNumericCellValue();
				if (num == Math.floor(num))
				{
					// integer-like
					return (long) num;
				}
				return num;
			case BOOLEAN:
				return cell.getBooleanCellValue();
			case FORMULA:
				// Just return the cached formula result as numeric/string/boolean
				// For simplicity, call cellToString
				// or evaluate with a FormulaEvaluator if needed
				return cellToString(cell);
			default:
				return null;
		}
	}

	private static int countNonEmptyCells(XSSFRow row)
	{
		if (row == null)
			return 0;
		int count = 0;
		for (int c = row.getFirstCellNum(); c < row.getLastCellNum(); c++)
		{
			Cell cell = row.getCell(c);
			if (cell != null && cell.getCellType() != CellType.BLANK)
			{
				// If it’s string with non-empty text, or numeric/boolean/formula → it’s non-empty
				if (cell.getCellType() == CellType.STRING && !cell.getStringCellValue().trim().isEmpty())
				{
					count++;
				}
				else if (cell.getCellType() == CellType.NUMERIC || cell.getCellType() == CellType.BOOLEAN
				        || cell.getCellType() == CellType.FORMULA)
				{
					count++;
				}
			}
		}
		return count;
	}
}
