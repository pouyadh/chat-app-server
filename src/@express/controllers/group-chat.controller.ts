import { Controller } from './@type';
import { Request } from 'express';
import GroupChatService from '../../services/group-chat.service';
import httpStatus from 'http-status';

export default {
   getInfo: [
      async (req: Request<{ groupChatId: string }>, res, next) => {
         const info = await GroupChatService.getInfo(req.params.groupChatId);
         return res.status(httpStatus.OK).json({ info });
      }
   ] as Controller[]
};
