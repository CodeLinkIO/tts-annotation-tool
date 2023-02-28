declare namespace Vinyl {
  type SourceAudio = {
    id: string;
    name: string;
    storageRefPath: string;
    subtitle: string;
    snippets: Snippet[];
    preProcessDone?: boolean;
    isAnnotated?: boolean;
    speakerId: string;
    speakerName?: string;
  };

  type Snippet = {
    id: string;
    startTime: number;
    endTime: number;
    text: string;
  };

  type Speaker = {
    id: string;
    name: string;
  };
}
