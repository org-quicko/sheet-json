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
import org.json.JSONObject;

import in.org.quicko.sheet.generator.util.WorkbookGeneratorUtil;

/**
 * When invoked, this goal reads a JSON documents and generates a <a href="http://json-schema.org/">JSON Schema</a>
 *
 */
@Mojo(name = "excel-to-json", defaultPhase = LifecyclePhase.GENERATE_SOURCES, requiresDependencyResolution = ResolutionScope.COMPILE, threadSafe = true)
public class JsonGeneratorMojo extends AbstractMojo
{

	/**
	 * Default constructor
	 */
	public JsonGeneratorMojo()
	{
		// Default constructor
	}

	@Parameter(required = true)
	private String sourcePath;

	@Parameter(defaultValue = "${project.build.directory}/generated-sources/main/resources/sample")
	private String outputDirectory;

	@Override
	public void execute() throws MojoExecutionException, MojoFailureException
	{
		try
		{
			getLog().info("Starting Json Generator...");
			getLog().info("Output Directory: " + outputDirectory);

			var sourceFile = new File(sourcePath);
			if (!sourceFile.exists())
			{
				throw new MojoExecutionException("Source file does not exist: " + sourcePath);
			}

			// Check if file is an Excel file
			String fileName = sourceFile.getName().toLowerCase();
			if (!fileName.endsWith(".xlsx") && !fileName.endsWith(".xls"))
			{
				throw new MojoExecutionException("Source file must be an Excel file (.xlsx or .xls): " + sourcePath);
			}

			JSONObject json = WorkbookGeneratorUtil.fromExcel(sourceFile);

			// Create output directory if it doesn't exist
			var outputDir = new File(outputDirectory);
			outputDir.mkdirs();

			// Write schema to output file
			var outputFileName = sourceFile.getName().replaceFirst("[.][^.]+$", "") + ".json";
			var outputFile = new File(outputDir, outputFileName);

			new ObjectMapper().writerWithDefaultPrettyPrinter().writeValue(outputFile, json);

			getLog().info("Generated schema from: " + sourcePath + " to: " + outputFile.getPath());

			getLog().info("Schema Generation completed successfully.");
		}
		catch (Exception e)
		{
			throw new MojoExecutionException("Error generating schemas", e);
		}
	}
}
