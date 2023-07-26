import http from 'http';
import config from '../config';
import { Server } from 'socket.io';
import socketHandler from './socket-handler';
import ioRequestHandler from './io-request-handler';
export const io = new Server();
export const startSocketIO = (server: http.Server) => {
   io.attach(server, {
      cors: {
         origin: config.client.web.baseUrl,
         credentials: true
      },
      allowRequest: ioRequestHandler
   });
   io.on('connection', socketHandler);
};
