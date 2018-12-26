import { Resource } from './Resource';

export interface Playlist extends Resource {
  channelId: string;
  channelTitle: string;
}
