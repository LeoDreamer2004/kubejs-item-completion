const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

function jumpToFile(path) {
	vscode.workspace.openTextDocument(path).then(document =>
		vscode.window.showTextDocument(document));
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Find the vocabulary file
	const vocabularyFilePath = path.join(context.extensionPath, 'resources', 'vocabulary.json');
	const editVocabularyCommand = vscode.commands.registerCommand('kubejs-item-completion.editVocabulary', () => {
		if (fs.existsSync(vocabularyFilePath)) {
			jumpToFile(vocabularyFilePath);
		} else {
			vscode.window.showWarningMessage('Vocabulary file is missing. Create a new one?', 'Yes').then(choice => {
				if (choice === 'Yes') {
					fs.writeFileSync(vocabularyFilePath, '{}');
					jumpToFile(vocabularyFilePath);
				}
			});
		}
	});
	context.subscriptions.push(editVocabularyCommand);

	let vocabulary = {};
	try {
		vocabulary = JSON.parse(fs.readFileSync(vocabularyFilePath, 'utf8'));
	} catch (error) {
		vscode.window.showErrorMessage('Failed to read or parse the Minecraft vocabulary file. Edit it?', 'Yes').then(choice => {
			if (choice === 'Yes') {
				fs.writeFileSync(vocabularyFilePath, '{}');
				jumpToFile(vocabularyFilePath);
			}
		});
		console.error(error);
		return;
	}

	// Register the completion providers
	const provider = vscode.languages.registerCompletionItemProvider('javascript', {
		provideCompletionItems(document, position) {
			const lineText = document.lineAt(position).text;
			const linePrefix = lineText.substr(0, position.character);
			const ret = [];
			for (let type in vocabulary) {
				let map = vocabulary[type];
				for (let namespace in map) {
					if (linePrefix.endsWith(namespace + ':')) {
						// If the line ends with "#minecraft:", skip "minecraft:" completions
						if (!namespace.startsWith("#") && linePrefix.endsWith("#" + namespace + ':')) 
							continue;
						let candidates = map[namespace].map(id => {
							const completion = new vscode.CompletionItem(namespace + ':' + id, vscode.CompletionItemKind.Text);
							completion.insertText = id;
							completion.detail = type;
							return completion;
						});
						ret.push(...candidates);
						break;
					}
				}
			}
			return ret;
		}
	}, ':'); // Completion trigger character
	context.subscriptions.push(provider);
}

function deactivate() { }

module.exports = {
	activate,
	deactivate
};
