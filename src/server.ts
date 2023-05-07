import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import mongoose from 'mongoose';
import { config } from './config/config';
import Logging from './library/Logging';
import 'express-async-errors';
import userRouter from './routes/User';
import cookieParser from 'cookie-parser';
import { AppError } from './library/AppError';
import { Server } from 'socket.io';
import socketAuth from './middlewares/socket-auth';
import socketHandler from './handler/socket-handler';

console.clear();
Logging.info('Starting the server...');
const app = express();

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
   app.use((req, res, next) => {
      Logging.info(
         `Incomming -> Method: [${req.method}] - URL:[${req.url}] IP: [${req.socket.remoteAddress}]`
      );
      res.on('finish', () => {
         Logging.info(
            `Outcomming -> Method: [${req.method}] - URL:[${req.url}] IP: [${req.socket.remoteAddress}] - Status: [${res.statusCode}]`
         );
      });
      next();
   });
   app.use(express.urlencoded({ extended: true }));
   app.use(express.json());
   app.use(cookieParser());
   app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', config.client.web.baseUrl);
      res.header(
         'Access-Control-Allow-Headers',
         'Origin, X-Requested-With, Content-Type, Accept, Authorization'
      );
      res.header('Access-Control-Allow-Credentials', 'true');
      if (req.method === 'OPTIONS') {
         res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
         return res.status(200).json({});
      }
      next();
   });

   /** Routes */

   app.use('/user', userRouter);

   /** Health Check */
   app.get('/ping', (req, res, next) => res.status(200).json({ message: 'pong' }));

   app.use((err: any, req: Request, res: Response, next: NextFunction) => {
      if (err instanceof AppError) {
         const { status, message } = err;
         if (!message) {
            res.sendStatus(status);
         } else {
            res.status(status).json({ message });
         }
      } else {
         console.log(err);
      }
   });

   app.use((req, res, next) => {
      const error = new Error('not found');
      Logging.error(error);
      return res.status(404).json({ message: error.message });
   });

   const httpServer = http
      .createServer(app)
      .listen(config.server.port, () =>
         Logging.info(`Server is running on port ${config.server.port}`)
      );

   const io = new Server(httpServer, {
      cors: {
         origin: config.client.web.baseUrl,
         credentials: true
      }
   });

   io.use(socketAuth(true));
   io.on('connection', socketHandler);
};
