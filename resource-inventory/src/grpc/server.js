const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const { applog } = require('../services/logger.service.js');

const logicalProtoPath = path.join(__dirname, './protos/logicalResource.proto');
const physicalProtoPath = path.join(__dirname, './protos/physicalResource.proto');

const logicalProto = grpc.loadPackageDefinition(
  protoLoader.loadSync(logicalProtoPath)
).logicalresource;

const physicalProto = grpc.loadPackageDefinition(
  protoLoader.loadSync(physicalProtoPath)
).physicalresource;

const server = new grpc.Server();

// Register your handlers (implementations)
server.addService(logicalProto.LogicalResourceService.service, require('./services/logicalService.js'));
server.addService(physicalProto.PhysicalResourceService.service, require('./services/physicalService.js'));

server.bindAsync('0.0.0.0:50051', grpc.ServerCredentials.createInsecure(), () => {
  applog('info', new Date().toISOString(), 'gRPC Server running on port 50051');
});
