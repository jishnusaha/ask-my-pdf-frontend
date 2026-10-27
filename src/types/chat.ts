export type ChatMessageRoleType = 'user' | 'assistant';

export interface IChat {
  id: number;
  title: string;
  created_at: string;
}

export interface IChatMessage {
  id: number;
  role: ChatMessageRoleType;
  content: string;
  content_html: string | null;
  created_at: string;
}

export interface IDocumentChunk {
  id: number;
  content: string;
  page_number: number;
  chunk_index: number;
  content_hash: string;
}
