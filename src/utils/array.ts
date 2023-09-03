export function reverseFind<T extends any>(
   array: Array<T>,
   fn: (item: T, index?: number, array?: Array<T>) => boolean,
   options?: {
      startFromIndex?: number;
   }
) {
   let startIndex = array.length - 1;
   if (options?.startFromIndex && options?.startFromIndex <= startIndex) {
      startIndex = options.startFromIndex;
   }
   for (let i = startIndex; i >= 0; i--) {
      if (fn(array[i], i, array)) return array[i];
   }
}

export function reverseFindIndex<T extends any>(
   array: Array<T>,
   fn: (item: T, index?: number, array?: Array<T>) => boolean,
   options?: {
      startFromIndex?: number;
   }
) {
   let startIndex = array.length - 1;
   if (options?.startFromIndex && options?.startFromIndex <= startIndex) {
      startIndex = options.startFromIndex;
   }
   for (let i = startIndex; i >= 0; i--) {
      if (fn(array[i], i, array)) return i;
   }
}

export function reverseForEach<T extends any>(
   array: Array<T>,
   fn: (item: T, index?: number, array?: Array<T>) => boolean,
   options?: {
      startFromIndex?: number;
   }
) {
   let startIndex = array.length - 1;
   if (options?.startFromIndex && options?.startFromIndex <= startIndex) {
      startIndex = options.startFromIndex;
   }
   for (let i = startIndex; i >= 0; i--) {
      if (fn(array[i], i, array)) return i;
   }
}
