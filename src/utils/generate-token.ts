import { config } from '../config/config';
import { IUserModel } from '../models/User';
import jwt from 'jsonwebtoken';

export type TokenType = keyof typeof config.token;
export interface IAuthTokenData {
   _id: string;
   username: string;
}
export interface IAuthTokenPayload {
   type: TokenType;
   _id: string;
   username: string;
}

export const generateAuthToken = (type: TokenType, auth: IUserModel | IAuthTokenData) => {
   const { _id, username } = auth;
   const { secret, expiresIn } = config.token[type];
   const payload: IAuthTokenPayload = { type, _id, username };
   const schema = 'Bearer';
   const token = jwt.sign(payload, secret, { expiresIn });
   return `${schema} ${token}`;
};

export const verifyAuthToken = (type: TokenType, tokenString: string): IAuthTokenPayload | null => {
   try {
      if (!tokenString) return null;
      const [schema, _token] = tokenString.split(' ');
      const payload = jwt.verify(_token, config.token[type].secret);
      if (
         schema !== 'Bearer' ||
         typeof payload !== 'object' ||
         !payload._id ||
         !payload.username ||
         !payload.type
      ) {
         return null;
      }

      return payload as IAuthTokenPayload;
   } catch (e) {
      return null;
   }
};
