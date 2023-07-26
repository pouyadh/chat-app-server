import Joi, { extend } from 'joi';
import fields from './fields';
import { Schema } from 'mongoose';

type NameOfFields = keyof typeof fields;

type FieldValueType<FieldName extends NameOfFields> = ReturnType<
   (typeof fields)[FieldName]['validate']
>['value'];

type ToSchema<T> = {
   [K in keyof T]: T[K] extends boolean
      ? K extends NameOfFields
         ? T[K] extends true
            ? (typeof fields)[K]
            : (typeof fields)[K]
         : never
      : ToSchema<T[K]>;
};
type ToValidForm<T> = {
   [K in keyof T]: T[K] extends boolean
      ? K extends NameOfFields
         ? T[K] extends true
            ? Exclude<FieldValueType<K>, undefined>
            : FieldValueType<K>
         : never
      : ToValidForm<T[K]>;
};

type PartialFieldRecord = Partial<{
   [K in NameOfFields]: boolean;
}>;

type FormSchema = {
   [key: string]: boolean | undefined | FormSchema;
} & PartialFieldRecord;

export function validateFlatForm<R extends NameOfFields, O extends NameOfFields>(
   form: object,
   required: R[],
   optional: O[] = []
) {
   const rSch = required.reduce((p, k) => ({ ...p, [k]: fields[k].required() }), {}) as {
      [K in R]: ReturnType<(typeof fields)[K]['required']>;
   };
   const oSch = optional.reduce((p, k) => ({ ...p, [k]: fields[k] }), {}) as {
      [K in O]: (typeof fields)[K];
   };

   const Sch = { ...rSch, ...oSch };

   type ValidForm = {
      [K in keyof typeof rSch]: Exclude<
         ReturnType<(typeof rSch)[K]['validate']>['value'],
         undefined
      >;
   } & {
      [K in keyof typeof oSch]: ReturnType<(typeof oSch)[K]['validate']>['value'];
   };

   const { value, error } = Joi.object(Sch).validate(form);
   if (error) throw error;

   return value as ValidForm;
}

export function validateNestedForm<FS extends FormSchema>(form: object, fromSchema: FS) {
   const convert = (formSchema: FormSchema) => {
      const result: {
         [K in NameOfFields]+?: (typeof fields)[K];
      } & {
         [key: string]: any;
      } = {};
      for (const key in formSchema) {
         const value = formSchema[key];
         if (typeof value === 'object' && value != null) {
            result[key] = convert(value);
         } else {
            result[key] = value
               ? fields[key as NameOfFields].required()
               : fields[key as NameOfFields];
         }
      }
      return result;
   };
   const schema = convert(fromSchema) as ToSchema<FS>;
   const { value, error } = Joi.object(schema).validate(form);
   if (error) throw error;

   return value as ToValidForm<FS>;
}

export function formSchemaToJoiSchema<FS extends FormSchema>(fromSchema: FS) {
   const convert = (formSchema: FormSchema) => {
      const result: {
         [K in NameOfFields]+?: (typeof fields)[K];
      } & {
         [key: string]: any;
      } = {};
      for (const key in formSchema) {
         const value = formSchema[key];
         if (typeof value === 'object' && value != null) {
            result[key] = convert(value);
         } else {
            result[key] = value
               ? fields[key as NameOfFields].required()
               : fields[key as NameOfFields];
         }
      }
      return result;
   };
   const schema = convert(fromSchema) as ToSchema<FS>;
   return schema;
}

export function JoiFrom<FS extends FormSchema>(fromSchema: FS) {
   const convert = (formSchema: FormSchema) => {
      const result: {
         [K in NameOfFields]+?: (typeof fields)[K];
      } & {
         [key: string]: any;
      } = {};
      for (const key in formSchema) {
         const value = formSchema[key];
         if (typeof value === 'object' && value != null) {
            result[key] = convert(value);
         } else {
            result[key] = value
               ? fields[key as NameOfFields].required()
               : fields[key as NameOfFields];
         }
      }
      return result;
   };
   const schema = convert(fromSchema) as ToSchema<FS>;
   return Joi.object(schema);
}
