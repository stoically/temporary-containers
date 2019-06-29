# Debug log

- Open a new tab and navigate to `about:debugging`
- Tick the "Enable debugging" checkbox (untick again when you're done posting the Issue)
- Scroll down to Temporary Containers and click the "Debug" link
- Confirm the dialog with OK, you now see "Developer Tools" with "Console" selected
- Type into the console `log.DEBUG=true`, it should respond with "true" (type `log.DEBUG=false` into the console when you're done posting the Issue)
- Now reproduce your issue
- Switch back to the "Developer Tools", select everything in the console
- Copy everything in the console, paste it into a .txt file, save the file, and attach it to the issue by drag&drop'ing it into the text-box


Please be aware that if you configured a Proxy in Firefox, details about it (except password) will show up in the debug log.

---

**Firefox 68**

- Open a new tab and navigate to `about:debugging#/runtime/this-firefox`
- Tick the "Enable extension debugging." checkbox if available (untick again when you're done posting the Issue)
- Scroll down and click "Inspect" to the right of "Temporary Containers"
- Confirm the dialog with OK, you now see "Developer Tools" with "Console" selected
- Type into the console `log.DEBUG=true`, it should respond with "true" (type `log.DEBUG=false` into the console when you're done posting the Issue)
- Now reproduce your issue
- Switch back to the "Developer Tools", select everything in the console
- Copy everything in the console, paste it into a .txt file, save the file, and attach it to the issue by drag&drop'ing it into the text-box