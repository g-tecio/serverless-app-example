const serverless = require('serverless-http');
const bodyParser = require('body-parser');
const express = require('express')
const app = express()
const AWS = require('aws-sdk');


const SCHEMA_TABLE = process.env.SCHEMA_TABLE;

const IS_OFFLINE = process.env.IS_OFFLINE;
let dynamoDb;
if (IS_OFFLINE === 'true') {
  dynamoDb = new AWS.DynamoDB.DocumentClient({
    region: 'localhost',
    endpoint: 'http://localhost:8000'
  })
  console.log(dynamoDb);
} else {
  dynamoDb = new AWS.DynamoDB.DocumentClient();
};

app.use(bodyParser.json({ strict: false }));

app.get('/', function (req, res) {
  res.send('Hello World!')
})

app.get('/schema/:schemaId', function (req, res) {
  const params = {
    TableName: SCHEMA_TABLE,
    Key: {
      schemaId: req.params.schemaId,
    },
  }

  dynamoDb.get(params, (error, result) => {
    if (error) {
      console.log(error);
      res.status(400).json({ error: 'Could not get schema' });
    }
    if (result.Item) {
      const {schemaId, name} = result.Item;
      res.json(result.Item);
    } else {
      res.status(404).json({ error: "Schema not found" });
    }
  });
})

app.get('/schemas', function (req, res) {
  const params = {
    TableName: SCHEMA_TABLE,
  }

  dynamoDb.scan(params, (err, result) => {
    if (err) {
        res.send({
          success: false,
          message: 'Error: Server error'
        });
      } else {
        res.send(result.Items);
      }
    });
})

app.post('/schema', function (req, res) {
  const { schemaId, name, dataFields } = req.body;
  if (typeof schemaId !== 'string') {
    res.status(400).json({ error: '"schemaId" must be a string' });
  } else if (typeof name !== 'string') {
    res.status(400).json({ error: '"name" must be a string' });
  }

  const params = {
    TableName: SCHEMA_TABLE,
    Item: {
      schemaId: schemaId,
      name: name,
      dataFields: dataFields,
      created_at: new Date().toString()
    },
  };

  dynamoDb.put(params, (error) => {
    if (error) {
      console.log(error);
      res.status(400).json({ error: 'Could not create schema' });
    }
    res.json(params);
  });
})

module.exports.handler = serverless(app);