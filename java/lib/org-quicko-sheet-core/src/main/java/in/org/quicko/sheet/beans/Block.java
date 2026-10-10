package in.org.quicko.sheet.beans;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.annotation.JsonTypeName;

/**
 * Represents a block of content within a sheet.
 */
@JsonTypeName("block")
@JsonIgnoreProperties(ignoreUnknown = true)
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.EXISTING_PROPERTY, property = "name", visible = true)
@JsonSubTypes({@JsonSubTypes.Type(value = Table.class, name = "table"),
        @JsonSubTypes.Type(value = List.class, name = "list")})
public abstract class Block extends BaseObject
{

	private static final long serialVersionUID = -7081249615076101102L;

	public Block(String entity)
	{
		super(entity);
	}
}
