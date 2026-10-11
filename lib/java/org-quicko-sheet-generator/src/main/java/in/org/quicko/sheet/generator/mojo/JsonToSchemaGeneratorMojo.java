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

import in.org.quicko.sheet.beans.Workbook;
import in.org.quicko.sheet.generator.util.JsonToSchemaGeneratorUtil;

/**
 * When invoked, this goal reads a JSON documents and generates a <a href="http://json-schema.org/">JSON Schema</a>
 *
 */
@Mojo(name = "json-to-schema", defaultPhase = LifecyclePhase.GENERATE_SOURCES, requiresDependencyResolution = ResolutionScope.COMPILE, threadSafe = true)
public class JsonToSchemaGeneratorMojo extends AbstractMojo
{

	/**
	 * Default constructor
	 */
	public JsonToSchemaGeneratorMojo()
	{
		// Default constructor
	}

	@Parameter(required = true)
	private String sourcePath;

	@Parameter(defaultValue = "${project.build.directory}/generated-sources/main/resources/schema")
	private String outputDirectory;

	@Override
	public void execute() throws MojoExecutionException, MojoFailureException
	{
		try
		{
			getLog().info("Starting Schema Generator...");
			getLog().info("Output Directory: " + outputDirectory);

			var mapper = new ObjectMapper();

			var sourceFile = new File(sourcePath);
			if (!sourceFile.exists())
			{
				throw new MojoExecutionException("Source file does not exist: " + sourcePath);
			}

			// Read the workbook from JSON file
			var workbook = mapper.readValue(sourceFile, Workbook.class);

			// Generate schema using SchemaGeneratorUtil
			var schema = JsonToSchemaGeneratorUtil.generate(workbook);

			// Create output directory if it doesn't exist
			var outputDir = new File(outputDirectory);
			outputDir.mkdirs();

			// Write schema to output file
			var outputFileName = sourceFile.getName().replaceFirst("[.][^.]+$", "") + ".schema.json";
			var outputFile = new File(outputDir, outputFileName);

			mapper.writerWithDefaultPrettyPrinter().writeValue(outputFile, schema);

			getLog().info("Generated schema from: " + sourcePath + " to: " + outputFile.getPath());

			getLog().info("Schema Generation completed successfully.");
		}
		catch (Exception e)
		{
			throw new MojoExecutionException("Error generating schemas", e);
		}
	}
}
