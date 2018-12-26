import { Resource } from './Resource';

export interface Video extends Resource {
  channelId: string;
  channelTitle: string;
}
