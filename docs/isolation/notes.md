# Notes

### Navigating in tabs Isolation Exceptions

Some Websites (like e.g. GitHub in Repos) don't actually trigger a request (navigation) in the current tab which could be canceled and reopened. Instead they use XHR or fetch to get new content, inject it into the website and then change the URL using window.location or pushState. In this case canceling the request and reopening in it a new Temporary Container is not possible.


### Mouse Click Exception

Not all Mouse Click can get catched since on some websites you don't actually click links, but instead other HTML elements and the website then executes arbitrary JavaScript which might open another website or a new tab without opening it in a new Temporary Container.