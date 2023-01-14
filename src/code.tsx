import { ActionPanel, List, getPreferenceValues, Detail, Action, Cache } from "@raycast/api";
import { existsSync, lstatSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { homedir } from "node:os";
import { useEffect, useState } from "react";

type FileType = "directory" | "file" | "other";

type FileDataType = {
  type: FileType;
  name: string;
  path: string;
};

type PreferencesType = {
  startDirectory: string;
  maxLevels: string;
  projectHints: string;
  codeAppName: string;
};

const cache = new Cache();

function getStartDirectory(): string {
  let { startDirectory = "" } = getPreferenceValues<PreferencesType>();
  startDirectory = startDirectory.replace("~", homedir());
  return resolve(startDirectory);
}

function DirectoryItem(props: { fileData: FileDataType }) {
  const filePath = `${props.fileData.path}/${props.fileData.name}`;
  const { codeAppName } = getPreferenceValues<PreferencesType>();
  return (
    <List.Item
      id={filePath}
      title={props.fileData.name}
      subtitle={filePath}
      icon={{ fileIcon: filePath }}
      actions={
        <ActionPanel>
          <Action.Open application={codeAppName} target={filePath} title={`Open in ${codeAppName}`} />
          <Action.ShowInFinder path={filePath} />
          <Action.CopyToClipboard
            title="Copy Directory Path"
            content={`${filePath}/`}
            shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
          />
        </ActionPanel>
      }
    />
  );
}

function getDirectoryData(path: string): FileDataType[] {
  const files: string[] = readdirSync(path);
  const data: FileDataType[] = [];

  for (const file of files) {
    const fileData = lstatSync(`${path}/${file}`);
    let fileType: FileType = "other";
    if (fileData.isDirectory()) fileType = "directory";
    if (fileData.isFile()) fileType = "file";

    const d: FileDataType = {
      type: fileType,
      name: file,
      path: path,
    };

    data.push(d);
  }

  return data;
}

function recursivelyGatherProjects(
  contents: FileDataType[],
  parentDir: FileDataType | null,
  currentLevel = 1
): FileDataType[] {
  const files: FileDataType[] = [];
  const { maxLevels = 2, projectHints = ["node_modules", ".git"] } = getPreferenceValues<PreferencesType>();

  // if the directory contains a project hint, add it to the list
  if (parentDir && contents.some((c) => projectHints.includes(c.name))) {
    files.push(parentDir);
    return files;
  }

  // stop if we're beyond the current level
  if (currentLevel > maxLevels) {
    console.log("past max levels for", parentDir?.name);
    return files;
  }

  for (const file of contents.filter((f) => f.type === "directory")) {
    const directoryData = getDirectoryData(`${file.path}/${file.name}`);
    const subfolders = recursivelyGatherProjects(directoryData, file, currentLevel + 1);
    files.push(...subfolders);
  }

  return files;
}

function Directory(props: { path: string }) {
  if (!existsSync(props.path)) {
    return <Detail markdown={`# Error: \n\nThe directory \`${props.path}\` does not exist. `} />;
  }

  const cachedRaw = cache.get("projects");
  const cached = cachedRaw ? JSON.parse(cachedRaw) : [];

  const [projects, setProjects] = useState<FileDataType[]>(cached);

  useEffect(() => {
    const directoryData = getDirectoryData(props.path);
    const p = recursivelyGatherProjects(directoryData, null);
    setProjects(p);
    cache.set("projects", JSON.stringify(p));
  }, []);

  if (!projects.length) {
    return <Detail markdown={`# No projects found in \`${props.path}\``} />;
  }

  return (
    <List searchBarPlaceholder={`Search in ${props.path}/`}>
      <List.Section title="Directories">
        {projects.map((data) => (
          <DirectoryItem fileData={data} key={data.path + data.name} />
        ))}
      </List.Section>
    </List>
  );
}

export default function Command() {
  return <Directory path={getStartDirectory()} />;
}
