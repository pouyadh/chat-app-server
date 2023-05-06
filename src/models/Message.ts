import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage {
   sender: mongoose.Types.ObjectId;
   text: string;
   outgoingStatus: 'sent' | 'delivered' | 'seen';
}

export interface IMessageModel extends IMessage, Document {}

const MessageSchema: Schema = new Schema(
   {
      sender: { type: mongoose.Types.ObjectId, ref: 'User' },
      text: String,
      outgoingStatus: { type: String, enum: ['sent', 'delivered', 'seen'], default: 'sent' }
   },
   { timestamps: true, versionKey: false }
);

export default mongoose.model<IMessageModel>('Message', MessageSchema);
