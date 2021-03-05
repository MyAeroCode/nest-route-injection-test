import { Controller, Get, Post, Param, Query, Body } from "@nestjs/common";
import { AppService } from "./app.service";

@Controller("api")
export class AppController {
    constructor(private readonly appService: AppService) {}

    @Get("hello")
    helloWithQuery(@Query("userName") userName: string): string {
        return this.appService.hello(userName);
    }

    @Post("hello")
    helloWithBody(@Body("userName") userName: string): string {
        return this.appService.hello(userName);
    }

    @Post("hello/:userName")
    helloWithParam(@Param("userName") userName: string): string {
        return this.appService.hello(userName);
    }
}
