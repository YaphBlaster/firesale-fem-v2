const fs = require("fs");
const isDev = require("electron-is-dev");
const { app, BrowserWindow, dialog, Menu } = require("electron");

// set this in the upper scope to avoid garbage collection until the program is exited
let mainWindow = null;

// when the app loads
app.on("ready", () => {
  // set the main window to a new instance of a Browser Window with the default show value of false
  mainWindow = new BrowserWindow({ show: false });

  Menu.setApplicationMenu(applicationMenu);

  // load up the index.html file
  mainWindow.loadFile(`${__dirname}/index.html`);

  isDev && mainWindow.webContents.openDevTools({ mode: "detach" });

  // once the mainWindow is ready to show set the mainWindow property (avoids loading flash)
  mainWindow.once("ready-to-show", () => mainWindow.show());
});

exports.getFileFromUser = () => {
  const files = dialog.showOpenDialog(mainWindow, {
    properties: ["openFile"],
    buttonLabel: "Unveil",
    title: "Title Window",
    filters: [
      {
        extensions: ["txt", "text"],
        name: "Text Files",
      },
      {
        extensions: ["md", "mdown", "markdown"],
        name: "Markdown Files",
      },
    ],
  });

  if (!files) return;

  const file = files[0];
  openFile(file);
};

exports.saveMarkdown = (filePath, content) => {
  if (!filePath) {
    filePath = dialog.showSaveDialog(mainWindow, {
      title: "Save Markdown",
      defaultPath: app.getPath("desktop"),
      filters: [
        { name: "Text Files", extensions: ["txt"] },
        { name: "Markdown Files", extensions: ["md", "markdown", "mdown"] },
      ],
    });
  }

  if (!filePath) return;
  fs.writeFileSync(filePath, content);
  openFile(filePath);
};

exports.saveHtml = (htmlContent) => {
  const filePath = dialog.showSaveDialog(mainWindow, {
    title: "Save HTML",
    defaultPath: app.getPath("desktop"),
    filters: [{ name: "HTML Files", extensions: ["html"] }],
  });

  if (!filePath) return;
  fs.writeFileSync(filePath, htmlContent);
};

const openFile = (exports.openFile = (file) => {
  const content = fs.readFileSync(file).toString();
  app.addRecentDocument(file);
  // send out a custom file-opened message
  mainWindow.webContents.send("file-opened", file, content);
});

const template = [
  {
    label: "File",
    submenu: [
      {
        label: "Open File",
        accelerator: "CommandOrControl+O",
        click() {
          exports.getFileFromUser();
        },
      },
      {
        label: "Save File",
        accelerator: "CommandOrControl+S",
        click() {
          mainWindow.webContents.send("save-markdown");
        },
      },
      {
        label: "Save HTML",
        accelerator: "CommandOrControl+Shift+S",
        click() {
          mainWindow.webContents.send("save-html");
        },
      },
      {
        label: "Copy",
        role: "copy",
      },
    ],
  },
];

if (process.platform === "darwin") {
  const applicationName = "Fire Sale";
  template.unshift({
    label: applicationName,
    submenu: [
      {
        label: `About ${applicationName}`,
        role: "about",
      },
      {
        label: `Quit ${applicationName}`,
        role: "quit",
      },
    ],
  });
}

const applicationMenu = Menu.buildFromTemplate(template);
