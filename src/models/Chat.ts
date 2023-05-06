import mongoose, { Document, Schema } from 'mongoose';

export interface IChat {
   type: 'group' | 'channel';
   creator: mongoose.Types.ObjectId;
   avatarUrl: string;
   title: string;
   members: mongoose.Types.ObjectId[];
   messages: mongoose.Types.ObjectId[];
}

export interface IChatModel extends IChat, Document {}

const ChatSchema: Schema = new Schema(
   {
      type: { type: String, enum: ['group', 'channel'] },
      creator: { type: mongoose.Types.ObjectId, ref: 'User' },
      avatarUrl: String,
      title: String,
      members: [{ type: mongoose.Types.ObjectId, ref: 'User' }],
      messages: [{ type: mongoose.Types.ObjectId, ref: 'Message' }]
   },
   { timestamps: true, versionKey: false }
);

export default mongoose.model<IChatModel>('Chat', ChatSchema);
