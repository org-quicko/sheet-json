package in.org.quicko.sheet.beans;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.annotation.JsonTypeName;

/**
 * Represents a sheet containing multiple blocks.
 */
@JsonTypeName("sheet")
@JsonIgnoreProperties(ignoreUnknown = true)
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.EXISTING_PROPERTY, property = "name", visible = true)
public class Sheet extends BaseObject
{

	private static final long serialVersionUID = -3041715443128969677L;

	@JsonProperty("blocks")
	private java.util.List<Block> blocks;

	/**
	 * Default constructor.
	 */
	public Sheet()
	{
		super("sheet");
	}

	/**
	 * Retrieves the list of blocks in the sheet.
	 *
	 * @return List of blocks.
	 */
	public java.util.List<Block> getBlocks()
	{
		if (this.blocks == null)
		{
			this.blocks = new java.util.ArrayList<Block>();
		}
		return blocks;
	}

	/**
	 * Retrieves a block by its index.
	 *
	 * @param index
	 *            Index of the block.
	 * @return The block at the specified index.
	 */
	public Block getBlock(int index)
	{
		if (index <= this.getBlocks().size())
		{
			return (Block) this.getBlocks().get(index);
		}
		throw new ArrayIndexOutOfBoundsException(index);
	}

	/**
	 * Retrieves a block by its name.
	 *
	 * @param name
	 *            Name of the block.
	 * @return The block with the given name, or null if not found.
	 */
	public Block getBlock(String name)
	{
		for (int i = 0; i < this.getBlocks().size(); i++)
		{
			Block block = (Block) this.getBlock(i);

			if (block.getName().equalsIgnoreCase(name))
			{
				return block;
			}
		}
		return null;
	}

	/**
	 * Adds a block to the sheet.
	 *
	 * @param block
	 *            The block to add.
	 */
	public void addBlock(Block block)
	{
		this.getBlocks().add(block);
	}

	/**
	 * Removes a block by its name.
	 *
	 * @param name
	 *            Name of the block to remove.
	 */
	public void removeBlock(String name)
	{
		for (int i = 0; i < this.getBlocks().size(); i++)
		{
			Block block = (Block) this.getBlock(i);

			if (block.getName().equalsIgnoreCase(name))
			{
				this.getBlocks().remove(i);
				return;
			}
		}
	}

	/**
	 * Replaces an existing block with a new one.
	 *
	 * @param block
	 *            The new block to replace the old one.
	 */
	public void replaceBlock(Block block)
	{

		for (int i = 0; i < this.getBlocks().size(); i++)
		{
			// check if the key matches
			if (this.getBlocks().get(i) != null
			        && ((Block) this.getBlocks().get(i)).getName().equalsIgnoreCase(block.getName()))
			{
				this.getBlocks().set(i, block);

				break;
			}
		}

	}

	/**
	 * Retrieves the number of blocks in the sheet.
	 *
	 * @return Number of blocks.
	 */
	public int size()
	{
		return this.getBlocks().size();
	}
}
