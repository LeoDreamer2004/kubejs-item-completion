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

	// Read the vocabulary file
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
		return;
	}

	// Register the completion providers
	const provider = vscode.languages.registerCompletionItemProvider('javascript', {
		provideCompletionItems() {
			const ret = [];
			for (let type in vocabulary) {
				let map = vocabulary[type];
				for (let namespace in map) {
					// If the line ends with "#minecraft:", skip "minecraft:" completions
					let candidates = map[namespace].map(id => {
						const completion = new vscode.CompletionItem(namespace + ':' + id, vscode.CompletionItemKind.Text);
						completion.detail = type;
						return completion;
					});
					ret.push(...candidates);
				}
			}
			return ret;
		}
	}, '\"'); // Completion trigger character
	context.subscriptions.push(provider);
}

function deactivate() { }

module.exports = {
	activate,
	deactivate
};
