export enum Sender {
  User = 'user',
  Bot = 'bot',
}

export interface Message {
  id: string;
  text: string;
  sender: Sender;
  timestamp: Date;
  isThinking?: boolean;
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
  maps?: {
    uri: string;
    title: string;
    placeAnswerSources?: {
      reviewSnippets?: {
        snippet: string;
        author: string;
      }[];
    }[];
  };
}

export interface MapResult {
  text: string;
  chunks?: GroundingChunk[];
}

export interface AnalysisResult {
  text: string;
}

export enum AppTab {
  Analysis = 'analysis',
  Map = 'map',
}