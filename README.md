# Raphaёl.loadSVG

This plugin allows you to load an SVG file exported from AI to Raphaёl.

## Basic Usage

    Raplhael.loadSVG(imageUrl, targetSet, params);

### Example

    paper = Raphael(0, 0, 200, 200);
    paper.rect(0, 0, paper.width, paper.height);
    
    paper.loadSVG(
      '/assets/butterfly.svg', 
      paper.set(), 
      { 
        x: 150, 
        y: 10, 
        width: 200, 
        height: 200, 
      keepAspectRatio: true
    });
