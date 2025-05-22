# deployWISP

[![Join Our Discord](https://img.shields.io/badge/Join%20Our-Discord-purple)](https://discord.gg/redlv) [![maintenance-status](https://img.shields.io/badge/maintenance-passively--maintained-yellowgreen.svg)](https://github.com/rhenryw/deployWisp/commits/main/)

## An easily deployable repo for [WCJ by Hg Workshop](https://github.com/MercuryWorkshop/wisp-client-js)

How to use:
---


START WITH A FRESH UBUNTU SERVER


Point your desired domain/subdomain to the server that you want to install WISP on (Using an `A` record, you can run `hostname -I` if you don't know the IP)

Then run
```bash
curl -fsSL https://raw.githubusercontent.com/rhenryw/deployWisp/refs/heads/main/install.sh | bash -s yourdomain.tld

```
Replace `yourdomain.tld` with your domain or subdomain.

It will install and start by itself!

It's that easy!

Your brand new shiny wisp server will be at `wss://domain.tld/` or `wss://your.domain.tld/`

To test
---
Go to [Websocket Tester](https://piehost.com/websocket-tester)

Enter `wss://yourdomain.tld` and hit connect, if it says 

```
- Connection failed, see your browser's developer console for reason and error code.
- Connection closed
```

Open an issue

NOTE: This has only been tested on newer ubuntu and debian
