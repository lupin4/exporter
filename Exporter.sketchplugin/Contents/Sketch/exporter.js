@import "constants.js";
@import "utils.js";
@import "resizing_constraint.js";
@import "resizing_type.js";


var getArtboardGroupsInPage = function(page, context, includeNone = true) {
  const artboardsSrc = page.artboards();
  const artboards = [];

  artboardsSrc.forEach(function(artboard){
      if( !artboard.isKindOfClass(MSSymbolMaster)){
        artboards.push(artboard);
      }
  });

  return Utils.getArtboardGroups(artboards, context);  
}

class Exporter {

  constructor(selectedPath, doc, page, context) {    
    this.doc = doc;
    this.page = page;
    this.context = context;
    this.prepareOutputFolder(selectedPath);
    this.retinaImages = Utils.valueForKeyOnDocument(Constants.RETINA_IMAGES, context, 1) === 1;
    this.jsStory = '';

    this.Settings = require('sketch/settings')

  }


  prepareFilePath(filePath,fileName)
  {
    const fileManager = NSFileManager.defaultManager();
    const targetPath = filePath + '/'+fileName;

    let error = MOPointer.alloc().init();
    if (!fileManager.fileExistsAtPath(filePath)) {
      if (!fileManager.createDirectoryAtPath_withIntermediateDirectories_attributes_error(filePath, false, null, error)) {
        log(error.value().localizedDescription());
      }
    }

    error = MOPointer.alloc().init();
    if (fileManager.fileExistsAtPath(targetPath)) {
      if (!fileManager.removeItemAtPath_error(targetPath, error)) {
        log(error.value().localizedDescription());
      }
    }
    return targetPath;
  }


  copyResources() {    
    const fileManager = NSFileManager.defaultManager();
    const resFolder = "resources";    
    const targetPath = this.prepareFilePath(this._outputPath,resFolder);
    
    const sourcePath = this.context.plugin.url().URLByAppendingPathComponent("Contents").URLByAppendingPathComponent("Sketch").URLByAppendingPathComponent("Resources").path();
    let error = MOPointer.alloc().init();
    if (!fileManager.copyItemAtPath_toPath_error(sourcePath, targetPath, error)) {
      log(error.value().localizedDescription());
    }
  }


