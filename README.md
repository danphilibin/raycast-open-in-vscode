# Open in Visual Studio Code

[Raycast](https://www.raycast.com) extension that recursively scans your dev folder for projects and opens the project in Visual Studio Code.

### Settings

- `startDirectory`: Starting directory for the command. ~ is expanded into your home directory.
  - default: `~/dev`
- `projectHints`: Only folders containing one of these files will be included.
  - default: `node_modules, package.json, requirements.txt, .gitignore`
- `maxLevels`: Number of levels of folders to recursively scan for projects. Maximum of 5.
  - default: 2
- `codeAppName`: The name of the application to open the project with.
  - default: `Visual Studio Code`
