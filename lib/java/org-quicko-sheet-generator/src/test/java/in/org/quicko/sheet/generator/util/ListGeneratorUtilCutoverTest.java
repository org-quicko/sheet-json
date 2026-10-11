package in.org.quicko.sheet.generator.util;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertTrue;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class ListGeneratorUtilCutoverTest
{
	private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

	@TempDir
	Path tempDir;

	@Test
	void generate_shouldPreservePreCutoverPropertyOrderAndAccessors() throws IOException
	{
		JsonNode schema = OBJECT_MAPPER.readTree("""
				{
				  "properties": {
				    "name": {"type": "string", "enum": ["meta_info"]},
				    "@entity": {"type": "string", "enum": ["list"]},
				    "items": {
				      "type": "array",
				      "items": {
				        "type": "object",
				        "properties": {
				          "taxpayer_name": {"type": "string"},
				          "filing_year": {"type": "integer", "format": "Long"},
				          "amended": {"type": "boolean"}
				        }
				      }
				    }
				  }
				}
				""");

		Map<String, String[]> classNames = new HashMap<>();
		ListGeneratorUtil.generate(schema, "meta_info", tempDir.toString(), classNames, "in.org.quicko.generated", false);

		Path generatedFile = tempDir.resolve("meta_info").resolve("beans").resolve("MetaInfoList.java");
		String generatedSource = GeneratedSourceTestSupport.normalizeSource(Files.readString(generatedFile));

		assertAll("list baseline",
		        () -> assertTrue(generatedSource.contains("package in.org.quicko.generated.lists.meta_info.beans;")),
		        () -> assertTrue(generatedSource.contains("import com.fasterxml.jackson.annotation.JsonIgnoreProperties;")),
		        () -> assertTrue(generatedSource.contains("@JsonTypeName(\"meta_info\")")),
		        () -> assertTrue(generatedSource.contains("private static final long serialVersionUID = <SERIAL>;")),
		        () -> assertTrue(generatedSource.contains("public static final String name = \"meta_info\";")),
		        () -> assertTrue(generatedSource.contains("public String valueOfTaxpayerName()")),
		        () -> assertTrue(generatedSource.contains("return item != null ? item.getStringValue() : null;")),
		        () -> assertTrue(generatedSource.contains("public void addTaxpayerName(String taxpayerName)")),
		        () -> assertTrue(generatedSource.contains("public Long valueOfFilingYear()")),
		        () -> assertTrue(generatedSource.contains("return item != null ? item.getLongValue() : null;")),
		        () -> assertTrue(generatedSource.contains("public void addFilingYear(Long filingYear)")),
		        () -> assertTrue(generatedSource.contains("public Boolean valueOfAmended()")),
		        () -> assertTrue(generatedSource.contains("return item != null ? item.getBooleanValue() : null;")),
		        () -> assertTrue(generatedSource.contains("public void addAmended(Boolean amended)")),
		        () -> assertTrue(generatedSource.indexOf("valueOfTaxpayerName") < generatedSource.indexOf("valueOfFilingYear")
		                && generatedSource.indexOf("valueOfFilingYear") < generatedSource.indexOf("valueOfAmended"),
		                "List accessors should preserve the pre-cutover property order"));
	}
}