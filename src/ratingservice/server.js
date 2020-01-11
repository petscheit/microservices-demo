/*
 * Copyright 2018 Google LLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const { dbJsonPath, env } = require('./config');

if (env !== 'test') {
  require('@google-cloud/profiler').start({
    serviceContext: {
      service: 'ratingservice',
      version: '1.0.0'
    }
  });
  require('@google-cloud/trace-agent').start();
  require('@google-cloud/debug-agent').start({
    serviceContext: {
      service: 'ratingervice',
      version: 'VERSION'
    }
  });
}

const fs = require('fs');
const path = require('path');
const grpc = require('grpc');
const pino = require('pino');
const protoLoader = require('@grpc/proto-loader');

const MAIN_PROTO_PATH = path.join(__dirname, './proto/demo.proto');
const HEALTH_PROTO_PATH = path.join(__dirname, './proto/grpc/health/v1/health.proto');

const PORT = process.env.PORT;

const shopProto = _loadProto(MAIN_PROTO_PATH).hipstershop;
const healthProto = _loadProto(HEALTH_PROTO_PATH).grpc.health.v1;

const logger = pino({
  name: 'ratingservice-server',
  messageKey: 'message',
  changeLevelName: 'severity',
  useLevelLabels: true
});

/**
 * Helper function that loads a protobuf file.
 */
function _loadProto(path) {
  const packageDefinition = protoLoader.loadSync(
    path,
    {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true
    }
  );
  return grpc.loadPackageDefinition(packageDefinition);
}

const readRatingsFromDb = () => {
  const data = fs.readFileSync(dbJsonPath);
  return JSON.parse(data);
}

const writeRatingsToDb = (ratings) => {
  const data = JSON.stringify(ratings);
  fs.writeFileSync(dbJsonPath, data);
}

/**
 * addRating
 */
function addRating(call, callback) {
  logger.info('received ratings request');
  console.log(call)

  const request = call.request;
  const ratingItem = request.rating;
  const { product_id, rating } = ratingItem;

  if (typeof product_id !== 'string' || rating <= 0 || rating > 5) throw new Error('invalid ratingItem');

  const allRatings = readRatingsFromDb();
  const ratingByProductId = allRatings[product_id];

  let newRating = null;
  if (!ratingByProductId) {
    newRating = { amount: 1, average: rating }
  } else {
    const amount = ratingByProductId.amount;
    const average = ratingByProductId.average;
    newRating = { amount: amount + 1, average: ((average * amount) + rating) / (amount + 1) }
  }

  allRatings[product_id] = newRating;
  writeRatingsToDb(allRatings)
  callback(null, null);
}

/**
 * return Ratings
 */
function getRatings(call, callback) {
  logger.info('received ratings request');
  console.log(call)

  const request = call.request;
  const { product_id } = request;

  const allRatings = readRatingsFromDb();

  const ratings = allRatings[product_id] || { average: 0, amount: 0 };

  callback(null, ratings);
}

/**
 * Endpoint for health checks
 */
function check(call, callback) {
  callback(null, { status: 'SERVING' });
}

/**
 * Starts an RPC server that receives requests for the
 * ratingConverter service at the sample server port
 */
function main() {
  logger.info(`Starting gRPC server on port ${PORT}...`);
  const server = new grpc.Server();
  console.log((shopProto))
  server.addService(shopProto.RatingService.service, { getRatings, addRating });
  server.addService(healthProto.Health.service, { check });
  server.bind(`0.0.0.0:${PORT}`, grpc.ServerCredentials.createInsecure());
  server.start();
}

if (env !== 'test') main();

module.exports = {
  addRating,
  getRatings
};