  getAbsoluteRect(layer, parentAbsoluteRect, indent) {
    //log("getAbsoluteRect()");
    let x, y, returnRect;
    if (layer.isKindOfClass(MSArtboardGroup)) {
      if (parentAbsoluteRect != null) {
        // symbol artboard
        returnRect = parentAbsoluteRect;
      } else {
        // root artboard
        returnRect = NSMakeRect(0, 0, layer.absoluteRect().width(), layer.absoluteRect().height());
      }
    } else if (parentAbsoluteRect != null) {
      const parentLayer = layer.parentForInsertingLayers();
      if (layer.resizingConstraint !== undefined) {
        // Sketch >= 44
        returnRect = NSMakeRect(parentAbsoluteRect.origin.x + layer.frame().x(), parentAbsoluteRect.origin.y + layer.frame().y(), layer.frame().width(), layer.frame().height());
        if (parentLayer.frame().width() !== parentAbsoluteRect.size.width && parentLayer.frame().height() !== parentAbsoluteRect.size.height) {
          const resizingConstraint = 63 ^ layer.resizingConstraint();
          const frame = layer.frame();
          const parentFrame = parentLayer.frame();

          if ((resizingConstraint & ResizingConstraint.LEFT) === ResizingConstraint.LEFT) {
            if ((resizingConstraint & ResizingConstraint.RIGHT) === ResizingConstraint.RIGHT) {
              const rightDistance = parentFrame.width() - frame.x() - frame.width();
              const width = parentAbsoluteRect.size.width - frame.x() - rightDistance;
              returnRect.size.width = width < 1 ? 1 : width;
            } else if ((resizingConstraint & ResizingConstraint.WIDTH) !== ResizingConstraint.WIDTH) {
              returnRect.size.width = (frame.width() / (parentFrame.width() - frame.x())) * (parentAbsoluteRect.size.width - frame.x());
            }
          } else if ((resizingConstraint & ResizingConstraint.RIGHT) === ResizingConstraint.RIGHT) {
            if ((resizingConstraint & ResizingConstraint.WIDTH) === ResizingConstraint.WIDTH) {
              returnRect.origin.x = parentAbsoluteRect.origin.x + (parentAbsoluteRect.size.width - (parentFrame.width() - (frame.x() + frame.width())) - frame.width());
            } else {
              const rightDistance = parentFrame.width() - frame.x() - frame.width();
              returnRect.size.width = (frame.width() / (parentFrame.width() - rightDistance)) * (parentAbsoluteRect.size.width - rightDistance);
              returnRect.origin.x = parentAbsoluteRect.origin.x + (parentAbsoluteRect.size.width - (parentFrame.width() - (frame.x() + frame.width())) - returnRect.size.width);
            }
          } else {
            if ((resizingConstraint & ResizingConstraint.WIDTH) === ResizingConstraint.WIDTH) {
              returnRect.origin.x = parentAbsoluteRect.origin.x + ((((frame.x() + frame.width() / 2.0) / parentFrame.width()) * parentAbsoluteRect.size.width) - (frame.width() / 2.0));
            } else {
              returnRect.origin.x = parentAbsoluteRect.origin.x + ((frame.x() / parentFrame.width()) * parentAbsoluteRect.size.width);
              returnRect.size.width = (frame.width() / parentFrame.width()) * parentAbsoluteRect.size.width;
            }
          }

          if ((resizingConstraint & ResizingConstraint.TOP) === ResizingConstraint.TOP) {
            if ((resizingConstraint & ResizingConstraint.BOTTOM) === ResizingConstraint.BOTTOM) {
              const bottomDistance = parentAbsoluteRect.size.height - frame.y() - frame.height();
              const height = parentAbsoluteRect.size.height - frame.y() - bottomDistance;
              returnRect.size.height = height < 1 ? 1 : height;
            } else if ((resizingConstraint & ResizingConstraint.HEIGHT) !== ResizingConstraint.HEIGHT) {
              returnRect.size.height = (frame.height() / (parentFrame.height() - frame.y())) * (parentAbsoluteRect.size.height - frame.y());
            }
          } else if ((resizingConstraint & ResizingConstraint.BOTTOM) === ResizingConstraint.BOTTOM) {
            if ((resizingConstraint & ResizingConstraint.HEIGHT) === ResizingConstraint.HEIGHT) {
              returnRect.origin.y = parentAbsoluteRect.origin.y + (parentAbsoluteRect.size.height - (parentFrame.height() - (frame.y() + frame.height())) - frame.height());
            } else {
              const bottomDistance = parentAbsoluteRect.size.height - frame.y() - frame.height();
              returnRect.size.height = (frame.height() / (parentFrame.height() - bottomDistance)) * (parentAbsoluteRect.size.height - bottomDistance);
              returnRect.origin.y = parentAbsoluteRect.origin.y + (parentAbsoluteRect.size.height - (parentFrame.height() - (frame.y() + frame.height())) - returnRect.size.height);
            }
          } else {
            if ((resizingConstraint & ResizingConstraint.HEIGHT) === ResizingConstraint.HEIGHT) {
              returnRect.origin.y = parentAbsoluteRect.origin.y + ((((frame.y() + frame.height() / 2.0) / parentFrame.height()) * parentAbsoluteRect.size.height) - (frame.height() / 2.0));
            } else {
              returnRect.origin.y = parentAbsoluteRect.origin.y + ((frame.y() / parentFrame.height()) * parentAbsoluteRect.size.height);
              returnRect.size.height = (frame.height() / parentFrame.height()) * parentAbsoluteRect.size.height;
            }
          }
        }
      } else if (layer.resizingType !== undefined) {
        // Sketch < 44
        let horzScale, vertScale, width, height, leftDistance, rightDistance, topDistance, bottomDistance, unscaledLeftoverHorzSpace, unscaledLeftoverVertSpace;
        let leftSpaceFraction, rightSpaceFraction, topSpaceFraction, bottomSpaceFraction, leftoverHorzSpace, leftoverVertSpace;
        switch (layer.resizingType()) {
          case ResizingType.STRETCH:
            horzScale = parentAbsoluteRect.size.width / parentLayer.frame().width();
            vertScale = parentAbsoluteRect.size.height / parentLayer.frame().height();
            x = parentAbsoluteRect.origin.x + (layer.frame().x() * horzScale);
            y = parentAbsoluteRect.origin.y + (layer.frame().y() * vertScale);
            width = layer.frame().width() * horzScale;
            height = layer.frame().height() * vertScale;
            returnRect = NSMakeRect(x, y, width, height);
            return returnRect;

          case ResizingType.PIN_TO_CORNER:
            leftDistance = layer.frame().x();
            rightDistance = parentLayer.frame().width() - (layer.frame().x() + layer.frame().width());
            x = leftDistance < rightDistance ? parentAbsoluteRect.origin.x + leftDistance : (parentAbsoluteRect.origin.x +
                parentAbsoluteRect.size.width) - rightDistance - layer.frame().width();
            topDistance = layer.frame().y();
            bottomDistance = parentLayer.frame().height() - (layer.frame().y() + layer.frame().height());
            y = topDistance < bottomDistance ? parentAbsoluteRect.origin.y + topDistance : (parentAbsoluteRect.origin.y +
                parentAbsoluteRect.size.height) - bottomDistance - layer.frame().height();
            returnRect = NSMakeRect(x, y, layer.frame().width(), layer.frame().height());
            break;

          case ResizingType.RESIZE_OBJECT:
            rightDistance = parentLayer.frame().width() - (layer.frame().x() + layer.frame().width());
            bottomDistance = parentLayer.frame().height() - (layer.frame().y() + layer.frame().height());
            returnRect = NSMakeRect(parentAbsoluteRect.origin.x + layer.frame().x(), parentAbsoluteRect.origin.y + layer.frame().y(),
                parentAbsoluteRect.size.width - layer.frame().x() - rightDistance, parentAbsoluteRect.size.height - layer.frame().y() - bottomDistance);
            break;

          case ResizingType.FLOAT_IN_PLACE:
            unscaledLeftoverHorzSpace = parentLayer.frame().width() - layer.frame().width();
            leftSpaceFraction = layer.frame().x() / unscaledLeftoverHorzSpace;
            rightSpaceFraction = (parentLayer.frame().width() - (layer.frame().x() + layer.frame().width())) / unscaledLeftoverHorzSpace;
            leftoverHorzSpace = parentAbsoluteRect.size.width - layer.frame().width();
            x = (((leftSpaceFraction * leftoverHorzSpace) + (parentAbsoluteRect.size.width - (rightSpaceFraction * leftoverHorzSpace))) / 2) + parentAbsoluteRect.origin.x - (layer.frame().width() / 2);

            unscaledLeftoverVertSpace = parentLayer.frame().height() - layer.frame().height();
            topSpaceFraction = layer.frame().y() / unscaledLeftoverVertSpace;
            bottomSpaceFraction = (parentLayer.frame().height() - (layer.frame().y() + layer.frame().height())) / unscaledLeftoverVertSpace;
            leftoverVertSpace = parentAbsoluteRect.size.height - layer.frame().height();
            y = (((topSpaceFraction * leftoverVertSpace) + (parentAbsoluteRect.size.height - (bottomSpaceFraction * leftoverVertSpace))) / 2) + parentAbsoluteRect.origin.y - (layer.frame().height() / 2);
            returnRect = NSMakeRect(x, y, layer.frame().width(), layer.frame().height());
            break;
        }
      }
    } else {
      // mobile menu layer
      returnRect = NSMakeRect(layer.absoluteRect().rulerX(), layer.absoluteRect().rulerY(), layer.absoluteRect().width(), layer.absoluteRect().height());
    }
    if (Constants.LAYER_LOGGING) {
      log(Utils.tab(indent, 1) + layer.name() + ": " + layer.class() + "," + layer.isKindOfClass(MSArtboardGroup) + "," + layer.resizingType() + ",(" + Math.round(returnRect.origin.x) + "," + Math.round(returnRect.origin.y) + "," + Math.round(returnRect.size.width) + "," + Math.round(returnRect.size.height) + ")");
    }
    return returnRect;
  }

