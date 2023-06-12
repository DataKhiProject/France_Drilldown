"use strict";

import "core-js/stable";
import "./../style/visual.less";
import powerbi from "powerbi-visuals-api";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import ISelectionManager = powerbi.extensibility.ISelectionManager;

import * as d3 from "d3";
type Selection<T extends d3.BaseType> = d3.Selection<T, any, any, any>;

import { VisualSettings } from "./VisualSettings";
import * as model from "./dataModel"
import { Map } from "./map";
import { Scale } from "./scale"
import { ITooltipServiceWrapper, createTooltipServiceWrapper} from "./toolTip";
import { LandingPage} from "./landingPage";



export class Visual implements IVisual {
    private svg: Selection<SVGElement>; //div principale
    private svg_map: Selection<SVGElement>;
    private svg_scale: Selection<SVGElement>;
    private colorScale: Scale; //div contenant l'échelle de couleur
    private map: Map; //div contenant la carte
    private logo: Selection<SVGImageElement>; // img contenant le logo

    private host: IVisualHost;
    private selectionManager: ISelectionManager;
    private tooltipServiceWrapper: ITooltipServiceWrapper; //Tooltip

    //Landing page
    private element: HTMLElement;
    private isLandingPageOn: boolean;
    private LandingPageRemoved: boolean;
    private LandingPage: Selection<any>;
    private LandingPageHTML: LandingPage;
    private dataModel: model.DataModel;
    private settings: VisualSettings;

    constructor(options: VisualConstructorOptions) {
        this.svg = d3.select(options.element).append('svg');
        this.svg_map = this.svg.append('svg');
        this.svg_scale = this.svg.append('svg');
        this.map = new Map(this.svg_map);
        this.colorScale = new Scale(this.svg_scale);
        this.logo = this.svg_map.append('image');
        this.settings = new VisualSettings;
        this.host = options.host;
        this.selectionManager = this.host.createSelectionManager();
        this.tooltipServiceWrapper = createTooltipServiceWrapper(this.host.tooltipService, options.element);
        this.element = options.element;
        this.LandingPageHTML = new LandingPage(this.host);
    }
    
    // Affichage du logo Datakhi
    public createLogo(width:number,height:number){
        this.logo.selectAll('.image').remove();
        this.logo.attr("width",20);
        this.logo.attr("height",15);
        this.logo.attr("x",width - 25);
        this.logo.attr("y",4);
        this.logo.attr("xlink:href","data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC4AAAA8CAYAAAAZp4inAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAACxEAAAsRAX9kX5EAAAUkSURBVGhDzZq7TpxHFMe9KwFabkm1KXARV1H8AN4GCm6ykCwhW8oDRG4onRdIkRewOyonXTpIEwlH3CSo8APEpS1LW5gChWsBEmR+qzOrb/ebOXP5lk1+EuLMh5jvP2fOnDk7s7X19fUnzWbzlwd9NBqN9srKyktp/q/Y3d19XdvY2Hg3MzPzVJ55OT8/P67Var8vLi7+JI/+E46Oju74Xe+0IpiammpOTk6+4h93dna+yOOhYkVDtPAiDIJOih3dN/3vyhJeRGbgozQHzuHh4abLQZWFg5mBb+mcl8ijgUB/o6Ojz6XZw0CEW3iJ8f6RNCuhiQav8LOzsw+tVqvGj8kon+RxEOP9J1UXb0g0eIUbsZ/FfLC0tPSIAVxfX/8hj1RYvLnimbGQaEgKlbm5uRexA8gRj2hmTJoqWTFuBxAKIREfFfMposErfHp6+jsxvRBCl5eXe9J0gphQtkkVDV7hpqNOigvl6YWFhcVQ6Ggxa/r+kioaokLFDoKXyKMeCJ2Q+P39/X/E7CKim9JMIinGeQkD2Nvb25VHXULix8fHvyqGDBVeSDTrSMwSWYtzYmJiwRU+iDcL9r00SxRDJlRlaqIhSzgQPq7QMQu2RQkszRLF2fKJC4mG+vHx8c/tdvsv+5O4S5LuSp434r8RswSzJWaH4iCxY0RD7e7OX5nGbL1ASiS7SLMDnu0Xabm4uHhTDBXWDaJdA+ZvYvaghordaEK52iWwfyBF6vX6j2J2YCApokH1eD9aRy6PaV7XQqJSkeVCe5krtWle39raeitmDzGiWYfJWUXL1a4sw0vEDBIp+r2Z2UdJoWIhk5AOpdmDa1b6Q4zBs36k2SFBdAs7K48zYjFLsCOK6cQl2jgiWIMXRUP2BmQ6cm4yt7e33jMan2gze2qRRVYrioZs4Tc3N3+K2YMph78Xs8vJycmvpLwc0QzWtcizYtziS48xu9/29vbfrkEWcc2QJdvjVSD7VBENQxeOaFfOL8KMaaJhqMJjRYupMjThrIdBiYahCN/c3HwnppOrq6vTFNGQLdxMe6kOh5QtHtgP5ufnv5ZmNNnCzbQ7t3yT30slMLcbYpYwG4v3Q4dGVh7PKVer5HwXWR73iSZWxYzGdWIQQ7Jw1/mIxdQpv4lZwlfb+JwQIkk4eZjzEWmW0I4cuPgSswTbv5jRRAvH01oeZosW04k2KLZ/45SkC4GgcGKQhaV5mhQY2qJBG5xxChcC0eKdWYXPgyMjI89CO50lJTOQ/32pFFjgMXk9+oLWh080n4RMDf5wdXX1B3nUxZcai7CYtRxfSbjmaSvOdVgEMeJ9cD+VlcdDtUUxZeacq4RgMScLx4NaDLLA+hfyoHdNiBZurw+1Qx5Ekx2k2YP5m/NSgD7pW5rRqDFOh8vLy4+lqaLVL5bQgmNwsZnM6/EU0Xg6ZutGlFYyMChmgFMBX4lg8Qo3/9i9oNUQL0VfPhH/xDwnV/KoBF/wsYOQRyWysgrYHTV2avvh5MoM2vlhJIZk4XgKwTGhYT5UXIvpxAy6c5t3r0UW8JLQGZ+FumR2dnYsFKtAXqZvwi509mjJDhUNYtMWXcSqEe+9iStC2NmvT/FzcHBwJn8qMVDhNtdLs4sR3wqVvS7GxsamxCwxMOEI09InM8CgjPeTTgF8VBZOCVAMjRDG+53vvsTEvkaWcIosjo0RoJUAGjZP5w4gSbgVS5E1qC9O2gHQd0oYeb+iyo3z2tpaVDa4L0iNp6enpePoRqPR/hfdDD4Ysu0iBAAAAABJRU5ErkJggg==");
    }

