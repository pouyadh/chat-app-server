import { HydratedDocument, Types } from 'mongoose';
import User, { Chat, Folder, IUser, IUserMethods, MessageStatus } from '../models/User';
import { AppError } from '../library/AppError';
import httpStatus from 'http-status';
import omit from '../utils/omit';
import pick from '../utils/pick';
import { JoiFrom, validateNestedForm, validateFlatForm } from './_joi/validateForm';
import throwIfError from '../utils/throwIfError';
import config from '../config';
import jwt from 'jsonwebtoken';
import { io } from '../@socket/socket';
import { IGroupChat } from '../models/GroupChat';
import { IChannel } from '../models/Channel';
import Content from '../models/Content';
import { getSocketByUserId } from '../@socket/utils';

export interface IUserIdentity {
   _id: string;
   username: string;
   name: string;
}

type TokenType = keyof typeof config.token;
interface ITokenPayload extends IUserIdentity {
   type: TokenType;
}

export default class UserService {
   private static _generateToken(
      type: TokenType,
      user: HydratedDocument<IUser, IUserMethods> | IUserIdentity
   ) {
      const username = user.username;
      const name = user.name;
      const _id = user._id.toString();
      const { secret, expiresIn } = config.token[type];
      const payload: ITokenPayload = { type, _id, username, name };
      const schema = 'Bearer';
      const token = jwt.sign(payload, secret, { expiresIn });
      return `${schema} ${token}`;
   }

   private static _parseToken(type: TokenType, token: string) {
      if (!token) throw new AppError(httpStatus.UNAUTHORIZED);
      const [schema, _token] = token.split(' ');
      if (schema !== 'Bearer') throw new AppError(httpStatus.UNAUTHORIZED);
      const payload = jwt.verify(_token, config.token[type].secret);
      if (
         typeof payload !== 'object' ||
         !payload._id ||
         !payload.username ||
         !payload.type ||
         !payload.name
      ) {
         throw new AppError(httpStatus.UNAUTHORIZED);
      }
      return payload as ITokenPayload;
   }

   static getUserIdentity(form: { accessToken: string }) {
      validateFlatForm(form, ['accessToken']);
      const tokenPayload = this._parseToken('access', form.accessToken);
      const { _id, username, name } = tokenPayload;
      return {
         _id,
         username,
         name
      } as IUserIdentity;
   }

   private static async _getUserByAccessToken(accessToken: string) {
      const tokenPayload = this._parseToken('access', accessToken);
      const user = await User.findById(tokenPayload._id);
      if (!user) throw new AppError(httpStatus.NOT_FOUND);
      return user;
   }

   static generateAccessToken(form: { refreshToken: string }) {
      validateFlatForm(form, ['refreshToken']);
      const tokenPayload = this._parseToken('refresh', form.refreshToken);
      return this._generateToken('access', tokenPayload);
   }

   static async sendResetPasswordLinkToUserEmail(form: { email: string }) {
      validateFlatForm(form, ['email']);
      const user = await User.findOne({ email: form.email });
      if (!user) throw new AppError(httpStatus.NOT_FOUND);
      const resetPasswordToken = this._generateToken('resetPassword', user);
      const resetPasswordLink = `${config.client.web.baseUrl}/reset-password?token=${resetPasswordToken}`;
      return resetPasswordLink;
      // TODO: Send Email
   }

   static async signup(form: {
      username: string;
      password: string;
      name: string;
      email: string;
      avatarUrl: string;
   }) {
      validateFlatForm(form, ['username', 'password', 'name', 'email', 'avatarUrl']);
      const { username, password, name, email, avatarUrl } = form;
      const user = new User({
         _id: new Types.ObjectId(),
         username,
         password,
         name,
         email,
         avatarUrl
      });
      await user.save().catch((err) => {
         if (err.code === 11000) {
            console.log(err);
            throw new AppError(httpStatus.CONFLICT, 'Username or Email already exists');
         } else {
            throw err;
         }
      });
   }
   static async signin(form: { username: string; password: string; persistent?: boolean }) {
      validateFlatForm(form, ['username', 'password'], ['persistent']);
      const user = await User.findOne({ username: form.username });
      if (!user || !user.verifyPassword(form.password))
         throw new AppError(httpStatus.FORBIDDEN, 'Invalid credentials');
      const accessToken = this._generateToken('access', user);
      const refreshToken = this._generateToken('refresh', user);
      user.refreshToken = refreshToken;
      await user.save();
      return {
         user: omit(user.toObject(), 'password', 'refreshToken'),
         accessToken,
         refreshToken
      };
   }

