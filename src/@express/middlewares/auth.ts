import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../../config';

const auth =
   (required: boolean = false) =>
   (req: AppRequest, res: Response, next: NextFunction) => {
      const { accessToken } = req.cookies;
      if (!accessToken) return required ? res.sendStatus(401) : next();
      const [schema, token] = accessToken.split(' ');
      if (schema !== 'Bearer' || !token) return required ? res.sendStatus(401) : next();
      try {
         req.user = jwt.verify(token, config.token.access.secret);
         next();
      } catch (error) {
         return required ? res.sendStatus(403) : next();
      }
   };
export default auth;
