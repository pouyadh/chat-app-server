import { Model, Schema, model, Types } from 'mongoose';

export const CHANNEL_ALL_PERMISSIONS = {
   // user
   joinChannel: 'Join channel',
   leaveChannel: 'leave channel',
   seeChannelInfo: 'See channel info',
   seeChannelSubscribers: 'See channel subscribers',
   // subscriber
   seeMessages: 'See messages',
   // admin
   pinMessages: 'Pin messages',
   deleteOwnMessage: 'Delete own message',
   changeChannelInfo: 'Change channel info',
   postMessages: 'Post messages',
   editMessagesOfOthers: 'Edit messages of others',
   deleteMessagesOfOthers: 'Delete messages of others',
   addSubscribers: 'Add subscribers',
   manageLiveStreams: 'Manage live streams',
   addNewAdmins: 'Add new admins',
   removeSubscribers: 'Remove subscribers',
   removeAdmins: 'Remove admins',
   editOwnMessage: 'Edit own Message',

   // owner
   updateAdminsPermissions: 'Update admins permissions',
   transferOwnership: 'Transfer Ownership',
   deleteChannel: 'Delete channel'
} as const;

export type ChannelAllPermissions = keyof typeof CHANNEL_ALL_PERMISSIONS;
export type ChannelAllPermissionObject = {
   [Key in ChannelAllPermissions]: boolean;
};
export type ChannelPartialPermissionObject = Partial<ChannelAllPermissionObject>;
export type ChannelRoles = 'owner' | 'admin' | 'subscriber' | 'user' | 'guest';

export type ChannelMessageContentItem = {
   type: 'message';
   data: {
      sender: Types.ObjectId;
      message: Types.ObjectId;
      hiddenFor: Types.ObjectId[];
   };
};
export type ChannelActivityContentItem = {
   type: 'activity';
   data: {
      commiter: Types.ObjectId;
      type: 'createChannel' | 'addSubscriber' | 'removeSubscriber';
      data: any;
   };
};

export type ChannelContentItem = ChannelActivityContentItem | ChannelMessageContentItem;

export type ChannelInfo = {
   avatarUrl: string;
   name: string;
   description: string;
};

export interface IChannel {
   info: ChannelInfo;
   subscribers: {
      role: ChannelRoles;
      user: Types.ObjectId;
      permissionOverrides: ChannelPartialPermissionObject;
   }[];
   contents: ChannelContentItem[];
   guestPermissions: ChannelPartialPermissionObject;
   activities: string[];
}

const CHANNEL_DEFAULT_PERMISSIONS: {
   [Role in ChannelRoles]: ChannelPartialPermissionObject;
} = {
   owner: {
      seeChannelInfo: true,
      seeChannelSubscribers: true,
      postMessages: true,
      addSubscribers: true,
      pinMessages: true,
      changeChannelInfo: true,
      deleteMessagesOfOthers: true,
      editMessagesOfOthers: true,
      deleteChannel: true,
      deleteOwnMessage: true,
      removeSubscribers: true,
      manageLiveStreams: true,
      removeAdmins: true,
      seeMessages: true,
      addNewAdmins: true,
      transferOwnership: true
   },
   admin: {
      leaveChannel: true,
      seeChannelInfo: true,
      seeChannelSubscribers: true,
      postMessages: true,
      addSubscribers: true,
      pinMessages: true,
      changeChannelInfo: true,
      deleteMessagesOfOthers: true,
      editMessagesOfOthers: true,
      deleteChannel: true,
      deleteOwnMessage: true,
      removeSubscribers: true,
      manageLiveStreams: true,
      removeAdmins: true,
      seeMessages: true
   },
   subscriber: {
      leaveChannel: true,
      seeChannelInfo: true,
      seeChannelSubscribers: true,
      seeMessages: true
   },
   user: {
      joinChannel: true,
      seeChannelInfo: true
   },
   guest: {
      seeChannelInfo: true
   }
};

export const CHANNEL_EDITABLE_PERMISSIONS = {
   admin: [
      'changeChannelInfo',
      'postMessages',
      'editMessagesOfOthers',
      'deleteMessagesOfOthers',
      'addSubscribers',
      'manageLiveStreams',
      'addNewAdmins'
   ] as Array<ChannelAllPermissions>
} as const;

