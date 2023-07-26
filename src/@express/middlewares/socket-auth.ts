import { Socket } from 'socket.io';
import cookie from 'cookie';
import config from '../../config';
import jwt from 'jsonwebtoken';

const socketAuth =
   (require = false) =>
   (socket: Socket, next: (err?: any) => void) => {
      const reject = () => (require ? next(new Error('Unauthorized')) : next());
      try {
         const { accessToken, refreshToken } = cookie.parse(socket.request.headers.cookie || '');
         const [schema, token] = accessToken.split(' ');
         const user = jwt.verify(token, config.token.access.secret);
         if (schema !== 'Bearer' || !user) return reject();
         socket.data.auth = {
            user,
            accessToken,
            refreshToken
         };
         return next();
      } catch (e) {
         return reject();
      }
   };

export default socketAuth;