  getHotspots(layer, excludeMobileMenu, offset, artboardData, parentAbsoluteRect, indent) {
    //log("getHotspots()");
    const command = this.context.command;
    const isMobileMenu = command.valueForKey_onLayer_forPluginIdentifier(Constants.IS_MOBILE_MENU, layer, this.context.plugin.identifier());
    if ((!layer.isVisible() && !isMobileMenu) || (excludeMobileMenu && isMobileMenu)) {
      return;
    }
    if (indent == null) {
      indent = 0;
    }

    const absoluteRect = this.getAbsoluteRect(layer, parentAbsoluteRect, indent);

    const hotspots = [];
    if (layer.isKindOfClass(MSSymbolInstance)) {
      // symbol instance
      const childHotspots = this.getHotspots(layer.symbolMaster(), excludeMobileMenu, offset, artboardData, absoluteRect, indent + 1);
      if (childHotspots != null) {
        Array.prototype.push.apply(hotspots, childHotspots);
      }
    } else if (layer.isKindOfClass(MSLayerGroup)) {
      // layer group
      layer.layers().forEach(function (childLayer) {
        const childHotspots = this.getHotspots(childLayer, excludeMobileMenu, offset, artboardData, absoluteRect, indent + 1);
        if (childHotspots != null) {
          Array.prototype.push.apply(hotspots, childHotspots);
        }
      }, this);
    }

    let x = Math.round(absoluteRect.origin.x - Constants.HOTSPOT_PADDING);
    let y = Math.round(absoluteRect.origin.y - Constants.HOTSPOT_PADDING);
    // offset is used by the mobile menu
    if (offset != null) {
      x += offset.x;
      y += offset.y;
    }
    const width = Math.round(absoluteRect.size.width);
    const height = Math.round(absoluteRect.size.height);


    // check external link      
    let externalLink = this.Settings.layerSettingForKey(layer,Constants.EXTERNAL_LINK);
    if (externalLink != null && externalLink != "") {
        // found external link
        const openLinkInNewWindow = command.valueForKey_onLayer_forPluginIdentifier(Constants.OPEN_LINK_IN_NEW_WINDOW, layer, this.context.plugin.identifier());
        const regExp = new RegExp("^http(s?)://");
        if (!regExp.test(externalLink.toLowerCase())) {
          externalLink = "http://" + externalLink;
        }
        const target = openLinkInNewWindow && 1==2 ? "_blank" : null;
        hotspots.push({href: externalLink, target: target, x: x, y: y, width: width, height: height});       
    }else{
      // check link to artboard
      let targetArtboadName = '';
      if(layer.flow()!=null){
        const target = layer.flow().destinationArtboard();
        if(target!=null){
          targetArtboadName = target.name();
        }
      }

      const artboardName = targetArtboadName!=''?targetArtboadName:command.valueForKey_onLayer_forPluginIdentifier(Constants.ARTBOARD_LINK, layer, this.context.plugin.identifier());
      if (artboardName != null && artboardName != "") {
        // found artboard link
        hotspots.push({artboardName:artboardName, href: Utils.toFilename(artboardName) + ".html", x: x, y: y, width: width, height: height});     
      }
    }
    return hotspots;
  }

