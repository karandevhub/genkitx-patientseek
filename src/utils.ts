export function removeEmptyKeys<T extends Record<string, any>>(obj: T): T {
    for (const key of Object.keys(obj) as Array<keyof T>) {
      if (obj[key] == null) { 
        delete obj[key];
      }
    }
    return obj;
  }