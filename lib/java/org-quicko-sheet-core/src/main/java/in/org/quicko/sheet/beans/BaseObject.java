package in.org.quicko.sheet.beans;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.annotation.JsonTypeName;

import java.io.Serializable;

import org.json.JSONObject;

/**
 * Represents the base object for all entities in the sheet system.
 */
@JsonTypeName("base_object")
@JsonIgnoreProperties(ignoreUnknown = true)
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.EXISTING_PROPERTY, property = "name", visible = true)
public abstract class BaseObject implements Serializable
{

	private static final long serialVersionUID = -6605169402763832013L;

	@JsonProperty("metadata")
	private JSONObject metadata;

	@JsonProperty("@entity")
	private String entity;

	/**
	 * Default constructor.
	 */
	public BaseObject(String entity)
	{
		this.entity = entity;
	}

	/**
	 * Retrieves the name of the object using Reflection to get the `JsonTypeName` annotation.
	 *
	 * @return The name defined in the `JsonTypeName` annotation.
	 */
	@JsonProperty("name")
	public String getName()
	{
		JsonTypeName annotation = this.getClass().getAnnotation(JsonTypeName.class);

		if (annotation != null)
		{
			return annotation.value();
		}

		return null; // or handle default case
	}

	public JSONObject getMetadata()
	{
		if (this.metadata == null)
		{
			this.metadata = new JSONObject();
		}
		return metadata;
	}

	public String getEntity()
	{
		return entity;
	}

}