  buildHotspotHTML(hotspot) {
    //log("buildHotspotHTML()");
    const style = "left:" + hotspot.x + "px; top:" + hotspot.y + "px; width:" + hotspot.width + "px; height:" + hotspot.height + "px";
    let html = '<a href="' + hotspot.href + '" class="hotspot" style="' + style + '"';
    if (hotspot.target != null) {
      html += ' target="' + hotspot.target + '"';
    }
    html += '></a>\n';
    return html;
  }

  buildHotspots(layer, artboardData, indent) {
    //log("buildHotspots()");
    let html = '';
    const isMobileMenuLayer = !layer.isKindOfClass(MSArtboardGroup);
    const offset = isMobileMenuLayer ? {x: -layer.absoluteRect().rulerX(), y: -layer.absoluteRect().rulerY()} : null;
    const hotspots = this.getHotspots(layer, !isMobileMenuLayer, offset, artboardData);
    if (hotspots != null) {
      hotspots.forEach(function (hotspot) {
        html += Utils.tab(indent) + this.buildHotspotHTML(hotspot);
      }, this);
    }
    return html;
  }


  getArtboardImageName(artboard, scale) {
    //log("getArtboardImageName()");
    const suffix = scale == 2 ? "@2x" : "";
    return Utils.toFilename(artboard.name(), false) + suffix + ".png";
  }


