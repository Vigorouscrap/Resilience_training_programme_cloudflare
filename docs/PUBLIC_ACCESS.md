# Public access

This project is a static website. There is no build step; the public website can be served directly from the `src` folder.

## Local network access

Run:

```bash
npm start
```

The server now binds to `0.0.0.0`, so other devices on the same network can open:

```text
http://YOUR_COMPUTER_LAN_IP:8000
```

To find the LAN IP on Windows:

```powershell
ipconfig
```

Look for the IPv4 address of the active Wi-Fi or Ethernet adapter.

Notes:

- Windows Firewall may ask whether to allow Python network access. Allow it for the network you are using.
- This only makes the site reachable from networks that can reach your computer.
- For internet-wide access from your own machine, you still need router port forwarding, a public IP/domain, or a tunnel service.

## Internet public access with Vercel

The repository includes `vercel.json`, which tells Vercel to publish the `src` folder directly. No build step is required.

1. Open Vercel and import the GitHub repository:

```text
https://github.com/xiaoqisong12-lgtm/Resilience_training_programme
```

2. Keep the default project root as the repository root.
3. Vercel will read `vercel.json` and deploy `src` as the output directory.
4. After deployment, Vercel will provide a public URL like:

```text
https://resilience-training-programme.vercel.app/
```

Vercel also creates preview URLs for future branch or pull-request deployments.

## Local-only mode

If you want the previous local-only behavior:

```bash
npm run start:local
```
