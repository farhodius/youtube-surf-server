const mongoose = require('mongoose');

const ResourceSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  created: {
    type: Date,
    default: Date.now
  }
});

export const ResourceModel = mongoose.model('resource', ResourceSchema, 'testresource');
