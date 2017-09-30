import { NgTestAppPage } from './app.po';

describe('ng-test-app App', () => {
  let page: NgTestAppPage;

  beforeEach(() => {
    page = new NgTestAppPage();
  });

  it('should display welcome message', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('Welcome to app!!');
  });
});
