import { Test } from '@nestjs/testing';
import { moduleMetadata } from './app.module';
import { AppController } from './app.controller';
import supertest from 'supertest';
import sinon from 'sinon';
import td from 'testdouble';
import mockito from 'ts-mockito';
import test from 'ava';

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

test('sinon: GET api/hello should call spy function', async (test) => {
    const { agent, helloWithBodySpy, helloWithParamSpy, helloWithQuerySpy } = await initSinon();
    const res = await agent.get('/api/hello').query({ userName });
    test.is(res.status, 200);
    test.is(res.text, expected);
    test.is(helloWithQuerySpy.callCount, 1);
    test.is(helloWithParamSpy.callCount, 0);
    test.is(helloWithBodySpy.callCount, 0);
    test.is(helloWithQuerySpy.calledWith(userName), true);
});

test('sinon: POST api/hello sholud call spy function', async (test) => {
    const { agent, helloWithBodySpy, helloWithParamSpy, helloWithQuerySpy } = await initSinon();
    const res = await agent.post('/api/hello').send({ userName });
    test.is(res.status, 201);
    test.is(res.text, expected);
    test.is(helloWithQuerySpy.callCount, 0);
    test.is(helloWithParamSpy.callCount, 0);
    test.is(helloWithBodySpy.callCount, 1);
    test.is(helloWithBodySpy.calledWith(userName), true);
});

test('sinon: POST api/hello/:userName sholud call spy function', async (test) => {
    const { agent, helloWithBodySpy, helloWithParamSpy, helloWithQuerySpy } = await initSinon();
    const res = await agent.post(`/api/hello/${userName}`);
    test.is(res.status, 201);
    test.is(res.text, expected);
    test.is(helloWithQuerySpy.callCount, 0);
    test.is(helloWithParamSpy.callCount, 1);
    test.is(helloWithBodySpy.callCount, 0);
    test.is(helloWithParamSpy.calledWith(userName), true);
});

async function initMockito() {
    const inited = await init();
    const appControllerSpy = mockito.spy(inited.appController);
    mockito.resetCalls();
    await inited.app.init();
    return { ...inited, appControllerSpy };
}

test('mockito: GET api/hello should call spy function', async (test) => {
    const { agent, appControllerSpy } = await initMockito();
    const res = await agent.get('/api/hello').query({ userName });
    test.is(res.status, 200);
    test.is(res.text, expected);
    mockito.verify(appControllerSpy.helloWithQuery(userName)).once();
    mockito.verify(appControllerSpy.helloWithParam(userName)).never();
    mockito.verify(appControllerSpy.helloWithBody(userName)).never();
});

test('mockito: POST api/hello sholud call spy function', async (test) => {
    const { agent, appControllerSpy } = await initMockito();
    const res = await agent.post('/api/hello').send({ userName });
    test.is(res.status, 201);
    test.is(res.text, expected);
    mockito.verify(appControllerSpy.helloWithQuery(userName)).never();
    mockito.verify(appControllerSpy.helloWithParam(userName)).never();
    mockito.verify(appControllerSpy.helloWithBody(userName)).once();
});

test(`mockito: POST api/hello/:userName sholud call spy function`, async (test) => {
    const { agent, appControllerSpy } = await initMockito();
    const res = await agent.post(`/api/hello/${userName}`);
    test.is(res.status, 201);
    test.is(res.text, expected);
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

test('testdouble: GET api/hello should call stub function', async (test) => {
    const { agent } = await initTestdouble();
    const res = await agent.get('/api/hello').query({ userName });
    test.is(res.status, 200);
    test.is(res.text, 'query');
});

test('testdouble: POST api/hello sholud call stub function', async (test) => {
    const { agent } = await initTestdouble();
    const res = await agent.post('/api/hello').send({ userName });
    test.is(res.status, 201);
    test.is(res.text, 'body');
});

test(`testdouble: POST api/hello/:userName sholud call stub function`, async (test) => {
    const { agent } = await initTestdouble();
    const res = await agent.post(`/api/hello/${userName}`);
    test.is(res.status, 201);
    test.is(res.text, 'param');
});
