package in.org.quicko.sheet.generator.util;

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

class TableGeneratorUtilTest
{

	private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

	@TempDir
	Path tempDir;

	@Test
	void generate_shouldEmitIterableAndStreamHelpers() throws IOException
	{
		JsonNode schema = OBJECT_MAPPER.readTree("""
				{
				  "properties": {
				    "name": {"type": "string", "enum": ["asset_wise_tax_pnl_summary"]},
				    "@entity": {"type": "string", "enum": ["table"]},
				    "header": {
				      "type": "array",
				      "items": [
				        {"type": "string", "enum": ["instrument_id"]},
				        {"type": "string", "enum": ["pnl"]}
				      ]
				    },
				    "rows": {
				      "type": "array",
				      "items": {
				        "type": "array",
				        "items": [
				          {"type": "string"},
				          {"type": "string"}
				        ]
				      }
				    }
				  }
				}
				""");

		Map<String, String[]> classNames = new HashMap<>();
		String packageName = "in.org.quicko.generated";
		String blockClassName = "AssetWiseTaxPnlSummaryTable";

		TableGeneratorUtil.generate(schema, blockClassName, tempDir.toString(), classNames, packageName, false);

		Path generatedFile = tempDir.resolve("asset_wise_tax_pnl_summary").resolve("beans")
		        .resolve(blockClassName + ".java");
		String generatedSource = Files.readString(generatedFile);
		String normalizedSource = GeneratedSourceTestSupport.normalizeSource(generatedSource);

		assertTrue(generatedSource.contains("implements Iterable<AssetWiseTaxPnlSummaryRow>"),
		        "Table should implement Iterable with the row type");
		assertTrue(generatedSource.contains("Iterator<AssetWiseTaxPnlSummaryRow> iterator()"),
		        "Generated source must expose iterator() override");
		assertTrue(generatedSource.contains("return getRow(index++);"),
		        "Iterator should delegate to typed getRow(int)");
		assertTrue(generatedSource.contains("Stream<AssetWiseTaxPnlSummaryRow> stream()"),
		        "Sequential stream helper must be generated");
		assertTrue(generatedSource.contains("Stream<AssetWiseTaxPnlSummaryRow> parallelStream()"),
		        "Parallel stream helper must be generated");
		assertTrue(generatedSource.contains("Spliterator<AssetWiseTaxPnlSummaryRow> spliterator()"),
		        "Custom spliterator should be emitted");
		assertTrue(generatedSource.contains("Spliterators.spliterator(iterator(), size()"),
		        "Spliterator should be sized and wrap iterator");
		assertTrue(generatedSource.contains("StreamSupport.stream(spliterator(), false)"),
		        "stream() should rely on StreamSupport");
		assertTrue(generatedSource.contains("StreamSupport.stream(spliterator(), true)"),
		        "parallelStream() should request parallel stream");
		assertTrue(normalizedSource.contains("import com.fasterxml.jackson.annotation.JsonIgnoreProperties;"),
		        "Table should preserve the baseline Jackson annotation imports");
		assertTrue(normalizedSource.contains("@JsonTypeName(\"asset_wise_tax_pnl_summary\")"),
		        "Table type name annotation should stay stable across the cutover");
		assertTrue(normalizedSource.contains("private static final long serialVersionUID = <SERIAL>;"),
		        "Table assertions should tolerate non-deterministic serialVersionUID generation");
	}
}