    public update(options: VisualUpdateOptions) {
        //landing page
        this.handleLandingPage(options);
        if( ! this.isLandingPageOn){
            //parse des settings
            this.settings.parse(options.dataViews[0]);
            //parse du datamodel     
            this.dataModel = model.parseDataModel(options.dataViews[0], this.settings, this.host);
                       
            
            this.svg.attr('width', options.viewport.width);
            this.svg.attr('height', options.viewport.height);

            //Attribution de la taille a la div principal
            
            if(this.settings.scale.show){
                var width = options.viewport.width-this.settings.scale.width;
                var height = options.viewport.height;
                this.svg_map.attr('width', width);
                this.svg_map.attr('height', height);
                this.svg_map.attr('x',this.settings.scale.width+5)

                this.svg_scale.attr('width', this.settings.scale.width);
                this.svg_scale.attr('height', options.viewport.height);
            }
            else{
                var width = options.viewport.width;
                var height = options.viewport.height;
                this.svg_map.attr('width', options.viewport.width);
                this.svg_map.attr('height', options.viewport.height);
                this.svg_map.attr('x',0)
                
                this.svg_scale.attr('width', 0);
                this.svg_scale.attr('height', 0);
            }

            this.svg.on('contextmenu', (d) => { //gestion du clic gauche
                const mouseEvent: MouseEvent = <MouseEvent> d3.event;
                
                this.selectionManager.showContextMenu(this.host.createSelectionIdBuilder().createSelectionId(), {
                    x: mouseEvent.clientX,
                    y: mouseEvent.clientY
                });
                mouseEvent.preventDefault();
            });


            //Affichage du logo 
            this.createLogo(width,height);
            
            //dessin de l'échelle de couleur
            this.colorScale.draw(this.dataModel, this.settings, this.selectionManager,this.settings.scale.width,options.viewport.height);

            //dessin de la carte
            this.map.draw(this.dataModel, this.settings, this.selectionManager, width / 2, height / 2, this.tooltipServiceWrapper);
            
        }
        else{
            this.svg.attr('width', 0);
            this.svg.attr('height', 0);
        }
 
    }
    
    private handleLandingPage(options: VisualUpdateOptions) {
        if(!options.dataViews || !options.dataViews.length) {
            if(!this.LandingPage){
                this.isLandingPageOn = true;
                this.LandingPageRemoved = false;
                const SampleLandingPage: Element = this.LandingPageHTML.getLandingPage(); //create a landing page
                this.element.appendChild(SampleLandingPage);
                this.LandingPage = d3.select(SampleLandingPage);
            }   
        } 
        else {
            if(this.isLandingPageOn && !this.LandingPageRemoved){
                this.isLandingPageOn = false;
                this.LandingPageRemoved = true;
                this.LandingPage.remove();
                this.LandingPage = null;
            }
        }
    }

