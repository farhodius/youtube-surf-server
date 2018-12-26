import * as express from 'express';

import { Youtube } from './services/Youtube';
import { ResourceModel } from './services/dbmodels/ResourceModel';
import bodyParser = require('body-parser');
import mongoose = require('mongoose');
import { runInNewContext } from 'vm';

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

app.get('/api/v1/search/:type', (req, res, next) => {
  const yt = new Youtube();
  const props = { type: req.params.type, query: req.query.q, limit: req.query.limit };
  yt.search(
    props,
    (results) => {
      res.send(results);
      // async function checkSaved() {
      //   for (const r of results.videos) {
      //     await ResourceModel.findOne({id: r.id}, (error, info) => {
      //       console.log('Resource info: ', info);
      //       if (info !== null) {
      //         r.saved = true;
      //       }
      //     });
      //   }
      //   console.log('Sending results');
      //   res.send(results);
      // }
      // checkSaved();
    },
    (error) => {
      console.log(error);
      next(error);
    }
  );
});

app.post('/api/v1/video', (req, res, next) => {
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

app.delete('/api/v1/video/:id', (req, res, next) => {
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
