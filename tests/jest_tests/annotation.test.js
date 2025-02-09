

import '@testing-library/jest-dom';


import { highlightSelectedText } from '../../scripts/annotation';

test('highlightSelectedText function highlights selected test', () => {

    document.body.innerHTML = `
    <div id="test-container">
        <p id="test-paragraph">This is text to highlight.</p>
    </div>
    `;

    const paragraph = document.getElementById('test-paragraph');
    const range = document.createRange();
    const selection = window.getSelection();

    range.selectNodeContents(paragraph);
    selection.removeAllRanges();
    selection.addRange(range);

    highlightSelectedText('yellow');

    const span = paragraph.querySelector('span');
    expect(span).toHaveStyle('background-color: yellow');
    expect(span.textContent).toBe('This is text to highlight.');
    
});





