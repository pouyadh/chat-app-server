import { CookieOptions, NextFunction, Response, Request } from 'express';
import mongoose from 'mongoose';
import User, { IUser, IUserModel } from '../models/User';
import jwt, { JwtPayload } from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { config, TokenType } from '../config/config';
import { resetToken, username as usernameSchema } from '../schemas/User';

import { AppRequest } from '../types';
import { AppError } from '../library/AppError';

interface ITokenPayloadObject extends JwtPayload {
   type: TokenType;
   _id: string;
   username: string;
}

const generateToken = (user: Pick<IUserModel, '_id' | 'username'>, type: TokenType) => {
   const { _id, username } = user;
   const { secret, expiresIn } = config.token[type];
   const payload = { type, _id, username };
   return 'Bearer ' + jwt.sign(payload, secret, { expiresIn });
};

const verifyToken = (token: string, type: TokenType) => {
   try {
      if (!token) return null;
      const [schema, _token] = token.split(' ');
      if (schema !== 'Bearer') return null;
      const payload = jwt.verify(_token, config.token[type].secret);
      if (typeof payload === 'object') {
         return payload as ITokenPayloadObject;
      } else {
         throw new Error('Invalid Token');
      }
   } catch {
      return null;
   }
};

const tokenCookieOptions: CookieOptions = {
   httpOnly: true,
   sameSite: 'none',
   secure: true
};

const signUpUser = async (req: Request, res: Response, next: NextFunction) => {
   const { username, password, name, email, avatarUrl } = req.body;
   const user = new User({
      _id: new mongoose.Types.ObjectId(),
      username,
      hashedPassword: bcrypt.hashSync(password, 10),
      name,
      email,
      avatarUrl
   });
   const accessToken = generateToken(user, 'access');
   const refreshToken = generateToken(user, 'refresh');
   user.refreshToken = refreshToken;
   await user.save().catch((err) => {
      if (err.code === 11000) {
         throw new AppError(409);
      } else {
         throw err;
      }
   });
   res.cookie('accessToken', accessToken, tokenCookieOptions)
      .cookie('refreshToken', refreshToken, tokenCookieOptions)
      .sendStatus(201);
};
const signInUser = async (req: Request, res: Response, next: NextFunction) => {
   const { username, password } = req.body;
   const user = await User.findOne({ username });
   if (!user || !bcrypt.compareSync(password, user.hashedPassword)) return res.sendStatus(403);
   const accessToken = generateToken(user, 'access');
   const refreshToken = generateToken(user, 'refresh');
   user.refreshToken = refreshToken;
   await user.save();
   const safeUser = {
      username: user.username,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl
   };
   res.cookie('accessToken', accessToken, tokenCookieOptions)
      .cookie('refreshToken', refreshToken, tokenCookieOptions)
      .status(200)
      .json({ user: safeUser });
};
const getToken = (req: Request, res: Response, next: NextFunction) => {
   const { refreshToken } = req.cookies;
   if (!refreshToken) return res.sendStatus(401);
   const refreshTokenPayloadObject = verifyToken(refreshToken, 'refresh');
   if (!refreshTokenPayloadObject) return res.sendStatus(403);
   const accessToken = generateToken(refreshTokenPayloadObject, 'access');
   return res.cookie('accessToken', accessToken, tokenCookieOptions).sendStatus(201);
};
const getOwnUser = async (req: AppRequest, res: Response, next: NextFunction) => {
   const user = await User.findById(req.user._id);
   if (!user) return res.sendStatus(404);
   const { username, email, avatarUrl, name } = user;
   res.status(200).json({
      user: {
         username,
         avatarUrl,
         name,
         email
      }
   });
};
const getUser = async (req: Request, res: Response, next: NextFunction) => {
   const username = req.params.username;
   const { error } = usernameSchema.required().validate(req.params.username);
   if (error) return res.status(422).json({ message: error.message });
   const user = await User.findOne({ username });
   if (!user) return res.sendStatus(404);
   const { avatarUrl, name } = user;
   res.status(200).json({
      username,
      avatarUrl,
      name
   });
};
const readAllUser = async (req: Request, res: Response, next: NextFunction) => {
   const users = await User.find();
   res.status(200).json({ users });
};
const updateOwnUser = async (req: AppRequest, res: Response, next: NextFunction) => {
   const user = await User.findById(req.user._id);
   if (!user) return res.sendStatus(404);
   user.set(req.body);
   await user.save();
   res.sendStatus(201);
};
const deleteOwnUser = async (req: AppRequest, res: Response, next: NextFunction) => {
   const { password } = req.body;
   const user = await User.findById(req.user._id);
   if (!user) return res.sendStatus(404);
   if (!bcrypt.compareSync(password, user.hashedPassword)) return res.sendStatus(403);
   await User.findByIdAndDelete(req.user._id);
   res.cookie('accessToken', '', tokenCookieOptions)
      .cookie('refreshToken', '', tokenCookieOptions)
      .sendStatus(201);
};

const signOutOwnUser = (req: Request, res: Response, next: NextFunction) => {
   return res
      .cookie('accessToken', '', tokenCookieOptions)
      .cookie('refreshToken', '', tokenCookieOptions)
      .sendStatus(200);
};

const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
   const { email } = req.body;
   const user = await User.findOne({ email });
   if (!user) return res.sendStatus(404);
   const resetPasswordToken = generateToken(user, 'resetPassword');
   const resetLink = `${config.client.web.baseUrl}/auth/reset-password?token=${resetPasswordToken}`;
   res.sendStatus(201);
   // send email
};

const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
   const { resetToken, password } = req.body;
   console.log(resetToken);
   const payload = verifyToken(resetToken, 'resetPassword');
   if (!payload || payload.type !== 'resetPassword') return res.sendStatus(403);
   const user = await User.findById(payload._id);
   if (!user) return res.sendStatus(404);
   user.hashedPassword = bcrypt.hashSync(password, 10);
   await user.save();
   res.sendStatus(201);
};

export default {
   signUpUser,
   signInUser,
   signOutOwnUser,
   getOwnUser,
   updateOwnUser,
   deleteOwnUser,
   getToken,
   getUser,
   readAllUser,
   forgotPassword,
   resetPassword
};
