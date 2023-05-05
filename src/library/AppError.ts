export class AppError {
   status: number;
   message: string;
   constructor(status: number = 500, message: string = '') {
      this.status = status;
      this.message = message;
   }
}