   static async resetPassword(form: { newPassword: string; resetPasswordToken: string }) {
      validateFlatForm(form, ['newPassword', 'resetPasswordToken']);
      const tokenPayload = this._parseToken('resetPassword', form.resetPasswordToken);
      const user = await User.findById(tokenPayload._id);
      if (!user) throw new AppError(httpStatus.NOT_FOUND);
      user.password = form.newPassword;
      await user.save();
   }

   static async getPublicProfile(form: { username?: string; userId?: string }) {
      throwIfError(
         JoiFrom({
            username: false,
            userId: false
         })
            .xor('username', 'userId')
            .validate(form)
      );
      let user: HydratedDocument<IUser, IUserMethods> | null = null;
      if (form.userId) {
         user = await User.findById(form.userId);
      } else if (form.username) {
         user = await User.findOne({ username: form.username });
      } else {
         throw new AppError(httpStatus.BAD_REQUEST);
      }
      if (!user) throw new AppError(httpStatus.NOT_FOUND);
      return pick(user.toObject(), '_id', 'name', 'avatarUrl', 'username');
   }

   static async getPublicProfilesById(form: { userIds: string[] }) {
      validateFlatForm(form, ['userIds']);
      const users = await User.find({ _id: { $in: form.userIds } });
      return users.map((u) => u.getPublicProfile());
   }

   userIdentity: IUserIdentity;
   constructor(form: { accessToken: string }) {
      validateFlatForm(form, ['accessToken']);
      this.userIdentity = UserService.getUserIdentity({ accessToken: form.accessToken });
   }
   private async _getFullUser(userId: string = this.userIdentity._id) {
      const user = await User.findById(userId);
      if (!user) throw new AppError(httpStatus.NOT_FOUND);
      return user;
   }

   async getPublicProfilesById(form: { userIds: string[] }) {
      return await UserService.getPublicProfilesById(form);
   }

   async signout() {
      return true;
   }

   async deleteAccount(form: { password: string }) {
      validateFlatForm(form, ['password']);
      const user = await this._getFullUser();
      if (!user.verifyPassword(form.password)) throw new AppError(httpStatus.FORBIDDEN);
      await user.deleteOne();
      return true;
   }

   async updateProfile(form: {
      updates: {
         avatarUrl?: string;
         name?: string;
      };
   }) {
      validateNestedForm(form, {
         updates: {
            avatarUrl: false,
            name: false
         }
      });
      const user = await this._getFullUser();
      user.set(form.updates);
      await user.save();
      return true;
   }

   async updateCredential(form: {
      password: string;
      updates: {
         password?: string;
         email?: string;
      };
   }) {
      throwIfError(
         JoiFrom({
            password: true,
            updates: {
               password: false,
               email: false
            }
         })
            .xor('updates.password', 'updates.email')
            .validate(form)
      );

      const user = await this._getFullUser();
      if (!user.verifyPassword(form.password)) {
         throw new AppError(httpStatus.FORBIDDEN);
      }
      if (form.updates.password) {
         user.password = form.updates.password;
         await user.save();
      } else if (form.updates.email) {
         if (user.email === form.updates.email) return;
         const anotherUser = await User.findOne({ email: form.updates.email });
         if (anotherUser) throw new AppError(httpStatus.CONFLICT);
         user.email = form.updates.email;
         await user.save();
      }
      return true;
   }

   async getUserData() {
      const user = await this._getFullUser();
      user.privateChats.forEach(async (pv) => {
         // Mark messages that were sent to user as delivered for themselves
         const chat = {
            type: 'user',
            id: pv.user.toString()
         } as Chat;
         user.markMessagesAsDelivered(chat, '', 'except-own');

         // Mark messages that were sent by other user as delivered for themselfs
         const otherUser = await this._getFullUser(chat.id);
         const otherUserChat = {
            type: 'user',
            id: this.userIdentity._id
         } as Chat;
         otherUser.markMessagesAsDelivered(otherUserChat, '', 'own');
         await otherUser.save();

         // Notif other user about message delivery if the person is online
         const userSocket = getSocketByUserId(chat.id);
         if (userSocket) {
            userSocket.emit('appAction', {
               method: 'markMessageAsDelivered',
               arg: {
                  chat: otherUserChat,
                  messageId: '',
                  sender: 'own'
               }
            });
         }
      });
      await user.save();
      return omit(user.toObject(), 'password', 'refreshToken');
   }

