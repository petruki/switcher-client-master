declare namespace SwitcherClient {

  /**
   * Quick start with the following 3 steps.
   * 
   * 1. Use Switcher.buildContext() to define the arguments to connect to the API.
   * 2. Use Switcher.factory() to create a new instance of Switcher.
   * 3. Use the instance created to call isItOn to query the API.
   */
  class Switcher {

    /**
     * Create the necessary configuration to communicate with the API
     * 
     * @param context Necessary arguments
     * @param options 
     */
    static buildContext(context: SwitcherContext, options: SwitcherOptions): void;

    /**
     * Creates a new instance of Switcher
     */
    static factory(): Switcher;

    /**
     * Read snapshot file locally and store in a parsed JSON object
     */
    static loadSnapshot(): Promise<void>;

    /**
     * Verifies if the current snapshot file is updated.
     * Return true if an update has been made.
     */
    static checkSnapshot(): Promise<boolean>;

    /**
     * Verifies if switchers are properly configured
     * 
     * @param switcherKeys Switcher Keys
     * @throws when one or more Switcher Keys were not found
     */
    static checkSwitchers(switcherKeys: string[]): Promise<void>;

    /**
     * Remove snapshot from real-time update
     */
    static unloadSnapshot(): void;

    /**
     * Force a switcher value to return a given value by calling one of both methods - true() false()
     * 
     * @param key 
     */
    static assume(key: string): Key;

    /**
     * Remove forced value from a switcher
     * 
     * @param key 
     */
    static forget(key: string): void;

    /**
     * Retrieve execution log given a switcher key
     * 
     * @param key 
     */
    static getLogger(key: string): any[];

    /**
    * Enable testing mode
    * It prevents from watching Snapshots that may hold process
    */
    static setTestEnabled(): void;

    /**
     * Disable testing mode
     */
    static setTestDisabled(): void;

    /**
    * Validate the input provided to access the API
    */
    validate(): Promise<void>;

    /**
     * Pre-set input values before calling the API
     * 
     * @param key 
     * @param input 
     */
    prepare(key: string, input?: string[]): Promise<void>;

    /**
     * Execute async criteria
     * 
     * @param key 
     * @param input 
     * @param showReason
     */
    isItOn(key?: string, input?: string[], showReason?: boolean): Promise<boolean>;

  }

  interface SwitcherContext {
    url: string;
    apiKey: string;
    domain: string;
    component: string;
    environment: string;
    token?: string;
    exp?: number;
  }

  interface SwitcherOptions {
    offline: boolean;
    logger: boolean;
    snapshotLocation: string;
    silentMode: boolean;
    retryAfter: string;
  }

  /**
   * Plain text validation. No format required.
   */
  function checkValue(input: string): string[];

  /**
   * Numeric type validation. It accepts positive/negative and decimal values.
   */
  function checkNumeric(input: string): string[];

  /**
   * This validation accept CIDR (e.g. 10.0.0.0/24) or IPv4 (e.g. 10.0.0.1) formats.
   */
  function checkNetwork(input: string): string[];

  /**
   * Date validation accept both date and time input (e.g. YYYY-MM-DD or YYYY-MM-DDTHH:mm) formats.
   */
  function checkDate(input: string): string[];

  /**
   * This validation accept only HH:mm format input.
   */
  function checkTime(input: string): string[];

  /**
   * Regular expression based validation. No format required.
   */
  function checkRegex(input: string): string[];
}

declare class Key {

  constructor(key: string);

  /**
   * Force result to true
   */
  true(): void;

  /**
   * Force result to false
   */
  false(): void;

  /**
   * Return selected switcher name
   */
  getKey(): Key;

  /**
   * Return current value
   */
  getValue(): boolean;
}

export = SwitcherClient;