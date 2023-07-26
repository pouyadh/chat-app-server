import Channel, {
   CHANNEL_ALL_PERMISSIONS,
   ChannelAllPermissions,
   ChannelPartialPermissionObject
} from '../models/Channel';
import { Types } from 'mongoose';
import { JoiFrom, validateFlatForm } from './_joi/validateForm';
import { AppError } from '../library/AppError';
import httpStatus from 'http-status';
import UserService, { IUserIdentity } from './user.service';
import Message, { IMessage } from '../models/Message';
import { getSocketByUserIds, kickAllSocketsFromTheRoom } from '../@socket/utils';
import { io } from '../@socket/socket';
import User from '../models/User';

export default class ChannelService {
   private static async _getChat(channelId: string) {
      const channel = await Channel.findById(channelId);
      if (!channel) throw new AppError(httpStatus.NOT_FOUND);
      return channel;
   }
   static async getInfo(channelId: string) {
      const channel = await Channel.findById(channelId);
      if (!channel) throw new AppError(httpStatus.NOT_FOUND);
      if (!channel.hasPermission('', 'seeChannelInfo')) throw new AppError(httpStatus.FORBIDDEN);
      return channel.info;
   }

   userIdentity: IUserIdentity;
   userId: string;
   constructor(userService: UserService) {
      this.userIdentity = userService.userIdentity;
      this.userId = userService.userIdentity._id;
   }

   private _checkPermission(
      channel: InstanceType<typeof Channel>,
      permission: ChannelAllPermissions
   ) {
      if (!channel.hasPermission(this.userId, permission)) {
         throw new AppError(httpStatus.FORBIDDEN);
      }
   }

   getAllPermissions() {
      return CHANNEL_ALL_PERMISSIONS;
   }

   async createChannel(form: {
      name: string;
      avatarUrl: string;
      description: string;
      subscriberUserIds: string[];
   }) {
      validateFlatForm(form, ['name', 'avatarUrl', 'description', 'subscriberUserIds']);

      const channel = new Channel({
         info: {
            name: form.name,
            avatarUrl: form.avatarUrl,
            description: form.description
         },
         subscribers: [
            {
               role: 'owner',
               user: new Types.ObjectId(this.userId),
               permissionOverrides: {}
            },
            ...form.subscriberUserIds.map((x) => ({
               role: 'subscriber',
               user: new Types.ObjectId(x),
               permissionOverrides: {}
            }))
         ],
         contents: [
            {
               type: 'activity',
               data: {
                  type: 'createChannel',
                  commiter: new Types.ObjectId(this.userId)
               }
            }
         ]
      });
      await channel.save();

      await User.updateMany(
         {
            _id: { $in: [this.userId, ...form.subscriberUserIds] }
         },
         {
            $push: { channels: channel._id }
         }
      );

      getSocketByUserIds([this.userId, ...form.subscriberUserIds]).forEach((s) =>
         s.join(channel._id.toString())
      );

      io.in(channel._id.toString()).emit('ChannelService', {
         method: 'createChannel',
         arg: { channelId: channel._id.toString(), ...form }
      });
   }

   async deleteChannel(form: { channelId: string }) {
      validateFlatForm(form, ['channelId']);
      const chat = await ChannelService._getChat(form.channelId);
      this._checkPermission(chat, 'deleteChannel');
      await chat.deleteOne();
      kickAllSocketsFromTheRoom(form.channelId);
   }

   async getInfo(form: { channelId: string }) {
      validateFlatForm(form, ['channelId']);
      const chat = await ChannelService._getChat(form.channelId);
      this._checkPermission(chat, 'seeChannelInfo');
      return chat.info;
   }
   async addSubscriber(form: { channelId: string; userId: string }) {
      validateFlatForm(form, ['channelId', 'userId']);
      const chat = await ChannelService._getChat(form.channelId);
      this._checkPermission(chat, 'addSubscribers');
      if (chat.addSubscriber(form.userId)) throw new AppError(httpStatus.CONFLICT);
      await chat.save();
      io.in(form.channelId).emit('ChannelService', {
         method: 'addSubscriber',
         arg: form
      });
   }