  generateJSStoryBegin(){
    this.jsStory = 
    'var story = {\n'+
    '"pages": [\n';
  }


  createJSStoryFile(){
    const fileName = 'story.js';
    return this.prepareFilePath(this._outputPath + "/" + Constants.RESOURCES_DIRECTORY,fileName);
  }

  generateJSStoryEnd(){
    this.jsStory += 
     '   ]\n,'+
     '"resolutions": [2],\n'+
     '"title": "'+this.context.document.cloudName()+'",\n'+
     '"highlightLinks": false\n'+
    '}\n';

    const pathStoryJS = this.createJSStoryFile();
    Utils.writeToFile(this.jsStory, pathStoryJS);
  }

  createMainHTML(){
    const docName = this.context.document.cloudName();

    let s = "";
    s += '<!DOCTYPE html>\n<html>\n<head>\n<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">\n';
    s += '<meta name="generator" content="Generated using Exporter Sketch Plugin - https://github.com/MaxBazarov/exporter">\n';
    s += '<title>'+docName+'</title>\n';
    s += '<link rel="stylesheet" type="text/css" href="resources/fa/css/all.min.css"/>\n';
    s += '<link rel="stylesheet" type="text/css" href="resources/viewer.css">\n';
    s += '<script type="text/javascript" src="resources/jquery-1.12.4.min.js" charset="UTF-8"></script>\n';
    s += '<script type="text/javascript" src="resources/jquery-migrate-1.4.1.min.js" charset="UTF-8"></script>\n';
    s += '<script type="text/javascript" src="resources/jquery.maphilight.min.js" charset="UTF-8"></script>\n';
    s += '<script type="text/javascript" src="resources/jquery.hotkeys.min.js" charset="UTF-8"></script>\n';
    s += '<script type="text/javascript" src="resources/jquery.ba-hashchange.min.js" charset="UTF-8"></script>\n';
    s += '<script type="text/javascript" src="resources/story.js" charset="UTF-8"></script>\n';
    s += '<script type="text/javascript" src="resources/viewer.js" charset="UTF-8"></script>\n';

    s += '<script type="text/javascript">\n';
    s += '  var viewer = createViewer(story, "images");\n';
    s += '</script>\n';
    s += '</head>\n';
    s += '<body class="screen">\n';
    s += ' <div id="container">\n';
    s += '  <div id="content"></div>\n';
    s += ' </div>\n';
    


    s += ' <div id="nav">\n';
    s += '     <ul id="nav-right-hide" class="nav-set">\n';
    s += '         <li class="nav-item-icon">\n';
    s += '             <a onclick="viewer.hideNavbar(); return false;" href="" title="Hide controls"><i class="fas fa-times"></i></a>\n';
    s += '         </li>\n';
    s += '     </ul>\n';
    s += '     <ul id="nav-left" class="nav-set">\n';
    s += '         <li id="nav-left-prev" class="nav-item-icon">\n';
    s += '             <a onclick="viewer.previous(); return false;" href="" title="View previous screen (or →)"><i class="fas fa-angle-left"></i></a>\n';
    s += '         </li>\n';
    s += '         <li id="nav-left-next" class="nav-item-icon">\n';
    s += '             <a onclick="viewer.next(); return false;" href="" title="View next screen (or ←)"><i class="fas fa-angle-right"></i></a>\n';
    s += '         </li>\n';
    s += '         <li id="nav-right-links" class="nav-item-icon">\n';
    s += '             <a onclick="viewer.toggleLinks(); return false;" href="" title="Toggle links (or SHIFT to toggle)"><i class="far fa-hand-pointer"></i></a>\n';
    s += '         </li>\n';
    s += '     </ul>\n';
    s += '     <ul id="nav-title">\n';
    s += '         <li><div class="nav-title-label">Screen title</div><div class="title">Title</div></li>\n';
    s += '     </ul>\n';
    s += ' </div>\n';
    s += ' <div id="nav-hide" class="hidden">\n';
    s += '     <ul class="nav-set">\n';
    s += '         <li class="nav-item-icon">\n';
    s += '             <a onclick="viewer.showNavbar(); return false;" href="" title="Show controls"><i class="fas fa-bars"></i></a>\n';
    s += '         </li>\n';
    s += '     </ul>\n';
    s += ' </div>\n';
    s += '</body>\n';
    s += '</html>\n';

    const filePath = this.prepareFilePath(this._outputPath,'index.html');
    Utils.writeToFile(s, filePath);
  }


