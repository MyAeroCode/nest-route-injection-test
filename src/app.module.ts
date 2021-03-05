import { Module } from "@nestjs/common";
import { ModuleMetadata } from "@nestjs/common/interfaces";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";

export const moduleMetadata: ModuleMetadata = {
    imports: [],
    controllers: [AppController],
    providers: [AppService],
};

@Module(moduleMetadata)
export class AppModule {}
