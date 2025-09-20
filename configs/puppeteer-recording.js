const puppeteer = require('puppeteer'); // v23.0.0 or later

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const timeout = 5000;
    page.setDefaultTimeout(timeout);

    {
        const targetPage = page;
        await targetPage.setViewport({
            width: 830,
            height: 959
        })
    }
    {
        const targetPage = page;
        await targetPage.goto('https://www.target.com/p/pok-233-mon-trading-card-game-scarlet-38-violet-stellar-crown-elite-trainer-box/-/A-91619912?afid=Mavely&cpng=&lnm=81938&ref=tgt_adv_xasd0002&clkid=f6df9512N8dff11f086b2d135acc6f9e4&TCID=AFL-f6df9512N8dff11f086b2d135acc6f9e4');
    }
    {
        const targetPage = page;
        await targetPage.goto('chrome://new-tab-page/');
    }
    {
        const targetPage = page;
        await targetPage.goto('chrome://extensions/');
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://extensions/', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('extensions-manager >>>> #toolbar >>>> #loadUnpacked >>>> #content'),
            targetPage.locator(':scope >>> #loadUnpacked >>>> :scope >>> #content')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 67,
                y: 11,
              },
            });
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://extensions/', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('extensions-manager >>>> #items-list >>>> #ckpenlhganbgdanipjkpbnoklodocibm >>>> #enableToggle'),
            targetPage.locator(':scope >>> #ckpenlhganbgdanipjkpbnoklodocibm >>>> :scope >>> #enableToggle')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 13.5,
                y: 4.984375,
              },
            });
    }
    {
        const targetPage = page;
        await targetPage.goto('chrome://new-tab-page/');
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://extensions/', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('extensions-manager >>>> #items-list >>>> #ckpenlhganbgdanipjkpbnoklodocibm >>>> #errors-button >>>> #content'),
            targetPage.locator(':scope >>> #errors-button >>>> :scope >>> #content')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 26.28125,
                y: 18.984375,
              },
            });
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://extensions/', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('extensions-manager >>>> extensions-error-page >>>> #errorsList > div'),
            targetPage.locator(':scope >>> #errorsList > div')
        ])
            .setTimeout(timeout)
            .click({
              delay: 3111,
              offset: {
                x: 279,
                y: 182,
              },
            });
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://extensions/', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await targetPage.keyboard.down('Control');
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://extensions/', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await targetPage.keyboard.down('c');
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://extensions/', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await targetPage.keyboard.up('Control');
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://extensions/', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await targetPage.keyboard.up('c');
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://extensions/', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('extensions-manager >>>> extensions-error-page >>>> cr-button >>>> #content'),
            targetPage.locator(':scope >>> extensions-error-page >>>> :scope >>> #content')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 35.890625,
                y: 17,
              },
            });
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://extensions/', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('extensions-manager >>>> #toolbar >>>> #loadUnpacked >>>> #content'),
            targetPage.locator(':scope >>> #loadUnpacked >>>> :scope >>> #content')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 63,
                y: 18,
              },
            });
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://extensions/', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('extensions-manager >>>> extensions-error-page >>>> #closeButton >>>> #maskedImage'),
            targetPage.locator(':scope >>> #closeButton >>>> :scope >>> #maskedImage')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 22,
                y: 17,
              },
            });
    }
    {
        const targetPage = page;
        await targetPage.goto('chrome://new-tab-page/');
    }
    {
        const targetPage = page;
        await targetPage.goto('chrome://extensions/');
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://extensions/', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('extensions-manager >>>> #toolbar >>>> #loadUnpacked >>>> #content'),
            targetPage.locator(':scope >>> #loadUnpacked >>>> :scope >>> #content')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 50,
                y: 6,
              },
            });
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://extensions/', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('::-p-aria(Errors)'),
            targetPage.locator('extensions-manager >>>> #items-list >>>> #ckpenlhganbgdanipjkpbnoklodocibm >>>> #errors-button'),
            targetPage.locator(':scope >>> #errors-button')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 58.78125,
                y: 14.984375,
              },
            });
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://extensions/', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('::-p-aria(Clear all)'),
            targetPage.locator('extensions-manager >>>> extensions-error-page >>>> cr-button'),
            targetPage.locator(':scope >>> extensions-error-page >>>> :scope >>> cr-button')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 49.234375,
                y: 30,
              },
            });
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://extensions/', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('::-p-aria(Load unpacked)'),
            targetPage.locator('extensions-manager >>>> #toolbar >>>> #loadUnpacked'),
            targetPage.locator(':scope >>> #loadUnpacked')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 62,
                y: 29,
              },
            });
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://extensions/', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('extensions-manager >>>> extensions-error-page >>>> #closeButton >>>> #maskedImage'),
            targetPage.locator(':scope >>> #closeButton >>>> :scope >>> #maskedImage')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 18.671875,
                y: 18,
              },
            });
    }
    {
        const targetPage = page;
        await targetPage.goto('chrome://new-tab-page/');
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://extensions/', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('extensions-manager >>>> #items-list >>>> #ckpenlhganbgdanipjkpbnoklodocibm >>>> #enableToggle'),
            targetPage.locator(':scope >>> #ckpenlhganbgdanipjkpbnoklodocibm >>>> :scope >>> #enableToggle')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 15,
                y: 11.984375,
              },
            });
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://extensions/', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('extensions-manager >>>> #items-list >>>> #ckpenlhganbgdanipjkpbnoklodocibm >>>> #enableToggle'),
            targetPage.locator(':scope >>> #ckpenlhganbgdanipjkpbnoklodocibm >>>> :scope >>> #enableToggle')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 15,
                y: 9.984375,
              },
            });
    }
    {
        const targetPage = page;
        await targetPage.goto('chrome://extensions/?id=ckpenlhganbgdanipjkpbnoklodocibm');
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://extensions/?id=ckpenlhganbgdanipjkpbnoklodocibm', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('extensions-manager >>>> extensions-detail-view >>>> #dev-reload-button >>>> #maskedImage'),
            targetPage.locator(':scope >>> extensions-detail-view >>>> :scope >>> #dev-reload-button >>>> :scope >>> #maskedImage')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 22.515625,
                y: 14,
              },
            });
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://extensions/?id=ckpenlhganbgdanipjkpbnoklodocibm', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('extensions-manager >>>> extensions-detail-view >>>> #closeButton >>>> #maskedImage'),
            targetPage.locator(':scope >>> #closeButton >>>> :scope >>> #maskedImage')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 13.515625,
                y: 8,
              },
            });
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://extensions/?id=ckpenlhganbgdanipjkpbnoklodocibm', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('extensions-manager >>>> #items-list >>>> #ckpenlhganbgdanipjkpbnoklodocibm >>>> #dev-reload-button >>>> #maskedImage'),
            targetPage.locator(':scope >>> #items-list >>>> :scope >>> #maskedImage')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 16,
                y: 8.984375,
              },
            });
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://new-tab-page/', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('ntp-app >>>> #content'),
            targetPage.locator(':scope >>> ntp-app >>>> :scope >>> #content')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 749,
                y: 608,
              },
            });
    }
    {
        const targetPage = page;
        await targetPage.goto('chrome://extensions/?id=ckpenlhganbgdanipjkpbnoklodocibm');
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://extensions/?id=ckpenlhganbgdanipjkpbnoklodocibm', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('extensions-manager >>>> extensions-detail-view >>>> #closeButton >>>> #maskedImage'),
            targetPage.locator(':scope >>> #closeButton >>>> :scope >>> #maskedImage')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 28.515625,
                y: 15,
              },
            });
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://extensions/?id=ckpenlhganbgdanipjkpbnoklodocibm', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('extensions-manager >>>> #toolbar >>>> #loadUnpacked >>>> #content'),
            targetPage.locator(':scope >>> #loadUnpacked >>>> :scope >>> #content')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 45,
                y: 6,
              },
            });
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://extensions/?id=ckpenlhganbgdanipjkpbnoklodocibm', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('extensions-manager >>>> #toolbar >>>> #loadUnpacked >>>> #content'),
            targetPage.locator(':scope >>> #loadUnpacked >>>> :scope >>> #content')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 84,
                y: 9,
              },
            });
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://extensions/?id=ckpenlhganbgdanipjkpbnoklodocibm', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('extensions-manager >>>> #items-list >>>> #ckpenlhganbgdanipjkpbnoklodocibm >>>> #errors-button >>>> #content'),
            targetPage.locator(':scope >>> #errors-button >>>> :scope >>> #content')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 18.78125,
                y: 6.984375,
              },
            });
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://extensions/?id=ckpenlhganbgdanipjkpbnoklodocibm', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('extensions-manager >>>> extensions-error-page >>>> cr-button >>>> #content'),
            targetPage.locator(':scope >>> extensions-error-page >>>> :scope >>> #content')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 38.234375,
                y: 1,
              },
            });
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://extensions/?id=ckpenlhganbgdanipjkpbnoklodocibm', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('extensions-manager >>>> extensions-error-page >>>> #closeButton >>>> #maskedImage'),
            targetPage.locator(':scope >>> extensions-error-page >>>> :scope >>> #closeButton >>>> :scope >>> #maskedImage')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 19.671875,
                y: 15,
              },
            });
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://extensions/?id=ckpenlhganbgdanipjkpbnoklodocibm', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('extensions-manager >>>> #items-list >>>> #ckpenlhganbgdanipjkpbnoklodocibm >>>> #dev-reload-button >>>> #maskedImage'),
            targetPage.locator(':scope >>> #items-list >>>> :scope >>> #maskedImage')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 8,
                y: 11.984375,
              },
            });
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://extensions/?id=ckpenlhganbgdanipjkpbnoklodocibm', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('extensions-manager >>>> #items-list >>>> #ckpenlhganbgdanipjkpbnoklodocibm >>>> #errors-button >>>> #content'),
            targetPage.locator(':scope >>> #errors-button >>>> :scope >>> #content')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 20.78125,
                y: 7.984375,
              },
            });
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://extensions/?id=ckpenlhganbgdanipjkpbnoklodocibm', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('::-p-aria(Warning Service worker registration failed. Status code: 15)'),
            targetPage.locator('extensions-manager >>>> extensions-error-page >>>> #errorsList > div:nth-of-type(1) div.start'),
            targetPage.locator(':scope >>> #errorsList > div:nth-of-type(1) div.start')
        ])
            .setTimeout(timeout)
            .click({
              delay: 3176,
              offset: {
                x: 39.671875,
                y: 30,
              },
            });
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://extensions/?id=ckpenlhganbgdanipjkpbnoklodocibm', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('extensions-manager >>>> extensions-error-page >>>> #\\35 '),
            targetPage.locator(':scope >>> #\\35 ')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 309.671875,
                y: 5.015625,
              },
            });
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://extensions/?id=ckpenlhganbgdanipjkpbnoklodocibm', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('extensions-manager >>>> extensions-error-page >>>> #\\37 '),
            targetPage.locator(':scope >>> #\\37 ')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 390.671875,
                y: 5.015625,
              },
            });
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://extensions/?id=ckpenlhganbgdanipjkpbnoklodocibm', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('extensions-manager >>>> extensions-error-page >>>> cr-button >>>> #content'),
            targetPage.locator(':scope >>> extensions-error-page >>>> :scope >>> #content')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 25.234375,
                y: 13,
              },
            });
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://extensions/?id=ckpenlhganbgdanipjkpbnoklodocibm', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('extensions-manager >>>> extensions-error-page >>>> #closeButton >>>> #maskedImage'),
            targetPage.locator(':scope >>> extensions-error-page >>>> :scope >>> #closeButton >>>> :scope >>> #maskedImage')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 18.671875,
                y: 21,
              },
            });
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://extensions/?id=ckpenlhganbgdanipjkpbnoklodocibm', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('extensions-manager >>>> #items-list >>>> #ckpenlhganbgdanipjkpbnoklodocibm >>>> #dev-reload-button >>>> #maskedImage'),
            targetPage.locator(':scope >>> #items-list >>>> :scope >>> #maskedImage')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 12,
                y: 11.984375,
              },
            });
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://extensions/?id=ckpenlhganbgdanipjkpbnoklodocibm', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('extensions-manager >>>> #items-list >>>> #ckpenlhganbgdanipjkpbnoklodocibm >>>> #errors-button >>>> #content'),
            targetPage.locator(':scope >>> #errors-button >>>> :scope >>> #content')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 30.78125,
                y: 11.984375,
              },
            });
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://extensions/?id=ckpenlhganbgdanipjkpbnoklodocibm', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('::-p-aria(Warning Service worker registration failed. Status code: 15)'),
            targetPage.locator('extensions-manager >>>> extensions-error-page >>>> #errorsList > div:nth-of-type(1) div.start'),
            targetPage.locator(':scope >>> #errorsList > div:nth-of-type(1) div.start')
        ])
            .setTimeout(timeout)
            .click({
              delay: 1072,
              offset: {
                x: 359.671875,
                y: 22,
              },
            });
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://extensions/?id=ckpenlhganbgdanipjkpbnoklodocibm', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await targetPage.keyboard.down('Control');
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://extensions/?id=ckpenlhganbgdanipjkpbnoklodocibm', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await targetPage.keyboard.down('c');
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://extensions/?id=ckpenlhganbgdanipjkpbnoklodocibm', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await targetPage.keyboard.up('Control');
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://extensions/?id=ckpenlhganbgdanipjkpbnoklodocibm', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await targetPage.keyboard.up('c');
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://extensions/?id=ckpenlhganbgdanipjkpbnoklodocibm', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('extensions-manager >>>> extensions-error-page >>>> #\\38 '),
            targetPage.locator(':scope >>> #\\38 ')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 261.671875,
                y: 6.015625,
              },
            });
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://extensions/?id=ckpenlhganbgdanipjkpbnoklodocibm', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('::-p-aria(Warning Service worker registration failed. Status code: 15)'),
            targetPage.locator('extensions-manager >>>> extensions-error-page >>>> #errorsList > div:nth-of-type(1) div.start'),
            targetPage.locator(':scope >>> #errorsList > div:nth-of-type(1) div.start')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 138.671875,
                y: 38,
              },
            });
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://extensions/?id=ckpenlhganbgdanipjkpbnoklodocibm', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('::-p-aria(Error Uncaught ReferenceError: window is not defined)'),
            targetPage.locator('extensions-manager >>>> extensions-error-page >>>> #errorsList > div:nth-of-type(2) div.start'),
            targetPage.locator(':scope >>> #errorsList > div:nth-of-type(2) div.start')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 114.671875,
                y: 9,
              },
            });
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://extensions/?id=ckpenlhganbgdanipjkpbnoklodocibm', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('extensions-manager >>>> extensions-error-page >>>> #errorsList > div:nth-of-type(2)'),
            targetPage.locator(':scope >>> #errorsList > div:nth-of-type(2)')
        ])
            .setTimeout(timeout)
            .click({
              delay: 1528,
              offset: {
                x: 277.671875,
                y: 174,
              },
            });
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://extensions/?id=ckpenlhganbgdanipjkpbnoklodocibm', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await targetPage.keyboard.down('Control');
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://extensions/?id=ckpenlhganbgdanipjkpbnoklodocibm', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await targetPage.keyboard.down('c');
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://extensions/?id=ckpenlhganbgdanipjkpbnoklodocibm', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await targetPage.keyboard.up('Control');
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://extensions/?id=ckpenlhganbgdanipjkpbnoklodocibm', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await targetPage.keyboard.up('c');
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'https://www.target.com/p/pok-233-mon-trading-card-game-mega-evolution-booster-display/-/A-94886127?clkid=f6df9512N8dff11f086b2d135acc6f9e4&cpng=&TCID=AFL-f6df9512N8dff11f086b2d135acc6f9e4&lnm=81938&afid=Mavely&ref=tgt_adv_xasd0002', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('body > div:nth-of-type(16)'),
            targetPage.locator('::-p-xpath(/html/body/div[16])'),
            targetPage.locator(':scope >>> body > div:nth-of-type(16)'),
            targetPage.locator('::-p-text(♿ Assistive Shopping)')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 103.0625,
                y: 18,
              },
            });
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://extensions/?id=ckpenlhganbgdanipjkpbnoklodocibm', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('::-p-aria(Load unpacked)'),
            targetPage.locator('extensions-manager >>>> #toolbar >>>> #loadUnpacked'),
            targetPage.locator(':scope >>> #loadUnpacked')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 87,
                y: 32,
              },
            });
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://extensions/?id=ckpenlhganbgdanipjkpbnoklodocibm', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('extensions-manager >>>> extensions-error-page >>>> cr-button >>>> #content'),
            targetPage.locator(':scope >>> extensions-error-page >>>> :scope >>> #content')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 11.234375,
                y: 10,
              },
            });
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://extensions/?id=ckpenlhganbgdanipjkpbnoklodocibm', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('extensions-manager >>>> extensions-error-page >>>> #closeButton >>>> #maskedImage'),
            targetPage.locator(':scope >>> extensions-error-page >>>> :scope >>> #closeButton >>>> :scope >>> #maskedImage')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 22.671875,
                y: 25,
              },
            });
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://extensions/?id=ckpenlhganbgdanipjkpbnoklodocibm', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('extensions-manager >>>> #items-list >>>> #ckpenlhganbgdanipjkpbnoklodocibm >>>> #dev-reload-button >>>> #maskedImage'),
            targetPage.locator(':scope >>> #items-list >>>> :scope >>> #maskedImage')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 0,
                y: 17.984375,
              },
            });
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://extensions/?id=ckpenlhganbgdanipjkpbnoklodocibm', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('extensions-manager >>>> #items-list >>>> #ckpenlhganbgdanipjkpbnoklodocibm >>>> #dev-reload-button >>>> #maskedImage'),
            targetPage.locator(':scope >>> #items-list >>>> :scope >>> #maskedImage')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 23,
                y: 16.984375,
              },
            });
    }
    {
        const targetPage = page;
        await targetPage.goto('chrome://extensions/?id=ckpenlhganbgdanipjkpbnoklodocibm');
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://extensions/?id=ckpenlhganbgdanipjkpbnoklodocibm', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('extensions-manager >>>> #toolbar >>>> #updateNow >>>> #content'),
            targetPage.locator(':scope >>> #updateNow >>>> :scope >>> #content')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 17.109375,
                y: 14,
              },
            });
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://extensions/?id=ckpenlhganbgdanipjkpbnoklodocibm', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('::-p-aria(Keyboard shortcuts)'),
            targetPage.locator('extensions-manager >>>> extensions-sidebar >>>> #sectionsShortcuts'),
            targetPage.locator(':scope >>> #sectionsShortcuts')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 185,
                y: 14,
              },
            });
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://extensions/?id=ckpenlhganbgdanipjkpbnoklodocibm', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('::-p-aria(My extensions)'),
            targetPage.locator('extensions-manager >>>> extensions-sidebar >>>> #sectionsExtensions'),
            targetPage.locator(':scope >>> #sectionsExtensions')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 122,
                y: 8,
              },
            });
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://extensions/?id=ckpenlhganbgdanipjkpbnoklodocibm', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('extensions-manager >>>> #items-list >>>> #ckpenlhganbgdanipjkpbnoklodocibm >>>> #detailsButton'),
            targetPage.locator(':scope >>> #ckpenlhganbgdanipjkpbnoklodocibm >>>> :scope >>> #detailsButton')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 46,
                y: 31.984375,
              },
            });
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://extensions/?id=ckpenlhganbgdanipjkpbnoklodocibm', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('extensions-manager >>>> extensions-detail-view >>>> #closeButton >>>> #maskedImage'),
            targetPage.locator(':scope >>> #closeButton >>>> :scope >>> #maskedImage')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 23.515625,
                y: 28,
              },
            });
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://extensions/?id=ckpenlhganbgdanipjkpbnoklodocibm', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('::-p-aria(Load unpacked)'),
            targetPage.locator('extensions-manager >>>> #toolbar >>>> #loadUnpacked'),
            targetPage.locator(':scope >>> #loadUnpacked')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 61,
                y: 29,
              },
            });
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://extensions/?id=ckpenlhganbgdanipjkpbnoklodocibm', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('extensions-manager >>>> #load-error >>>> cr-button.action-button >>>> #content'),
            targetPage.locator(':scope >>> cr-button.action-button >>>> :scope >>> #content')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 16.625,
                y: 3,
              },
            });
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://extensions/?id=ckpenlhganbgdanipjkpbnoklodocibm', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('extensions-manager >>>> #load-error >>>> cr-button.action-button >>>> #content'),
            targetPage.locator(':scope >>> cr-button.action-button >>>> :scope >>> #content')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 14.625,
                y: 8,
              },
            });
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://extensions/?id=ckpenlhganbgdanipjkpbnoklodocibm', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('extensions-manager >>>> #load-error >>>> cr-button.cancel-button >>>> #content'),
            targetPage.locator(':scope >>> cr-button.cancel-button >>>> :scope >>> #content')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 33.671875,
                y: 11,
              },
            });
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://extensions/?id=ckpenlhganbgdanipjkpbnoklodocibm', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('::-p-aria(Load unpacked)'),
            targetPage.locator('extensions-manager >>>> #toolbar >>>> #loadUnpacked'),
            targetPage.locator(':scope >>> #loadUnpacked')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 66,
                y: 28,
              },
            });
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://extensions/?id=ckpenlhganbgdanipjkpbnoklodocibm', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('extensions-manager >>>> #load-error >>>> #dialog > div:nth-of-type(2)'),
            targetPage.locator(':scope >>> #dialog > div:nth-of-type(2)')
        ])
            .setTimeout(timeout)
            .click({
              delay: 4104,
              offset: {
                x: 12,
                y: 6,
              },
            });
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://extensions/?id=ckpenlhganbgdanipjkpbnoklodocibm', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('::-p-aria(Retry)'),
            targetPage.locator('extensions-manager >>>> #load-error >>>> cr-button.action-button'),
            targetPage.locator(':scope >>> cr-button.action-button')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 14.8125,
                y: 14,
              },
            });
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://extensions/?id=ckpenlhganbgdanipjkpbnoklodocibm', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('extensions-manager >>>> #load-error >>>> cr-button.action-button >>>> #content'),
            targetPage.locator(':scope >>> cr-button.action-button >>>> :scope >>> #content')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 11.625,
                y: 6,
              },
            });
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://extensions/?id=ckpenlhganbgdanipjkpbnoklodocibm', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('extensions-manager >>>> #load-error >>>> cr-button.cancel-button >>>> #content'),
            targetPage.locator(':scope >>> cr-button.cancel-button >>>> :scope >>> #content')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 38.671875,
                y: 10,
              },
            });
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://extensions/?id=ckpenlhganbgdanipjkpbnoklodocibm', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('extensions-manager >>>> #toolbar >>>> #loadUnpacked >>>> #content'),
            targetPage.locator(':scope >>> #loadUnpacked >>>> :scope >>> #content')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 51,
                y: 11,
              },
            });
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://extensions/?id=ckpenlhganbgdanipjkpbnoklodocibm', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('extensions-manager >>>> #load-error >>>> cr-button.cancel-button >>>> #content'),
            targetPage.locator(':scope >>> cr-button.cancel-button >>>> :scope >>> #content')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 31.671875,
                y: 18,
              },
            });
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://extensions/?id=ckpenlhganbgdanipjkpbnoklodocibm', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('extensions-manager >>>> #toolbar >>>> #loadUnpacked >>>> #content'),
            targetPage.locator(':scope >>> #loadUnpacked >>>> :scope >>> #content')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 46,
                y: 12,
              },
            });
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://extensions/?id=ckpenlhganbgdanipjkpbnoklodocibm', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('extensions-manager >>>> #items-list >>>> #ckpenlhganbgdanipjkpbnoklodocibm >>>> #dev-reload-button >>>> #maskedImage'),
            targetPage.locator(':scope >>> #items-list >>>> :scope >>> #maskedImage')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 21,
                y: 21.984375,
              },
            });
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://extensions/?id=ckpenlhganbgdanipjkpbnoklodocibm', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('extensions-manager >>>> #items-list >>>> #ckpenlhganbgdanipjkpbnoklodocibm >>>> #detailsButton >>>> #content'),
            targetPage.locator(':scope >>> #ckpenlhganbgdanipjkpbnoklodocibm >>>> :scope >>> #detailsButton >>>> :scope >>> #content')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 1,
                y: 2.984375,
              },
            });
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://extensions/?id=ckpenlhganbgdanipjkpbnoklodocibm', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('extensions-manager >>>> extensions-detail-view >>>> #allow-incognito'),
            targetPage.locator(':scope >>> #allow-incognito')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 652.515625,
                y: 61.734375,
              },
            });
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://extensions/?id=ckpenlhganbgdanipjkpbnoklodocibm', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('::-p-aria(Allow in Incognito Warning: Google Chrome cannot prevent extensions from recording your browsing history. To disable this extension in Incognito mode, unselect this option. Changes to this setting will be applied once Chrome restarts. )'),
            targetPage.locator('extensions-manager >>>> extensions-detail-view >>>> #allow-incognito >>>> #crToggle'),
            targetPage.locator(':scope >>> #allow-incognito >>>> :scope >>> #crToggle')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 10.515625,
                y: 11.71875,
              },
            });
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://extensions/?id=ckpenlhganbgdanipjkpbnoklodocibm', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('extensions-manager >>>> #container'),
            targetPage.locator(':scope >>> extensions-manager >>>> :scope >>> #container')
        ])
            .setTimeout(timeout)
            .click({
              delay: 848,
              offset: {
                x: 1533,
                y: 578,
              },
            });
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://extensions/?id=ckpenlhganbgdanipjkpbnoklodocibm', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('extensions-manager >>>> extensions-detail-view >>>> #closeButton >>>> #maskedImage'),
            targetPage.locator(':scope >>> #closeButton >>>> :scope >>> #maskedImage')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 19,
                y: 20,
              },
            });
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://extensions/?id=ckpenlhganbgdanipjkpbnoklodocibm', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('extensions-manager >>>> #toolbar >>>> #loadUnpacked >>>> #content'),
            targetPage.locator(':scope >>> #loadUnpacked >>>> :scope >>> #content')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 68,
                y: 5,
              },
            });
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://extensions/?id=ckpenlhganbgdanipjkpbnoklodocibm', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('extensions-manager >>>> #items-list >>>> #ckpenlhganbgdanipjkpbnoklodocibm >>>> #dev-reload-button >>>> #maskedImage'),
            targetPage.locator(':scope >>> #items-list >>>> :scope >>> #maskedImage')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 16.75,
                y: 7.984375,
              },
            });
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://extensions/?id=ckpenlhganbgdanipjkpbnoklodocibm', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('extensions-manager >>>> #items-list >>>> #ckpenlhganbgdanipjkpbnoklodocibm >>>> #button-strip'),
            targetPage.locator(':scope >>> #ckpenlhganbgdanipjkpbnoklodocibm >>>> :scope >>> #button-strip')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 364.75,
                y: 32.984375,
              },
            });
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://extensions/?id=ckpenlhganbgdanipjkpbnoklodocibm', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('extensions-manager >>>> #items-list >>>> #ckpenlhganbgdanipjkpbnoklodocibm >>>> #enableToggle'),
            targetPage.locator(':scope >>> #ckpenlhganbgdanipjkpbnoklodocibm >>>> :scope >>> #enableToggle')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 11.75,
                y: 5.984375,
              },
            });
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://extensions/?id=ckpenlhganbgdanipjkpbnoklodocibm', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('extensions-manager >>>> #items-list >>>> #ckpenlhganbgdanipjkpbnoklodocibm >>>> #enableToggle'),
            targetPage.locator(':scope >>> #ckpenlhganbgdanipjkpbnoklodocibm >>>> :scope >>> #enableToggle')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 11.75,
                y: 5.984375,
              },
            });
    }
    {
        const targetPage = page;
        await targetPage.goto('chrome://settings/');
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://settings/', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('::-p-aria(Appearance)'),
            targetPage.locator('settings-ui >>>> #leftMenu >>>> #appearance'),
            targetPage.locator(':scope >>> #appearance')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 194,
                y: 15,
              },
            });
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://settings/', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('::-p-aria(Show tab groups in bookmarks bar)'),
            targetPage.locator('settings-ui >>>> #main >>>> settings-basic-page >>>> settings-appearance-page >>>> #showSavedTabGroups >>>> #control'),
            targetPage.locator(':scope >>> #showSavedTabGroups >>>> :scope >>> #control')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 12.671875,
                y: 5.921875,
              },
            });
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://settings/', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('::-p-aria(Show tab groups in bookmarks bar)'),
            targetPage.locator('settings-ui >>>> #main >>>> settings-basic-page >>>> settings-appearance-page >>>> #showSavedTabGroups >>>> #control'),
            targetPage.locator(':scope >>> #showSavedTabGroups >>>> :scope >>> #control')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 14.671875,
                y: 14.921875,
              },
            });
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://settings/', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('::-p-aria(Show home button)'),
            targetPage.locator('settings-ui >>>> #main >>>> settings-basic-page >>>> settings-appearance-page >>>> #pages > div > settings-toggle-button:nth-of-type(1) >>>> #control'),
            targetPage.locator(':scope >>> settings-appearance-page >>>> :scope >>> #pages > div > settings-toggle-button:nth-of-type(1) >>>> :scope >>> #control')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 9.671875,
                y: 13.9375,
              },
            });
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://settings/', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('::-p-aria(Show home button)'),
            targetPage.locator('settings-ui >>>> #main >>>> settings-basic-page >>>> settings-appearance-page >>>> #pages > div > settings-toggle-button:nth-of-type(1) >>>> #control'),
            targetPage.locator(':scope >>> settings-appearance-page >>>> :scope >>> #pages > div > settings-toggle-button:nth-of-type(1) >>>> :scope >>> #control')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 11.421875,
                y: 13.9375,
              },
            });
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://settings/', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('::-p-aria(Show home button)'),
            targetPage.locator('settings-ui >>>> #main >>>> settings-basic-page >>>> settings-appearance-page >>>> #pages > div > settings-toggle-button:nth-of-type(1) >>>> #control'),
            targetPage.locator(':scope >>> settings-appearance-page >>>> :scope >>> #pages > div > settings-toggle-button:nth-of-type(1) >>>> :scope >>> #control')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 9.671875,
                y: 13.9375,
              },
            });
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://settings/', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('::-p-aria(Show home button)'),
            targetPage.locator('settings-ui >>>> #main >>>> settings-basic-page >>>> settings-appearance-page >>>> #pages > div > settings-toggle-button:nth-of-type(1) >>>> #control'),
            targetPage.locator(':scope >>> settings-appearance-page >>>> :scope >>> #pages > div > settings-toggle-button:nth-of-type(1) >>>> :scope >>> #control')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 13.421875,
                y: 13.9375,
              },
            });
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'chrome://settings/', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('settings-ui >>>> #main >>>> settings-basic-page >>>> settings-appearance-page >>>> #customizeToolbar >>>> #icon >>>> #icon'),
            targetPage.locator(':scope >>> #customizeToolbar >>>> :scope >>> #icon >>>> :scope >>> #icon')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 26.609375,
                y: 18.953125,
              },
            });
    }
    {
        const targetPage = page;
        await targetPage.goto('chrome://new-tab-page/');
    }
    {
        const targetPage = page;
        await targetPage.goto('https://www.google.com/search?q=chrome+custom+toolbar&oq=chrome+custom+tool&gs_lcrp=EgZjaHJvbWUqBwgAEAAYgAQyBwgAEAAYgAQyBggBEEUYOTIICAIQABgWGB4yCAgDEAAYFhgeMggIBBAAGBYYHjIICAUQABgWGB4yCAgGEAAYFhgeMggIBxAAGBYYHjIICAgQABgWGB4yCggJEAAYChgWGB7SAQg0NzI2ajBqN6gCALACAA&sourceid=chrome&ie=UTF-8');
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'https://www.google.com/search?q=chrome+custom+toolbar&oq=chrome+custom+tool&gs_lcrp=EgZjaHJvbWUqBwgAEAAYgAQyBwgAEAAYgAQyBggBEEUYOTIICAIQABgWGB4yCAgDEAAYFhgeMggIBBAAGBYYHjIICAUQABgWGB4yCAgGEAAYFhgeMggIBxAAGBYYHjIICAgQABgWGB4yCggJEAAYChgWGB7SAQg0NzI2ajBqN6gCALACAA&sourceid=chrome&ie=UTF-8', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        const promises = [];
        const startWaitingForEvents = () => {
            promises.push(targetPage.waitForNavigation());
        }
        await puppeteer.Locator.race([
            targetPage.locator('::-p-aria(How to make a toolbar in Google Chrome?)'),
            targetPage.locator('div:nth-of-type(6) h3'),
            targetPage.locator('::-p-xpath(//*[@id=\\"rso\\"]/div[6]/div/div/div/div[1]/div/div/span/a/h3)'),
            targetPage.locator(':scope >>> div:nth-of-type(6) h3'),
            targetPage.locator('::-p-text(How to make a)')
        ])
            .setTimeout(timeout)
            .on('action', () => startWaitingForEvents())
            .click({
              offset: {
                x: 330,
                y: 24.546875,
              },
            });
        await Promise.all(promises);
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'https://stackoverflow.com/questions/6681697/how-to-make-a-toolbar-in-google-chrome', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('::-p-aria(The chrome.infobars API) >>>> ::-p-aria([role=\\"code\\"])'),
            targetPage.locator('h1:nth-of-type(1) > code'),
            targetPage.locator('::-p-xpath(//*[@id=\\"answer-17279590\\"]/div/div[2]/div[1]/h1[1]/code)'),
            targetPage.locator(':scope >>> h1:nth-of-type(1) > code')
        ])
            .setTimeout(timeout)
            .click({
              count: 2,
              offset: {
                x: 84.203125,
                y: 19.46875,
              },
            });
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'https://stackoverflow.com/questions/6681697/how-to-make-a-toolbar-in-google-chrome', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('::-p-aria(The chrome.infobars API) >>>> ::-p-aria([role=\\"code\\"])'),
            targetPage.locator('h1:nth-of-type(1) > code'),
            targetPage.locator('::-p-xpath(//*[@id=\\"answer-17279590\\"]/div/div[2]/div[1]/h1[1]/code)'),
            targetPage.locator(':scope >>> h1:nth-of-type(1) > code')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 93.203125,
                y: 20.46875,
              },
            });
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'https://stackoverflow.com/questions/6681697/how-to-make-a-toolbar-in-google-chrome', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('::-p-aria(The chrome.infobars API) >>>> ::-p-aria([role=\\"code\\"])'),
            targetPage.locator('h1:nth-of-type(1) > code'),
            targetPage.locator('::-p-xpath(//*[@id=\\"answer-17279590\\"]/div/div[2]/div[1]/h1[1]/code)'),
            targetPage.locator(':scope >>> h1:nth-of-type(1) > code')
        ])
            .setTimeout(timeout)
            .click({
              count: 2,
              offset: {
                x: 99.203125,
                y: 20.46875,
              },
            });
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'https://stackoverflow.com/questions/6681697/how-to-make-a-toolbar-in-google-chrome', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('::-p-aria(The chrome.infobars API) >>>> ::-p-aria([role=\\"code\\"])'),
            targetPage.locator('h1:nth-of-type(1) > code'),
            targetPage.locator('::-p-xpath(//*[@id=\\"answer-17279590\\"]/div/div[2]/div[1]/h1[1]/code)'),
            targetPage.locator(':scope >>> h1:nth-of-type(1) > code')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 176.203125,
                y: 18.46875,
              },
            });
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'https://stackoverflow.com/questions/6681697/how-to-make-a-toolbar-in-google-chrome', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('::-p-aria(The chrome.infobars API) >>>> ::-p-aria([role=\\"code\\"])'),
            targetPage.locator('h1:nth-of-type(1) > code'),
            targetPage.locator('::-p-xpath(//*[@id=\\"answer-17279590\\"]/div/div[2]/div[1]/h1[1]/code)'),
            targetPage.locator(':scope >>> h1:nth-of-type(1) > code')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 169.203125,
                y: 23.46875,
              },
            });
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'https://stackoverflow.com/questions/6681697/how-to-make-a-toolbar-in-google-chrome', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        await puppeteer.Locator.race([
            targetPage.locator('::-p-aria(http://crossrider.com/download/chrome/35180)'),
            targetPage.locator('#answer-17287530 li:nth-of-type(3) > a'),
            targetPage.locator('::-p-xpath(//*[@id=\\"answer-17287530\\"]/div/div[2]/div[1]/ul/li[3]/a)'),
            targetPage.locator(':scope >>> #answer-17287530 li:nth-of-type(3) > a'),
            targetPage.locator('::-p-text(http://crossrider.com/download/chrome/35180)')
        ])
            .setTimeout(timeout)
            .click({
              offset: {
                x: 116.03125,
                y: 8.953125,
              },
            });
    }
    {
        const targetPage = page;
        await targetPage.goto('https://www.google.com/search?q=chrome+custom+toolbar&oq=chrome+custom+tool&gs_lcrp=EgZjaHJvbWUqBwgAEAAYgAQyBwgAEAAYgAQyBggBEEUYOTIICAIQABgWGB4yCAgDEAAYFhgeMggIBBAAGBYYHjIICAUQABgWGB4yCAgGEAAYFhgeMggIBxAAGBYYHjIICAgQABgWGB4yCggJEAAYChgWGB7SAQg0NzI2ajBqN6gCALACAA&sourceid=chrome&ie=UTF-8');
    }
    {
        const target = await browser.waitForTarget(t => t.url() === 'https://www.google.com/search?q=chrome+custom+toolbar&oq=chrome+custom+tool&gs_lcrp=EgZjaHJvbWUqBwgAEAAYgAQyBwgAEAAYgAQyBggBEEUYOTIICAIQABgWGB4yCAgDEAAYFhgeMggIBBAAGBYYHjIICAUQABgWGB4yCAgGEAAYFhgeMggIBxAAGBYYHjIICAgQABgWGB4yCggJEAAYChgWGB7SAQg0NzI2ajBqN6gCALACAA&sourceid=chrome&ie=UTF-8', { timeout });
        const targetPage = await target.page();
        targetPage.setDefaultTimeout(timeout);
        const promises = [];
        const startWaitingForEvents = () => {
            promises.push(targetPage.waitForNavigation());
        }
        await puppeteer.Locator.race([
            targetPage.locator("::-p-aria(Chrome\\'s Customisable Toolbar Just Made My Life Easier)"),
            targetPage.locator('div:nth-of-type(7) h3'),
            targetPage.locator('::-p-xpath(//*[@id=\\"rso\\"]/div[7]/div/div/div/div[1]/div/div/span/a/h3)'),
            targetPage.locator(':scope >>> div:nth-of-type(7) h3')
        ])
            .setTimeout(timeout)
            .on('action', () => startWaitingForEvents())
            .click({
              offset: {
                x: 163,
                y: 21.6875,
              },
            });
        await Promise.all(promises);
    }

    await browser.close();

})().catch(err => {
    console.error(err);
    process.exit(1);
});
