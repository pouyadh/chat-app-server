export default function <Result extends { [key: string]: any; error?: any }>(result: Result) {
   if (result.error) throw result.error;
   return result;
}
