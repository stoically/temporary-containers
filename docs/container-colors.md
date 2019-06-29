# Container Colors

You can only use the provided container colors out-of-the-box because they're hardcoded by Firefox. If you want to change the colors however, you can do so with CSS: Open `about:profiles`, click on "root directory" for your active profile, open or create the `chrome` folder and to change

the color of the tab- and address bar create `userChrome.css` with content

```
    .identity-color-red {
      --identity-tab-color: #000000 !important; /* tab bar */
      --identity-icon-color: #000000 !important; /* address bar */
    }
```


If you want to change the color of Multi-Account Containers too, create `userContent.css` with content

```css
    [data-identity-color="red"] {
      --identity-icon-color: #000000 !important; /* multi-account containers menu */
    }

    .identity-color-red {
      --identity-icon-color: #000000 !important; /* multi-account containers preferences */
    }
```


Adjust `#000000` to your liking. `"red"` can be any color you can set in the preferences, so you can overwrite different colors. Restart browser to see the changes.

Pro-Tip: Click the Firefox Menu, Select "Web Developer", Select "Browser Toolbox", Confirm the Dialog with OK. The Element-Picker (Top-Left) can select any Firefox Menu and reveal the underlying CSS that you can overwrite with `userChrome.css`


Related: https://github.com/mozilla/multi-account-containers/issues/391

Source: https://www.reddit.com/r/unixporn/comments/78m6t1/oc_firefox_dark_theme/