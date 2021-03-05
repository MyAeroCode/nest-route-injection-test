import { Injectable } from "@nestjs/common";

@Injectable()
export class AppService {
    hello(userName: string): string {
        return `Hello, ${userName}!`;
    }
}
