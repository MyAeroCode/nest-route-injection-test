import superTest from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { moduleMetadata } from './app.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import supertest from 'supertest';
import sinon from 'sinon';

async function generateModuleRef() {
    const testingModuleBuilder = Test.createTestingModule(moduleMetadata);
    const moduleRef = await testingModuleBuilder.compile();
    return moduleRef;
}

describe('support router level mocking', () => {
    const userName = 'Lutz';
    const expected = `Hello, ${userName}!`;

    let moduleRef: TestingModule;
    let app: INestApplication;
    let appService: AppService;
    let appController: AppController;
    let agent: superTest.SuperTest<superTest.Test>;

    beforeEach(async () => {
        moduleRef = await generateModuleRef();
        app = moduleRef.createNestApplication();
        appController = moduleRef.get(AppController);
        appService = moduleRef.get(AppService);
        agent = supertest(app.getHttpServer());
    });

    describe('using jest', () => {
        beforeEach(async () => {
            jest.clearAllMocks();
            jest.spyOn(appService, 'hello');
            jest.spyOn(appController, 'helloWithQuery');
            jest.spyOn(appController, 'helloWithParam');
            jest.spyOn(appController, 'helloWithBody');
            await app.init();
        });

        test('GET api/hello should call spy function', async () => {
            const res = await agent.get('/api/hello').query({ userName });
            expect(res.status).toBe(200);
            expect(res.text).toBe(expected);
            expect(appService.hello).toHaveBeenCalledTimes(1);
            expect(appController.helloWithQuery).toHaveBeenCalledTimes(1);
            expect(appController.helloWithParam).toHaveBeenCalledTimes(0);
            expect(appController.helloWithBody).toHaveBeenCalledTimes(0);
            expect(appController.helloWithQuery).toHaveBeenLastCalledWith(
                userName,
            );
        });

        test('POST api/hello sholud call spy function', async () => {
            const res = await agent.post('/api/hello').send({ userName });
            expect(res.status).toBe(201);
            expect(res.text).toBe(expected);
            expect(appService.hello).toHaveBeenCalledTimes(1);
            expect(appController.helloWithQuery).toHaveBeenCalledTimes(0);
            expect(appController.helloWithParam).toHaveBeenCalledTimes(0);
            expect(appController.helloWithBody).toHaveBeenCalledTimes(1);
            expect(appController.helloWithBody).toHaveBeenLastCalledWith(
                userName,
            );
        });

        test(`POST api/hello/:userName sholud call spy function`, async () => {
            const res = await agent.post(`/api/hello/${userName}`);
            expect(res.status).toBe(201);
            expect(res.text).toBe(expected);
            expect(appService.hello).toHaveBeenCalledTimes(1);
            expect(appController.helloWithQuery).toHaveBeenCalledTimes(0);
            expect(appController.helloWithParam).toHaveBeenCalledTimes(1);
            expect(appController.helloWithBody).toHaveBeenCalledTimes(0);
            expect(appController.helloWithParam).toHaveBeenLastCalledWith(
                userName,
            );
        });
    });

    describe('using sinon', () => {
        beforeEach(async () => {
            sinon.reset();
            sinon.spy(appService, 'hello');
            sinon.spy(appController, 'helloWithQuery');
            sinon.spy(appController, 'helloWithParam');
            sinon.spy(appController, 'helloWithBody');
            await app.init();
        });

        test('GET api/hello should call spy function', async () => {
            const res = await agent.get('/api/hello').query({ userName });
            expect(res.status).toBe(200);
            expect(res.text).toBe(expected);
            expect(appService.hello).toHaveProperty('callCount', 1);
            expect(appController.helloWithQuery).toHaveProperty('callCount', 1);
            expect(appController.helloWithParam).toHaveProperty('callCount', 0);
            expect(appController.helloWithBody).toHaveProperty('callCount', 0);
            expect(appController.helloWithQuery).toHaveProperty('args', [
                [userName],
            ]);
        });

        test('POST api/hello sholud call spy function', async () => {
            const res = await agent.post('/api/hello').send({ userName });
            expect(res.status).toBe(201);
            expect(res.text).toBe(expected);
            expect(appService.hello).toHaveProperty('callCount', 1);
            expect(appController.helloWithQuery).toHaveProperty('callCount', 0);
            expect(appController.helloWithParam).toHaveProperty('callCount', 0);
            expect(appController.helloWithBody).toHaveProperty('callCount', 1);
            expect(appController.helloWithBody).toHaveProperty('args', [
                [userName],
            ]);
        });

        test(`POST api/hello/:userName sholud call spy function`, async () => {
            const res = await agent.post(`/api/hello/${userName}`);
            expect(res.status).toBe(201);
            expect(res.text).toBe(expected);
            expect(appService.hello).toHaveProperty('callCount', 1);
            expect(appController.helloWithQuery).toHaveProperty('callCount', 0);
            expect(appController.helloWithParam).toHaveProperty('callCount', 1);
            expect(appController.helloWithBody).toHaveProperty('callCount', 0);
            expect(appController.helloWithParam).toHaveProperty('args', [
                [userName],
            ]);
        });
    });
});
