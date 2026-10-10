package in.org.quicko.sheet.beans;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.annotation.JsonTypeName;

/**
 * Represents a workbook containing multiple sheets.
 */
@JsonTypeName("workbook")
@JsonIgnoreProperties(ignoreUnknown = true)
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.EXISTING_PROPERTY, property = "name", visible = true)
public class Workbook extends BaseObject
{

	private static final long serialVersionUID = -7590098645061234237L;

	@JsonProperty("sheets")
	private java.util.List<Sheet> sheets;

	/**
	 * Default constructor.
	 */
	public Workbook()
	{
		super("workbook");
	}

	/**
	 * Retrieves all sheets in the workbook.
	 *
	 * @return JSONArray of sheets.
	 */
	public java.util.List<Sheet> getSheets()
	{
		if (this.sheets == null)
		{
			this.sheets = new java.util.ArrayList<Sheet>();
		}
		return this.sheets;
	}

	/**
	 * Retrieves a sheet by its index.
	 *
	 * @param index
	 *            Index of the sheet.
	 * @return The sheet at the specified index.
	 */
	protected Sheet getSheet(int index)
	{
		if (index <= this.getSheets().size())
		{
			return (Sheet) this.getSheets().get(index);
		}
		throw new ArrayIndexOutOfBoundsException(index);
	}

	/**
	 * Retrieves a sheet by its name.
	 *
	 * @param name
	 *            Name of the sheet.
	 * @return The matching sheet or null if not found.
	 */
	protected Sheet getSheet(String name)
	{
		for (int i = 0; i < this.getSheets().size(); i++)
		{
			Sheet sheet = this.getSheet(i);

			if (sheet.getName().equalsIgnoreCase(name))
			{
				return sheet;
			}
		}
		return null;
	}

	/**
	 * Adds a sheet to the workbook.
	 *
	 * @param sheet
	 *            Sheet to add.
	 */
	protected void addSheet(Sheet sheet)
	{
		this.getSheets().add(sheet);
	}

	/**
	 * Adds multiple sheets to the workbook.
	 *
	 * @param sheets
	 *            JSONArray of sheets to add.
	 */
	protected void addSheets(java.util.List<Sheet> sheets)
	{
		this.getSheets().addAll(sheets);
	}

	/**
	 * Replaces an existing sheet with a new one.
	 *
	 * @param sheet
	 *            The new sheet to replace the old one.
	 */
	public void replaceSheet(Sheet sheet)
	{
		for (int i = 0; i < this.getSheets().size(); i++)
		{
			if (this.getSheet(i).getName().equalsIgnoreCase(sheet.getName()))
			{
				this.getSheets().set(i, sheet);
				break;
			}
		}

	}

	/**
	 * Removes a sheet by its index.
	 *
	 * @param index
	 *            Index of the sheet to remove.
	 */
	protected void removeSheet(int index)
	{
		this.getSheets().remove(index);
	}

	/**
	 * Removes a sheet by its name.
	 *
	 * @param name
	 *            Name of the sheet to remove.
	 */
	public void removeSheet(String name)
	{
		for (int i = 0; i < this.getSheets().size(); i++)
		{
			Sheet sheet = this.getSheet(i);

			if (sheet.getName().equalsIgnoreCase(name))
			{
				this.getSheets().remove(i);
				return;
			}
		}
	}

	/**
	 * Retrieves the number of sheets in the workbook.
	 *
	 * @return Number of blocks.
	 */
	public int size()
	{
		return this.getSheets().size();
	}

}
