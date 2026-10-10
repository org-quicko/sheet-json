package in.org.quicko.sheet.generator.util;

import tools.jackson.databind.JsonNode;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

class TableGeneratorUtil
{

	/**
	 * Generate table class and its corresponding row class
	 *
	 * @param blockSchema
	 *            The block schema to generate from
	 * @param blockClassName
	 *            The name of the table class
	 * @param tablesDir
	 *            The directory to output table classes to
	 * @param classNames
	 *            Map to track generated class names
	 * @param packageName
	 *            Base package name
	 * @param isCommon
	 *            Whether this is part of a common package
	 * @throws IOException
	 *             If there's an error writing files
	 */
	public static void generate(JsonNode blockSchema, String blockClassName, String tablesDir,
	        Map<String, String[]> classNames, String packageName, Boolean isCommon) throws IOException
	{
		// 1) Grab the "name" property from the block schema
		String blockName = GeneratorUtil.getFirstEnum(blockSchema, "name");

		// 2) Look under "header" -> "items" -> each item has "enum": ["columnName"].
		// "items" should be an array of per-column schemas
		JsonNode headerItems = blockSchema.path("properties").path("header").path("items");
		// Collect column names from each itemNode's enum[0]
		List<String> columnNames = new ArrayList<>();
		if (headerItems.isArray())
		{
			for (JsonNode colItemNode : headerItems)
			{
				JsonNode colEnumNode = colItemNode.path("enum");
				if (colEnumNode.isArray() && colEnumNode.size() > 0)
				{
					columnNames.add(colEnumNode.get(0).asText());
				}
			}
		}

		// Build a comma-separated string literal for the header array
		String headerArray =
		        columnNames.stream().map(col -> String.format("\"%s\"", col)).collect(Collectors.joining(",\n\t\t\t"));

		// 3) Build table class (same as before; only difference is how we got "headerArray")
		String tableDirectory = tablesDir + "/" + blockName + "/beans";
		String tablePackage = packageName + (isCommon ? ".tables.common." : ".tables.") + blockName + ".beans";

		String rowClassName = blockClassName.replace("Table", "Row");

		List<String> tableImports = new ArrayList<>();
		tableImports.add("import com.fasterxml.jackson.annotation.JsonIgnoreProperties;");
		tableImports.add("import com.fasterxml.jackson.annotation.JsonTypeInfo;");
		tableImports.add("import com.fasterxml.jackson.annotation.JsonTypeName;");
		tableImports.add("import java.util.Arrays;");
		tableImports.add("import java.util.Iterator;");
		tableImports.add("import java.util.NoSuchElementException;");
		tableImports.add("import java.util.Spliterator;");
		tableImports.add("import java.util.Spliterators;");
		tableImports.add("import java.util.stream.Stream;");
		tableImports.add("import java.util.stream.StreamSupport;");
		tableImports.add("import org.json.JSONArray;");
		tableImports.add("import in.org.quicko.sheet.beans.Table;");

		String tableClass = String
		        .format("""
		                        package %s;
		                        %s
		                        %s

		                        @JsonTypeName(\"%s\")
		                        @JsonIgnoreProperties(ignoreUnknown = true)
		                        @JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.EXISTING_PROPERTY, property = \"name\", visible = true)
		                        public class %s extends Table implements Iterable<%s>
		                        {
		                private static JSONArray header = new JSONArray(
		                	Arrays.asList(
		                		%s
		                	)
		                );

		                private static final long serialVersionUID = %dL;

		                public %s()
		                {
		                	super.setHeader(header);
		                }

		                @Override
		                public %s getRow(int index)
		                {
		                	JSONArray row = super.getRow(index);
		                	if (row instanceof %s tableRow)
		                	{
		                		return tableRow;
		                	}
		                	else
		                	{
		                		%s tableRow = new %s(row);
		                		this.replaceRow(index, tableRow);
		                		return tableRow;
		                	}
		                }

		                public void add%s(%s row)
		                {
		                	super.addRow(row);
		                }

		                @Override
		                public Iterator<%s> iterator()
		                {
		                	return new Iterator<>()
		                	{
		                		private int index = 0;

		                		@Override
		                		public boolean hasNext()
		                		{
		                			return index < size();
		                		}

		                		@Override
		                		public %s next()
		                		{
		                			if (!hasNext())
		                			{
		                				throw new NoSuchElementException("No more rows at index " + index);
		                			}
		                			return getRow(index++);
		                		}
		                	};
		                }

		                public Stream<%s> stream()
		                {
		                	return StreamSupport.stream(spliterator(), false);
		                }

		                public Stream<%s> parallelStream()
		                {
		                	return StreamSupport.stream(spliterator(), true);
		                }

		                @Override
		                public Spliterator<%s> spliterator()
		                {
		                	return Spliterators.spliterator(iterator(), size(),
		                			Spliterator.ORDERED | Spliterator.NONNULL | Spliterator.SIZED | Spliterator.SUBSIZED);
		                }
		        }
		        """,
		        tablePackage, GeneratorUtil.AUTO_GEN_COMMENT, String.join("\n", tableImports), blockName,
		        blockClassName, rowClassName, headerArray, GeneratorUtil.generateSerialVersionUID(),
		        blockClassName, rowClassName, rowClassName, rowClassName, rowClassName,
		        rowClassName.replace("Row", ""), rowClassName, rowClassName, rowClassName, rowClassName, rowClassName,
		        rowClassName)
		        .trim();

		Files.createDirectories(Paths.get(tableDirectory));
		Files.writeString(Paths.get(tableDirectory, blockClassName + ".java"), tableClass);

		// track for mixin generation
		GeneratorUtil.updateClassNames(classNames, "table", tablePackage, blockClassName);

		// Generate Row class
		RowGeneratorUtil.generate(blockSchema, rowClassName, tableDirectory, classNames, tablePackage);
	}
}
