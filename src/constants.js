export const ActionType = {
    COMMENT: "comment",
    HIGHLIGHT: "highlight",
    TEXTSTYLE: "textstyle",
    CLEAR: "clear",
    LOAD_MARKUP: "load_markup",
    SUMMARIZE: "summarize", 
    GENERATE: "generate"
}

export const MessageKeys = {
    KEY_COMMAND: 'cmd_shortcut', 
    ANNOTATION: 'annotate',
    MARKUP_MESSAGE: 'markup_message',
    SAVE_ANNOTATION: 'save_annotation', 
    GENERATE: 'generate_infographic',
    GET_MARKUP_KEY: 'get_markup_key',
    MARKUP_KEY_RESPONSE: 'markup_response',
    UPDATE_COMMENT_TEXT: 'update_comment_text'
}

export const TextstyleType = {
    BOLD: "bold",
    UNDERLINE: "underline",
    ITALIC: "italic"
}

export const HighlightColors = {
    YELLOW: `#fcf766`,
    BLUE: `#66fcf3`,
    GREEN: `#60da57`,
    RED: `#E55A5A`,
    COMMENT_COLOR: `#FdF8C6`,
    DEFAULT: `#fcf766`,
    TRANSPARENT: '#FFFFFF'
}

export const IdPreamble = {
    COMMENT: "comment_",
    HIGHLIGHT: "highlight_",
    TEXTSTYLE: "textstyle_"
}

export const CommandShortcuts = {
    HIGHLIGHT: "Ctrl+Shift+H",
    BOLD: "Ctrl+Shift+B",
    ITALIC: "Ctrl+I",
    UNDERLINE: "Ctrl+Shift+U"
}

const PreTitles = {
    HIGHLIGHT: "Highlight",
    BOLD: "Bold",
    ITALIC: "Italic",
    UNDERLINE: "Underline",
    COMMENT: "Comment",
    SUMMARIZE: "Summarize Text"
}

export const Titles = {
    HIGHLIGHT: PreTitles.HIGHLIGHT + " ".repeat(10) + CommandShortcuts.HIGHLIGHT,
    BOLD: PreTitles.BOLD + " ".repeat(31) + CommandShortcuts.BOLD,
    ITALIC: PreTitles.ITALIC + " ".repeat(31) +CommandShortcuts.ITALIC,
    UNDERLINE: PreTitles.UNDERLINE + " ".repeat(25) +CommandShortcuts.UNDERLINE,
    COMMENT: PreTitles.COMMENT + " ".repeat(15),
    SUMMARIZE: PreTitles.SUMMARIZE, 
    GENERATE: "Generate Infographic"
}

export const words = [
    "alpha", "bravo", "charlie", "delta", "echo", "foxtrot", "golf", "hotel", "india", "juliet",
    "kilo", "lima", "mike", "november", "oscar", "papa", "quebec", "romeo", "sierra", "tango",
    "uniform", "victor", "whiskey", "xray", "yankee", "zulu", "apple", "banana", "cherry", "date",
    "elderberry", "fig", "grape", "honeydew", "kiwi", "lemon", "mango", "nectarine", "orange", "papaya",
    "quince", "raspberry", "strawberry", "tangerine", "ugli", "vanilla", "watermelon", "xigua", "yam", "zucchini",
    "ant", "bee", "cat", "dog", "eel", "fox", "goat", "horse", "iguana", "jaguar",
    "kangaroo", "lion", "monkey", "newt", "owl", "penguin", "quail", "rabbit", "snake", "turtle",
    "urchin", "vulture", "wolf", "xerus", "yak", "zebra", "amber", "bronze", "crimson", "denim",
    "emerald", "fuchsia", "gold", "hazel", "indigo", "jade", "khaki", "lavender", "magenta", "navy",
    "ochre", "peach", "quartz", "rose", "silver", "teal", "umber", "violet", "white", "yellow"
  ];
  