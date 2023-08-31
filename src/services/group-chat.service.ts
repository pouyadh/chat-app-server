import GroupChat, {
   GROUP_CHAT_ALL_PERMISSIONS,
   GroupChatAllPermissions,
   GroupChatPartialPermissionObject
} from '../models/GroupChat';
import { Types } from 'mongoose';
import { JoiFrom, validateFlatForm } from './_joi/validateForm';
import { AppError } from '../library/AppError';
import httpStatus from 'http-status';
import UserService, { IUserIdentity } from './user.service';
import Content from '../models/Content';
import { kickAllSocketsFromTheRoom } from '../@socket/utils';
import { io } from '../@socket/socket';
import throwIfError from '../utils/throwIfError';

export default class GroupChatService {
   private static async _getChat(groupChatId: string) {
      const groupChat = await GroupChat.findById(groupChatId);
      if (!groupChat) throw new AppError(httpStatus.NOT_FOUND);
      return groupChat;
   }

   static async getInfo(groupChatId: string) {
      const groupChat = await GroupChat.findById(groupChatId);
      if (!groupChat) throw new AppError(httpStatus.NOT_FOUND);
      if (!groupChat.hasPermission('', 'seeGroupInfo')) throw new AppError(httpStatus.FORBIDDEN);
      return groupChat.info;
   }

   userIdentity: IUserIdentity;
   userId: string;
   constructor(userService: UserService) {
      this.userIdentity = userService.userIdentity;
      this.userId = userService.userIdentity._id;
   }

   private _checkPermission(
      groupChat: InstanceType<typeof GroupChat>,
      permission: GroupChatAllPermissions
   ) {
      if (!groupChat.hasPermission(this.userId, permission)) {
         throw new AppError(httpStatus.FORBIDDEN);
      }
   }

   getAllPermissions() {
      return GROUP_CHAT_ALL_PERMISSIONS;
   }

   async createGroup(form: {
      groupChatId: string;
      title: string;
      avatarUrl: string;
      members: string[];
   }) {
      validateFlatForm(form, ['groupChatId', 'title', 'avatarUrl', 'members']);

      const groupChat = new GroupChat({
         owner: new Types.ObjectId(this.userIdentity._id),
         title: form.title,
         avatarUrl: form.avatarUrl,
         members: form.members.map((m) => ({
            role: 'owner',
            user: new Types.ObjectId(m),
            permissionOverrides: {}
         }))
      });
      await groupChat.save();
   }

   async deleteGroup(form: { groupChatId: string }) {
      validateFlatForm(form, ['groupChatId']);
      const chat = await GroupChatService._getChat(form.groupChatId);
      this._checkPermission(chat, 'deleteGroup');
      await chat.deleteOne();
      kickAllSocketsFromTheRoom(form.groupChatId);
   }

   async getInfo(form: { groupChatId?: string; groupChatIds?: string[] }) {
      throwIfError(
         JoiFrom({
            groupChatId: false,
            groupChatIds: false
         })
            .xor('groupChatId', 'groupChatIds')
            .validate(form)
      );
      if (form.groupChatId) {
         const chat = await GroupChatService._getChat(form.groupChatId);
         this._checkPermission(chat, 'seeGroupInfo');
         return chat.info;
      } else if (form.groupChatIds) {
         const chats = await GroupChat.find({ _id: { $in: form.groupChatIds } });

         return chats.map((chat) => {
            try {
               this._checkPermission(chat, 'seeGroupInfo');
               return chat.info;
            } catch (error) {
               return null;
            }
         });
      }
   }
   async addMember(form: { groupChatId: string; userId: string }) {
      validateFlatForm(form, ['groupChatId', 'userId']);
      const chat = await GroupChatService._getChat(form.groupChatId);
      this._checkPermission(chat, 'addMembers');
      if (chat.addMember(form.userId)) throw new AppError(httpStatus.CONFLICT);
      await chat.save();
      io.in(form.groupChatId).emit('GroupChatService', {
         method: 'addMember',
         arg: form
      });
   }