   async removeSubscriber(form: { channelId: string; userId: string }) {
      validateFlatForm(form, ['userId']);
      const chat = await ChannelService._getChat(form.channelId);
      this._checkPermission(chat, 'removeSubscribers');
      if (!chat.removeSubscriber(form.userId)) throw new AppError(httpStatus.NOT_FOUND);
      await chat.save();
      io.in(form.channelId).emit('ChannelService', {
         method: 'removeSubscriber',
         arg: form
      });
   }
   async addAdmin(form: {
      channelId: string;
      userId: string;
      permissionOverrides?: ChannelPartialPermissionObject;
      customTitle?: string;
   }) {
      validateFlatForm(form, ['userId']);
      const chat = await ChannelService._getChat(form.channelId);
      this._checkPermission(chat, 'addNewAdmins');
      const userInChannel = chat.authorize(form.userId);
      if (userInChannel.role === 'admin') throw new AppError(httpStatus.CONFLICT);
      if (userInChannel.role === 'user') throw new AppError(httpStatus.UNPROCESSABLE_ENTITY);
      const subscriber = chat.getSubscriber(form.userId);
      subscriber.role = 'admin';
      subscriber.permissionOverrides = form.permissionOverrides || {};
      await chat.save();
      io.in(form.channelId).emit('ChannelService', {
         method: 'addAdmin',
         arg: form
      });
   }
   async removeAdmin(form: { channelId: string; userId: string }) {
      validateFlatForm(form, ['userId']);
      const chat = await ChannelService._getChat(form.channelId);
      this._checkPermission(chat, 'removeAdmins');
      const userInChannel = chat.authorize(form.userId);
      if (userInChannel.role !== 'admin') throw new AppError(httpStatus.BAD_REQUEST);
      await chat.save();
      io.in(form.channelId).emit('ChannelService', {
         method: 'removeAdmin',
         arg: form
      });
   }

   async updateAdminPermissions(form: {
      channelId: string;
      userId: string;
      permissionOverrides: ChannelPartialPermissionObject;
   }) {
      validateFlatForm(form, ['channelId', 'userId']);
      const chat = await ChannelService._getChat(form.channelId);
      this._checkPermission(chat, 'updateAdminsPermissions');
      const admin = chat.getSubscriber(form.userId);
      if (admin.role !== 'admin') throw new AppError(httpStatus.BAD_REQUEST);
      admin.permissionOverrides = form.permissionOverrides;
      await chat.save();
      io.in(form.channelId).emit('ChannelService', {
         method: 'updateAdminPermissions',
         arg: form
      });
   }

   async updateInfo(form: {
      channelId: string;
      updates: { title?: string; avatarUrl?: string; description?: string };
   }) {
      JoiFrom({
         channelId: true,
         updates: {
            title: false,
            avatarUrl: false,
            description: false
         }
      }).or('updates.title', 'updates.avatarUrl', 'update.description');
      const chat = await ChannelService._getChat(form.channelId);
      if (!chat.hasPermission(this.userId, 'changeChannelInfo')) {
         throw new AppError(httpStatus.FORBIDDEN);
      }
      chat.set(form.updates);
      await chat.save();
      io.in(form.channelId).emit('ChannelService', {
         method: 'updateChannelInfo',
         arg: form
      });
   }

   async postMessage(form: { channelId: string; message: string }) {
      validateFlatForm(form, ['message']);
      const chat = await ChannelService._getChat(form.channelId);
      this._checkPermission(chat, 'postMessages');
      const sender = new Types.ObjectId(this.userIdentity._id);
      const message = new Message({
         _id: new Types.ObjectId(),
         sender,
         message: form.message
      });
      chat.addMessage({
         sender,
         message: message._id,
         hiddenFor: []
      });
      await chat.save();
      io.in(form.channelId).emit('ChannelService', {
         method: 'postMessage',
         arg: form
      });
   }

   async deleteMessage(form: {
      channelId: string;
      messageId: string;
      deleteForEveryone?: boolean;
   }) {
      validateFlatForm(form, ['channelId', 'messageId'], ['deleteForEveryone']);
      const chat = await ChannelService._getChat(form.channelId);
      const messageItem = chat.getMessage(form.messageId);
      if (!messageItem) throw new AppError(httpStatus.NOT_FOUND);
      if (messageItem.data.sender.equals(this.userId)) {
         // Own message
         this._checkPermission(chat, 'deleteOwnMessage');
         if (form.deleteForEveryone) {
            chat.deleteMessage(form.messageId);

            await chat.save();
            io.in(form.channelId).emit('ChannelService', {
               method: 'deleteMessage',
               arg: form
            });
         } else {
            messageItem.data.hiddenFor.push(new Types.ObjectId(this.userId));
            await chat.save();
         }
      } else {
         // Someone else's message
         this._checkPermission(chat, 'deleteMessagesOfOthers');
         chat.deleteMessage(form.messageId);
         await chat.save();
         io.in(form.channelId).emit('ChannelService', {
            method: 'deleteMessage',
            arg: form
         });
      }
   }

   async editMessage(form: { channelId: string; messageId: string; content: IMessage['content'] }) {
      validateFlatForm(form, ['channelId', 'messageId'], ['deleteForEveryone']);
      const chat = await ChannelService._getChat(form.channelId);
      const messageItem = chat.getMessage(form.messageId);
      if (!messageItem) throw new AppError(httpStatus.NOT_FOUND);
      if (messageItem.data.sender.equals(this.userId)) {
         // Own message
         this._checkPermission(chat, 'editOwnMessage');
      } else {
         // Someone else's message
         this._checkPermission(chat, 'editMessagesOfOthers');
      }

      const message = await Message.findById(form.messageId);
      if (!message) throw new AppError(httpStatus.NOT_FOUND);
      message.content = form.content;
      message.edited = true;
      message.save();
      io.in(form.channelId).emit('ChannelService', {
         method: 'editMessage',
         arg: form
      });
   }
}
