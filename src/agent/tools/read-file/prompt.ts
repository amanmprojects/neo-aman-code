export const readFileToolName = "readFile";

export const fileUnchangedStub =
    "File unchanged since last read. The content from the earlier readFile tool result in this conversation is still current — refer to that instead of re-reading.";

export const maxLinesToRead = 2000;

/**
 * Renders the readFile tool description with detailed usage instructions.
 */
export function getReadFileDescription(): string {
    return `Reads a file from the local filesystem. You can access any file directly by using this tool.

Assume this tool is able to read all files on the machine. If the User provides a path to a file assume that path is valid. It is okay to read a file that does not exist; an error will be returned.

Usage:
- The filePath parameter must be an absolute path, not a relative path. Relative inputs may be resolved against the current working directory for compatibility, but you should always send an absolute path.
- By default, it reads up to ${maxLinesToRead} lines starting from the beginning of the file
- You can optionally specify offset and limit for pagination. If offset and limit are not provided, the tool returns up to maxLinesToRead lines rather than the whole file.
- Results are returned using cat -n format, with line numbers starting at 1
- This tool reads text files. Binary formats such as images, audio, video, archives, and office documents are rejected.
- Jupyter notebooks (.ipynb files) are returned as raw file contents only; notebook cells and outputs are not parsed into a richer structure.
- This tool can only read files, not directories. To read a directory, use the listDir tool.
- Paths to screenshots or other binary image files will be rejected by this tool because they are not text files.
- If you read a file that exists but has empty contents you will receive a system reminder warning in place of file contents.`;
}
