package in.org.quicko.sheet.generator.mojo;

import tools.jackson.databind.ObjectMapper;

import java.io.File;

import org.apache.maven.plugin.AbstractMojo;
import org.apache.maven.plugin.MojoExecutionException;
import org.apache.maven.plugin.MojoFailureException;
import org.apache.maven.plugins.annotations.LifecyclePhase;
import org.apache.maven.plugins.annotations.Mojo;
import org.apache.maven.plugins.annotations.Parameter;
import org.apache.maven.plugins.annotations.ResolutionScope;

import in.org.quicko.sheet.generator.util.ExcelToSchemaGeneratorUtil;

/**
 * When invoked, this goal reads an Excel file and generates a <a href="http://json-schema.org/">JSON Schema</a> The
 * Excel file should contain sheets with property definitions following a specific format.
 */
@Mojo(name = "excel-to-schema", defaultPhase = LifecyclePhase.GENERATE_SOURCES, requiresDependencyResolution = ResolutionScope.COMPILE, threadSafe = true)
public class ExcelToSchemaGeneratorMojo extends AbstractMojo
{

	/**
	 * Default constructor
	 */
	public ExcelToSchemaGeneratorMojo()
	{
		// Default constructor
	}

	/**
	 * Path to the source Excel file containing schema definitions
	 */
	@Parameter(required = true)
	private String sourcePath;

	/**
	 * Output directory where the generated schema will be saved
	 */
	@Parameter(defaultValue = "${project.build.directory}/generated-sources/main/resources/schema")
	private String outputDirectory;

	/**
	 * Name of the workbook to generate schema for
	 */
	@Parameter()
	private String workbookName;

	@Override
	public void execute() throws MojoExecutionException, MojoFailureException
	{
		try
		{
			getLog().info("Starting Excel Schema Generator...");
			getLog().info("Output Directory: " + outputDirectory);

			var sourceFile = new File(sourcePath);
			if (!sourceFile.exists())
			{
				throw new MojoExecutionException("Source Excel file does not exist: " + sourcePath);
			}

			// Validate file extension
			if (!(sourcePath.toLowerCase().endsWith(".xlsx") || sourcePath.toLowerCase().endsWith(".xls")))
			{
				throw new MojoExecutionException("Source file must be an Excel file (.xlsx or .xls): " + sourcePath);
			}

			// Generate schema from Excel
			var schema = ExcelToSchemaGeneratorUtil.generate(sourceFile, workbookName);

			// Create output directory if it doesn't exist
			var outputDir = new File(outputDirectory);
			outputDir.mkdirs();

			// Write schema to output file
			var outputFileName = sourceFile.getName().replaceFirst("[.][^.]+$", "") + ".schema.json";
			var outputFile = new File(outputDir, outputFileName);

			var mapper = new ObjectMapper();
			mapper.writerWithDefaultPrettyPrinter().writeValue(outputFile, schema);

			getLog().info("Generated schema from Excel: " + sourcePath + " to: " + outputFile.getPath());
			getLog().info("Schema Generation completed successfully.");
		}
		catch (Exception e)
		{
			throw new MojoExecutionException("Error generating schema from Excel file", e);
		}
	}
}
