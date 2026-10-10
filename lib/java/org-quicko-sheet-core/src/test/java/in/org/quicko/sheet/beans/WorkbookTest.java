package in.org.quicko.sheet.beans;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import java.io.IOException;

import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.Test;

import in.org.quicko.sheet.utils.WorkbookUtil;

/**
 * Unit tests for Workbook class.
 */
public class WorkbookTest
{

	@Test
	public void testAddSheet()
	{
		Workbook workbook = new Workbook();
		Sheet sheet = new Sheet();
		workbook.addSheet(sheet);
		assertEquals(1, workbook.size());
	}

	@Test
	public void testToExcel() throws IOException
	{
		Workbook workbook = new Workbook();
		XSSFWorkbook excelData = WorkbookUtil.toExcel(workbook);
		assertNotNull(excelData);
	}

	@Test
	public void testWorkbookInitialization()
	{
		Workbook workbook = new Workbook();

		assertNotNull(workbook);
	}

	@Test
	public void testSetNameAndGetName()
	{
		Workbook workbook = new Workbook();

		assertEquals("workbook", workbook.getName());
	}

	@Test
	public void testSetEntityAndGetEntity()
	{
		Workbook workbook = new Workbook();

		assertEquals("workbook", workbook.getEntity());
	}

}
