export default function (classObject: any) {
   try {
      return (
         Object.getOwnPropertyNames(classObject.prototype) as (
            | keyof InstanceType<typeof classObject>
            | 'constructor'
         )[]
      ).filter((method) => {
         return (
            typeof classObject.prototype[method] === 'function' && method !== 'constructor'
            // && !method.startsWith('_')
         );
      });
   } catch (e) {
      return false;
   }
}
