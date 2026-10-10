package in.org.quicko.sheet.generator.util;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.nio.file.Path;
import java.util.Map;
import java.util.Set;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class ObjectGeneratorUtilCutoverTest
{
	private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

	private static final String PACKAGE_NAME = "in.org.quicko.generated.cutover";

	@TempDir
	Path tempDir;

	@Test
	void generate_shouldPreservePreCutoverGeneratedSourceShape() throws IOException
	{
		JsonNode schema = OBJECT_MAPPER.readTree("""
				{
				  "properties": {
				    "name": {"type": "string", "enum": ["capital_gains_workbook"]},
				    "@entity": {"type": "string", "enum": ["workbook"]},
				    "sheets": {
				      "type": "array",
				      "items": {
				        "oneOf": [
				          {
				            "properties": {
				              "name": {"type": "string", "enum": ["fy_2024_summary"]},
				              "@entity": {"type": "string", "enum": ["sheet"]},
				              "blocks": {
				                "type": "array",
				                "items": {
				                  "oneOf": [
				                    {
				                      "properties": {
				                        "name": {"type": "string", "enum": ["asset_summary"]},
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
				                              {"type": "number", "format": "BigDecimal"}
				                            ]
				                          }
				                        }
				                      }
				                    },
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
				                  ]
				                }
				              }
				            }
				          }
				        ]
				      }
				    }
				  }
				}
				""");

		Map<String, String> generatedSources = GeneratedSourceTestSupport.generateObjectSources(schema, tempDir,
		        PACKAGE_NAME);

		assertEquals(Set.of("mixins/ListMixin.java", "mixins/RowMixin.java", "mixins/SheetMixin.java",
		        "mixins/TableMixin.java", "mixins/WorkbookMixin.java", "lists/meta_info/beans/MetaInfoList.java",
		        "sheets/fy_2024_summary/beans/Fy2024SummarySheet.java",
		        "tables/asset_summary/beans/AssetSummaryRow.java",
		        "tables/asset_summary/beans/AssetSummaryTable.java",
		        "workbooks/beans/CapitalGainsWorkbook.java"), generatedSources.keySet(),
		        "The top-level generator should emit the same source tree shape as the pre-cutover baseline");

		String workbookSource = generatedSources.get("workbooks/beans/CapitalGainsWorkbook.java");
		String sheetSource = generatedSources.get("sheets/fy_2024_summary/beans/Fy2024SummarySheet.java");
		String tableSource = generatedSources.get("tables/asset_summary/beans/AssetSummaryTable.java");
		String rowSource = generatedSources.get("tables/asset_summary/beans/AssetSummaryRow.java");
		String listSource = generatedSources.get("lists/meta_info/beans/MetaInfoList.java");

		assertAll("workbook baseline",
		        () -> assertTrue(workbookSource.contains("package in.org.quicko.generated.cutover.workbooks.beans;")),
		        () -> assertTrue(workbookSource.contains("import com.fasterxml.jackson.annotation.JsonIgnore;")),
		        () -> assertTrue(workbookSource.contains("@JsonTypeName(\"capital_gains_workbook\")")),
		        () -> assertTrue(workbookSource.contains("private static final long serialVersionUID = <SERIAL>;")),
		        () -> assertTrue(workbookSource.contains("public Fy2024SummarySheet getFy2024Summary()")),
		        () -> assertTrue(workbookSource.contains(
		                "public void addFy2024Summary(Fy2024SummarySheet fy2024Summary)")));

		assertAll("sheet baseline",
		        () -> assertTrue(sheetSource.contains("package in.org.quicko.generated.cutover.sheets.fy_2024_summary.beans;")),
		        () -> assertTrue(sheetSource.contains("import com.fasterxml.jackson.annotation.JsonIgnore;")),
		        () -> assertTrue(sheetSource.contains("import in.org.quicko.generated.cutover.tables.asset_summary.beans.AssetSummaryTable;")),
		        () -> assertTrue(sheetSource.contains("import in.org.quicko.generated.cutover.lists.meta_info.beans.MetaInfoList;")),
		        () -> assertTrue(sheetSource.contains("@JsonTypeName(\"fy_2024_summary\")")),
		        () -> assertTrue(sheetSource.contains("public void addAssetSummary(AssetSummaryTable assetSummary)")),
		        () -> assertTrue(sheetSource.contains("public AssetSummaryTable getAssetSummary()")),
		        () -> assertTrue(sheetSource.contains("public void addMetaInfo(MetaInfoList metaInfo)")),
		        () -> assertTrue(sheetSource.contains("public MetaInfoList getMetaInfo()")));

		assertAll("table baseline",
		        () -> assertTrue(tableSource.contains("package in.org.quicko.generated.cutover.tables.asset_summary.beans;")),
		        () -> assertTrue(tableSource.contains("import com.fasterxml.jackson.annotation.JsonIgnoreProperties;")),
		        () -> assertTrue(tableSource.contains("implements Iterable<AssetSummaryRow>")),
		        () -> assertTrue(tableSource.contains("\"instrument_id\"")),
		        () -> assertTrue(tableSource.contains("\"pnl\"")),
		        () -> assertTrue(tableSource.contains("private static final long serialVersionUID = <SERIAL>;")),
		        () -> assertTrue(tableSource.contains("public AssetSummaryRow getRow(int index)")),
		        () -> assertTrue(tableSource.contains("public void addAssetSummary(AssetSummaryRow row)")),
		        () -> assertTrue(tableSource.contains("public Stream<AssetSummaryRow> parallelStream()")));

		assertAll("row baseline",
		        () -> assertTrue(rowSource.contains("package in.org.quicko.generated.cutover.tables.asset_summary.beans;")),
		        () -> assertTrue(rowSource.contains("public class AssetSummaryRow extends JSONArray implements Serializable")),
		        () -> assertTrue(rowSource.contains("private static final int INSTRUMENTID_INDEX = 0;")),
		        () -> assertTrue(rowSource.contains("private static final int PNL_INDEX = 1;")),
		        () -> assertTrue(rowSource.contains("public String getInstrumentId()")),
		        () -> assertTrue(rowSource.contains("public void setInstrumentId(String instrumentId)")),
		        () -> assertTrue(rowSource.contains("public java.math.BigDecimal getPnl()")),
		        () -> assertTrue(rowSource.contains("public void setPnl(java.math.BigDecimal pnl)")));

		assertAll("list baseline",
		        () -> assertTrue(listSource.contains("package in.org.quicko.generated.cutover.lists.meta_info.beans;")),
		        () -> assertTrue(listSource.contains("@JsonTypeName(\"meta_info\")")),
		        () -> assertTrue(listSource.contains("private static final long serialVersionUID = <SERIAL>;")),
		        () -> assertTrue(listSource.contains("public static final String name = \"meta_info\";")),
		        () -> assertTrue(listSource.contains("public String valueOfTaxpayerName()")),
		        () -> assertTrue(listSource.contains("public Long valueOfFilingYear()")),
		        () -> assertTrue(listSource.contains("public Boolean valueOfAmended()")),
		        () -> assertTrue(listSource.indexOf("valueOfTaxpayerName") < listSource.indexOf("valueOfFilingYear")
		                && listSource.indexOf("valueOfFilingYear") < listSource.indexOf("valueOfAmended"),
		                "List properties should preserve the baseline declaration order"));

		assertEquals("""
		        package in.org.quicko.generated.cutover.mixins;
		
		        import com.fasterxml.jackson.annotation.JsonSubTypes;
		        import com.fasterxml.jackson.annotation.JsonSubTypes.Type;
		
		        import in.org.quicko.generated.cutover.workbooks.beans.CapitalGainsWorkbook;
		
		        @JsonSubTypes({
		        	@Type(value = CapitalGainsWorkbook.class, name = \"capital_gains_workbook\")
		        })
		        public abstract class WorkbookMixin
		        {
		        }
		        """.trim(), generatedSources.get("mixins/WorkbookMixin.java"));

		assertEquals("""
		        package in.org.quicko.generated.cutover.mixins;
		
		        import com.fasterxml.jackson.annotation.JsonSubTypes;
		        import com.fasterxml.jackson.annotation.JsonSubTypes.Type;
		
		        import in.org.quicko.generated.cutover.sheets.fy_2024_summary.beans.Fy2024SummarySheet;
		
		        @JsonSubTypes({
		        	@Type(value = Fy2024SummarySheet.class, name = \"fy2024_summary_sheet\")
		        })
		        public abstract class SheetMixin
		        {
		        }
		        """.trim(), generatedSources.get("mixins/SheetMixin.java"));

		assertEquals("""
		        package in.org.quicko.generated.cutover.mixins;
		
		        import com.fasterxml.jackson.annotation.JsonSubTypes;
		        import com.fasterxml.jackson.annotation.JsonSubTypes.Type;
		
		        import in.org.quicko.generated.cutover.tables.asset_summary.beans.AssetSummaryTable;
		
		        @JsonSubTypes({
		        	@Type(value = AssetSummaryTable.class, name = \"asset_summary_table\")
		        })
		        public abstract class TableMixin
		        {
		        }
		        """.trim(), generatedSources.get("mixins/TableMixin.java"));

		assertEquals("""
		        package in.org.quicko.generated.cutover.mixins;
		
		        import com.fasterxml.jackson.annotation.JsonSubTypes;
		        import com.fasterxml.jackson.annotation.JsonSubTypes.Type;
		
		        import in.org.quicko.generated.cutover.lists.meta_info.beans.MetaInfoList;
		
		        @JsonSubTypes({
		        	@Type(value = MetaInfoList.class, name = \"meta_info_list\")
		        })
		        public abstract class ListMixin
		        {
		        }
		        """.trim(), generatedSources.get("mixins/ListMixin.java"));

		assertEquals("""
		        package in.org.quicko.generated.cutover.mixins;
		
		        import com.fasterxml.jackson.annotation.JsonSubTypes;
		        import com.fasterxml.jackson.annotation.JsonSubTypes.Type;
		
		        import in.org.quicko.generated.cutover.tables.asset_summary.beans.AssetSummaryRow;
		
		        @JsonSubTypes({
		        	@Type(value = AssetSummaryRow.class, name = \"asset_summary_row\")
		        })
		        public abstract class RowMixin
		        {
		        }
		        """.trim(), generatedSources.get("mixins/RowMixin.java"));
	}
}