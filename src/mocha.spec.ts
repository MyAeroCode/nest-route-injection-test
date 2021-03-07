import superTest from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { moduleMetadata } from './app.module';
import { AppController } from './app.controller';
import supertest from 'supertest';
import sinon from 'sinon';
import td from 'testdouble';
import mockito from 'ts-mockito';
import { expect } from 'chai';

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

    describe('using sinon', () => {
        beforeEach(async () => {
            sinon.reset();
            sinon.spy(appController, 'helloWithQuery');
            sinon.spy(appController, 'helloWithParam');
            sinon.spy(appController, 'helloWithBody');
            await app.init();
        });

        it('GET api/hello should call spy function', async () => {
            const res = await agent.get('/api/hello').query({ userName });
            expect(res.status).to.be.eq(200);
            expect(res.text).to.be.eq(expected);
            expect(appController.helloWithQuery).to.have.property('callCount', 1);
            expect(appController.helloWithParam).to.have.property('callCount', 0);
            expect(appController.helloWithBody).to.have.property('callCount', 0);
            expect(appController.helloWithQuery)
                .to.have.property('args')
                .that.deep.equals([[userName]]);
        });

        it('POST api/hello sholud call spy function', async () => {
            const res = await agent.post('/api/hello').send({ userName });
            expect(res.status).to.be.eq(201);
            expect(res.text).to.be.eq(expected);
            expect(appController.helloWithQuery).to.have.property('callCount', 0);
            expect(appController.helloWithParam).to.have.property('callCount', 0);
            expect(appController.helloWithBody).to.have.property('callCount', 1);
            expect(appController.helloWithBody)
                .to.have.property('args')
                .that.deep.equals([[userName]]);
        });

        it(`POST api/hello/:userName sholud call spy function`, async () => {
            const res = await agent.post(`/api/hello/${userName}`);
            expect(res.status).to.be.eq(201);
            expect(res.text).to.be.eq(expected);
            expect(appController.helloWithQuery).to.have.property('callCount', 0);
            expect(appController.helloWithParam).to.have.property('callCount', 1);
            expect(appController.helloWithBody).to.have.property('callCount', 0);
            expect(appController.helloWithParam)
                .to.have.property('args')
                .that.deep.equals([[userName]]);
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
            expect(res.status).to.be.eq(200);
            expect(res.text).to.be.eq(expected);
            mockito.verify(appControllerSpy.helloWithQuery(userName)).once();
            mockito.verify(appControllerSpy.helloWithParam(userName)).never();
            mockito.verify(appControllerSpy.helloWithBody(userName)).never();
        });

        it('POST api/hello sholud call spy function', async () => {
            const res = await agent.post('/api/hello').send({ userName });
            expect(res.status).to.be.eq(201);
            expect(res.text).to.be.eq(expected);
            mockito.verify(appControllerSpy.helloWithQuery(userName)).never();
            mockito.verify(appControllerSpy.helloWithParam(userName)).never();
            mockito.verify(appControllerSpy.helloWithBody(userName)).once();
        });

        it(`POST api/hello/:userName sholud call spy function`, async () => {
            const res = await agent.post(`/api/hello/${userName}`);
            expect(res.status).to.be.eq(201);
            expect(res.text).to.be.eq(expected);
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

        it('GET api/hello should call stub function', async () => {
            const res = await agent.get('/api/hello').query({ userName });
            expect(res.status).to.be.eq(200);
            expect(res.text).to.be.eq('query');
        });

        it('POST api/hello sholud call stub function', async () => {
            const res = await agent.post('/api/hello').send({ userName });
            expect(res.status).to.be.eq(201);
            expect(res.text).to.be.eq('body');
        });

        it(`POST api/hello/:userName sholud call stub function`, async () => {
            const res = await agent.post(`/api/hello/${userName}`);
            expect(res.status).to.be.eq(201);
            expect(res.text).to.be.eq('param');
        });
    });
});
