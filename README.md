# VOIS Test Data Extension

This Chrome extension provides tools for managing test data, including a notes management system with a rich text editor.

## Features

- Notes Manager with tabs on the left side
- Rich text editing using Tiptap editor
- Save and organize notes across multiple tabs

## Development

### Setup

```bash
# Install dependencies
npm install

# Build the Tiptap editor bundle
npm run build

# Watch for changes during development
npm run watch
```

### Tiptap Editor

The Notes Manager uses the [Tiptap](https://tiptap.dev/) editor, a headless rich text editor for Vue.js. We've integrated it directly with our Chrome extension using npm packages and webpack.

#### Included Extensions

- StarterKit (includes basic formatting options)
- Placeholder
- Link
- Image
- TextAlign
- Underline
- TextStyle
- Color
- Highlight

#### Updating the Editor

To modify the Tiptap editor:

1. Edit `src/utils/tiptap/npm-tiptap-editor.js` to change editor functionality
2. Edit `src/utils/tiptap/npm-tiptap-editor.css` to change editor styling
3. Run `npm run build` to create the updated bundle

### Project Structure

- `src/features/utilityButtons/notesManager/` - Notes Manager feature
- `src/utils/tiptap/` - Tiptap editor integration
- `dist/` - Bundled JavaScript files

## License

ISC 