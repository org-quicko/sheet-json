package in.org.quicko.sheet.beans;

import tools.jackson.databind.annotation.JsonDeserialize;
import tools.jackson.databind.annotation.JsonSerialize;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.util.Objects;

import in.org.quicko.sheet.serializer.CustomItemDeserializer;
import in.org.quicko.sheet.serializer.CustomItemSerializer;

/**
 * Represents an individual key-value pair item. This class is used to store data in a structured format with a key and
 * value. It supports various data types including numeric, boolean, and string values.
 */
@JsonSerialize(using = CustomItemSerializer.class)
@JsonDeserialize(using = CustomItemDeserializer.class)
public class Item
{

	private String key;

	private Object value;

	/**
	 * Creates an item with a BigDecimal value.
	 *
	 * @param key
	 *            The key identifier for this item
	 * @param value
	 *            The Object value to store
	 */
	public Item(String key, Object value)
	{
		this.key = key;
		this.value = value;
	}

	/**
	 * Creates an item with a BigDecimal value.
	 *
	 *
	 * @param key
	 *            The key identifier for this item
	 * @param value
	 *            The BigDecimal value to store
	 */
	public Item(String key, BigDecimal value)
	{
		this.key = key;
		this.value = value;
	}

	/**
	 * Creates an item with a BigInteger value.
	 *
	 * @param key
	 *            The key identifier for this item
	 * @param value
	 *            The BigInteger value to store
	 */
	public Item(String key, BigInteger value)
	{
		this.key = key;
		this.value = new BigDecimal(value);
	}

	/**
	 * Creates an item with a Boolean value.
	 *
	 * @param key
	 *            The key identifier for this item
	 * @param value
	 *            The Boolean value to store
	 */
	public Item(String key, Boolean value)
	{
		this.key = key;
		this.value = value;
	}

	/**
	 * Creates an item with a Double value. The Double value is converted to BigDecimal for storage.
	 *
	 * @param key
	 *            The key identifier for this item
	 * @param value
	 *            The Double value to store
	 */
	public Item(String key, Double value)
	{
		this.key = key;
		this.value = value != null ? BigDecimal.valueOf(value) : null;
	}

	/**
	 * Creates an item with a Float value. The Float value is converted to BigDecimal for storage.
	 *
	 * @param key
	 *            The key identifier for this item
	 * @param value
	 *            The Float value to store
	 */
	public Item(String key, Float value)
	{
		this.key = key;
		this.value = value != null ? BigDecimal.valueOf(value) : null;
	}

	/**
	 * Creates an item with an Integer value. The Integer value is converted to BigInteger for storage.
	 *
	 * @param key
	 *            The key identifier for this item
	 * @param value
	 *            The Integer value to store
	 */
	public Item(String key, Integer value)
	{
		this.key = key;
		this.value = value != null ? BigDecimal.valueOf(value) : null;
	}

	/**
	 * Creates an item with a Long value. The Long value is converted to BigInteger for storage.
	 *
	 * @param key
	 *            The key identifier for this item
	 * @param value
	 *            The Long value to store
	 */
	public Item(String key, Long value)
	{
		this.key = key;
		this.value = value != null ? BigDecimal.valueOf(value) : null;
	}

	/**
	 * Creates an item with a String value.
	 *
	 * @param key
	 *            The key identifier for this item
	 * @param value
	 *            The String value to store
	 */
	public Item(String key, String value)
	{
		this.key = key;
		this.value = value;
	}

	/**
	 * Gets the key of this item.
	 *
	 * @return The key identifier
	 */
	public String getKey()
	{

		return this.key;

	}

	/**
	 * Gets the value of this item as an Object.
	 *
	 * @return The value stored in this item
	 */
	public Object getValue()
	{

		return this.value;

	}

	/**
	 * Gets the value of this item as a Boolean.
	 *
	 * @return The Boolean value, or null if the value is not a Boolean
	 */
	public Boolean getBooleanValue()
	{
		return this.value != null ? (Boolean) this.value : null;
	}

	/**
	 * Gets the value of this item as a BigDecimal.
	 *
	 * @return The BigDecimal value, or null if the value is not a BigDecimal
	 */
	public BigDecimal getBigDecimalValue()
	{
		return this.value != null ? (BigDecimal) this.value : null;
	}

	/**
	 * Gets the value of this item as a Long.
	 *
	 * @return The Long value converted from BigInteger
	 */
	public Long getLongValue()
	{
		return this.value != null ? ((BigDecimal) this.value).longValue() : null;
	}

	/**
	 * Gets the value of this item as a Double.
	 *
	 * @return The Double value converted from BigDecimal
	 */
	public Double getDoubleValue()
	{
		return this.value != null ? ((BigDecimal) this.value).doubleValue() : null;
	}

	/**
	 * Gets the value of this item as an Integer.
	 *
	 * @return The Integer value converted from BigInteger
	 */
	public Integer getIntegerValue()
	{
		return this.value != null ? ((BigDecimal) this.value).intValue() : null;
	}

	/**
	 * Gets the value of this item as a BigInteger.
	 *
	 * @return The BigInteger value, or null if the value is not a BigInteger
	 */
	public BigInteger getBigIntegerValue()
	{
		return this.value != null ? ((BigDecimal) this.value).toBigInteger() : null;
	}

	/**
	 * Gets the value of this item as a String.
	 *
	 * @return The String value, or null if the value is not a String
	 */
	public String getStringValue()
	{
		return this.value != null ? (String) this.value : null;

	}

	/**
	 * Compares this item with another item for equality. Items are considered equal if they have the same key
	 * (case-insensitive) and value.
	 *
	 * @param item
	 *            The item to compare with
	 * @return true if the items are equal, false otherwise
	 */
	public boolean equals(Item item)
	{
		return this.getKey().equalsIgnoreCase(item.getKey()) && Objects.equals(this.value, item.value);
	}

	@Override
	public String toString()
	{
		return "Item [key=" + key + ", value=" + value + "]";
	}
}
