import { google, GoogleApis } from 'googleapis';
import { Resource } from '../interfaces/resources/Resource';
import { Video } from '../interfaces/resources/Video';
import { Channel } from '../interfaces/resources/Channel';
import { Playlist } from '../interfaces/resources/Playlist';
import { ResourceModel } from './dbmodels/ResourceModel';

export class Youtube {
  yt: any;
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
          this.processSearchResults(response.data.items, successCallback, errorCallback);
        }
      }
    );
  }

  async processSearchResults(results, successCallback, errorCallback) {
    const output = { videos: [], channels: [], playlists: [] };
    results.forEach((item) => {
      if (item.id.kind === 'youtube#video') {
        output.videos.push(this.parseVideoResource(item));
      } else if (item.id.kind === 'youtube#channel') {
        output.channels.push(this.parseChannelResource(item));
      } else if (item.id.kind === 'youtube#playlist') {
        output.playlists.push(this.parsePlaylistResource(item));
      }
    });

    this.flagSavedResources(output.videos).then((resources) => {
      // output.videos = resources;
      console.log('Sending youtube output');
      successCallback(output);
    });

    return;
    for (const k of Object.keys(output)) {
      for (const r of output[k]) {
        await ResourceModel.findOne({ id: r.id }, (error, info) => {
          if (error) {
            errorCallback(error);
            return;
          }
          console.log('Resource info: ', info);
          r.saved = info !== null;
        });
      }
    }
    console.log('Youtube is sending output');
    successCallback(output);
  }

  parseVideoResource(resource): Video {
    const video: Video = {
      id: resource.id.videoId,
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
      id: resource.id.channelId,
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
      id: resource.id.playlistId,
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

  flagSavedResources<T extends Resource[]>(resourses: T): Promise<T> {
    return new Promise(async (resolve, reject) => {
      for (const r of resourses) {
        await ResourceModel.findOne({ id: r.id }, (error, info) => {
          if (error) {
            throw error;
          }
          console.log('Resource info: ', info);
          r.saved = info !== null;
        });
      }
      resolve(resourses);
    });
  }
}
