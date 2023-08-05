import Joi from 'joi';

const id = Joi.string().regex(/^[a-f\d]{24}$/i);

const fields = {
   id: Joi.string().regex(/^[a-f\d]{24}$/i),
   memberUserId: Joi.string().regex(/^[a-f\d]{24}$/i),
   subscriberUserId: Joi.string().regex(/^[a-f\d]{24}$/i),
   messageId: Joi.string().regex(/^[a-f\d]{24}$/i),
   adminUserId: Joi.string().regex(/^[a-f\d]{24}$/i),
   newOwnerUserId: Joi.string().regex(/^[a-f\d]{24}$/i),
   userId: Joi.string().regex(/^[a-f\d]{24}$/i),
   targetUserId: Joi.string().regex(/^[a-f\d]{24}$/i),
   privateChatId: Joi.string().regex(/^[a-f\d]{24}$/i),
   groupChatId: Joi.string().regex(/^[a-f\d]{24}$/i),
   channelId: Joi.string().regex(/^[a-f\d]{24}$/i),
   username: Joi.string().min(5).max(20).lowercase(),
   email: Joi.string().email().lowercase(),
   password: Joi.string().min(8).max(20),
   newPassword: Joi.string().min(8).max(20),
   token: Joi.string(),
   resetToken: Joi.string(),
   accessToken: Joi.string(),
   refreshToken: Joi.string(),
   resetPasswordToken: Joi.string(),
   name: Joi.string().min(3).max(100),
   avatarUrl: Joi.string(),
   title: Joi.string(),
   members: Joi.array().items(id),
   messageText: Joi.string(),
   persistent: Joi.boolean(),
   message: Joi.string(),
   limit: Joi.number(),
   get userIds() {
      return Joi.array().items(this.userId).min(1);
   },
   get messageIds() {
      return Joi.array().items(this.id).min(1);
   },
   get subscriberUserIds() {
      return Joi.array().items(this.subscriberUserId);
   },
   deleteForEveryone: Joi.boolean(),
   userService: Joi.object(),
   deleteForOtherPerson: Joi.boolean(),
   description: Joi.string(),
   get groupChatIds() {
      return Joi.array().items(this.groupChatId).min(1);
   },
   get channelIds() {
      return Joi.array().items(this.channelId).min(1);
   }
};
export default fields;
