package in.org.quicko.sheet.generator.util;

import tools.jackson.databind.JsonNode;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

final class GeneratedSourceTestSupport
{

	private GeneratedSourceTestSupport()
	{
	}

	static Map<String, String> generateObjectSources(JsonNode schema, Path outputDir, String packageName) throws IOException
	{
		ObjectGeneratorUtil.generate(schema, outputDir.toString(), packageName);
		return readGeneratedSources(outputDir);
	}

	static Map<String, String> readGeneratedSources(Path root) throws IOException
	{
		try (Stream<Path> files = Files.walk(root))
		{
			return files.filter(Files::isRegularFile)
			        .sorted(Comparator.comparing(path -> root.relativize(path).toString().replace('\\', '/')))
			        .collect(Collectors.toMap(path -> root.relativize(path).toString().replace('\\', '/'),
			                GeneratedSourceTestSupport::readNormalizedSource, (left, right) -> left, LinkedHashMap::new));
		}
	}

	private static String readNormalizedSource(Path path)
	{
		try
		{
			return normalizeSource(Files.readString(path));
		}
		catch (IOException exception)
		{
			throw new IllegalStateException("Failed to read generated source: " + path, exception);
		}
	}

	static String normalizeSource(String source)
	{
		return source.replace("\r\n", "\n").replace("\r", "\n").replaceAll("(?m)[ \t]+$", "")
		        .replaceAll("private static final long serialVersionUID = -?\\d+L;",
		                "private static final long serialVersionUID = <SERIAL>;")
		        .trim();
	}
}