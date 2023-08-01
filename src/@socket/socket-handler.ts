import { Socket } from 'socket.io';
import UserService from '../services/user.service';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import cookie from 'cookie';
import Logging from '../library/Logging';
import { createHandlerFromObject } from './utils';
import GroupChatService from '../services/group-chat.service';
import ChannelService from '../services/channel.service';

export interface InitialSocketData {
   userService: InstanceType<typeof UserService>;
}

export default async function (
   socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, InitialSocketData>
) {
   const { accessToken, refreshToken } = cookie.parse(socket.handshake.headers.cookie || '');
   const userService = new UserService({ accessToken });
   socket.data.userService = userService;

   socket.on('UserService', createHandlerFromObject(userService));
   socket.on('GroupChatService', createHandlerFromObject(new GroupChatService(userService)));
   socket.on('ChannelService', createHandlerFromObject(new ChannelService(userService)));

   userService
      .getUserData()
      .then(({ channels, groupChats }) => {
         socket.join([...channels, groupChats].map((x) => x.toString()));
      })
      .catch((e) => {
         // User is deleted, but his access token remains valid for a while
         socket.disconnect(true);
      });

   Logging.info(`Socket connected. user-> ${socket.data.userService.userIdentity.username}`);
   socket.once('disconnect', (reason) => {
      socket.removeAllListeners();
      Logging.info(`Socket disconnected. user-> ${socket.data.userService?.userIdentity.username}`);
      delete socket.data.userService;
   });
}
