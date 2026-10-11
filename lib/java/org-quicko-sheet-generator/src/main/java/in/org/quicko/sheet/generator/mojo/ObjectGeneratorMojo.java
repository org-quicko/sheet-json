package in.org.quicko.sheet.generator.mojo;

import tools.jackson.databind.ObjectMapper;

import java.io.File;
import java.nio.file.Paths;

import org.apache.maven.plugin.AbstractMojo;
import org.apache.maven.plugin.MojoExecutionException;
import org.apache.maven.plugin.MojoFailureException;
import org.apache.maven.plugins.annotations.LifecyclePhase;
import org.apache.maven.plugins.annotations.Mojo;
import org.apache.maven.plugins.annotations.Parameter;
import org.apache.maven.plugins.annotations.ResolutionScope;
import org.apache.maven.project.MavenProject;

import in.org.quicko.sheet.generator.util.ObjectGeneratorUtil;

/**
 * Mojo to generate Java POJOs from JSON Schema.
 */
@Mojo(name = "schema-to-pojo", defaultPhase = LifecyclePhase.GENERATE_SOURCES, requiresDependencyResolution = ResolutionScope.COMPILE, threadSafe = true)
public class ObjectGeneratorMojo extends AbstractMojo
{

	/**
	 * Default constructor
	 */
	public ObjectGeneratorMojo()
	{
		// Default constructor
	}

	/**
	 * The source path to read the schema from.
	 */
	@Parameter(required = true)
	private String sourcePath;

	/**
	 * The target package to generate the classes to.
	 */
	@Parameter(required = true)
	private String targetPackage;

	/**
	 * Target directory for generated Java source files.
	 *
	 */
	@Parameter(defaultValue = "${project.build.directory}/generated-sources/main/java")
	private String outputDirectory;

	/**
	 * The project being built.
	 */
	@Parameter(defaultValue = "${project}", required = true, readonly = true)
	private MavenProject project;

	@Override
	public void execute() throws MojoExecutionException, MojoFailureException
	{
		try
		{

			getLog().info("Starting Sheet Generator...");
			getLog().info("Target Package: " + targetPackage);
			getLog().info("Output Directory: " + outputDirectory);

			var sourceFile = new File(sourcePath);
			if (!sourceFile.exists())
			{
				throw new MojoExecutionException("Source file does not exist: " + sourcePath);
			}

			var schema = new ObjectMapper().readTree(sourceFile);

			var packageOutputDirectory = Paths.get(outputDirectory).resolve(targetPackage.replace(".", "/")).toString();

			ObjectGeneratorUtil.generate(schema, packageOutputDirectory, targetPackage);

			project.addCompileSourceRoot(Paths.get(outputDirectory).toString());

			getLog().info("Generated classes from: " + sourcePath);

			getLog().info("Sheet Generation completed successfully.");
		}
		catch (Exception e)
		{
			throw new MojoExecutionException("Error generating sheets", e);
		}
	}
}
