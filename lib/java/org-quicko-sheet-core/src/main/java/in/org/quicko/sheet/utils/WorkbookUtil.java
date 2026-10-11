package in.org.quicko.sheet.utils;

import java.io.IOException;
import java.math.BigDecimal;
import java.math.BigInteger;

import org.apache.poi.ss.usermodel.HorizontalAlignment;
import org.apache.poi.ss.usermodel.VerticalAlignment;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFCell;
import org.apache.poi.xssf.usermodel.XSSFCellStyle;
import org.apache.poi.xssf.usermodel.XSSFRow;
import org.apache.poi.xssf.usermodel.XSSFSheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.json.JSONArray;

import in.org.quicko.sheet.beans.Item;
import in.org.quicko.sheet.beans.Sheet;
import in.org.quicko.sheet.beans.Workbook;

/**
 * Java equivalent of the Node.js WorkbookConverter class. Uses Apache POI to read/write XLSX files.
 */
public class WorkbookUtil
{

	/**
	 * Converts the workbook into an Excel byte array.
	 *
	 * @return Byte array representing the workbook.
	 * @throws IOException
	 *             If an error occurs during conversion.
	 */
	public static XSSFWorkbook toExcel(Workbook workbook) throws IOException
	{
		XSSFWorkbook excelWorkbook = new XSSFWorkbook();

		for (int i = 0; i < workbook.getSheets().size(); i++)
		{
			Sheet sheet = workbook.getSheets().get(i);

			// Create a new sheet
			String sheetName = sheet.getName();

			XSSFSheet spreadSheet = excelWorkbook.createSheet(sheetName);

			int rowNum = 1;

			for (int j = 0; j < sheet.getBlocks().size(); j++)
			{

				if (sheet.getBlock(j) instanceof in.org.quicko.sheet.beans.Table)
				{
					in.org.quicko.sheet.beans.Table table = (in.org.quicko.sheet.beans.Table) sheet.getBlock(j);

					// merge cells for table title
					CellRangeAddress mergedRegion =
					        new CellRangeAddress(rowNum, rowNum, 0, table.getHeader().length() - 1);
					spreadSheet.addMergedRegion(mergedRegion);

					// set value and formating of title cell
					XSSFRow titleRow = spreadSheet.createRow(rowNum);
					XSSFCell titleCell = titleRow.createCell(0);
					String tableName = table.getName();

					titleCell.setCellValue(tableName);
					XSSFCellStyle style = excelWorkbook.createCellStyle();
					style.setAlignment(HorizontalAlignment.CENTER);
					style.setVerticalAlignment(VerticalAlignment.CENTER);
					titleCell.setCellStyle(style);

					rowNum += 2;

					// Create header row
					XSSFRow headerRow = spreadSheet.createRow(rowNum++);
					for (int k = 0; k < table.getHeader().length(); k++)
					{
						String headerValue = table.getHeader().getString(k);

						headerRow.createCell(k).setCellValue(headerValue);
					}

					// Create data rows
					for (int l = 0; l < table.getRows().length(); l++)
					{
						XSSFRow spreadSheetRow = spreadSheet.createRow(rowNum++);
						JSONArray row = table.getRow(l);
						for (int m = 0; m < row.length(); m++)
						{

							Object data = row.isNull(m) ? null : row.get(m);

							if (data == null || data.toString().equals("null"))
							{
								spreadSheetRow.createCell(m);
							}
							else if (data instanceof String)
							{
								spreadSheetRow.createCell(m).setCellValue((String) data);
							}
							else if (data instanceof BigDecimal)
							{
								spreadSheetRow.createCell(m).setCellValue(((BigDecimal) data).doubleValue());
							}
							else if (data instanceof Integer)
							{
								spreadSheetRow.createCell(m).setCellValue((Integer) data);
							}
							else if (data instanceof Double)
							{
								spreadSheetRow.createCell(m).setCellValue((Double) data);
							}
							else if (data instanceof Long)
							{
								spreadSheetRow.createCell(m).setCellValue((Long) data);
							}
							else
							{
								spreadSheetRow.createCell(m).setCellValue(data.toString());
							}
						}
					}

					// Autosize columns
					for (int n = 0; n < table.getHeader().length(); n++)
					{
						spreadSheet.autoSizeColumn(n);
					}

				}
				else if (sheet.getBlock(j) instanceof in.org.quicko.sheet.beans.List)
				{
					in.org.quicko.sheet.beans.List list = (in.org.quicko.sheet.beans.List) sheet.getBlock(j);

					final int columnCount = 2;

					// merge cells for list title
					CellRangeAddress mergedRegion = new CellRangeAddress(rowNum, rowNum, 0, columnCount - 1);
					spreadSheet.addMergedRegion(mergedRegion);

					// set value and formating of title cell
					XSSFRow titleRow = spreadSheet.createRow(rowNum);
					XSSFCell titleCell = titleRow.createCell(0);
					String listName = list.getName();

					titleCell.setCellValue(listName);
					XSSFCellStyle style = excelWorkbook.createCellStyle();
					style.setAlignment(HorizontalAlignment.CENTER);
					style.setVerticalAlignment(VerticalAlignment.CENTER);
					titleCell.setCellStyle(style);

					rowNum += 2;

					// Create data rows

					for (int l = 0; l < list.getItems().size(); l++)
					{
						XSSFRow spreadSheetRow = spreadSheet.createRow(rowNum++);

						Item item = list.getItems().get(l);

						if (item == null || item.getKey() == null)
						{
							spreadSheetRow.createCell(0);
						}

						if (item == null || item.getValue() == null)
						{
							spreadSheetRow.createCell(1);
						}
						else
						{
							if (item.getValue() instanceof String)
							{
								spreadSheetRow.createCell(1).setCellValue(item.getStringValue());
							}
							else if (item.getValue() instanceof BigDecimal)
							{
								spreadSheetRow.createCell(1).setCellValue(item.getBigDecimalValue().toString());
							}
							else if (item.getValue() instanceof BigInteger)
							{
								spreadSheetRow.createCell(1).setCellValue(item.getBigIntegerValue().toString());
							}
							else if (item.getValue() instanceof Boolean)
							{
								spreadSheetRow.createCell(1).setCellValue(item.getBooleanValue());
							}
							else if (item.getValue() instanceof Long)
							{
								spreadSheetRow.createCell(1).setCellValue(item.getLongValue());
							}
							else if (item.getValue() instanceof Double)
							{
								spreadSheetRow.createCell(1).setCellValue(item.getDoubleValue());
							}
							else if (item.getValue() instanceof Integer)
							{
								spreadSheetRow.createCell(1).setCellValue(item.getIntegerValue());
							}
							else
							{
								spreadSheetRow.createCell(1).setCellValue(item.getValue().toString());
							}

						}

					}

					// Autosize columns
					for (int n = 0; n < columnCount; n++)
					{
						spreadSheet.autoSizeColumn(n);
					}
				}

				rowNum += 2;

			}

		}

		return excelWorkbook;

	}

}
