const config = require('config');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const MasterConfig = require('./model');

module.exports = () => {
const packageDef = protoLoader.loadSync(
  path.join(__dirname, '..', 'grpc', 'masterconfig.proto')
);
  const grpcObject = grpc.loadPackageDefinition(packageDef);
  const service = grpcObject.MasterConfigService.service;

  async function GetMasterConfig(call, callback) {
    try {
      const configDoc = await MasterConfig.findOne({ code: call.request.code });
      callback(null, { config: configDoc ? configDoc.toObject() : {} });
    } catch (err) {
      callback(err, null);
    }
  }

  async function CreateMasterConfig(call, callback) {
    try {
      const configDoc = new MasterConfig(call.request.config);
      const saved = await configDoc.save();
      callback(null, { config: saved.toObject() });
    } catch (err) {
      callback(err, null);
    }
  }

  const server = new grpc.Server();
  server.addService(service, { GetMasterConfig, CreateMasterConfig });

  const grpcHost = config.get('gRPC.host') || '0.0.0.0';
  const grpcPort = config.get('gRPC.port') || 50051;
  const grpcAddress = `${grpcHost}:${grpcPort}`;

  server.bindAsync(grpcAddress, grpc.ServerCredentials.createInsecure(), () => {
    server.start();
    console.log(`gRPC server running on ${grpcAddress}`);
  });
};