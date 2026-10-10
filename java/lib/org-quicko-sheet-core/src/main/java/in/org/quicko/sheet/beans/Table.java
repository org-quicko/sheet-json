package in.org.quicko.sheet.beans;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.annotation.JsonTypeName;

import org.json.JSONArray;

/**
 * Represents a table block containing rows and headers.
 */
@JsonTypeName("table")
@JsonIgnoreProperties(ignoreUnknown = true)
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.EXISTING_PROPERTY, property = "name", visible = true)
public class Table extends Block
{

	private static final long serialVersionUID = 1448946789438450220L;

	@JsonProperty("header")
	private JSONArray header;

	@JsonProperty("rows")
	private JSONArray rows;

	/**
	 * Default constructor.
	 */
	public Table()
	{
		super("table");
	}

	/**
	 * Retrieves the table header.
	 *
	 * @return JSONArray representing the table header.
	 */
	public JSONArray getHeader()
	{
		if (this.header == null)
		{
			this.header = new JSONArray();
		}
		return header;
	}

	public void setHeader(JSONArray header)
	{
		if (this.header == null)
		{
			this.header = header;
		}
		else
		{
			this.header.clear();

			this.header.put(header);
		}

	}

	/**
	 * Retrieves all rows in the table.
	 *
	 * @return JSONArray representing the rows.
	 */
	public JSONArray getRows()
	{
		if (this.rows == null)
		{
			this.rows = new JSONArray();
		}
		return this.rows;
	}

	/**
	 * Retrieves a row by index.
	 *
	 * @param index
	 *            Index of the row.
	 * @return JSONArray representing the row.
	 */
	public JSONArray getRow(int index)
	{
		if (index < this.getRows().length())
		{
			return this.getRows().getJSONArray(index);
		}
		throw new ArrayIndexOutOfBoundsException(index);
	}

	/**
	 * Adds a new row to the table.
	 *
	 * @param row
	 *            JSONArray representing the row.
	 */
	public void addRow(JSONArray row)
	{
		this.getRows().put(row);
	}

	/**
	 * Adds multiple rows to the table.
	 *
	 * @param rows
	 *            JSONArray representing multiple rows.
	 */
	public void addRows(JSONArray rows)
	{
		rows.forEach(row -> this.getRows().put(row));
	}

	/**
	 * Replaces an existing row with a new one.
	 *
	 * @param index
	 *            Index of the row to replace.
	 * @param row
	 *            JSONArray representing the new row.
	 */
	public void replaceRow(int index, JSONArray row)
	{
		this.getRows().put(index, row);
	}

	/**
	 * Removes a row by its index.
	 *
	 * @param index
	 *            Index of the row to remove.
	 */
	public void removeRow(int index)
	{
		this.getRows().remove(index);
	}

	/**
	 * Retrieves the number of rows in the table.
	 *
	 * @return Number of rows.
	 */
	public int size()
	{
		return this.getRows().length();
	}
}
