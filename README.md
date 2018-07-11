# Exporter

A Sketch plugin that exports Sketch artboards into linked HTML files. 

The Expoerter was forked from Click-Thru-Prototype plugin (https://github.com/markhorgan/click-thru-prototype), but got several improvements and changes:
- Support for Sketch-native links
- Support for cross-page links
- Support for links inside Symbols


## Installation

To install, [download the zip file](https://github.com/markhorgan/click-thru-prototype/archive/master.zip) and double-click on `Click-Thru-Prototype.sketchplugin`. The commands will show up under `Plugins > Click-Thru Prototype`. To see it in action, open `demo.sketch` and then select `Plugins > Click-Thru Prototype > Export to HTML`.

## Usage

You can create links between artboards, add external links or show a JavaScript dialog. When you're finished adding these you can generate a HTML website of the current page by selecting `Export to HTML`. The generated files can then be uploaded to a server so you can show your client. 
 
### Responsive Design 
 
The plugin can handle responsive design, you just need to start your artboards with the same name e.g. `index`, `index tablet`, `index mobile`. When you change the width of your browser it will show a different artboard in the exported website. You can turn this feature off by unchecking `Responsive artboards` in Settings. You may need to update your artboard links after turning this setting on or off. 
 
<img src="https://cloud.githubusercontent.com/assets/1472553/23585670/f88e9c1c-017b-11e7-98c2-f8d70c6e58fa.png" alt="Responsive artboards">

### Mobile Menu

On mobile you will want to show a mobile menu rather than the normal horizontal menu. To do this you need to select which layer is the button that shows the menu by selecting `Set Mobile Menu Button`, and which layer is the mobile menu by selecting `Set Mobile Menu`.
 
<img src="https://cloud.githubusercontent.com/assets/1472553/23585671/fa923e74-017b-11e7-8f79-a242df8cd12e.png" alt="Mobile menu">

### Retina Images
 
By default it will show 2x images for high pixel density screens. To turn this off uncheck `Export retina images` in Settings and re-export the page.