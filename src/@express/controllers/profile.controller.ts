import { Request } from 'express';
import ChannelService from '../services/channel.service';
import GroupChatService from '../services/group-chat.service';
import UserService from '../services/user.service';
import httpStatus from 'http-status';

export default {
   getUserPublicProfile: [
      async function (req: Request<{ username: string }>, res, next) {
         const publicProfile = await UserService.getPublicProfile(req.params);
         return res.status(httpStatus.OK).json({ publicProfile });
      }
   ] as Controller[],

   getGroupPublicProfile: [
      async function (req: Request<{ groupChatId: string }>, res, next) {
         const publicProfile = await GroupChatService.getPublicProfile(req.params);
         return res.status(httpStatus.OK).json({ publicProfile });
      }
   ] as Controller[],

   getChannelPublicProfile: [
      async function (req: Request<{ channelId: string }>, res, next) {
         const publicProfile = await ChannelService.getPublicProfile(req.params);
         return res.status(httpStatus.OK).json({ publicProfile });
      }
   ] as Controller[]
};
