package in.org.quicko.sheet.mapper;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.SerializationFeature;
import tools.jackson.databind.node.ArrayNode;
import tools.jackson.databind.node.ObjectNode;

import java.math.BigDecimal;
import java.math.BigInteger;

import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.jupiter.api.Test;

import in.org.quicko.sheet.beans.Block;
import in.org.quicko.sheet.beans.Item;
import in.org.quicko.sheet.beans.List;
import in.org.quicko.sheet.beans.Sheet;
import in.org.quicko.sheet.beans.Table;
import in.org.quicko.sheet.beans.Workbook;

public class JsonMapperTest
{

	@Test
	public void testJsonMapperInitialization()
	{
		JsonMapper mapper = new JsonMapper();
		assertNotNull(mapper);
	}

	@Test
	public void testCreateJsonNodeFromWorkbook() throws JacksonException
	{
		JsonMapper mapper = new JsonMapper();
		Workbook workbook = new Workbook();
		Sheet sheet = new Sheet();
		workbook.getSheets().add(sheet);

		JsonNode node = mapper.valueToTree(workbook);
		assertNotNull(node);
		assertTrue(node.isObject());
		assertEquals("workbook", node.get("name").asText());
		assertTrue(node.has("sheets"));
		assertTrue(node.get("sheets").isArray());
	}

	@Test
	public void testCreateEntityFromJsonNode() throws JacksonException
	{
		JsonMapper mapper = new JsonMapper();
		String json =
		        "{\"entity\":\"workbook\",\"name\":\"workbook\",\"sheets\":[{\"entity\":\"sheet\",\"name\":\"sheet\",\"blocks\":[]}]}";

		JsonNode node = mapper.readTree(json);
		Workbook workbook = mapper.treeToValue(node, Workbook.class);

		assertNotNull(workbook);
		assertEquals("workbook", workbook.getName());
		assertEquals(1, workbook.size());
	}

	@Test
	public void testCreateJsonNodeFromSheet() throws JacksonException
	{
		JsonMapper mapper = new JsonMapper();
		Sheet sheet = new Sheet();
		Block block = new List();
		sheet.addBlock(block);

		JsonNode node = mapper.valueToTree(sheet);
		assertNotNull(node);
		assertTrue(node.isObject());
		assertEquals("sheet", node.get("name").asText());
		assertTrue(node.has("blocks"));
		assertTrue(node.get("blocks").isArray());
	}

	@Test
	public void testCreateJsonNodeFromList() throws JacksonException
	{
		JsonMapper mapper = new JsonMapper();
		List list = new List();
		list.addItem(new Item("key1", "value1"));

		JsonNode node = mapper.valueToTree(list);
		assertNotNull(node);
		assertTrue(node.isObject());
		assertEquals("list", node.get("name").asText());
		assertTrue(node.has("items"));
		assertTrue(node.get("items").isArray());
	}

	@Test
	public void testCreateJsonNodeFromTable() throws JacksonException
	{
		JsonMapper mapper = new JsonMapper();
		Table table = new Table();
		table.setHeader(new JSONArray().put("column_1"));
		JSONArray row = new JSONArray().put("value1");
		table.addRow(row);

		JsonNode node = mapper.valueToTree(table);
		assertNotNull(node);
		assertTrue(node.isObject());
		assertEquals("table", node.get("name").asText());
		assertTrue(node.get("header").isArray());
		assertTrue(node.get("rows").isArray());
		assertEquals("column_1", node.get("header").get(0).asText());
		assertEquals("value1", node.get("rows").get(0).get(0).asText());

	}

	@Test
	public void testNumberDeserialization() throws JacksonException
	{
		JsonMapper mapper = new JsonMapper();
		String json = "{\"decimal\":123.456,\"integer\":123}";

		JsonNode node = mapper.readTree(json);
		assertTrue(node.get("decimal").isNumber());
		assertTrue(node.get("decimal").numberType() == tools.jackson.core.JsonParser.NumberType.BIG_DECIMAL);
		assertEquals(new BigDecimal("123.456"), node.get("decimal").decimalValue());

		assertTrue(node.get("integer").isNumber());
		assertTrue(node.get("integer").numberType() == tools.jackson.core.JsonParser.NumberType.BIG_INTEGER);
		assertEquals(new BigInteger("123"), node.get("integer").bigIntegerValue());
	}

	@Test
	public void testJsonObjectToJsonNode() throws JacksonException
	{
		JsonMapper mapper = new JsonMapper();
		JSONObject jsonObj = new JSONObject();
		jsonObj.put("name", "test");
		jsonObj.put("value", 123.456);

		String jsonString = jsonObj.toString();
		JsonNode node = mapper.readTree(jsonString);

		assertNotNull(node);
		assertEquals("test", node.get("name").asText());
		assertEquals(123.456, node.get("value").asDouble());
	}

	@Test
	public void testJsonArrayToJsonNode() throws JacksonException
	{
		JsonMapper mapper = new JsonMapper();
		JSONArray jsonArr = new JSONArray();
		jsonArr.put("value1");
		jsonArr.put(123);

		String jsonString = jsonArr.toString();
		JsonNode node = mapper.readTree(jsonString);

		assertNotNull(node);
		assertTrue(node.isArray());
		assertEquals("value1", node.get(0).asText());
		assertEquals(123, node.get(1).asInt());
	}

	@Test
	public void testCreateArrayNode()
	{
		JsonMapper mapper = new JsonMapper();
		ArrayNode arrayNode = mapper.createArrayNode();

		arrayNode.add("value1");
		arrayNode.add(123);

		assertNotNull(arrayNode);
		assertEquals(2, arrayNode.size());
		assertEquals("value1", arrayNode.get(0).asText());
		assertEquals(123, arrayNode.get(1).asInt());
	}

	@Test
	public void testCreateObjectNode()
	{
		JsonMapper mapper = new JsonMapper();
		ObjectNode objectNode = mapper.createObjectNode();

		objectNode.put("name", "test");
		objectNode.put("value", 123.456);

		assertNotNull(objectNode);
		assertEquals("test", objectNode.get("name").asText());
		assertEquals(123.456, objectNode.get("value").asDouble());
	}

	@Test
	public void testComplexTreeNavigation() throws JacksonException
	{
		JsonMapper mapper = new JsonMapper();
		String json =
		        "{\"workbook\":{\"name\":\"test\",\"sheets\":[{\"name\":\"sheet1\",\"blocks\":[{\"type\":\"list\",\"items\":[{\"key\":\"item1\",\"value\":123}]}]}]}}";

		JsonNode root = mapper.readTree(json);
		JsonNode workbook = root.get("workbook");
		JsonNode sheets = workbook.get("sheets");
		JsonNode firstSheet = sheets.get(0);
		JsonNode blocks = firstSheet.get("blocks");
		JsonNode firstBlock = blocks.get(0);
		JsonNode items = firstBlock.get("items");
		JsonNode firstItem = items.get(0);

		assertEquals("test", workbook.get("name").asText());
		assertEquals("sheet1", firstSheet.get("name").asText());
		assertEquals("list", firstBlock.get("type").asText());
		assertEquals("item1", firstItem.get("key").asText());
		assertEquals(123, firstItem.get("value").asInt());
	}
}
