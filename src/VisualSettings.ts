/*
 *  Power BI Visualizations
 *
 *  Copyright (c) Microsoft Corporation
 *  All rights reserved.
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */

"use strict";

import powerbi from "powerbi-visuals-api";
import DataView = powerbi.DataView;
import Fill = powerbi.Fill;
import { ColorScale } from "./colorScale";
import { util } from "./util";

class MapBackgroundSetting {
  public selectedMap: string;
  public drillLevel: number;
  public mapSelection: string[];

  constructor() {
    this.selectedMap = "regions";
    this.drillLevel = 0;
    this.mapSelection = ["regions","departements","arrondissements","communes"];
  }
}

class ScaleSetting {
  public rangeLevel: number;
  public colors: ColorScale ;
  public show: boolean;
  public width: number;
  public extremum: boolean;
  public minValue0: boolean;

  constructor() {
    this.rangeLevel = 6;
    this.colors = new ColorScale;
    this.show = true;
    this.width = 150;
    this.extremum = false;
    this.minValue0 = false;
  }
}

class ColorSetting{
  public gradientColor:boolean;
  public minColor:Fill;
  public minColorVal: number;
  public maxColor:Fill;
  public maxColorVal: number;
  public DivergentColor:boolean;
  public midColor:Fill;
  public midColorVal: number;

  constructor() {
    this.gradientColor = false;
    this.minColor = {solid:{color:"#FFFF00"}};
    this.minColorVal = null;
    this.maxColor = {solid:{color:"#FF0000"}};
    this.maxColorVal = null;
    this.DivergentColor = false;
    this.midColor = {solid:{color:"#FF8800"}};
    this.midColorVal = null;
  }
}

class TooltipSetting{
  public show:boolean;

  constructor(){
    this.show = true;
  }
}

export class VisualSettings {
  public mapBackground: MapBackgroundSetting;
  public color: ColorSetting;
  public scale: ScaleSetting;
  public tooltip:TooltipSetting;

  constructor() {
    this.mapBackground= new MapBackgroundSetting;
    this.color = new ColorSetting;
    this.scale= new ScaleSetting;
    this.tooltip = new TooltipSetting;
  }

  public parse(dataview: DataView){
    //var setting: VisualSettings = new VisualSettings;

    var metadata = dataview.metadata;
    //map background setting
    this.mapBackground.drillLevel = util.GETDRILLLEVEL(metadata.columns); //donne a quel niveau de drilldown on se trouve (commence a 0)
    this.mapBackground.mapSelection = []; //on met les découpages voulues par l'utilisateurs
    var level1 = util.GETVALUE(metadata.objects,"map","level1","regions");
    var level2 = util.GETVALUE(metadata.objects,"map","level2","departements");
    var level3 = util.GETVALUE(metadata.objects,"map","level3","arrondissements");
    this.mapBackground.mapSelection.push(level1);
    this.mapBackground.mapSelection.push(level2);
    this.mapBackground.mapSelection.push(level3);
    this.mapBackground.mapSelection.push("communes");
    
    //on sélectionne la map a utiliser en fonction du niveau de drill et du découpage sélectionné.
    console.log(this.mapBackground.drillLevel);
    this.mapBackground.selectedMap = this.mapBackground.mapSelection[this.mapBackground.drillLevel]; //donne la carte a utiliser en fonction du niveau de drilldown

    //color setting
    this.color.gradientColor = util.GETVALUE(metadata.objects,"couleur","gradientColor",false);
    this.color.minColor = util.GETVALUE(metadata.objects,"couleur","minColor",{solid:{color:"#FFFF00"}});
    this.color.minColorVal = util.GETVALUE(metadata.objects,"couleur","minColorValue",null);
    this.color.maxColor = util.GETVALUE(metadata.objects,"couleur","maxColor",{solid:{color:"#FF0000"}});
    this.color.maxColorVal = util.GETVALUE(metadata.objects,"couleur","maxColorValue",null);
    this.color.DivergentColor = util.GETVALUE(metadata.objects,"couleur","divergentColorSwitch",false);
    this.color.midColor = util.GETVALUE(metadata.objects,"couleur","middleColor",{solid:{color:"#FF8800"}});
    this.color.midColorVal = util.GETVALUE(metadata.objects,"couleur","middleColorValue",null);

    //color scale setting
    this.scale.rangeLevel = util.GETVALUE(metadata.objects,"couleur","colorRange",6); //donne le nombre de "catégorie" de couleur pour l'échelle
    this.scale.colors.setColor(this.color.minColor.solid.color, this.color.maxColor.solid.color); //permet de créer l'échelle de couleur a partir d'une couleur de départ et une couleur d'arrivé
    this.scale.colors.setRange(this.scale.rangeLevel); //donne a l'échelle de couleur le nombre de catégorie de couleur 
    this.scale.colors.generateScale(); //on génère l'échelle de couleur
    this.scale.show = util.GETVALUE(metadata.objects,"scale","show",true);
    this.scale.width = util.GETVALUE(metadata.objects,"scale","width",150);
    this.scale.extremum = util.GETVALUE(metadata.objects,"scale","extremum",false);
    this.scale.minValue0 = util.GETVALUE(metadata.objects,"scale","minValue0",false);

    //tooltip setting
    this.tooltip.show = util.GETVALUE(metadata.objects,"tooltip","show",true);
  }
}


