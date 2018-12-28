import { google, GoogleApis, youtube_v3 } from 'googleapis';
import { Resource } from '../interfaces/resources/Resource';
import { Video } from '../interfaces/resources/Video';
import { Channel } from '../interfaces/resources/Channel';
import { Playlist } from '../interfaces/resources/Playlist';
import { ResourceModel } from './dbmodels/ResourceModel';

export class Youtube {
  yt: youtube_v3.Youtube;
  apiKey: string = 'AIzaSyBfjpOmbAD7A_e494OzrKKq1zOIPjqLsOs';

  constructor() {
    this.yt = google.youtube({
      version: 'v3',
      auth: this.apiKey
    });
  }

  search(params: { type: string; query: string; limit: number }, successCallback, errorCallback) {
    this.yt.search.list(
      {
        part: 'snippet',
        type: params.type,
        q: params.query,
        maxResults: params.limit
      },
      (error, response) => {
        if (error) {
          errorCallback(error);
        } else {
          successCallback(response.data.items);
        }
      }
    );
  }

  getVideoResourceDetails(resourceId: string, limit: number) {
    return new Promise((resolve, reject) => {
      this.yt.videos.list({ part: 'snippet, statistics', id: resourceId, maxResults: limit }, (error, response) => {
        if (error) {
          reject(error);
        } else {
          resolve(response.data.items[0]);
        }
      });
    });
  }

  getPlaylistResourceDetails(resourceId: string, limit: number) {
    return new Promise((resolve, reject) => {
      this.yt.playlists.list({ part: 'snippet', id: resourceId, maxResults: limit }, (error, response) => {
        if (error) {
          reject(error);
        } else {
          resolve(response.data.items[0]);
        }
      });
    });
  }

  getChannelResourceDetails(resourceId: string, limit: number) {
    return new Promise((resolve, reject) => {
      this.yt.channels.list({ part: 'snippet, statistics', id: resourceId, maxResults: limit }, (error, response) => {
        if (error) {
          reject(error);
        } else {
          resolve(response.data.items[0]);
        }
      });
    });
  }

  parseVideoResource(resource): Video {
    const video: Video = {
      id: resource.id.videoId ? resource.id.videoId : resource.id, // Video resource is different from Search resource
      title: resource.snippet.title,
      description: resource.snippet.description,
      publishedAt: resource.snippet.publishedAt,
      channelId: resource.snippet.channelId,
      channelTitle: resource.snippet.channelTitle,
      resourceType: 'video',
      saved: false,
      thumbnails: {
        sm: { url: resource.snippet.thumbnails.default.url },
        md: { url: resource.snippet.thumbnails.medium.url },
        lg: { url: resource.snippet.thumbnails.high.url }
      }
    };
    return video;
  }

  parseChannelResource(resource): Channel {
    const channel: Channel = {
      id: resource.id.channelId ? resource.id.channelId : resource.id, // Channel resource is different from Search resource
      title: resource.snippet.title,
      description: resource.snippet.description,
      publishedAt: resource.snippet.publishedAt,
      resourceType: 'channel',
      saved: false,
      thumbnails: {
        sm: { url: resource.snippet.thumbnails.default.url },
        md: { url: resource.snippet.thumbnails.medium.url },
        lg: { url: resource.snippet.thumbnails.high.url }
      }
    };
    return channel;
  }

  parsePlaylistResource(resource): Playlist {
    const playlist: Playlist = {
      id: resource.id.playlistId ? resource.id.playlistId : resource.id, // Playlist resource is different from Search resource
      title: resource.snippet.title,
      description: resource.snippet.description,
      publishedAt: resource.snippet.publishedAt,
      channelId: resource.snippet.channelId,
      channelTitle: resource.snippet.channelTitle,
      resourceType: 'playlist',
      saved: false,
      thumbnails: {
        sm: { url: resource.snippet.thumbnails.default.url },
        md: { url: resource.snippet.thumbnails.medium.url },
        lg: { url: resource.snippet.thumbnails.high.url }
      }
    };
    return playlist;
  }

  /**
   * This function has to be refactored to only handle one resource at a time
   * and moved to MongoDB related class
   * Potentially need to change MongoDB driver package
   * @param resourses
   */
  flagSavedResources<T extends Resource[]>(resourses: T): Promise<T> {
    return new Promise(async (resolve, reject) => {
      for (const r of resourses) {
        await ResourceModel.findOne({ id: r.id }, (error, info) => {
          if (error) {
            throw error;
          }
          r.saved = info !== null;
        });
      }
      resolve(resourses);
    });
  }
}
