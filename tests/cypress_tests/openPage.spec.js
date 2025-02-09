// cypress/plugins/index.js

const path = require('path');

module.exports = (on, config) => {
    // Modify the browser launch options
    on('before:browser:launch', (browser = {}, launchOptions) => {
        if (browser.name === 'chrome' && browser.isHeadless === false) {
            // Path to your unpacked extension
            const extensionPath = path.resolve(__dirname, "C:/Users/snf8ez/workspace/Student_extension");

            launchOptions.args.push(`--load-extension=${extensionPath}`);
            launchOptions.args.push(`--disable-extensions-except=${extensionPath}`);

            return launchOptions;
        }
    });
}

// cypress/integration/open_wikipedia_and_interact_spec.js

describe('Open Wikipedia Hamburger Page and Simulate Key Press', () => {
    it('should open the Wikipedia page and perform text selection and key press', () => {
        // Visit the Wikipedia page with the specified link
        cy.visit('https://en.wikipedia.org/wiki/Hamburger#:~:text=Fletcher%20Davis%20of%20Athens%2C%20Texas,a%20pickle%20on%20the%20side.');

        // Verify that the page has loaded by checking the title
        cy.title().should('include', 'Hamburger - Wikipedia');

        // Verify specific content on the page to ensure it loaded correctly
        cy.contains('History of the hamburger').should('be.visible');

        // Select text from the page
        cy.get('p') // Example: target the first paragraph tag
          .contains('Fletcher Davis') // Ensure this contains the specific text snippet
          .then(($el) => {
              const el = $el[0];
              const document = el.ownerDocument;
              const range = document.createRange();
              range.selectNodeContents(el);

              const selection = document.getSelection();
              selection.removeAllRanges();
              selection.addRange(range);
          });

        // Simulate pressing Ctrl + Shift + H
        cy.get('body').type('{ctrl}{shift}h'); // Simulate the keyboard shortcut

        // Optionally, add assertions to verify expected behavior after the shortcut
        // Example: Check if an extension element is visible or if some change occurred
        // cy.get('#extension-result-element').should('be.visible'); // Modify with actual selectors
    });
});
