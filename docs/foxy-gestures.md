# Foxy Gestures

You can use the [API](/stoically/firefox-add-on-temporary-containers/wiki/API) in [Foxy Gesture User Scripts](https://github.com/marklieberman/foxygestures/wiki/User-Scripts):


Open new Temporary Container tab

```js
browser.runtime.sendMessage('{c607c8df-14a7-4f28-894f-29e8722976af}', {
    method: 'createTabInTempContainer'
});
```

Open link in new Temporary Container tab

```js
const url = data.element && data.element.linkHref;
if (url) {
    browser.runtime.sendMessage('{c607c8df-14a7-4f28-894f-29e8722976af}', {
        method: 'createTabInTempContainer',
        active: true,
        url
    });
}
```

Open link in new Background Temporary Container tab

```js
const url = data.element && data.element.linkHref;
if (url) {
    browser.runtime.sendMessage('{c607c8df-14a7-4f28-894f-29e8722976af}', {
        method: 'createTabInTempContainer',
        active: false,
        url
    });
}
```