   async kickMember(form: { groupChatId: string; userId: string }) {
      validateFlatForm(form, ['userId']);
      const chat = await GroupChatService._getChat(form.groupChatId);
      this._checkPermission(chat, 'kickMembers');
      if (!chat.removeMember(form.userId)) throw new AppError(httpStatus.NOT_FOUND);
      await chat.save();
      io.in(form.groupChatId).emit('GroupChatService', {
         method: 'kickMember',
         arg: form
      });
   }
   async addAdmin(form: {
      groupChatId: string;
      userId: string;
      permissionOverrides?: GroupChatPartialPermissionObject;
      customTitle?: string;
   }) {
      validateFlatForm(form, ['userId']);
      const chat = await GroupChatService._getChat(form.groupChatId);
      this._checkPermission(chat, 'addNewAdmins');
      const userInGroup = chat.authorize(form.userId);
      if (userInGroup.role === 'admin') throw new AppError(httpStatus.CONFLICT);
      if (userInGroup.role === 'user') throw new AppError(httpStatus.UNPROCESSABLE_ENTITY);
      const member = chat.getMember(form.userId);
      member.role = 'admin';
      member.permissionOverrides = form.permissionOverrides || {};
      member.customTitle = form.customTitle;
      await chat.save();
      io.in(form.groupChatId).emit('GroupChatService', {
         method: 'addAdmin',
         arg: form
      });
   }
   async removeAdmin(form: { groupChatId: string; userId: string }) {
      validateFlatForm(form, ['userId']);
      const chat = await GroupChatService._getChat(form.groupChatId);
      this._checkPermission(chat, 'removeAdmins');
      const userInGroup = chat.authorize(form.userId);
      if (userInGroup.role !== 'admin') throw new AppError(httpStatus.BAD_REQUEST);
      await chat.save();
      io.in(form.groupChatId).emit('GroupChatService', {
         method: 'removeAdmin',
         arg: form
      });
   }

   async updateMemberPermissions(form: {
      groupChatId: string;
      userId: string;
      permissionOverrides: GroupChatPartialPermissionObject;
   }) {
      validateFlatForm(form, ['groupChatId', 'userId']);
      const chat = await GroupChatService._getChat(form.groupChatId);
      this._checkPermission(chat, 'updateMemberPermissionOverrides');
      const member = chat.getMember(form.userId);
      if (member.role !== 'member') throw new AppError(httpStatus.BAD_REQUEST);
      member.permissionOverrides = form.permissionOverrides;
      await chat.save();
      io.in(form.groupChatId).emit('GroupChatService', {
         method: 'updateMemberPermissions',
         arg: form
      });
   }

   async updateInfo(form: {
      groupChatId: string;
      updates: { title?: string; avatarUrl?: string; description?: string };
   }) {
      JoiFrom({
         groupChatId: true,
         updates: {
            title: false,
            avatarUrl: false,
            description: false
         }
      }).or('updates.title', 'updates.avatarUrl', 'update.description');
      const chat = await GroupChatService._getChat(form.groupChatId);
      if (!chat.hasPermission(this.userId, 'changeGroupInfo')) {
         throw new AppError(httpStatus.FORBIDDEN);
      }
      chat.set(form.updates);
      await chat.save();
      io.in(form.groupChatId).emit('GroupChatService', {
         method: 'updateGroupInfo',
         arg: form
      });
   }

   async sendMessage(form: { groupChatId: string; text: string }) {
      validateFlatForm(form, ['groupChatId', 'text']);
      const chat = await GroupChatService._getChat(form.groupChatId);
      this._checkPermission(chat, 'sendMessage');
      const sender = new Types.ObjectId(this.userIdentity._id);
      const content = new Content({
         text: form.text,
         edited: false
      });
      chat.addMessage({
         _id: new Types.ObjectId(),
         sender,
         content: content._id,
         hiddenFor: []
      });
      await chat.save();
      io.in(form.groupChatId).emit('GroupChatService', {
         method: 'sendMessage',
         arg: form
      });
   }

   async deleteMessage(form: {
      groupChatId: string;
      messageId: string;
      deleteForEveryone?: boolean;
   }) {
      validateFlatForm(form, ['groupChatId', 'messageId'], ['deleteForEveryone']);
      const chat = await GroupChatService._getChat(form.groupChatId);
      const messageItem = chat.getMessage(form.messageId);
      if (!messageItem) throw new AppError(httpStatus.NOT_FOUND);
      if (messageItem.data.sender.equals(this.userId)) {
         // Own message
         this._checkPermission(chat, 'deleteOwnMessage');
         if (form.deleteForEveryone) {
            chat.deleteMessage(form.messageId);
            await chat.save();
            io.in(form.groupChatId).emit('GroupChatService', {
               method: 'deleteMessage',
               arg: form
            });
         } else {
            messageItem.data.hiddenFor.push(new Types.ObjectId(this.userId));
            await chat.save();
         }
      } else {
         // Someone else's message
         this._checkPermission(chat, 'deleteMessages');
         chat.deleteMessage(form.messageId);
         await chat.save();
         io.in(form.groupChatId).emit('GroupChatService', {
            method: 'deleteMessage',
            arg: form
         });
      }
   }
}
