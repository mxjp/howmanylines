# howmanylines
Simple performant line counter.
![Preview](/preview.png)

## Installation
```bash
npm i -g howmanylines
```

# Usage
```bash
howmanylines
```

### `[--input] <path>`
The directory to analyze. Default is the current working directory.

### `--output | -o <type>`
Specify the output type. Can be one of `summary`, `summary-json`, `files`, `files-json`<br>
The format of json types is considered stable.

### `--verbose | -v`
Output debugging information.

### `--no-gitignore`
Do not evaluate gitignore files.

### `--gitignore-files [...names]`
Specify the name of gitignore files to use. Default is `.gitignore`

### `--no-color`
Disable colored output.

### `--stat-mode <mode>`
Specify, how files are analyzed. Can be one of the following:
+ `default` - Read complete files at once and ignore files invalid utf-8 content.
+ `stream` - Stream files and ignore invalid data. Recommended in case of limited memory.
