const matchPath = (path: string, url: string) => {
   const splittedPath = path.split('/');
   const splittedUrl = url.split('/');
   if (splittedPath.length !== splittedUrl.length) return false;
   const params: {
      [x: string]: string;
   } = {};
   for (let i = 0; i < splittedPath.length; i++) {
      if (splittedPath[i].charAt(0) === ':') {
         if (splittedUrl[i].length === 0) return false;
         params[splittedPath[i].slice(1)] = splittedUrl[i];
      } else if (splittedPath[i] !== splittedUrl[i]) {
         return false;
      }
   }
   return params;
};

export default matchPath;