  pushArtboardSetIntoJSStory(artboardSet,index) {
    const mainArtboard = artboardSet[0].artboard;
    const mainName = mainArtboard.name();
    //log("process main artboard "+mainName);
    let js = index?',':'';
    js +=
      '{\n'+
      '"image": "'+ Utils.toFilename(mainName+'.png',false)+'",\n'+
      '"image2x": "'+ Utils.toFilename(mainName+'@2x.png',false)+'",\n'+
      '"width": '+mainArtboard.frame().width()+',\n'+
      '"height": '+mainArtboard.frame().height()+',\n'+
      '"title": "'+mainName+'",\n'+
      '"links": [\n';      


    // build flat link array
    const hotspots = [];
    artboardSet.forEach(function (artboardData) {   
      const artboard = artboardData.artboard;
      const artboardHotspots = this.getHotspots(artboard, true, null, artboardData);
      if (artboardHotspots != null) {   
        hotspots.push.apply(hotspots, artboardHotspots);
      }
    },this);

    let hotspotIndex = 0;  
    hotspots.forEach(function (hotspot) {
      const spotJs = this.pushHotspotIntoJSStory(hotspot);
      if(spotJs=='') return;
      js += hotspotIndex++?',':'';
      js += spotJs;
    }, this);

    js += ']}\n';

    this.jsStory += js;
  }

  pushHotspotIntoJSStory(hotspot) {
    let js = 
      '{\n'+
      '  "rect": [\n'+
      '    '+hotspot.x+',\n'+
      '    '+hotspot.y+',\n'+
      '    '+(hotspot.x+hotspot.width)+',\n'+
      '    '+(hotspot.y+hotspot.height)+'\n'+
      '   ],\n';

    if(hotspot.artboardName!=undefined){ 
      const targetBoard = this.artboardsDict[hotspot.artboardName];
      if(targetBoard==undefined){
        log("undefined artboard: '"+hotspot.artboardName + '"');
        return '';     
      }              
      js += '   "page": ' + this.artboardsDict[hotspot.artboardName]+'\n';
    }else{              
      if(hotspot.target!=undefined){   
       js += '   "target": "'+hotspot.target+'",\n';
      }
      js += '   "url": "'+hotspot.href+'"\n';                    
    }
          
    js += '  }\n';
 
    return js;
  }


