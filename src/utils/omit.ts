export default function omit<T, K extends keyof T>(obj: T, ...keys: K[]): Omit<T, K> {
   const ret: any = { ...obj };
   keys.forEach((key) => {
      delete ret[key];
   });
   return ret as Omit<T, K>;
}
