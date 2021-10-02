Color Me Error
==============

This extension will color any occurrences of TODO and FIXME (configurable) as
errors when found in text. Word will be highlighted only when found with
non-letter character on each side.

Extension will parse only visible text and thus should be fast even on large
or remote files.

![Screenshot](https://raw.githubusercontent.com/medo64/color-me-error/main/images/screenshot.png)


## Extension Settings

This extension contributes the following settings:

* `colorMeError.words`: Comma-separated list of words that will be colored as
                        error.


### Default Configuration

    "colorMeError.words": "TODO, FIXME",


## Known Issues

### Not Coloring For Large Files

For performance reasons Visual Studio Code doesn't synchronize files that are
over 5MB in size (see [issue 27100](https://github.com/Microsoft/vscode/issues/27100)).
Therefore, no coloring will be visible on large files. To avoid this you can
set `editor.largeFileOptimizations` to `false`.