   async addContact(form: { username: string; name?: string }) {
      validateFlatForm(form, ['username'], ['name']);
      const user = await this._getFullUser();
      const contact = await User.findOne({ username: form.username });
      if (!contact) throw new AppError(httpStatus.NOT_FOUND, 'Username does not exists');

      if (user.contacts.find((c) => c.user.equals(contact._id)))
         throw new AppError(httpStatus.CONFLICT, 'This contact already exists');
      user.contacts.push({
         name: form.name || '',
         user: contact._id
      });
      await user.save();
      return {
         name: form.name,
         user: contact._id.toString()
      };
   }

   async removeContact(form: { userId: string }) {
      validateFlatForm(form, ['userId']);
      const user = await this._getFullUser();
      const newContacts = user.contacts.filter((c) => !c.user.equals(form.userId));
      if (user.contacts.length === newContacts.length) throw new AppError(httpStatus.NOT_FOUND);
      user.contacts = newContacts;
      await user.save();
      return form.userId;
   }

   async getContacts(form: { populate?: boolean }) {
      if (form.populate) {
         const user = await User.findById(this.userIdentity._id).populate('contacts.user');
         if (!user) throw new AppError(httpStatus.NOT_FOUND);
         return user.contacts;
      } else {
         const user = await this._getFullUser();
         return user.contacts;
      }
   }

   async getPreviusePrivateMessages(form: { userId: string; limit: number; messageId?: string }) {
      validateFlatForm(form, ['userId', 'limit'], ['messageId']);
      const user = await this._getFullUser();
      const pvIdx = user.privateChats.findIndex((pv) => pv.user.equals(form.userId));
      if (pvIdx === -1) new AppError(httpStatus.NOT_FOUND);
      const pv = user.privateChats[pvIdx];
      if (form.limit < 1) return [];
      if (form.messageId) {
         const messageIndex = pv.messages.findIndex((m) => m._id.equals(form.messageId || ''));
         if (messageIndex === -1) return [];
         pv.messages = pv.messages.slice(Math.max(0, messageIndex - form.limit), messageIndex);
         await user.populate(`privateChats.${pvIdx}.messages.message`);
         return user.privateChats[pvIdx].messages;
      } else {
         pv.messages = pv.messages.slice(
            Math.max(0, pv.messages.length - form.limit),
            pv.messages.length
         );
         await user.populate(`privateChats.${pvIdx}.messages.message`);
         return user.privateChats[pvIdx].messages;
      }
   }

   async markMessageAsSeen(form: { chat: Chat; messageId: string }) {
      const user = await this._getFullUser();
      user.markMessagesAsSeen(form.chat, form.messageId, 'except-own');
      await user.save();
      if (form.chat.type === 'user') {
         const otherUser = await this._getFullUser(form.chat.id);
         otherUser.markMessagesAsSeen(
            {
               type: 'user',
               id: this.userIdentity._id
            },
            form.messageId,
            'own'
         );
         await otherUser.save();
         getSocketByUserId(form.chat.id)?.emit('appAction', {
            method: 'markMessageAsSeen',
            arg: {
               chat: {
                  type: 'user',
                  id: this.userIdentity._id
               },
               messageId: form.messageId,
               sender: 'own'
            }
         });
      }
   }

   async sendPrivateMessage(form: { userId: string; text: string }) {
      validateFlatForm(form, ['userId', 'text']);
      const user = await this._getFullUser();
      const userOid = new Types.ObjectId(this.userIdentity._id);
      const otherUserOid = new Types.ObjectId(form.userId);
      let messageStatus: MessageStatus = 'sent';
      const content = new Content({
         text: form.text,
         edited: false
      });
      const message = {
         _id: new Types.ObjectId(),
         sender: userOid,
         status: messageStatus,
         content: content._id,
         sentAt: new Date()
      };

      const otherUserSocket = getSocketByUserId(form.userId);
      if (otherUserSocket) {
         otherUserSocket.emit('appAction', {
            method: 'addMessageToPrivateChat',
            arg: { userId: this.userIdentity._id, message, content: content.toObject() }
         });
         messageStatus = 'delivered';
      }

      let userPv = user.privateChats.find((pv) => pv.user.equals(form.userId));
      if (!userPv) {
         userPv = {
            user: otherUserOid,
            messages: []
         };
         user.privateChats.push(userPv);
      }
      userPv.messages.push(message);

      const otherUser = await User.findById(form.userId);
      if (!otherUser) throw new AppError(httpStatus.NOT_FOUND);
      let otherUserPv = otherUser.privateChats.find((pv) => pv.user.equals(this.userIdentity._id));
      if (!otherUserPv) {
         otherUserPv = {
            user: userOid,
            messages: []
         };
         otherUser.privateChats.push(otherUserPv);
      }
      otherUserPv.messages.push(message);

      await content.save();
      await user.save();
      await otherUser.save();

      return { userId: form.userId, message, content: content.toObject() };
   }

