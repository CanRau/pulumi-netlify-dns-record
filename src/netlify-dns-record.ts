import * as pulumi from "@pulumi/pulumi";
import * as NetlifyAPI from "netlify";
import {
  CheckFailure,
  CheckResult,
  CreateResult,
  DiffResult,
  ReadResult,
  Resource,
  ResourceProvider,
} from "@pulumi/pulumi/dynamic";

export type NetlifyDnsInputs = {
  apiKey: string | pulumi.Input<string>;
  zoneId: string | pulumi.Input<string>;
  type: string | pulumi.Input<string>;
  hostname: string | pulumi.Input<string>;
  value: string | pulumi.Input<string>;
  ttl?: number | pulumi.Input<number>;
  priority?: number | pulumi.Input<number>;
  secondsToWaitAfter?: number | pulumi.Input<number>;
};

type ProviderInputs = {
  apiKey: string;
  zoneId: string;
  type: string;
  hostname: string;
  value: string;
  ttl?: number;
  priority?: number;
  secondsToWaitAfter?: number;
  [key: string]: string | number | undefined;
};

const validKeys = [
  "apiKey",
  "zoneId",
  "type",
  "hostname",
  "value",
  "ttl",
  "priority",
];
const filterValidKeys = (key: string) => validKeys.includes(key);

const shallowCompare = (obj1: ProviderInputs, obj2: ProviderInputs) => {
  const obj1Keys = Object.keys(obj1).filter(filterValidKeys);
  const obj2Keys = Object.keys(obj2).filter(filterValidKeys);
  return (
    obj1Keys.length === obj2Keys.length &&
    obj1Keys.every((key) => obj1[key] === obj2[key])
  );
};

// https://gist.github.com/joepie91/2664c85a744e6bd0629c
const sleep = (duration: number) =>
  new Promise((resolve) => setTimeout(resolve, duration * 1000));

const netlifyDnsProvider: ResourceProvider = {
  async check(
    olds: NetlifyDnsInputs,
    news: NetlifyDnsInputs,
  ): Promise<CheckResult> {
    const failures: CheckFailure[] = [];
    if (failures.length > 0) {
      return {failures: failures};
    }
    return {inputs: news};
  },

  async create(props: ProviderInputs): Promise<CreateResult> {
    const netlify = new NetlifyAPI(props.apiKey);

    try {
      const {__provider, secondsToWaitAfter, ...outs} = props;

      const body = {
        type: props.type,
        hostname: props.hostname,
        value: props.value,
        ttl: props.ttl,
        priority: props.priority,
      };

      const {id} = await netlify.createDnsRecord({zone_id: props.zoneId, body});

      if (typeof secondsToWaitAfter === "number" && secondsToWaitAfter > 0) {
        await sleep(secondsToWaitAfter);
      }

      return {id, outs};
    } catch (error) {
      console.log(error.message);
      throw error;
    }
  },

  async diff(
    id: string,
    olds: ProviderInputs,
    news: ProviderInputs,
  ): Promise<DiffResult> {
    const replaces: string[] = [];
    let changes = false;

    if (!shallowCompare(olds, news)) {
      changes = true;
      replaces.push(...Object.keys(news).filter(filterValidKeys));
    }

    return {changes, replaces};
  },

  async delete(id: string, {apiKey, zoneId}: ProviderInputs) {
    const netlify = new NetlifyAPI(apiKey);
    await netlify.deleteDnsRecord({zone_id: zoneId, dns_record_id: id});
  },

  async read(id: string, props: ProviderInputs): Promise<ReadResult> {
    const netlify = new NetlifyAPI(props.apiKey);
    const response = await netlify.getIndividualDnsRecord({
      zone_id: props.zoneId,
      dns_record_id: id,
    });
    return {id: response.id, props: {...props, ...response}};
  },
};

export class NetlifyDnsRecord extends Resource {
  /**
   * Creates a new DNS record on Netlify
   *
   * @param apiKey - Netlify API key
   * @param zoneId - Netlify DNS zone ID
   * @param type - DNS record type
   * @param hostname - DNS record hostname
   * @param value - DNS record value
   * @param ttl - Time to live in seconds
   * @param priority - The priority of the target host, lower value means more preferred. Only for records of type MX.
   * @param secondsToWaitAfter - How many seconds to wait after the record has been created
   */
  constructor(
    name: string,
    props: NetlifyDnsInputs,
    opts?: pulumi.CustomResourceOptions,
  ) {
    super(netlifyDnsProvider, name, props, opts);
  }
}
