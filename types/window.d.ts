interface FileSystemFileHandle {
  createWritable(): Promise<FileSystemWritableFileStream>;
}

interface FileSystemWritableFileStream extends WritableStream {
  write(data: Blob): Promise<void>;
  close(): Promise<void>;
}

interface Window {
  showSaveFilePicker(options?: {
    suggestedName?: string;
    types?: {
      description: string;
      accept: {
        [mimeType: string]: string[];
      };
    }[];
  }): Promise<FileSystemFileHandle>;
}
