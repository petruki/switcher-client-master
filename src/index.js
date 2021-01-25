'use strict';

const Bypasser = require('./lib/bypasser');
const ExecutionLogger = require('./lib/utils/executionLogger');
const { loadDomain, validateSnapshot, StrategiesType } = require('./lib/snapshot');
const services = require('./lib/services');
const checkCriteriaOffline = require('./lib/resolver');
const fs = require('fs');

const DEFAULT_ENVIRONMENT = 'default';
const DEFAULT_SNAPSHOT_LOCATION = './snapshot/';
const DEFAULT_RETRY_TIME = '5m';
const DEFAULT_OFFLINE = false;
const DEFAULT_LOGGER = false;
const DEFAULT_TEST_MODE = false;

class Switcher {

  static buildContext(context, options) {
    this.testEnabled = DEFAULT_TEST_MODE;

    this.context = {};
    this.context = context;
    this.context.environment = context.environment || DEFAULT_ENVIRONMENT;

    // Default values
    this.options = {};
    this.options.offline = DEFAULT_OFFLINE;
    this.options.snapshotLocation = DEFAULT_SNAPSHOT_LOCATION;
    this.options.logger = DEFAULT_LOGGER;

    if (options) {
      if ('offline' in options) {
        this.options.offline = options.offline;
      }

      if ('snapshotLocation' in options) {
        this.options.snapshotLocation = options.snapshotLocation;
      }

      if ('silentMode' in options) {
        this.options.silentMode = options.silentMode;
      }

      if ('logger' in options) {
        this.options.logger = options.logger;
      }

      if ('retryAfter' in options) {
        this.options.retryTime =  options.retryAfter.slice(0, -1);
        this.options.retryDurationIn = options.retryAfter.slice(-1);
      } else {
        this.options.retryTime = DEFAULT_RETRY_TIME.charAt(0);
        this.options.retryDurationIn = DEFAULT_RETRY_TIME.charAt(1);
      }
    }
  }

  static factory() {
    return new Switcher();
  }

  static async checkSnapshot() {
    if (Switcher.snapshot) {
      if (!Switcher.context.exp || Date.now() > (Switcher.context.exp*1000)) {
        await Switcher._auth();

        const result = await validateSnapshot(Switcher.context, Switcher.options.snapshotLocation, 
          Switcher.snapshot.data.domain.version);
        
        if (result) {
          Switcher.loadSnapshot();
          return true;
        }
      }
      return false;
    }
  }

  static async loadSnapshot() {
    const snapshotFile = `${Switcher.options.snapshotLocation}${Switcher.context.environment}.json`;
    Switcher.snapshot = loadDomain(Switcher.options.snapshotLocation, Switcher.context.environment);

    if (Switcher.snapshot.data.domain.version == 0 && !Switcher.options.offline) {
      await Switcher.checkSnapshot();
    } else if (!Switcher.testEnabled) {
      fs.unwatchFile(snapshotFile);
      fs.watchFile(snapshotFile, () => {
        Switcher.snapshot = loadDomain(Switcher.options.snapshotLocation, Switcher.context.environment);
      });
    }
  }

  static unloadSnapshot() {
    if (!Switcher.testEnabled) {
      const snapshotFile = `${Switcher.options.snapshotLocation}${Switcher.context.environment}.json`;
      Switcher.snapshot = undefined;
      fs.unwatchFile(snapshotFile);
    }
  }

  static async _auth() {
    const response = await services.auth(Switcher.context, {
      silentMode: Switcher.options.silentMode,
      retryTime: Switcher.options.retryTime,
      retryDurationIn: Switcher.options.retryDurationIn
    });
    
    Switcher.context.token = response.data.token;
    Switcher.context.exp = response.data.exp;
  }

  static get StrategiesType() {
    return StrategiesType;
  }

  static assume(key) {
    return Bypasser.assume(key);
  }

  static forget(key) {
    return Bypasser.forget(key);
  }

  static getLogger(key) {
    return ExecutionLogger.getByKey(key);
  }

  static setTestEnabled() {
    Switcher.testEnabled = true;
  }

  static setTestDisabled() {
    Switcher.testEnabled = false;
  }

  async prepare(key, input) {
    this.key = key;

    if (input) { this.input = input; }

    if (!Switcher.options.offline) {
      await Switcher._auth();
    }
  }

  /**
   * Validate context before querying the API
   */
  async validate() {
    let errors = [];

    if (!Switcher.context.apiKey) {
      errors.push('Missing API Key field');
    }

    if (!Switcher.context.component) {
      errors.push('Missing component field');
    }

    if (!Switcher.context.url) {
      errors.push('Missing url field');
    }

    if (!this.key) {
      errors.push('Missing key field');
    }

    if (!Switcher.context.exp || Date.now() > (Switcher.context.exp*1000)) {
      await this.prepare(this.key, this.input);
    }

    if (!Switcher.context.token) {
      errors.push('Missing token field');
    }

    if (errors.length) {
      throw new Error(`Something went wrong: ${errors.join(', ')}`);
    }
  }

  async isItOn(key, input, showReason = false) {
    // verify if query from Bypasser
    const bypassKey = Bypasser.searchBypassed(this.key ? this.key : key);
    if (bypassKey) {
      return bypassKey.getValue();
    }

    // verify if query from snapshot
    if (Switcher.options.offline) {
      const result = checkCriteriaOffline(
        this.key ? this.key : key, this.input ? this.input : input, Switcher.snapshot);

      ExecutionLogger.add(this.key, result);
      return result;
    }

    if (key) { this.key = key; }
    if (input) { this.input = input; }
    
    await this.validate();
    if (Switcher.context.token === 'SILENT') {
      const result = checkCriteriaOffline(
        this.key ? this.key : key, this.input ? this.input : input, Switcher.snapshot);

      if (Switcher.options.logger) 
        ExecutionLogger.add(this.key, result);

      return result;
    } else {
      const response = await services.checkCriteria(Switcher.context, this.key, this.input, showReason);

      if (Switcher.options.logger) 
        ExecutionLogger.add(this.key, response.data);

      return response.data.result;
    }
  }
  
}

module.exports = Switcher;