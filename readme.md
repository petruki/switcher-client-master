[![Build Status](https://travis-ci.com/switcherapi/switcher-client-master.svg?branch=master)](https://travis-ci.com/github/switcherapi/switcher-client-master)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=switcherapi_switcher-client-master&metric=alert_status)](https://sonarcloud.io/dashboard?id=switcherapi_switcher-client-master)
[![Coverage Status](https://coveralls.io/repos/github/switcherapi/switcher-client-master/badge.svg?branch=master)](https://coveralls.io/github/switcherapi/switcher-client-master?branch=master)
[![npm version](https://badge.fury.io/js/switcher-client.svg)](https://badge.fury.io/js/switcher-client)
[![Known Vulnerabilities](https://snyk.io/test/github/switcherapi/switcher-client-master/badge.svg?targetFile=package.json)](https://snyk.io/test/github/switcherapi/switcher-client-master?targetFile=package.json)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Slack: Switcher-HQ](https://img.shields.io/badge/slack-@switcher/hq-blue.svg?logo=slack)](https://switcher-hq.slack.com/)

![Switcher API: JavaScript Client: Cloud-based Feature Flag API](https://github.com/switcherapi/switcherapi-assets/blob/master/logo/switcherapi_js_client.png)

# About  
JavaScript SDK for working with Switcher-API.
https://github.com/switcherapi/switcher-api

- Flexible and robust functions that will keep your code clean and maintainable.
- Able to work offline using a snapshot file downloaded from your remote Switcher-API Domain.
- Silent mode is a hybrid configuration that automatically enables a contingent sub-process in case of any connectivity issue.
- Built-in mock implementation for clear and easy implementation of automated testing.
- Easy to setup. Switcher Context is responsible to manage all the complexity between your application and API.

# Usage

## Install  
`npm install switcher-client`

## Module initialization
The context properties stores all information regarding connectivity and strategy settings.

```js
const Switcher = require("switcher-client");

const apiKey = 'API Key';
const environment = 'default'; // Production = default
const domain = 'My Domain';
const component = 'MyApp';
const url = 'https://switcher-load-balance.herokuapp.com';
```

- **apiKey**: Switcher-API key generated to your component.
- **environment**: Environment name. Production environment is named as 'default'.
- **domain**: Domain name.
- **component**: Application name.
- **url**: Swither-API endpoint.

## Options
You can also activate features such as offline and silent mode:

```js
const offline = true;
const logger = true;
const snapshotAutoload = true;
const snapshotLocation = './snapshot/';
const silentMode = true;
const retryAfter = '5m';

let switcher = new Switcher(url, apiKey, domain, component, environment, {
      offline, logger, snapshotLocation, snapshotAutoload, silentMode, retryAfter
});
```

- **offline**: If activated, the client will only fetch the configuration inside your snapshot file. The default value is 'false'.
- **logger**: If activated, it is possible to retrieve the last results from a given Switcher key using Switcher.getLogger('KEY')
- **snapshotLocation**: Location of snapshot files. The default value is './snapshot/'.
- **snapshotAutload**: If activated, snapshot folder and files are going to be created automatically.
- **silentMode**: If activated, all connectivity issues will be ignored and the client will automatically fetch the configuration into your snapshot file.
- **retryAfter** : Time given to the module to re-establish connectivity with the API - e.g. 5s (s: seconds - m: minutes - h: hours).

## Pre-execution
Before you call the API, there is one single step you need to execute to complete the configuration.
If you are not running the API expecting to use the offline features, you can ignore this step. 

After instantiating the Switcher, you need to load the snapshot engine to watch for changes in your Domain structure.
```js
await switcher.loadSnapshot();
```

## Executing
There are a few different ways to call the API using the JavaScript module.
Here are some examples:

1. **No parameters**
Invoking the API can be done by instantiating the switcher and calling *isItOn* passing its key as a parameter.

```js
const switcher = new Switcher(url, apiKey, domain, component, environment);
await switcher.isItOn('FEATURE01');
```

2. **Promise**
Most functions were implemented using async operations. Here it is a differnet way to execute the criteria:

```js
switcher.isItOn('KEY')
    .then(result => console.log('Result:', result))
    .catch(error => console.log(error));
```

3. **Strategy validation - preparing input**
Loading information into the switcher can be made by using *prepare*, in case you want to include input from a different place of your code. Otherwise, it is also possible to include everything in the same call.

```js
switcher.prepare('FEATURE01', [Switcher.StrategiesType.VALUE, 'USER_1');
switcher.isItOn();
```

4. **Strategy validation - all-in-one execution**
All-in-one method is fast and include everything you need to execute a complex call to the API.

```js
await switcher.isItOn('FEATURE01',
    [Switcher.StrategiesType.VALUE, 'User 1', 
    Switcher.StrategiesType.NETWORK, '192.168.0.1']
);
```

## Built-in mock feature
You can also bypass your switcher configuration by invoking 'Switcher.assume'. This is perfect for your test code where you want to test both scenarios when the switcher is true and false.

```js
Switcher.assume('FEATURE01').true();
switcher.isItOn('FEATURE01'); // true

Switcher.forget('FEATURE01');
switcher.isItOn('FEATURE01'); // Now, it's going to return the result retrieved from the API or the Snaopshot file
```

**Enabling Test Mode**
You may want to enable this feature while using Switcher Client with automated testing.
It prevents the Switcher Client from locking snapshot files even after the test execution.

To enable this feature, it is recommended to place the following on your test setup files:
```js
Switcher.setTestEnabled();
```

## Snapshot version check
For convenience, an implementation of a domain version checker is available if you have external processes that manage snapshot files.

```js
switcher.checkSnapshot();
```