    public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {
        var objectName = options.objectName;
        var objectEnumeration: VisualObjectInstance[] = [];

        switch (objectName) {
            case 'couleur':
                if(this.settings.color.gradientColor){ //Si couleur gradient sélectionner
                    if (this.settings.color.DivergentColor){ //Si il y a couleur divergent sélectionné
                        objectEnumeration.push({
                            objectName: objectName,
                            displayName: objectName,
                            properties: {
                                gradientColor: this.settings.color.gradientColor,
                                minColor: {
                                    solid: {
                                        color: this.settings.color.minColor.solid.color
                                    }
                                },
                                minColorValue: this.settings.color.minColorVal,
                                maxColor: {
                                    solid: {
                                        color: this.settings.color.maxColor.solid.color
                                    }
                                },
                                maxColorValue: this.settings.color.maxColorVal,
                                divergentColorSwitch: this.settings.color.DivergentColor,
                                middleColor:{
                                    solid: {
                                        color: this.settings.color.midColor.solid.color
                                    }
                                },
                                middleColorValue: this.settings.color.midColorVal
                            },
                            validValues:{
                                minColorValue: {
                                    numberRange:{
                                        min: Number.MIN_VALUE,
                                        max: Number.MAX_VALUE
                                    }
                                },
                                maxColorValue: {
                                    numberRange:{
                                        min: Number.MIN_VALUE,
                                        max: Number.MAX_VALUE
                                    }
                                },
                                middleColorValue: {
                                    numberRange:{
                                        min: Number.MIN_VALUE,
                                        max: Number.MAX_VALUE
                                    }
                                }
                            },
                            selector: null
                        });
                    }
                    else
                    objectEnumeration.push({
                        objectName: objectName,
                        displayName: objectName,
                        properties: {
                            gradientColor: this.settings.color.gradientColor,
                            minColor: {
                                solid: {
                                    color: this.settings.color.minColor.solid.color
                                }
                            },
                            minColorValue: this.settings.color.minColorVal,
                            maxColor: {
                                solid: {
                                    color: this.settings.color.maxColor.solid.color
                                }
                            },
                            maxColorValue: this.settings.color.maxColorVal,
                            divergentColorSwitch: this.settings.color.DivergentColor
                        },
                        validValues:{
                            minColorValue: {
                                numberRange:{
                                    min: Number.MIN_VALUE,
                                    max: Number.MAX_VALUE
                                }
                            },
                            maxColorValue: {
                                numberRange:{
                                    min: Number.MIN_VALUE,
                                    max: Number.MAX_VALUE
                                }
                            }
                        },
                        selector: null
                    });
                }
                else {
                    objectEnumeration.push({
                        objectName: objectName,
                        displayName: objectName,
                        properties: {
                            gradientColor: this.settings.color.gradientColor,
                            minColor: {
                                solid: {
                                    color: this.settings.color.minColor.solid.color
                                }
                            },
                            minColorValue: this.settings.color.minColorVal,
                            maxColor: {
                                solid: {
                                    color: this.settings.color.maxColor.solid.color
                                }
                            },
                            maxColorValue: this.settings.color.maxColorVal,
                            colorRange: this.settings.scale.rangeLevel
                        },
                        validValues:{
                            colorRange: {
                                numberRange:{
                                    min: 3,
                                    max: 30
                                }
                            },
                            minColorValue: {
                                numberRange:{
                                    min: Number.MIN_VALUE,
                                    max: Number.MAX_VALUE
                                }
                            },
                            maxColorValue: {
                                numberRange:{
                                    min: Number.MIN_VALUE,
                                    max: Number.MAX_VALUE
                                }
                            }
                        },
                        selector: null
                    });
                }
                break;
            case 'tooltip':
                objectEnumeration.push({
                    objectName: objectName,
                    displayName: objectName,
                    properties: {
                        show: this.settings.tooltip.show
                        
                    },
                    selector: null
                });
                break;
            case 'scale':
                objectEnumeration.push({
                    objectName: objectName,
                    displayName: objectName,
                    properties: {
                        show: this.settings.scale.show,
                        width: this.settings.scale.width,
                        extremum: this.settings.scale.extremum,
                        minValue0: this.settings.scale.minValue0
                    },
                    validValues:{
                        width: {
                            numberRange:{
                                min: 100,
                                max: 1000
                            }
                        }
                    },
                    selector: null
                });
                break;
            case 'map':
                objectEnumeration.push({
                    objectName: objectName,
                    displayName: objectName,
                    properties: {
                        level1: this.settings.mapBackground.mapSelection[0],
                        level2: this.settings.mapBackground.mapSelection[1],
                        level3: this.settings.mapBackground.mapSelection[2],
                        level4: this.settings.mapBackground.mapSelection[3]
                    },
                    selector:null
                })
                break;
        }
        return objectEnumeration;
    }

    public destroy(): void { }
}
