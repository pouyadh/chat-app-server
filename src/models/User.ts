import { Model, Schema, model, Types, HydratedDocument } from 'mongoose';
import bcrypt from 'bcrypt';
import pick from '../utils/pick';
import { IContent } from './Content';

export type Chat = {
   type: 'user' | 'group' | 'channel';
   id: string;
};

export type MessageStatus = 'sent' | 'delivered' | 'seen';

export type Folder = {
   id: Types.ObjectId;
   name: string;
   chats: {
      type: 'user' | 'group' | 'channel';
      id: Types.ObjectId;
   }[];
};

export type IMessage = {
   _id: Types.ObjectId;
   sender: Types.ObjectId;
   status: MessageStatus;
   content: Types.ObjectId;
   sentAt: Date;
};
export type IMessagePopulated = IMessage & { content: IContent };

export interface IUser {
   username: string;
   email: string;
   name: string;
   avatarUrl: string;
   password: string;
   refreshToken?: string;
   contacts: {
      name: string;
      user: Types.ObjectId;
   }[];
   privateChats: {
      user: Types.ObjectId;
      messages: IMessage[];
   }[];
   groupChats: Types.ObjectId[];
   channels: Types.ObjectId[];
   savedMessages: Types.ObjectId[];
   lastSeen: Date;
   folders: Folder[];
}

export interface IUserPublicProfile extends Pick<IUser, 'username' | 'name' | 'avatarUrl'> {
   _id: Types.ObjectId;
}

export interface IUserMethods {
   verifyPassword(password: string): boolean;
   createFolder(name: string, chats?: Folder['chats']): void;
   getPublicProfile(): IUserPublicProfile;
   markPrivateMessagesAsSeen(userId: string, lastSeenMessageId: string): void;
   getPrivateChat(userId: string): IUser['privateChats'][number] | undefined;
}

interface UserModel extends Model<IUser, {}, IUserMethods> {}

const schema = new Schema<IUser, UserModel, IUserMethods>(
   {
      username: { type: String, required: true, trim: true, lowercase: true, unique: true },
      email: { type: String, required: true, trim: true, lowercase: true, unique: true },
      name: { type: String, required: true },
      avatarUrl: { type: String, required: true },
      password: { type: String, required: true },
      refreshToken: { type: String },
      contacts: [
         {
            name: String,
            user: { type: Schema.Types.ObjectId, ref: 'User' }
         }
      ],
      privateChats: [
         {
            user: { type: Schema.Types.ObjectId, ref: 'User' },
            messages: [
               {
                  _id: { type: Schema.Types.ObjectId, default: new Types.ObjectId() },
                  sender: { type: Schema.Types.ObjectId, ref: 'User' },
                  status: { type: String, enum: ['sent', 'delivered', 'seen'] },
                  content: { type: Schema.Types.ObjectId, ref: 'Content' },
                  sentAt: { type: Date, default: () => new Date() }
               }
            ]
         }
      ],
      groupChats: [{ type: Schema.Types.ObjectId, ref: 'GroupChat' }],
      channels: [{ type: Schema.Types.ObjectId, ref: 'Channel' }],
      savedMessages: [{ type: Schema.Types.ObjectId, ref: 'Message' }],
      lastSeen: { type: Date, default: () => new Date() },
      folders: [
         {
            id: Schema.Types.ObjectId,
            name: String,
            chats: [
               {
                  type: String,
                  id: Schema.Types.ObjectId
               }
            ]
         }
      ]
   },
   { timestamps: true, versionKey: false }
);

schema.pre('save', async function (next) {
   if (!this.isModified('password')) {
      return next();
   }
   const salt = await bcrypt.genSalt(10);
   const hashedPassword = await bcrypt.hash(this.password, salt);
   this.password = hashedPassword;
   next();
});

schema.method('verifyPassword', function verifyPassword(password: string): boolean {
   return bcrypt.compareSync(password, this.password);
});

schema.method<InstanceType<typeof User>>(
   'createFolder',
   function createFolder(name: string, chats: Folder['chats'] = []): void {
      this.folders.push({
         id: new Types.ObjectId(),
         name,
         chats
      });
   }
);

schema.method<InstanceType<typeof User>>(
   'getPublicProfile',
   function getPublicProfile(): IUserPublicProfile {
      return pick(this.toObject(), '_id', 'username', 'name', 'avatarUrl');
   }
);

schema.method<InstanceType<typeof User>>(
   'markPrivateMessagesAsSeen',
   function markPrivateMessagesAsSeen(userId: string, lastSeenMessageId: string): void {
      const pv = this.privateChats.find((pv) => pv.user.equals(userId));
      if (!pv) return;
      let idx: number = pv.messages.length - 1;
      while (idx > 0 && !pv.messages[idx]._id.equals(lastSeenMessageId)) {
         idx--;
      }
      while (idx > 0 && pv.messages[idx].status !== 'seen') {
         pv.messages[idx].status = 'seen';
      }
   }
);

schema.method<InstanceType<typeof User>>('getPrivateChat', function getPrivateChat(userId: string):
   | IUser['privateChats'][number]
   | undefined {
   return this.privateChats.find((pv) => pv.user.equals(userId));
});

const User = model<IUser, UserModel>('User', schema);

export default User;

export type UserDocument = HydratedDocument<IUser, IUserMethods>;
export type IUserWith_id = IUser & { _id: Types.ObjectId } & Required<{ _id: Types.ObjectId }>;
