/* eslint-disable @typescript-eslint/no-explicit-any */
import path from 'path';
const expect = require('chai').expect;
import webExtensionsGeckoDriver from 'webextensions-geckodriver';
const webdriver = webExtensionsGeckoDriver.webdriver;
const until = webdriver.until;
const By = webdriver.By;
const manifestPath = path.resolve(
  path.join(__dirname, './../../dist/manifest.json')
);

describe('Temporary Containers', () => {
  let helper: any;
  let geckodriver: any;

  before(async () => {
    const webExtension = await webExtensionsGeckoDriver(manifestPath);
    geckodriver = webExtension.geckodriver;
    helper = {
      toolbarButton(): any {
        return geckodriver.wait(
          until.elementLocated(
            By.id('_c607c8df-14a7-4f28-894f-29e8722976af_-browser-action')
          ),
          5000
        );
      },
    };
  });

  it('should have a toolbar button', async () => {
    const button = await helper.toolbarButton();
    expect(await button.getAttribute('tooltiptext')).to.equal(
      'Open a new tab in a new Temporary Container'
    );
  });

  it('should open a new Temporary Container if toolbar button is clicked', async () => {
    await geckodriver.getAllWindowHandles();
    const button = await helper.toolbarButton();

    // give the extension a chance to fully initialize
    await new Promise((r) => setTimeout(r, 1500));

    button.click();

    await geckodriver.wait(
      async () => {
        const handles = await geckodriver.getAllWindowHandles();
        return handles.length === 2;
      },
      5000,
      'Should have opened a new tab'
    );

    const element = await geckodriver.wait(
      until.elementLocated(By.id('userContext-label')),
      5000,
      'Should find the userContext label'
    );

    await geckodriver.wait(
      async () => {
        const containerName = await element.getAttribute('value');
        return containerName === 'tmp1';
      },
      5000,
      'Should have a containerName'
    );
  });

  after(() => {
    geckodriver.quit();
  });
});
