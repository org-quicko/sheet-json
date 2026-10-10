package in.org.quicko.sheet.beans;

import org.junit.platform.suite.api.SelectClasses;
import org.junit.platform.suite.api.Suite;

/**
 * Test suite to run all test classes for the org.quicko.sheet.beans package.
 */
@Suite
@SelectClasses({BaseObjectTest.class, BlockTest.class, ItemTest.class, ListTest.class, SheetTest.class, TableTest.class,
        WorkbookTest.class})
public class TestSuite
{
}
