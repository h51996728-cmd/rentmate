# RentMate prototype

## Run locally

From this folder, start the app server:

```sh
ruby --disable-gems server.rb
```

Then open <http://localhost:8000>. Keep the server running while using the app. Do not open `index.html` directly if you want listings to be shared.

Owner listings are stored by the server in `rentmate-listings.json`, so they remain available after refreshes and server restarts. Everyone using this same server URL sees the same listings. To share listings with people outside this computer, deploy the app and server to a public host with persistent storage.

The checkout in this prototype is simulated and does not collect real payments.

## Publish online with Render

1. Push this project to a GitHub repository.
2. In Render, choose **New → Blueprint**, connect that repository, and deploy the `render.yaml` blueprint.
3. Render will provide the public URL when the service is live. The blueprint includes persistent disk storage for listings.

Render persistent disks are available on paid services. Without persistent storage, listing data can be lost when the service restarts. See [Render's persistent disk docs](https://render.com/docs/disks).
