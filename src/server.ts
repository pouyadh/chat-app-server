import http from 'http';
import mongoose from 'mongoose';
import Logging from './library/Logging';
import 'express-async-errors';
import config from './config';
import expressApp from './@express/expressApp';
import { startSocketIO } from './@socket/socket';

console.clear();
Logging.info('Starting the server...');

mongoose
   .connect(config.mongo.url, { w: 'majority', retryWrites: true })
   .then(() => {
      Logging.info('Connected to MongoDB');
      StartServer();
   })
   .catch((error) => {
      Logging.error('Unable to connect: ');
      Logging.error(error);
   });

const StartServer = () => {
   const httpServer = http
      .createServer(expressApp)
      .listen(config.server.port, () =>
         Logging.info(`Server is running on port ${config.server.port}`)
      );

   startSocketIO(httpServer);
};
