# API

You can send messages to the Temporary Containers Add-on to trigger functionality or gather information by using [runtime.sendMessage](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/runtime/sendMessage). A message to Temporary Containers looks like this:

```js
browser.runtime.sendMessage('{c607c8df-14a7-4f28-894f-29e8722976af}', message);
```

`message` is an object with at least the property `method` as String. It returns a Promise that resolves in case of success, if information was requested it'll resolve with that. In case of error the Promise rejects.


Supported messages are:

### Open new Temporary Container tab

`method`: string, createTabInTempContainer

`url`: string, the URL you want to open in the new tab ([tabs.create limitations for `url` apply](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/tabs/create)). If provided the tab is focused if `active` is not set to `false`.

`active`: boolean, `true` to focus the tab, `false` or `undefined` to open the tab in the background

`deletesHistory`, boolean, `true` to open a "Deletes History Temporary Container" - only works if the user gave history permission in the Advanced preferences, `false` or `undefined` to open a regular Temporary Container

Returns the return value of `browser.tabs.create` if successful. Returns `undefined` if no tab was created.


### Check if a Container is a Temporary Container

`method`: string, isTempContainer

`cookieStoreId`: string, the cookieStoreId to check

Returns `true` if the given `cookieStoreId` is a Temporary Container, `false` if not