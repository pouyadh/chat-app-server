import http from 'http';
import cookie from 'cookie';
import UserService from '../services/user.service';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import { Socket } from 'socket.io';

export default async function (
   req: http.IncomingMessage,
   callback: (err: string | null | undefined, success: boolean) => void
) {
   try {
      let { accessToken, refreshToken } = cookie.parse(req.headers.cookie || '');
      if (UserService.getUserIdentity({ accessToken })) return callback(null, true);
   } catch (e) {}
   callback(null, false);
}

export type SocketData = {
   userService: UserService;
};
export type UserSocket = Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, SocketData>;
