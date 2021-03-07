import superTest from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { moduleMetadata } from './app.module';
import { AppController } from './app.controller';
import supertest from 'supertest';
import sinon from 'sinon';
import td from 'testdouble';
import mockito from 'ts-mockito';

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
    let appController: AppController;
    let agent: superTest.SuperTest<superTest.Test>;

    beforeEach(async () => {
        moduleRef = await generateModuleRef();
        app = moduleRef.createNestApplication();
        appController = moduleRef.get(AppController);
        agent = supertest(app.getHttpServer());
    });

    describe('using bulit-in (jest)', () => {
        beforeEach(async () => {
            jest.clearAllMocks();
            jest.spyOn(appController, 'helloWithQuery');
            jest.spyOn(appController, 'helloWithParam');
            jest.spyOn(appController, 'helloWithBody');
            await app.init();
        });

        test('GET api/hello should call spy function', async () => {
            const res = await agent.get('/api/hello').query({ userName });
            expect(res.status).toBe(200);
            expect(res.text).toBe(expected);
            expect(appController.helloWithQuery).toHaveBeenCalledTimes(1);
            expect(appController.helloWithParam).toHaveBeenCalledTimes(0);
            expect(appController.helloWithBody).toHaveBeenCalledTimes(0);
            expect(appController.helloWithQuery).toHaveBeenCalledWith(userName);
        });

        test('POST api/hello sholud call spy function', async () => {
            const res = await agent.post('/api/hello').send({ userName });
            expect(res.status).toBe(201);
            expect(res.text).toBe(expected);
            expect(appController.helloWithQuery).toHaveBeenCalledTimes(0);
            expect(appController.helloWithParam).toHaveBeenCalledTimes(0);
            expect(appController.helloWithBody).toHaveBeenCalledTimes(1);
            expect(appController.helloWithBody).toHaveBeenCalledWith(userName);
        });

        test(`POST api/hello/:userName sholud call spy function`, async () => {
            const res = await agent.post(`/api/hello/${userName}`);
            expect(res.status).toBe(201);
            expect(res.text).toBe(expected);
            expect(appController.helloWithQuery).toHaveBeenCalledTimes(0);
            expect(appController.helloWithParam).toHaveBeenCalledTimes(1);
            expect(appController.helloWithBody).toHaveBeenCalledTimes(0);
            expect(appController.helloWithParam).toHaveBeenCalledWith(userName);
        });
    });

    describe('using sinon', () => {
        let helloWithQuerySpy: sinon.SinonSpy<[userName: string], string>;
        let helloWithParamSpy: sinon.SinonSpy<[userName: string], string>;
        let helloWithBodySpy: sinon.SinonSpy<[userName: string], string>;
        beforeEach(async () => {
            sinon.reset();
            helloWithQuerySpy = sinon.spy(appController, 'helloWithQuery');
            helloWithParamSpy = sinon.spy(appController, 'helloWithParam');
            helloWithBodySpy = sinon.spy(appController, 'helloWithBody');
            await app.init();
        });

        test('GET api/hello should call spy function', async () => {
            const res = await agent.get('/api/hello').query({ userName });
            expect(res.status).toBe(200);
            expect(res.text).toBe(expected);
            expect(helloWithQuerySpy.callCount).toBe(1);
            expect(helloWithParamSpy.callCount).toBe(0);
            expect(helloWithBodySpy.callCount).toBe(0);
            expect(helloWithQuerySpy.calledWith(userName)).toBe(true);
        });

        test('POST api/hello sholud call spy function', async () => {
            const res = await agent.post('/api/hello').send({ userName });
            expect(res.status).toBe(201);
            expect(res.text).toBe(expected);
            expect(helloWithQuerySpy.callCount).toBe(0);
            expect(helloWithParamSpy.callCount).toBe(0);
            expect(helloWithBodySpy.callCount).toBe(1);
            expect(helloWithBodySpy.calledWith(userName)).toBe(true);
        });

        test(`POST api/hello/:userName sholud call spy function`, async () => {
            const res = await agent.post(`/api/hello/${userName}`);
            expect(res.status).toBe(201);
            expect(res.text).toBe(expected);
            expect(helloWithQuerySpy.callCount).toBe(0);
            expect(helloWithParamSpy.callCount).toBe(1);
            expect(helloWithBodySpy.callCount).toBe(0);
            expect(helloWithParamSpy.calledWith(userName)).toBe(true);
        });
    });

    describe('using ts-mockito', () => {
        let appControllerSpy: AppController;
        beforeEach(async () => {
            mockito.resetCalls();
            appControllerSpy = mockito.spy(appController);
            await app.init();
        });

        test('GET api/hello should call spy function', async () => {
            const res = await agent.get('/api/hello').query({ userName });
            expect(res.status).toBe(200);
            expect(res.text).toBe(expected);
            mockito.verify(appControllerSpy.helloWithQuery(userName)).once();
            mockito.verify(appControllerSpy.helloWithParam(userName)).never();
            mockito.verify(appControllerSpy.helloWithBody(userName)).never();
        });

        test('POST api/hello sholud call spy function', async () => {
            const res = await agent.post('/api/hello').send({ userName });
            expect(res.status).toBe(201);
            expect(res.text).toBe(expected);
            mockito.verify(appControllerSpy.helloWithQuery(userName)).never();
            mockito.verify(appControllerSpy.helloWithParam(userName)).never();
            mockito.verify(appControllerSpy.helloWithBody(userName)).once();
        });

        test(`POST api/hello/:userName sholud call spy function`, async () => {
            const res = await agent.post(`/api/hello/${userName}`);
            expect(res.status).toBe(201);
            expect(res.text).toBe(expected);
            mockito.verify(appControllerSpy.helloWithQuery(userName)).never();
            mockito.verify(appControllerSpy.helloWithParam(userName)).once();
            mockito.verify(appControllerSpy.helloWithBody(userName)).never();
        });
    });

    describe('using testdouble', () => {
        beforeEach(async () => {
            td.replace(appController, 'helloWithQuery', () => 'query');
            td.replace(appController, 'helloWithParam', () => 'param');
            td.replace(appController, 'helloWithBody', () => 'body');
            await app.init();
        });

        test('GET api/hello should call stub function', async () => {
            const res = await agent.get('/api/hello').query({ userName });
            expect(res.status).toBe(200);
            expect(res.text).toBe('query');
        });

        test('POST api/hello sholud call stub function', async () => {
            const res = await agent.post('/api/hello').send({ userName });
            expect(res.status).toBe(201);
            expect(res.text).toBe('body');
        });

        test(`POST api/hello/:userName sholud call stub function`, async () => {
            const res = await agent.post(`/api/hello/${userName}`);
            expect(res.status).toBe(201);
            expect(res.text).toBe('param');
        });
    });
});
