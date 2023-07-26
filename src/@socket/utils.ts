import { PickByValue } from 'utility-types';
import { UserSocket } from './io-request-handler';
import { io } from './socket';

export const getSocketByUserId = (userId: string) => {
   return [...io.sockets.sockets.values()].find(
      (s) => s.data.userService.userIdentity._id === userId
   ) as UserSocket | undefined;
};

export const getSocketByUserIds = (userIds: string[]) => {
   return [...io.sockets.sockets.values()].filter((s) =>
      userIds.includes(s.data.userService.userIdentity._id)
   ) as UserSocket[];
};

export const getSocketByUserUsername = (username: string) => {
   return [...io.sockets.sockets.values()].find(
      (s) => s.data.userService.userIdentity.username === username
   ) as UserSocket | undefined;
};

export const getSocketByUserUsernames = (usernames: string[]) => {
   return [...io.sockets.sockets.values()].filter((s) =>
      usernames.includes(s.data.userService.userIdentity._id)
   ) as UserSocket[];
};

export const emitUserById = (userId: string, event: string, ...args: any) => {
   const userSocket = getSocketByUserId(userId);
   if (userSocket) {
      userSocket.emit(event, ...args);
      return true;
   } else {
      return false;
   }
};

export const emitUsersByIds = (userIds: string[], event: string, ...args: any) => {
   getSocketByUserIds(userIds).forEach((s) => s.emit(event, ...args));
};

export const createHandlerFromObject =
   (object: { [k: string]: any }) =>
   (...args: any[]) => {
      if (args.length !== 2 || typeof args[1] !== 'function') return;
      const [data, callback] = args as [any, (resp: any) => {}];
      const { method, arg } = data;
      const invalidMethodError = { error: 'invalid-method' };
      if (typeof method !== 'string') return callback(invalidMethodError);
      if (method.startsWith('_')) return callback(invalidMethodError);
      if (!(method in object)) return callback(invalidMethodError);
      const property = method as keyof typeof object;
      if (typeof object[property] !== 'function') return callback(invalidMethodError);
      const validFunction = property as keyof PickByValue<typeof object, Function>;
      try {
         const result = object[validFunction](arg);
         if (result instanceof Promise) {
            result.then(callback).catch((e) => callback({ error: e }));
         } else {
            callback(result);
         }
      } catch (e) {
         callback({ error: e });
      }
   };

export const kickAllSocketsFromTheRoom = (room: string) => {
   const roomSockets = io.sockets.adapter.rooms.get(room);

   if (roomSockets) {
      roomSockets.forEach((socketId) => {
         io.sockets.sockets.get(socketId)?.leave(room);
      });
   }
};
