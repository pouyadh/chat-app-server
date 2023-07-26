import { Model, Schema, model, Types } from 'mongoose';

export const GROUP_CHAT_ALL_PERMISSIONS = {
   // user
   joinGroup: 'Join group',
   leaveGroup: 'leave group',
   seeGroupInfo: 'See group info',
   seeGroupMembers: 'See group members',
   // member
   sendMessage: 'Send message',
   sendPhotos: 'Send photos',
   sendVideoFiles: 'Send video files',
   sendVideoMessages: 'Send video messages',
   sendMusic: 'Send music',
   sendVoiceMessage: 'Send voice message',
   sendFiles: 'Send files',
   addMembers: 'Add members',
   pinMessages: 'Pin messages',
   changeGroupInfo: 'Change group info',
   deleteOwnMessage: 'Delete own message',
   // admin
   deleteMessages: 'Delete Messages',
   banUsers: 'Ban users',
   inviteUsersViaLink: 'Invite users via link',
   manageVideoChats: 'Manage video chats',
   remainAnonymous: 'Remain anonymous',
   addNewAdmins: 'Add new admins',
   removeAdmins: 'Remove admins',
   kickMembers: 'Kick members',
   updateMemberPermissionOverrides: 'Update member permission overrides',
   // owner
   transferOwnership: 'Transfer Ownership',
   deleteGroup: 'Delete group'
} as const;

export type GroupChatAllPermissions = keyof typeof GROUP_CHAT_ALL_PERMISSIONS;
export type GroupChatAllPermissionObject = {
   [Key in GroupChatAllPermissions]: boolean;
};
export type GroupChatPartialPermissionObject = Partial<GroupChatAllPermissionObject>;
export type GroupChatRoles = 'owner' | 'admin' | 'member' | 'user' | 'guest';

export type GroupChatMessageContentItem = {
   type: 'message';
   data: {
      sender: Types.ObjectId;
      message: Types.ObjectId;
      hiddenFor: Types.ObjectId[];
   };
};
export type GroupChatActivityContentItem = {
   type: 'activity';
   data: {
      commiter: Types.ObjectId;
      type: 'createGroupChat' | 'addSubscriber' | 'removeSubscriber';
      data: any;
   };
};

export type GroupChatContentItem = GroupChatActivityContentItem | GroupChatMessageContentItem;

export interface IGroupChat {
   info: {
      avatarUrl: string;
      name: string;
      description: string;
   };
   members: {
      role: GroupChatRoles;
      user: Types.ObjectId;
      permissionOverrides: GroupChatPartialPermissionObject;
      customTitle?: string;
   }[];
   adminPermissions: GroupChatPartialPermissionObject;
   memberPermissions: GroupChatPartialPermissionObject;
   guestPermissions: GroupChatPartialPermissionObject;
   contents: GroupChatContentItem[];
}

const GROUP_CHAT_DEFAULT_PERMISSIONS: {
   [Role in GroupChatRoles]: GroupChatPartialPermissionObject;
} = {
   owner: {
      leaveGroup: true,
      seeGroupInfo: true,
      seeGroupMembers: true,
      sendMessage: true,
      sendPhotos: true,
      sendVideoFiles: true,
      sendMusic: true,
      sendVoiceMessage: true,
      sendFiles: true,
      addMembers: true,
      pinMessages: true,
      changeGroupInfo: true,
      deleteMessages: true,
      banUsers: true,
      inviteUsersViaLink: true,
      manageVideoChats: true,
      remainAnonymous: true,
      addNewAdmins: true,
      transferOwnership: true
   },
   admin: {
      leaveGroup: true,
      seeGroupInfo: true,
      seeGroupMembers: true,
      sendMessage: true,
      sendPhotos: true,
      sendVideoFiles: true,
      sendMusic: true,
      sendVoiceMessage: true,
      sendFiles: true,
      addMembers: true,
      pinMessages: true,
      changeGroupInfo: true,
      deleteMessages: true,
      banUsers: true,
      inviteUsersViaLink: true,
      manageVideoChats: true,
      remainAnonymous: false,
      addNewAdmins: false
   },
   member: {
      leaveGroup: true,
      seeGroupInfo: true,
      seeGroupMembers: true,
      sendMessage: true,
      sendPhotos: true,
      sendVideoFiles: true,
      sendMusic: true,
      sendVoiceMessage: true,
      sendFiles: true,
      addMembers: true,
      pinMessages: true,
      changeGroupInfo: true
   },
   user: {
      joinGroup: true,
      seeGroupInfo: true,
      seeGroupMembers: false
   },
   guest: {
      seeGroupInfo: true
   }
};

export const GROUP_CHAT_EDITABLE_PERMISSIONS = {
   admin: [
      'changeGroupInfo',
      'deleteMessages',
      'banUsers',
      'inviteUsersViaLink',
      'pinMessages',
      'manageVideoChats',
      'remainAnonymous',
      'addNewAdmins'
   ] as Array<GroupChatAllPermissions>,
   member: [
      'sendMessage',
      'sendPhotos',
      'sendVideoFiles',
      'sendVideoMessages',
      'sendMusic',
      'sendVoiceMessage',
      'sendFiles',
      'addMembers',
      'pinMessages',
      'changeGroupInfo',
      'sendMessageDelay'
   ] as Array<GroupChatAllPermissions>
} as const;

interface IGroupChatMethods {
   authorize(userId: string): {
      role: GroupChatRoles;
      permissions: GroupChatPartialPermissionObject;
   };
   isAdmin(userId: string): boolean;
   isMember(userId: string): boolean;
   addMember(userId: string): boolean;
   removeMember(userId: string): boolean;
   hasPermission(userId: string, permission: GroupChatAllPermissions): boolean;
   getMember(userId: string): IGroupChat['members'][number];
   addActivity(data: GroupChatActivityContentItem['data']): void;
   addMessage(data: GroupChatMessageContentItem['data']): void;
   deleteMessage(messageId: string): void;
   getMessage(messageId: string): GroupChatMessageContentItem | undefined;
}

