# Netlify DNS Record Dynamic Provider for Pulumi

This dynamic [Pulumi](https://www.pulumi.com/) provider creates & destroys DNS records in a Netlify DNS zone via the [Netlify SDK](https://npmjs.com/package/netlify).

## Usage

```ts
// index.ts
import * as pulumi from "@pulumi/pulumi";
import {NetlifyDnsRecord} from "@canrau/pulumi-netlify-dns-record";

const cfg = new pulumi.Config();

new NetlifyDnsRecord("dns-record", {
  apiKey: cfg.requireSecret("netlify_api_key"),
  zoneId: cfg.requireSecret("netlify_dns_zone_id"),
  type: "TXT",
  ttl: 10 * 60 /* 10 minutes */,
  hostname: "mydomain.com",
  value: "TXT Value",
});
```

## Options

```ts
type NetlifyDnsInputs = {
  apiKey: string | pulumi.Input<string>;
  zoneId: string | pulumi.Input<string>;
  type: string | pulumi.Input<string>;
  hostname: string | pulumi.Input<string>;
  value: string | pulumi.Input<string>;
  ttl?: number | pulumi.Input<number>;
  priority?: number | pulumi.Input<number>;
  secondsToWaitAfter?: number | pulumi.Input<number>;
};
```
