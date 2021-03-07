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

    describe('using bulit-in (jasmine)', () => {
        beforeEach(async () => {
            spyOn(appController, 'helloWithQuery').and.callThrough();
            spyOn(appController, 'helloWithParam').and.callThrough();
            spyOn(appController, 'helloWithBody').and.callThrough();
            await app.init();
        });

        it('GET api/hello should call spy function', async () => {
            const res = await agent.get('/api/hello').query({ userName });
            expect(res.status).toBe(200);
            expect(res.text).toBe(expected);
            expect(appController.helloWithQuery).toHaveBeenCalledTimes(1);
            expect(appController.helloWithParam).toHaveBeenCalledTimes(0);
            expect(appController.helloWithBody).toHaveBeenCalledTimes(0);
            expect(appController.helloWithQuery).toHaveBeenCalledWith(userName);
        });

        it('POST api/hello sholud call spy function', async () => {
            const res = await agent.post('/api/hello').send({ userName });
            expect(res.status).toBe(201);
            expect(res.text).toBe(expected);
            expect(appController.helloWithQuery).toHaveBeenCalledTimes(0);
            expect(appController.helloWithParam).toHaveBeenCalledTimes(0);
            expect(appController.helloWithBody).toHaveBeenCalledTimes(1);
            expect(appController.helloWithBody).toHaveBeenCalledWith(userName);
        });

        it(`POST api/hello/:userName sholud call spy function`, async () => {
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

        it('GET api/hello should call spy function', async () => {
            const res = await agent.get('/api/hello').query({ userName });
            expect(res.status).toBe(200);
            expect(helloWithQuerySpy.callCount).toBe(1);
            expect(helloWithParamSpy.callCount).toBe(0);
            expect(helloWithBodySpy.callCount).toBe(0);
            expect(helloWithQuerySpy.calledWith(userName)).toBe(true);
        });

        it('POST api/hello sholud call spy function', async () => {
            const res = await agent.post('/api/hello').send({ userName });
            expect(res.status).toBe(201);
            expect(res.text).toBe(expected);
            expect(helloWithQuerySpy.callCount).toBe(0);
            expect(helloWithParamSpy.callCount).toBe(0);
            expect(helloWithBodySpy.callCount).toBe(1);
            expect(helloWithBodySpy.calledWith(userName)).toBe(true);
        });

        it(`POST api/hello/:userName sholud call spy function`, async () => {
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

        it('GET api/hello should call spy function', async () => {
            const res = await agent.get('/api/hello').query({ userName });
            expect(res.status).toBe(200);
            expect(res.text).toBe(expected);
            expect((mockito.capture(appControllerSpy.helloWithQuery) as any).actions).toHaveSize(1);
            expect((mockito.capture(appControllerSpy.helloWithParam) as any).actions).toHaveSize(0);
            expect((mockito.capture(appControllerSpy.helloWithBody) as any).actions).toHaveSize(0);
            expect(mockito.capture(appControllerSpy.helloWithQuery).last()).toEqual([userName]);
        });

        it('POST api/hello sholud call spy function', async () => {
            const res = await agent.post('/api/hello').send({ userName });
            expect(res.status).toBe(201);
            expect(res.text).toBe(expected);
            expect((mockito.capture(appControllerSpy.helloWithQuery) as any).actions).toHaveSize(0);
            expect((mockito.capture(appControllerSpy.helloWithParam) as any).actions).toHaveSize(0);
            expect((mockito.capture(appControllerSpy.helloWithBody) as any).actions).toHaveSize(1);
            expect(mockito.capture(appControllerSpy.helloWithBody).last()).toEqual([userName]);
        });

        it(`POST api/hello/:userName sholud call spy function`, async () => {
            const res = await agent.post(`/api/hello/${userName}`);
            expect(res.status).toBe(201);
            expect(res.text).toBe(expected);
            expect((mockito.capture(appControllerSpy.helloWithQuery) as any).actions).toHaveSize(0);
            expect((mockito.capture(appControllerSpy.helloWithParam) as any).actions).toHaveSize(1);
            expect((mockito.capture(appControllerSpy.helloWithBody) as any).actions).toHaveSize(0);
            expect(mockito.capture(appControllerSpy.helloWithParam).last()).toEqual([userName]);
        });
    });

    describe('using testdouble', () => {
        beforeEach(async () => {
            td.replace(appController, 'helloWithQuery', () => 'query');
            td.replace(appController, 'helloWithParam', () => 'param');
            td.replace(appController, 'helloWithBody', () => 'body');
            await app.init();
        });

        it('GET api/hello should call stub function', async () => {
            const res = await agent.get('/api/hello').query({ userName });
            expect(res.status).toBe(200);
            expect(res.text).toBe('query');
        });

        it('POST api/hello sholud call stub function', async () => {
            const res = await agent.post('/api/hello').send({ userName });
            expect(res.status).toBe(201);
            expect(res.text).toBe('body');
        });

        it(`POST api/hello/:userName sholud call stub function`, async () => {
            const res = await agent.post(`/api/hello/${userName}`);
            expect(res.status).toBe(201);
            expect(res.text).toBe('param');
        });
    });
});
