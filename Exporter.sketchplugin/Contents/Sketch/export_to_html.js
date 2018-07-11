@import "utils.js";
@import "exporter.js";

function saveFileDialog() {
  const openPanel = NSOpenPanel.openPanel();
  openPanel.setTitle("Chooce a location...");
  openPanel.setPrompt("Export");
  openPanel.setCanChooseDirectories(true);
  openPanel.setCanChooseFiles(false);
  openPanel.setAllowsMultipleSelection(false);
  openPanel.setShowsHiddenFiles(false);
  openPanel.setExtensionHidden(false);
  const buttonPressed = openPanel.runModal();
  if (buttonPressed == NSFileHandlingPanelOKButton) {
    return openPanel.URL();
  }
  return null;
}

var onRun = function(context) {
  const doc = context.document;
  var UI = require('sketch/ui')

  if (doc.currentPage().artboards().count() === 0) {
    UI.alert("There are no artboards to export.");
    return;
  }


  const fileURL = saveFileDialog();
  if (fileURL == null) {
    return;
  }

  const exporter = new Exporter(fileURL.path(), doc, doc.currentPage(), context);
  exporter.exportArtboards();
};

