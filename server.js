'use strict';

const express = require('express');
const SocketServer = require('ws').Server;
const path = require('path');

const PORT = process.env.PORT || 3000;

const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

// Connection URL
const url = process.env.MONGODB_URI || 'mongodb://localhost:27017';

// Database Name
const dbName = 'birthday';

// Create a new MongoClient
const client = new MongoClient(url);

function connectToMongo(callback) {
  // Use connect method to connect to the Server
  client.connect(function(err) {
    assert.equal(null, err);
    console.log('Connected successfully to server');

    const db = client.db(dbName);

    callback(db);
  });
}
function initWebSockets(db) {
  const wss = new SocketServer({ server });

  wss.on('connection', ws => {
    console.log('Client connected');
    const collection = db.collection('messages');
    // Find some documents
    collection.find({}).toArray(function(err, docs) {
      assert.equal(err, null);
      console.log("Found the following records");
      console.log(docs)
      docs.forEach((doc) => {
        ws.send(JSON.stringify(doc));
      });
    });

    ws.on('close', () => console.log('Client disconnected'));
    ws.on('message', function incoming(message) {
      wss.clients.forEach(client => {
        client.send(message);
        const collection = db.collection('messages');
        collection.insert(JSON.parse(message));
      });
    });
  });
}

function init(db) {
  initWebSockets(db);
}

const server = express()
  // .use((req, res) => res.sendFile(INDEX))
  .use(express.static('public'))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

connectToMongo(init);