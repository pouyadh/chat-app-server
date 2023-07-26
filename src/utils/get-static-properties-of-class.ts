export default function (classObject: any) {
   try {
      return (Object.getOwnPropertyNames(classObject) as (keyof typeof classObject)[]).filter(
         (method) => {
            return typeof classObject[method] === 'function'; // && !method.startsWith('_');
         }
      );
   } catch (e) {
      return false;
   }
}