interface GroupChatModel extends Model<IGroupChat, {}, IGroupChatMethods> {}

const GroupChatSchema = new Schema<IGroupChat, GroupChatModel, IGroupChatMethods>(
   {
      info: {
         avatarUrl: String,
         name: String,
         description: String
      },
      members: [
         {
            role: { type: String, enum: ['owner', 'admin', 'member'] },
            user: { type: Schema.Types.ObjectId, ref: 'User' },
            permissionOverrides: {
               type: Object.keys(GROUP_CHAT_ALL_PERMISSIONS).reduce(
                  (o, permission) => ({ ...o, [permission]: Boolean }),
                  {}
               ),
               default: {}
            },
            customTitle: String,
            slowMode: {
               type: Number,
               enum: [0, 10, 30, 60, 300, 900, 3600],
               default: 0
            }
         }
      ],
      adminPermissions: {
         type: Object.keys(GROUP_CHAT_ALL_PERMISSIONS).reduce(
            (o, permission) => ({ ...o, [permission]: Boolean }),
            {}
         ),
         default: GROUP_CHAT_DEFAULT_PERMISSIONS.admin
      },
      memberPermissions: {
         type: Object.keys(GROUP_CHAT_ALL_PERMISSIONS).reduce(
            (o, permission) => ({ ...o, [permission]: Boolean }),
            {}
         ),
         default: GROUP_CHAT_DEFAULT_PERMISSIONS.member
      },
      guestPermissions: {
         type: Object.keys(GROUP_CHAT_ALL_PERMISSIONS).reduce(
            (o, permission) => ({ ...o, [permission]: Boolean }),
            {}
         ),
         default: GROUP_CHAT_DEFAULT_PERMISSIONS.guest
      },
      contents: [
         {
            type: {
               type: String,
               enum: ['message', 'activity']
            },
            data: {
               // If type === 'message'
               sender: { Type: Schema.Types.ObjectId, ref: 'User' },
               message: { type: Schema.Types.ObjectId, ref: 'Message' },
               hiddenFor: [{ Type: Schema.Types.ObjectId, ref: 'User' }],
               // If type === 'activity'
               commiter: { Type: Schema.Types.ObjectId, ref: 'User' },
               type: String,
               data: Object
            }
         }
      ]
   },
   { timestamps: true, versionKey: false }
);

GroupChatSchema.method<InstanceType<typeof GroupChat>>(
   'authorize',
   function authorize(userId: string) {
      const member = this.members.find((x) => x.user.equals(userId)) as
         | IGroupChat['members'][number]
         | undefined;
      if (!member) {
         return {
            role: 'guest',
            permissions: {
               ...this.guestPermissions
            }
         };
      }
      return {
         role: member.role,
         permissions: {
            ...GROUP_CHAT_DEFAULT_PERMISSIONS[member.role],
            ...member.permissionOverrides
         }
      };
   }
);

GroupChatSchema.method<InstanceType<typeof GroupChat>>(
   'isAdmin',
   function isAdmin(userId: string): boolean {
      return this.authorize(userId).role === 'admin';
   }
);

GroupChatSchema.method<InstanceType<typeof GroupChat>>(
   'isMember',
   function isMember(userId: string): boolean {
      return this.authorize(userId).role === 'member';
   }
);
GroupChatSchema.method<InstanceType<typeof GroupChat>>(
   'addMember',
   function addMember(userId: string): boolean {
      if (this.isMember(userId)) return false;
      this.members.push({
         role: 'member',
         user: new Types.ObjectId(userId),
         permissionOverrides: {}
      });
      return true;
   }
);
GroupChatSchema.method<InstanceType<typeof GroupChat>>(
   'removeMember',
   function removeMember(userId: string): boolean {
      if (!this.isMember(userId)) return false;
      this.members = this.members.filter((m) => !m.user.equals(userId));
      return true;
   }
);

GroupChatSchema.method<InstanceType<typeof GroupChat>>(
   'hasPermission',
   function hasPermission(userId: string, permission: GroupChatAllPermissions): boolean {
      return !!this.authorize(userId).permissions[permission];
   }
);

GroupChatSchema.method<InstanceType<typeof GroupChat>>(
   'getMember',
   function getMember(userId: string) {
      return this.members.find((x) => x.user.equals(userId));
   }
);

GroupChatSchema.method<InstanceType<typeof GroupChat>>(
   'addMessage',
   function addMessage(data: GroupChatMessageContentItem['data']): void {
      this.contents.push({
         type: 'message',
         data
      });
   }
);

GroupChatSchema.method<InstanceType<typeof GroupChat>>(
   'deleteMessage',
   function deleteMessage(messageId: string): void {
      this.contents = this.contents.filter(
         ({ type, data }) => type === 'activity' || !data.message.equals(messageId)
      );
   }
);

GroupChatSchema.method<InstanceType<typeof GroupChat>>(
   'getMessage',
   function getMessage(messageId: string): GroupChatMessageContentItem | undefined {
      return this.contents.find(
         ({ type, data }) => type === 'message' && data.message.equals(messageId)
      ) as GroupChatMessageContentItem | undefined;
   }
);

GroupChatSchema.method<InstanceType<typeof GroupChat>>(
   'addActivity',
   function addActivity(data: GroupChatActivityContentItem['data']): void {
      this.contents.push({
         type: 'activity',
         data
      });
   }
);

const GroupChat = model<IGroupChat, GroupChatModel>('GroupChat', GroupChatSchema);

export default GroupChat;