interface IChannelMethods {
   authorize(userId: string): {
      role: ChannelRoles;
      permissions: ChannelPartialPermissionObject;
   };
   isAdmin(userId: string): boolean;
   isSubscriber(userId: string): boolean;
   addSubscriber(userId: string): boolean;
   removeSubscriber(userId: string): boolean;
   hasPermission(userId: string, permission: ChannelAllPermissions): boolean;
   getSubscriber(userId: string): IChannel['subscribers'][number];
   addActivity(data: ChannelActivityContentItem['data']): void;
   addMessage(data: ChannelMessageContentItem['data']): void;
   deleteMessage(messageId: string): void;
   getMessage(messageId: string): ChannelMessageContentItem | undefined;
}

export interface ChannelModel extends Model<IChannel, {}, IChannelMethods> {}

const ChannelSchema = new Schema<IChannel, ChannelModel, IChannelMethods>(
   {
      info: {
         avatarUrl: String,
         name: String,
         description: String
      },
      subscribers: [
         {
            role: { type: String, enum: ['owner', 'admin', 'subscriber', 'user'] },
            user: Schema.Types.ObjectId,
            permissionOverrides: Object.keys(CHANNEL_ALL_PERMISSIONS).reduce(
               (o, permission) => ({ ...o, [permission]: Boolean }),
               {}
            )
         }
      ],
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
      ],
      guestPermissions: {
         type: Object.keys(CHANNEL_ALL_PERMISSIONS).reduce(
            (o, permission) => ({ ...o, [permission]: Boolean }),
            {}
         ),
         default: CHANNEL_DEFAULT_PERMISSIONS.guest
      },
      activities: [String]
   },
   { timestamps: true, versionKey: false }
);

ChannelSchema.method<InstanceType<typeof Channel>>('authorize', function authorize(userId: string) {
   const subscriber = this.subscribers.find((x) => x.user.equals(userId)) as
      | IChannel['subscribers'][number]
      | undefined;
   if (!subscriber) {
      return {
         role: 'guest',
         permissions: {
            ...this.guestPermissions
         }
      };
   }
   return {
      role: subscriber.role,
      permissions: {
         ...CHANNEL_DEFAULT_PERMISSIONS[subscriber.role],
         ...subscriber.permissionOverrides
      }
   };
});

ChannelSchema.method<InstanceType<typeof Channel>>(
   'isAdmin',
   function isAdmin(userId: string): boolean {
      return this.authorize(userId).role === 'admin';
   }
);

ChannelSchema.method<InstanceType<typeof Channel>>(
   'isSubscriber',
   function isSubscriber(userId: string): boolean {
      return this.authorize(userId).role === 'subscriber';
   }
);
ChannelSchema.method<InstanceType<typeof Channel>>(
   'addSubscriber',
   function addSubscriber(userId: string): boolean {
      if (this.isSubscriber(userId)) return false;
      this.subscribers.push({
         role: 'subscriber',
         user: new Types.ObjectId(userId),
         permissionOverrides: {}
      });
      return true;
   }
);
ChannelSchema.method<InstanceType<typeof Channel>>(
   'removeSubscriber',
   function removeSubscriber(userId: string): boolean {
      if (!this.isSubscriber(userId)) return false;
      this.subscribers = this.subscribers.filter((m) => !m.user.equals(userId));
      return true;
   }
);

ChannelSchema.method<InstanceType<typeof Channel>>(
   'hasPermission',
   function hasPermission(userId: string, permission: ChannelAllPermissions): boolean {
      return !!this.authorize(userId).permissions[permission];
   }
);

ChannelSchema.method<InstanceType<typeof Channel>>(
   'getSubscriber',
   function getSubscriber(userId: string) {
      return this.subscribers.find((x) => x.user.equals(userId));
   }
);

ChannelSchema.method<InstanceType<typeof Channel>>(
   'addMessage',
   function addMessage(data: ChannelMessageContentItem['data']): void {
      this.contents.push({
         type: 'message',
         data
      });
   }
);

ChannelSchema.method<InstanceType<typeof Channel>>(
   'deleteMessage',
   function deleteMessage(messageId: string): void {
      this.contents = this.contents.filter(
         ({ type, data }) => type === 'activity' || !data.message.equals(messageId)
      );
   }
);

ChannelSchema.method<InstanceType<typeof Channel>>(
   'getMessage',
   function getMessage(messageId: string): ChannelMessageContentItem | undefined {
      return this.contents.find(
         ({ type, data }) => type === 'message' && data.message.equals(messageId)
      ) as ChannelMessageContentItem | undefined;
   }
);

ChannelSchema.method<InstanceType<typeof Channel>>(
   'addActivity',
   function addActivity(data: ChannelActivityContentItem['data']): void {
      this.contents.push({
         type: 'activity',
         data
      });
   }
);

const Channel = model<IChannel, ChannelModel>('Channel', ChannelSchema);

export default Channel;
