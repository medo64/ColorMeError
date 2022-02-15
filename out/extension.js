'use strict'

const vscode = require('vscode')


/** @param {vscode.ExtensionContext} context */
function activate(context) {
    // @ts-ignore
    const isDebug = (context.extensionMode === 2)

    // default values
    const defaultWords = [ "TODO", "FIXME" ]

    // decorations
    var errorDecorationType

    // patterns
    const letterPattern = /\p{L}/u

    /**
     * @param {vscode.TextEditor} editor
     * @param {boolean} [configurationUpdate]
     * @param {readonly vscode.Range[]} [ranges]
     */
    function renderDocument(editor, configurationUpdate = false, ranges) {
        if (isDebug) { console.debug(new Date().getTime() + ' renderDocument()') }
        if (!editor) { return }

        const document = editor.document
        if (!document) { return }

        const startTime = isDebug ? new Date().getTime() : null

        const [ words ] = getDocumentSettings(document)
        const shouldRender = words.length > 0;

        if (!errorDecorationType || configurationUpdate) {
            if (errorDecorationType != null) { errorDecorationType.dispose() }
            errorDecorationType = vscode.window.createTextEditorDecorationType({ color: new vscode.ThemeColor('errorForeground') })
            if (isDebug) { console.debug(new Date().getTime() + ' renderDocument() created new issue decoration type') }
        }

        var errorDecorations =[]

        if (shouldRender) {
            //determine what is exactly visible
            let visibleRanges = (ranges == null) ? editor.visibleRanges : ranges
            let startOffset = document.offsetAt(visibleRanges[0].start)
            let endOffset = document.offsetAt(visibleRanges[0].end)
            for(let i=1; i<visibleRanges.length; i++) {
                let nextStartOffset = document.offsetAt(visibleRanges[i].start)
                let nextEndOffset = document.offsetAt(visibleRanges[i].end)
                if (startOffset > nextStartOffset) { startOffset = nextStartOffset }
                if (endOffset < nextEndOffset) { endOffset = nextEndOffset }
            }

            let startPosition = document.positionAt(startOffset)
            let endPosition = document.positionAt(endOffset)

            let startLine = Number(document.lineAt(startPosition).lineNumber)
            let endLine = Number(document.validatePosition(endPosition.translate(2, 0)).line)
            if (startLine > 0) { startLine -= 1 } //in case of partial previous line

            for (let i=startLine; i<=endLine; i++) {
                const line = document.lineAt(i)
                const lineText = line.text.toLowerCase()
                const lineLength = lineText.length

                if ((lineLength > 0) && shouldRender) {
                    for (const word of words) {
                        var startsAt = lineText.indexOf(word);
                        while (startsAt >= 0) {
                            if (startsAt == -1) { continue; }

                            const endsAt = startsAt + word.length
                            var isStandalone = true;
                            if ((startsAt > 0) && (letterPattern.exec(lineText.substring(startsAt -1, startsAt)) !== null)) {  // ignore if character before the match is letter
                                isStandalone = false;
                            } else if ((endsAt < lineLength) && (letterPattern.exec(lineText.substring(endsAt, endsAt + 1)) !== null)) {  // ignore if character after the match is letter
                                isStandalone = false;
                            }

                            if (isStandalone) {
                                errorDecorations.push({
                                    range: new vscode.Range(
                                        new vscode.Position(i, startsAt),
                                        new vscode.Position(i, endsAt),
                                    )
                                })
                            }

                            startsAt = lineText.indexOf(word, startsAt + 1);
                        }
                    }
                }
            }
        }

        if (isDebug) { console.debug(new Date().getTime() + ' renderDocument() ready for decorating in ' + (new Date().getTime() - startTime) + ' ms') }

        if (editor.setDecorations) { editor.setDecorations(errorDecorationType, errorDecorations) }

        if (isDebug) { console.debug(new Date().getTime() + ' renderDocument() finished in ' + (new Date().getTime() - startTime) + ' ms') }
    }


    function getDocumentSettings(document) {
        let customConfiguration = vscode.workspace.getConfiguration('colorMeError', null)
        let words = (customConfiguration != null) ? customConfiguration.get('words', defaultWords) || defaultWords : defaultWords

        const languageId = document.languageId
        if (languageId) {
            const languageSpecificConfiguration = vscode.workspace.getConfiguration('[' + languageId + ']', null)
            if (languageSpecificConfiguration !== null) {

                const specificWords = languageSpecificConfiguration['colorMeError.words']
                if (specificWords) { words = specificWords }
            }
        }

        let wordArray = words.map(text => text.trim().toLowerCase()).filter(text => text != null)
        return [ wordArray ]
    }


    renderDocument(vscode.window.activeTextEditor)


    /** @param e: vscode.TextEditorSelectionChangeEvent */
    vscode.window.onDidChangeActiveTextEditor((e) => {
        if (isDebug) { console.debug(new Date().getTime() + ' onDidChangeActiveTextEditor()') }
        renderDocument(e)
    }, null, context.subscriptions)

    /** @param e: vscode.TextEditorVisibleRangesChangeEvent */
    vscode.window.onDidChangeTextEditorVisibleRanges((e) => {
        if (isDebug) { console.debug(new Date().getTime() + ' onDidChangeTextEditorVisibleRanges()') }
        if ((e.textEditor != null) && (e.textEditor.document != null) && (e.visibleRanges.length > 0)) {
            renderDocument(e.textEditor, false, e.visibleRanges)
        }
    }, null, context.subscriptions)

    /** @param e: vscode.TextEditor[] */
    vscode.window.onDidChangeVisibleTextEditors((e) => {
        if (isDebug) { console.debug(new Date().getTime() + ' onDidChangeVisibleTextEditors()') }
        e.forEach(editor => {
            renderDocument(editor)
        })
    }, null, context.subscriptions)

    /** @param {vscode.TextDocumentChangeEvent} e */
    vscode.workspace.onDidChangeTextDocument((e) => {
        if (isDebug) {console.debug(new Date().getTime() + ' onDidChangeTextDocument(' + (e.contentChanges.length > 0 ? 'contentChanges' : '') + ')') }
        if (e.contentChanges.length > 0) {
            renderDocument(vscode.window.activeTextEditor)
        }
    }, null, context.subscriptions)

    vscode.workspace.onDidChangeConfiguration(() => {
        if (isDebug) { console.debug(new Date().getTime() + ' onDidChangeConfiguration()') }
        renderDocument(vscode.window.activeTextEditor, true)
    }, null, context.subscriptions)
}
exports.activate = activate


function deactivate() {
}
exports.deactivate = deactivate
