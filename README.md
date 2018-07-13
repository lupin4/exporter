# Exporter

A Sketch plugin that exports Sketch artboards into linked HTML files. 

The Exporter was forked from [Click-Thru-Prototype](https://github.com/markhorgan/click-thru-prototype) plugin, but got several improvements and changes:
- Support for Sketch-native links
- Support for cross-page links
- Support for links inside Symbols


## Installation

To install, [download the zip file](https://github.com/MaxBazarov/exporter/raw/master/Exporter.sketchplugin.zip) and double-click on `Exporter.sketchplugin`. The commands will show up under `Plugins > Exporter`. To see it in action, open `demo.sketch` and then select `Plugins > Exporter > Export to HTML`.

## Usage

You can user Sketch-native links or add external links. When you're finished adding these you can generate a HTML website of the current page by selecting `Export to HTML`. The generated files can then be uploaded to a server so you can show it to your clients. 

### Retina Images
 
By default it will show 2x images for high pixel density screens. To turn this off uncheck `Export retina images` in Settings and re-export the page.