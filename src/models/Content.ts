import { Model, Schema, model, Types } from 'mongoose';

export interface IContent {
   text: string;
   edited: boolean;
}

interface IContentMethods {}

const ContentSchema = new Schema<IContent, {}, IContentMethods>({
   text: String,
   edited: Boolean
});

export type ContentModel = Model<IContent, {}, IContentMethods>;
const Content = model<IContent, ContentModel>('Content', ContentSchema);

export default Content;
