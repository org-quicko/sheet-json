package in.org.quicko.sheet.generator.util;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

/**
 * Utility class to generate Mixin classes.
 */
public class MixinGeneratorUtil
{

	private MixinGeneratorUtil()
	{
		// Private constructor to hide implicit public one
	}

	/**
	 * Generate mixin classes for each type
	 *
	 * @param mixinsDir
	 *            The directory to output mixin classes to
	 * @param classNames
	 *            Map containing **FQN** class names for each type
	 * @param packageName
	 *            Base package name
	 * @throws IOException
	 *             If there's an error writing files
	 */
	public static void generate(String mixinsDir, Map<String, String[]> classNames, String packageName)
	        throws IOException
	{
		// Generate each mixin file
		generateMixin(classNames.get("workbook"), "workbook", "WorkbookMixin.java", mixinsDir, packageName);
		generateMixin(classNames.get("sheet"), "sheet", "SheetMixin.java", mixinsDir, packageName);
		generateMixin(classNames.get("table"), "table", "TableMixin.java", mixinsDir, packageName);
		generateMixin(classNames.get("list"), "list", "ListMixin.java", mixinsDir, packageName);
		generateMixin(classNames.get("row"), "row", "RowMixin.java", mixinsDir, packageName);
	}

	private static void generateMixin(String[] fqcnArray, String entityType, String fileName, String mixinsDir,
	        String packageName) throws IOException
	{
		if (fqcnArray == null || fqcnArray.length == 0)
		{
			return;
		}

		// Build import lines
		Set<String> imports = new HashSet<>();
		for (String fqcn : fqcnArray)
		{
			// e.g. "import in.org.quicko.sheet.core.generator.output.sheets.movie_sheet.MovieSheet;"
			imports.add("import " + fqcn + ";");
		}

		// Build the @JsonSubTypes lines
		// e.g. "@Type(value = MovieSheet.class, name = "movie_sheet")"
		String subTypes = Arrays.stream(fqcnArray).map(fqcn -> {
			// shortName = "MovieSheet" from "in.org.quicko...movie_sheet.MovieSheet"
			String shortName = fqcn.substring(fqcn.lastIndexOf('.') + 1);

			// turn "MovieSheet" => "movie_sheet"
			String snakeCase = shortName.replaceAll("([A-Z])", "_$1") // e.g. "MovieSheet" -> "_M_ovie_S_heet"
			        .toLowerCase() // -> "_movie_sheet"
			        .substring(1); // -> "movie_sheet"

			return String.format("@Type(value = %s.class, name = \"%s\")", shortName, snakeCase);
		}).reduce((a, b) -> a + ",\n\t" + b).orElse("");

		// Mixin class name
		String mixinClassName = capitalize(entityType) + "Mixin";

		// Write final file content
		String content = String.format("""
		        package %s.mixins;

		        import com.fasterxml.jackson.annotation.JsonSubTypes;
		        import com.fasterxml.jackson.annotation.JsonSubTypes.Type;

		        %s

		        @JsonSubTypes({
		        \t%s
		        })
		        public abstract class %s
		        {
		        }
		        """, packageName, String.join("\n", imports), subTypes, mixinClassName).trim();

		Files.writeString(Paths.get(mixinsDir, fileName), content);
	}

	private static String capitalize(String str)
	{
		if (str == null || str.isEmpty())
			return str;
		return str.substring(0, 1).toUpperCase() + str.substring(1);
	}
}
