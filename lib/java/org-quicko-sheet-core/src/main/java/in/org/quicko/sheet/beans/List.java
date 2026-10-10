package in.org.quicko.sheet.beans;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.annotation.JsonTypeName;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.util.ArrayList;

/**
 * Represents a list block containing multiple key-value items.
 */
@JsonTypeName("list")
@JsonIgnoreProperties(ignoreUnknown = true)
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.EXISTING_PROPERTY, property = "name", visible = true)
public class List extends Block
{

	private static final long serialVersionUID = 1273317298476706422L;

	@JsonProperty("items")
	private java.util.List<Item> items;

	/**
	 * Default constructor.
	 */
	public List()
	{
		super("list");
	}

	/**
	 * Retrieves all items in the list.
	 *
	 * @return JSONArray of items.
	 */
	public java.util.List<Item> getItems()
	{
		if (this.items == null)
		{
			this.items = new ArrayList<Item>();
		}
		return this.items;
	}

	/**
	 * Retrieves an item by its key.
	 *
	 * @param key
	 *            Key of the item.
	 * @return The matching item or null if not found.
	 */
	public Item getItem(String key)
	{
		for (int i = 0; i < this.getItems().size(); i++)
		{
			Item item = (Item) this.getItems().get(i);

			if (item.getKey().equalsIgnoreCase(key))
			{
				return item;
			}
		}
		return null;
	}

	/**
	 * Retrieves an item by its index.
	 *
	 * @param index
	 *            Index of the item.
	 * @return The item at the specified index or null if out of range.
	 */
	public Item getItem(int index)
	{
		if (this.getItems().size() > index)
		{
			return (Item) this.getItems().get(index);
		}
		return null;
	}

	/**
	 * Adds an item to the list.
	 *
	 * @param item
	 *            Item to add.
	 */
	public void addItem(Item item)
	{
		this.getItems().add(item);
	}

	/**
	 * Adds an item with a BigDecimal value.
	 *
	 * @param key
	 *            The key identifier for this item
	 * @param value
	 *            The BigDecimal value to store
	 */
	public void addItem(String key, BigDecimal value)
	{
		this.addItem(new Item(key, value));
	}

	/**
	 * Adds an item with a BigInteger value.
	 *
	 * @param key
	 *            The key identifier for this item
	 * @param value
	 *            The BigInteger value to store
	 */
	public void addItem(String key, BigInteger value)
	{
		this.addItem(new Item(key, value));
	}

	/**
	 * Adds an item with a Boolean value.
	 *
	 * @param key
	 *            The key identifier for this item
	 * @param value
	 *            The Boolean value to store
	 */
	public void addItem(String key, Boolean value)
	{
		this.addItem(new Item(key, value));
	}

	/**
	 * Adds an item with a Double value.
	 *
	 * @param key
	 *            The key identifier for this item
	 * @param value
	 *            The Double value to store
	 */
	public void addItem(String key, Double value)
	{
		this.addItem(new Item(key, value));
	}

	/**
	 * Adds an item with a Float value.
	 *
	 * @param key
	 *            The key identifier for this item
	 * @param value
	 *            The Float value to store
	 */
	public void addItem(String key, Float value)
	{
		this.addItem(new Item(key, value));
	}

	/**
	 * Adds an item with an Integer value.
	 *
	 * @param key
	 *            The key identifier for this item
	 * @param value
	 *            The Integer value to store
	 */
	public void addItem(String key, Integer value)
	{
		this.addItem(new Item(key, value));
	}

	/**
	 * Adds an item with a Long value.
	 *
	 * @param key
	 *            The key identifier for this item
	 * @param value
	 *            The Long value to store
	 */
	public void addItem(String key, Long value)
	{
		this.addItem(new Item(key, value));
	}

	/**
	 * Adds an item with a String value.
	 *
	 * @param key
	 *            The key identifier for this item
	 * @param value
	 *            The String value to store
	 */
	public void addItem(String key, String value)
	{
		this.addItem(new Item(key, value));
	}

	/**
	 * Replaces an existing item with a new one.
	 *
	 * @param item
	 *            The new item to replace the old one.
	 */
	public void replaceItem(int index, Item item)
	{
		this.getItems().set(index, item);
	}

	/**
	 * Replaces an existing item with a new one.
	 *
	 * @param item
	 *            The new item to replace the old one.
	 */
	public void replaceItem(Item item)
	{
		for (int i = 0; i < this.getItems().size(); i++)
		{
			// check if the key matches
			if (this.getItems().get(i) != null && this.getItems().get(i).getKey().equalsIgnoreCase(item.getKey()))
			{
				this.getItems().set(i, item);

				break;
			}
		}
	}

	/**
	 * Removes an item by its index.
	 *
	 * @param index
	 *            Index of the item to remove.
	 */
	public void removeItem(int index)
	{
		this.getItems().remove(index);
	}

	/**
	 * Removes an item by its key.
	 *
	 * @param key
	 *            Key of the item to remove.
	 */
	public void removeItem(String key)
	{
		for (int i = 0; i < this.getItems().size(); i++)
		{
			Item item = this.getItem(key);
			if (item.getKey().equalsIgnoreCase(key))
			{
				this.getItems().remove(i);
			}
		}
	}

	public int size()
	{
		return this.getItems().size();
	}

}
