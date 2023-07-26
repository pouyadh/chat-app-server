import { Request } from 'express';
import { Controller } from './@type';
import ChannelService from '../../services/channel.service';
import httpStatus from 'http-status';

export default {
   getInfo: [
      async (req: Request<{ channelId: string }>, res, next) => {
         const info = await ChannelService.getInfo(req.params.channelId);
         return res.status(httpStatus.OK).json({ info });
      }
   ] as Controller[]
};
