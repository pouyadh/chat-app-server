import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import UserService from '../../services/user.service';
import config from '../../config';

type Controller = (req: Request, res: Response, next: NextFunction) => any;

export default {
   signUp: [
      async function (req, res, next) {
         await UserService.signup(req.body);
         return res.sendStatus(httpStatus.CREATED);
      }
   ] as Controller[],

   signIn: [
      async function (req, res, next) {
         const { user, accessToken, refreshToken } = await UserService.signin(req.body);
         return res
            .cookie('accessToken', accessToken, config.tokenCookieOptions)
            .cookie('refreshToken', refreshToken, config.tokenCookieOptions)
            .status(httpStatus.OK)
            .json({ user });
      }
   ] as Controller[],

   signOut: [
      async function (req, res, next) {
         const { accessToken } = req.cookies;
         if (!accessToken) return res.sendStatus(httpStatus.NO_CONTENT);
         await new UserService({ accessToken }).signout();
         return res
            .cookie('accessToken', '', config.tokenCookieOptions)
            .cookie('refreshToken', '', config.tokenCookieOptions)
            .sendStatus(httpStatus.NO_CONTENT);
      }
   ] as Controller[],

   sendResetPasswordLinkToUserEmail: [
      async function (req, res, next) {
         const link = await UserService.sendResetPasswordLinkToUserEmail(req.body);
         //res.sendStatus(httpStatus.NO_CONTENT);
         res.status(httpStatus.OK).json({ link });
      }
   ] as Controller[],

   resetPassword: [
      async function (req, res, next) {
         await UserService.resetPassword(req.body);
         return res.sendStatus(httpStatus.NO_CONTENT);
      }
   ] as Controller[],

   getToken: [
      async function (req, res, next) {
         const { refreshToken } = req.cookies;
         const accessToken = await UserService.generateAccessToken({ refreshToken });
         return res.cookie('accessToken', accessToken, config.tokenCookieOptions).sendStatus(201);
      }
   ] as Controller[],

   deleteAccount: [
      async function (req, res, next) {
         const { accessToken } = req.cookies;
         if (!accessToken) return res.sendStatus(httpStatus.FORBIDDEN);
         await new UserService({ accessToken }).deleteAccount(req.body);
         return res
            .cookie('accessToken', '', config.tokenCookieOptions)
            .cookie('refreshToken', '', config.tokenCookieOptions)
            .sendStatus(httpStatus.NO_CONTENT);
      }
   ] as Controller[],

   updateCredentials: [
      async function (req, res, next) {
         const { accessToken } = req.cookies;
         if (!accessToken) return res.sendStatus(httpStatus.FORBIDDEN);
         await new UserService({ accessToken }).updateCredential(req.body);
         return res.sendStatus(httpStatus.NO_CONTENT);
      }
   ] as Controller[],

   updateProfile: [
      async function (req, res, next) {
         const { accessToken } = req.cookies;
         if (!accessToken) return res.sendStatus(httpStatus.FORBIDDEN);
         await new UserService({ accessToken }).updateProfile(req.body);
         return res.sendStatus(httpStatus.NO_CONTENT);
      }
   ] as Controller[],

   getData: [
      async function (req, res, next) {
         const { accessToken } = req.cookies;
         if (!accessToken) return res.sendStatus(httpStatus.FORBIDDEN);
         const userData = await new UserService({ accessToken }).getUserData();
         return res.status(200).json(userData);
      }
   ] as Controller[],

   getPublicProfiles: [
      async function (req, res, next) {
         const publicProfiles = await UserService.getPublicProfilesById(req.body);
         return res.status(200).json(publicProfiles);
      }
   ] as Controller[]
};
