import { Socket } from 'socket.io';
import { IAuthTokenData } from '../utils/generate-token';

interface SocketData {
   auth: {
      user: IAuthTokenData;
      accessToken?: string;
      refreshToken?: string;
   };
}
const socketHandler = (socket: Socket) => {
   const socketData = socket.data as SocketData;
   const { user } = socketData.auth;
   console.log(`${user.username} Connected.`);
   socket.on('disconnect', (reason) => {
      console.log(`${user.username} Disconnected`);
   });
};

export default socketHandler;
