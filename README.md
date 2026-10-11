# Sheet JSON

Sheet JSON represents a workbook as JSON. A workbook contains sheets, and each
sheet contains table or list blocks.

This repository contains the Java and Node.js libraries for reading and
updating workbook data, generators that create classes from JSON Schema, and
Sheet Tools, a browser application for building schemas and viewing workbook
data.

## Workbook structure

A table contains a header and rows. The header is an array of column names,
and each row is an array of values. A row value belongs to the column at the
same index in the header. Use `null` for an empty cell.

Lists hold key-value pairs as single-property objects, such as
`{"currency": "INR"}`.

Each workbook, sheet, and block has an `@entity` that identifies its type.
Use `name` to refer to a specific workbook, sheet, or block, such as
`payment_table`.

For example, this workbook contains a payment table and a settings list:

```json
{
  "@entity": "workbook",
  "name": "report_workbook",
  "sheets": [
    {
      "@entity": "sheet",
      "name": "summary_sheet",
      "blocks": [
        {
          "@entity": "table",
          "name": "payment_table",
          "header": ["reference", "amount"],
          "rows": [["PAY-1", 150]]
        },
        {
          "@entity": "list",
          "name": "settings_list",
          "items": [{"currency": "INR"}]
        }
      ]
    }
  ]
}
```

The amount `150` belongs to the `amount` column because both are at index `1`
in their arrays. The settings list contains the key `currency` with the value
`INR`.

## Packages

Libraries live under `lib/<language>/<package>`. The Sheet Tools frontend
lives under `frontend/nextjs/org-quicko-sheet-tools`.

```text
sheet-json/
├── lib/
│   ├── java/
│   │   ├── org-quicko-sheet-core/
│   │   └── org-quicko-sheet-generator/
│   └── nodejs/
│       ├── org-quicko-sheet-core/
│       └── org-quicko-sheet-generator/
├── frontend/
│   └── nextjs/
│       └── org-quicko-sheet-tools/
└── README.md
```

| Package | Location | Purpose |
|---|---|---|
| `in.org.quicko.sheet:core` | [Java library](lib/java/org-quicko-sheet-core/) | Read and update workbooks, sheets, tables, and lists; convert workbook JSON into Java objects and back. |
| `in.org.quicko.sheet:generator` | [Java generator](lib/java/org-quicko-sheet-generator/) | Generate Java classes and Jackson mixins from JSON Schema through a Maven plugin. |
| `@org-quicko/sheet` | [Node.js library](lib/nodejs/org-quicko-sheet-core/) | Read and update workbook data through TypeScript classes; convert workbook JSON into class instances and back. |
| `@org-quicko/sheet-generator` | [Node.js generator](lib/nodejs/org-quicko-sheet-generator/) | Generate TypeScript classes from JSON Schema through the `schema-to-objects` command. |
| Sheet Tools | [Browser application](frontend/nextjs/org-quicko-sheet-tools/) | Build workbook schemas and view or edit workbook data in a browser. |

Each library has its own build configuration and published package name.
Applications continue using the existing Maven coordinates and npm package
names.

## Generate classes from JSON Schema

JSON Schema defines a workbook's sheets, tables, lists, and data types. The
generators read that schema and create classes for the workbook, sheets,
tables, rows, and lists. Application code uses these classes to access sheets
and blocks and to read or update their values.

For Java, configure the Maven plugin's `schema-to-pojo` goal. Its
[implementation](lib/java/org-quicko-sheet-generator/src/main/java/in/org/quicko/sheet/generator/mojo/ObjectGeneratorMojo.java)
defines the schema path, Java package, and output-directory parameters. For
Node.js, follow the
[generator setup](lib/nodejs/org-quicko-sheet-generator/README.md#configuration-and-setup)
to run `schema-to-objects`.

Make structural changes in the schema and regenerate the classes. Direct
changes to generated classes can be overwritten by the next generator run.
After regeneration, compile the Java code or run the application's TypeScript
check. Then deserialize representative workbook JSON and serialize it again
to verify the generated name mappings and value conversions.

For the Node.js library's data structure and JSON conversion, read the
[data model](lib/nodejs/org-quicko-sheet-core/docs/concepts/data-model.mdx)
and [serialization guide](lib/nodejs/org-quicko-sheet-core/docs/concepts/serialization.mdx).

## Build the libraries

The Java libraries use Maven. Use a JDK that supports the compiler release
configured in their `pom.xml` files. Install the core library before the
generator, which depends on it. Run these commands from the repository root:

```shell
mvn -f lib/java/org-quicko-sheet-core/pom.xml install -Dgpg.skip=true
mvn -f lib/java/org-quicko-sheet-generator/pom.xml install -Dgpg.skip=true
```

`-Dgpg.skip=true` skips release signing for local builds.

The Node.js libraries use npm. From either library's directory, run:

```shell
npm ci
npm run build
```

Their `package.json` files define the dependencies and build scripts.

## Run Sheet Tools

Sheet Tools is a Next.js application. From the repository root, run:

```shell
cd frontend/nextjs/org-quicko-sheet-tools
pnpm install
pnpm dev
```

Open the URL printed by the development server. Use the schema builder to
define a workbook's sheets and blocks and export its JSON Schema. Use the
visualizer to view and edit workbook data.

## Git history

The `main` histories from `sheet-java`, `sheet-generator-java`, `sheet-js`,
`sheet-generator-js`, and `sheet-tools` were imported with `git subtree add`
without squashing. Their original commit IDs, authors, dates, and messages
are preserved.

Historical commits retain the file paths from their original repositories.
The subtree import commits record each source commit in `git-subtree-split`.
Use that commit ID to inspect a package's history before its import.
