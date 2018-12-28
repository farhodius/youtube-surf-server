import * as express from 'express';

import { Youtube } from './services/Youtube';
import { ResourceModel } from './services/dbmodels/ResourceModel';
import bodyParser = require('body-parser');
import mongoose = require('mongoose');
import { Resource } from './interfaces/resources/Resource';
import { YoutubeResourceType } from './common/enums/YoutubeResourceType';
import { youtube } from 'googleapis/build/src/apis/youtube';

// Connect to the DB
mongoose.connect('mongodb://localhost/ytsurfer');
const db = mongoose.connection;
db.on('error', () => {
  console.log('Failed to connect to the DB!');
});

db.once('open', () => {
  console.log('Successfully connected to the DB!');
});

const port: number = 8080;
const app = express();

app.use('', (req, res, next) => {
  // Handling cross origin access control
  // Allowed URls
  res.setHeader('Access-Control-Allow-Origin', '*');
  // Allowed Request methods
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
  // Allowed Request headers
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type');
  next();
});

app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('Hello');
});

/**
 * Search all resource types videos, playlists, channels
 */
app.get('/api/v1/search/:type', (req, res, next) => {
  const yt = new Youtube();
  const props = { type: req.params.type, query: req.query.q, limit: req.query.limit };
  yt.search(
    props,
    (rawResults) => {
      const results: Resource[] = [];
      rawResults.forEach((r) => {
        if (r.id.kind === 'youtube#video') {
          results.push(yt.parseVideoResource(r));
        } else if (r.id.kind === 'youtube#playlist') {
          results.push(yt.parsePlaylistResource(r));
        } else if (r.id.kind === 'youtube#channel') {
          results.push(yt.parseChannelResource(r));
        }
      });

      // Find and flag as saved resources that are already in the DB
      yt.flagSavedResources(results).then((resources) => {
        res.send(resources);
      });
    },
    (error) => {
      console.log(error);
      next(error);
    }
  );
});

/**
 * Get all resources saved in the DB
 */
app.get('/api/v1/resource', (req, res, next) => {
  // Set find query conditions and options
  const conditions: any = {};
  const options: any = {};
  const resourceType: string = req.query.type.toLowerCase();
  const limit: number = parseInt(req.query.limit);
  if (YoutubeResourceType[resourceType] === resourceType) {
    conditions.type = resourceType;
  }
  if (!isNaN(limit) && limit > 0) {
    options.limit = limit;
  }
  // Get saved resources

  ResourceModel.find(conditions, null, options, async (error, results) => {
    if (error) {
      next(error);
    } else {
      // Get details from Youtube API
      const yt: Youtube = new Youtube();
      const output: Resource[] = [];
      try {
        let resource: Resource;
        for (const r of results) {
          if (r.type === YoutubeResourceType.video) {
            const ytres = await yt.getVideoResourceDetails(r.id, limit);
            resource = yt.parseVideoResource(ytres);
          } else if (r.type === YoutubeResourceType.playlist) {
            const ytres = await yt.getPlaylistResourceDetails(r.id, limit);
            resource = yt.parsePlaylistResource(ytres);
          } else if (r.type === YoutubeResourceType.channel) {
            const ytres = await yt.getChannelResourceDetails(r.id, limit);
            resource = yt.parseChannelResource(ytres);
          } else {
            continue;
          }
          resource.saved = true;
          output.push(resource);
        }
      } catch (error) {
        next(error);
        return;
      }

      res.send(output);
    }
  });
});

/**
 * Save resource to the DB
 */
app.post('/api/v1/resource', (req, res, next) => {
  const data = req.body;
  const resource = new ResourceModel({
    id: data.id,
    type: data.resourceType
  });
  resource.save((error, resource) => {
    if (error) {
      next(error);
    } else {
      res.send({ result: 'Success', docId: resource._id });
    }
  });
});

/**
 * Delete resource from the DB
 */
app.delete('/api/v1/resource/:id', (req, res, next) => {
  ResourceModel.findOneAndDelete({ id: req.params.id }, (error, resource) => {
    if (error) {
      next(error);
    } else {
      if (resource === null) {
        // Document not found
        res.send({ result: 'Success', docId: null });
      } else {
        // Document successfully removed
        res.send({ result: 'Success', docId: resource._id });
      }
    }
  });
});

app.listen(port, () => {
  console.log('Listening on port: ' + port);
});
