import { Test } from '@nestjs/testing';
import { moduleMetadata } from './app.module';
import { AppController } from './app.controller';
import supertest from 'supertest';
import sinon from 'sinon';
import td from 'testdouble';
import mockito from 'ts-mockito';
import qunit from 'qunit';

const userName = 'Lutz';
const expected = `Hello, ${userName}!`;

async function generateModuleRef() {
    const testingModuleBuilder = Test.createTestingModule(moduleMetadata);
    const moduleRef = await testingModuleBuilder.compile();
    return moduleRef;
}

async function init() {
    const moduleRef = await generateModuleRef();
    const app = moduleRef.createNestApplication();
    const appController = moduleRef.get(AppController);
    const agent = supertest(app.getHttpServer());
    return {
        moduleRef,
        app,
        appController,
        agent,
    };
}

async function initSinon() {
    const inited = await init();
    const helloWithQuerySpy = sinon.spy(inited.appController, 'helloWithQuery');
    const helloWithParamSpy = sinon.spy(inited.appController, 'helloWithParam');
    const helloWithBodySpy = sinon.spy(inited.appController, 'helloWithBody');
    sinon.reset();
    await inited.app.init();
    return { ...inited, helloWithQuerySpy, helloWithParamSpy, helloWithBodySpy };
}

qunit.test('sinon: GET api/hello should call spy function', async (test) => {
    const { agent, helloWithBodySpy, helloWithParamSpy, helloWithQuerySpy } = await initSinon();
    const res = await agent.get('/api/hello').query({ userName });
    test.equal(res.status, 200);
    test.equal(res.text, expected);
    test.equal(helloWithQuerySpy.callCount, 1);
    test.equal(helloWithParamSpy.callCount, 0);
    test.equal(helloWithBodySpy.callCount, 0);
    test.equal(helloWithQuerySpy.calledWith(userName), true);
});

qunit.test('sinon: POST api/hello sholud call spy function', async (test) => {
    const { agent, helloWithBodySpy, helloWithParamSpy, helloWithQuerySpy } = await initSinon();
    const res = await agent.post('/api/hello').send({ userName });
    test.equal(res.status, 201);
    test.equal(res.text, expected);
    test.equal(helloWithQuerySpy.callCount, 0);
    test.equal(helloWithParamSpy.callCount, 0);
    test.equal(helloWithBodySpy.callCount, 1);
    test.equal(helloWithBodySpy.calledWith(userName), true);
});

qunit.test('sinon: POST api/hello/:userName sholud call spy function', async (test) => {
    const { agent, helloWithBodySpy, helloWithParamSpy, helloWithQuerySpy } = await initSinon();
    const res = await agent.post(`/api/hello/${userName}`);
    test.equal(res.status, 201);
    test.equal(res.text, expected);
    test.equal(helloWithQuerySpy.callCount, 0);
    test.equal(helloWithParamSpy.callCount, 1);
    test.equal(helloWithBodySpy.callCount, 0);
    test.equal(helloWithParamSpy.calledWith(userName), true);
});

async function initMockito() {
    const inited = await init();
    const appControllerSpy = mockito.spy(inited.appController);
    mockito.resetCalls();
    await inited.app.init();
    return { ...inited, appControllerSpy };
}

qunit.test('mockito: GET api/hello should call spy function', async (test) => {
    const { agent, appControllerSpy } = await initMockito();
    const res = await agent.get('/api/hello').query({ userName });
    test.equal(res.status, 200);
    test.equal(res.text, expected);
    mockito.verify(appControllerSpy.helloWithQuery(userName)).once();
    mockito.verify(appControllerSpy.helloWithParam(userName)).never();
    mockito.verify(appControllerSpy.helloWithBody(userName)).never();
});

qunit.test('mockito: POST api/hello sholud call spy function', async (test) => {
    const { agent, appControllerSpy } = await initMockito();
    const res = await agent.post('/api/hello').send({ userName });
    test.equal(res.status, 201);
    test.equal(res.text, expected);
    mockito.verify(appControllerSpy.helloWithQuery(userName)).never();
    mockito.verify(appControllerSpy.helloWithParam(userName)).never();
    mockito.verify(appControllerSpy.helloWithBody(userName)).once();
});

qunit.test(`mockito: POST api/hello/:userName sholud call spy function`, async (test) => {
    const { agent, appControllerSpy } = await initMockito();
    const res = await agent.post(`/api/hello/${userName}`);
    test.equal(res.status, 201);
    test.equal(res.text, expected);
    mockito.verify(appControllerSpy.helloWithQuery(userName)).never();
    mockito.verify(appControllerSpy.helloWithParam(userName)).once();
    mockito.verify(appControllerSpy.helloWithBody(userName)).never();
});

async function initTestdouble() {
    const inited = await init();
    td.replace(inited.appController, 'helloWithQuery', () => 'query');
    td.replace(inited.appController, 'helloWithParam', () => 'param');
    td.replace(inited.appController, 'helloWithBody', () => 'body');
    await inited.app.init();
    return { ...inited };
}

qunit.test('testdouble: GET api/hello should call stub function', async (test) => {
    const { agent } = await initTestdouble();
    const res = await agent.get('/api/hello').query({ userName });
    test.equal(res.status, 200);
    test.equal(res.text, 'query');
});

qunit.test('testdouble: POST api/hello sholud call stub function', async (test) => {
    const { agent } = await initTestdouble();
    const res = await agent.post('/api/hello').send({ userName });
    test.equal(res.status, 201);
    test.equal(res.text, 'body');
});

qunit.test(`testdouble: POST api/hello/:userName sholud call stub function`, async (test) => {
    const { agent } = await initTestdouble();
    const res = await agent.post(`/api/hello/${userName}`);
    test.equal(res.status, 201);
    test.equal(res.text, 'param');
});
