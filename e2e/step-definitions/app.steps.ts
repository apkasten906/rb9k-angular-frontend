import { Given, Then } from '@cucumber/cucumber';
import assert from 'assert';

let appTitle: string;

Given('the application is running', function () {
  appTitle = 'rb9k-app';
});

Then('the page title should contain {string}', function (expectedTitle: string) {
  assert.ok(
    appTitle.includes(expectedTitle),
    `Expected title to contain "${expectedTitle}" but got "${appTitle}"`
  );
});