  exportImage(layer, scale, imagePath) {
    //log("exportImage()");
    let slice;
    if (layer.isKindOfClass(MSArtboardGroup)) {
      slice = MSExportRequest.exportRequestsFromExportableLayer(layer).firstObject();
    } else {
      slice = MSExportRequest.exportRequestsFromExportableLayer_inRect_useIDForName(layer, layer.absoluteInfluenceRect(), false).firstObject();
    }
    slice.scale = scale;
    slice.saveForWeb = false;
    slice.format = "png";
    this.context.document.saveArtboardOrSlice_toFile(slice, imagePath);
  }

  exportImages(artboardGroup) {
    //log("exportImages()");
    artboardGroup.forEach(function (artboardData) {
      const mobileMenuLayer = artboardData.mobileMenuLayer;
      const mobileMenuLayerIsVisible = mobileMenuLayer != null && mobileMenuLayer.isVisible();
      if (mobileMenuLayerIsVisible) {
        mobileMenuLayer.setIsVisible(false);
      }

      this.exportImage(artboardData.artboard, 1, this._imagesPath + this.getArtboardImageName(artboardData.artboard, 1));
      if (this.retinaImages) {
        this.exportImage(artboardData.artboard, 2, this._imagesPath + this.getArtboardImageName(artboardData.artboard, 2));
      }
    
    }, this);
  }



  getArtboardGroups(context) {

    const artboardGroups = [];
    this.doc.pages().forEach(function(page){
      if (1==1 || !Utils.isSymbolsPage(page)) {
        artboardGroups.push.apply(artboardGroups, getArtboardGroupsInPage(page, context, false));
      }
    })


    // try to find flowStartPoint and move it on top  
    for (var i = 0; i < artboardGroups.length; i++) {
      const a = artboardGroups[i][0].artboard;
      if( a.isFlowHome() ){
         if(i!=0){              
              // move found artgroup to the top
              const item1 = artboardGroups[i];
              artboardGroups.splice(i,1);
              artboardGroups.splice(0,0,item1);
          }
          break;
      }
    }

    return artboardGroups;
  }

  getArtboardsDict(){
    let dict = [];
    let index = 0;
    this.artboardGroups.forEach(function (artboardGroup) {
      const mainArtboard = artboardGroup[0].artboard;
      const mainName = mainArtboard.name();
      dict[mainName] = index++;
    }, this);
    return dict;
  }

  exportArtboards() {
    this.artboardGroups = this.getArtboardGroups(this.context);
    this.artboardsDict = this.getArtboardsDict();

    this.copyResources();
    this.createMainHTML();

    // try to collect all hotspots into single dictionay
    this.generateJSStoryBegin();
    let index = 0;

    this.artboardGroups.forEach(function (artboardGroup) {
      this.exportImages(artboardGroup);
      this.pushArtboardSetIntoJSStory(artboardGroup,index++);
    }, this);


    this.generateJSStoryEnd();
  }

  prepareOutputFolder(selectedPath) {
    //log("prepareOutputFolder()");
    let error;
    const fileManager = NSFileManager.defaultManager();

    this._outputPath = selectedPath + "/" + this.context.document.cloudName();
    if (!fileManager.fileExistsAtPath(this._outputPath)) {
      error = MOPointer.alloc().init();
      if (!fileManager.createDirectoryAtPath_withIntermediateDirectories_attributes_error(this._outputPath, false, null, error)) {
        log(error.value().localizedDescription());
      }
    } else {
      Utils.removeFilesWithExtension(this._outputPath, "html");
    }

    this._imagesPath = this._outputPath + "/" + Constants.IMAGES_DIRECTORY;
    if (!fileManager.fileExistsAtPath(this._imagesPath)) {
      error = MOPointer.alloc().init();
      if (!fileManager.createDirectoryAtPath_withIntermediateDirectories_attributes_error(this._imagesPath, false, null, error)) {
        log(error.value().localizedDescription());
      }
    } else {
      Utils.removeFilesWithExtension(this._imagesPath, "png");
    }
  }
}