   async deletePrivateChat(form: { userId: string; deleteForOtherPerson?: boolean }) {
      validateFlatForm(form, ['userId'], ['deleteForOtherPerson']);
      const user = await this._getFullUser();
      user.privateChats = user.privateChats.filter((x) => !x.user.equals(form.userId));
      await user.save();

      if (form.deleteForOtherPerson) {
         const otherUser = await User.findById(form.userId);
         if (!otherUser) throw new AppError(httpStatus.NOT_FOUND);
         const pv = otherUser.privateChats.find((x) => x.user.equals(this.userIdentity._id));
         if (!pv) throw new AppError(httpStatus.NOT_FOUND);
         pv.messages = pv.messages.filter((m) => m.sender.equals(this.userIdentity._id));
         await otherUser.save();
         io.to(form.userId).emit('appAction', {
            method: 'deleteUserMessagesFromPrivateChat',
            arg: {
               user: this.userIdentity._id
            }
         });
      }
      return true;
   }

   async deleteMessageFromPrivateChat(form: {
      userId: string;
      messageId: string;
      deleteForOtherPerson?: boolean;
   }) {
      validateFlatForm(form, ['userId', 'messageId'], ['deleteForOtherPerson']);
      const user = await this._getFullUser();
      const userPv = user.privateChats.find((pv) => pv.user.equals(form.userId));
      if (!userPv) throw new AppError(httpStatus.NOT_FOUND);
      userPv.messages = userPv.messages.filter((m) => m._id.equals(form.messageId));
      await user.save();
      if (form.deleteForOtherPerson) {
         const otherUser = await User.findById(form.userId);
         if (!otherUser) throw new AppError(httpStatus.NOT_FOUND);
         const otherUserPv = otherUser.privateChats.find((pv) =>
            pv.user.equals(this.userIdentity._id)
         );
         if (!otherUserPv) throw new AppError(httpStatus.NOT_FOUND);
         otherUserPv.messages = otherUserPv.messages.filter((m) => m._id.equals(form.messageId));
         await otherUser.save();
         io.to(form.userId).emit('appAction', {
            method: 'deleteUserMessagesFromPrivateChat',
            arg: {
               user: this.userIdentity._id,
               message: form.messageId
            }
         });
      }
   }

   async seen() {
      const user = await this._getFullUser();
      user.lastSeen = new Date();
      user.save();
      return true;
   }
   async typing(form: { userId?: string; groupChatId?: string; channelId?: string }) {
      throwIfError(
         JoiFrom({
            userId: false,
            groupChatId: false,
            channelId: false
         })
            .xor('userId', 'groupChatId', 'channelId')
            .validate(form)
      );

      io.to(form.userId || form.groupChatId || form.channelId || '').emit('UserService', {
         method: 'isTyping',
         arg: form
      });
      return true;
   }

   async createFolder(form: { name: string; chats: Folder['chats'] }) {
      const user = await this._getFullUser();
      user.createFolder(form.name, form.chats || []);
      await user.save();
      return true;
   }
   async addChatToFolder(form: { folderId: string; chat: Folder['chats'][number] }) {
      const user = await this._getFullUser();
      const folder = user.folders.find((f) => f.id.equals(form.folderId));
      if (!folder) throw new AppError(httpStatus.NOT_FOUND);
      folder.chats.push(form.chat);
      await user.save();
      return true;
   }
   async removeFolder(form: { folderId: string }) {
      const user = await this._getFullUser();
      const fCountBeforeRemove = user.folders.length;
      user.folders = user.folders.filter((f) => !f.id.equals(form.folderId));
      if (fCountBeforeRemove === user.folders.length) throw new AppError(httpStatus.NOT_FOUND);
      await user.save();
      return true;
   }
   async removeChatFromFolder(form: { folderId: string; chatId: string }) {
      const user = await this._getFullUser();
      const folder = user.folders.find((f) => f.id.equals(form.folderId));
      if (!folder) throw new AppError(httpStatus.NOT_FOUND);
      const cCountBefroeRemove = folder.chats.length;
      folder.chats = folder.chats.filter((c) => !c.id.equals(form.chatId));
      if (cCountBefroeRemove === folder.chats.length) throw new AppError(httpStatus.NOT_FOUND);
      await user.save();
      return true;
   }

   async getContents(form: { contentIds: string[] }) {
      validateFlatForm(form, ['contentIds']);
      const contents = await Content.find({ _id: { $in: form.contentIds } });
      return contents;
   }
}
