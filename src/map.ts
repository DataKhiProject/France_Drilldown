import powerbi from "powerbi-visuals-api";
import ISelectionManager = powerbi.extensibility.ISelectionManager;
import ISelectionId = powerbi.extensibility.ISelectionId;
import { valueFormatter } from "powerbi-visuals-utils-formattingutils";

import * as d3 from "d3";
type Selection<T extends d3.BaseType> = d3.Selection<T, any, any, any>;

import { DataModel, DataPoint } from "./dataModel"
import { VisualSettings } from "./VisualSettings";
import { util } from "./util";
import { ITooltipServiceWrapper, TooltipEventArgs } from "./toolTip";
import { GeoProjection, selection } from "d3";

export class Map {
    private div: Selection<SVGElement>;
    private path;
    private previousSelected: ISelectionId[];
    private previousDrillLevel: number;
    private projection: GeoProjection;
    

    constructor(svg: Selection<SVGElement>) {
        this.div = svg.append('g');
        this.previousSelected = [];
        this.projection = d3.geoConicConformal()
            .center([2.454071, 47.279229]) //centre de la france
            .scale(2600) //zoom
        this.previousDrillLevel = 0;
        
    }

    public erase() {
        this.div.selectAll('.path').remove();
    }

    private static getTooltipData(value: any) {
        return [{
            displayName: value.name,
            value: value.value.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, " ")
        }];
    }

    private selected(shape: SVGPathElement, scale: number) {
        d3.select(shape)
            .style('opacity', 1)
            .style('stroke-width', 1 / scale)
            .style('stroke', 'black');
    }

    private unselected(shape: SVGPathElement, scale: number) {
        d3.select(shape)
            .style('opacity', 0.5)
            .style('stroke-width', (1 / scale) / 2)
            .style('stroke', 'grey');
    }

    private neutral(shape: SVGElement, scale: number) {
        d3.select(shape)
            .style('opacity', 1)
            .style('stroke-width', (1 / scale) / 2)
            .style('stroke', 'grey');
    }

    private tooltip(settings: VisualSettings, toolTip: ITooltipServiceWrapper) {
        if (settings.tooltip.show) {
            toolTip.addTooltip(this.div.selectAll('path'),
                (tooltipEvent: TooltipEventArgs<number>) => Map.getTooltipData(tooltipEvent.data),
                (tooltipEvent: TooltipEventArgs<number>) => null);
        }
    }

    /**
     * permet d'avoir le vecteur de translation a appliquer pour placer la forme au centre de la div  en prennant en compte le zoom.
     * pour cela on calcul le vecteur entre le centre de la div et de la forme.
     * Ce vecteursera multiplier par le scale. Pour compensé le décentrage du scale,on ajoute (scale - 1)*c où c est le centre de la div.
     * @param dataModel model de donnée, nous permet de trouver le centre de la forme
     * @param path fonction de path, pour calculer le centre de la forme
     * @param x centre de la div
     * @param y centre de la div
     * @param scale facteur de zoom²
     */
    private getTranslation(dataModel: DataModel, x: number, y: number, scale: number): [number, number] {
        var centroid = util.GETCENTROID(dataModel.data, this.path);
        var translate: [number, number] = [x - centroid[0], y - centroid[1]]; // vecteur de translation entre le centroid de la forme et celle de la div
        translate = [(-(scale - 1) * x + translate[0] * scale), (-(scale - 1) * y + translate[1] * scale)]; //recentrage en prenant en compte le scale
        return translate;
    }

    /**
     * Permet de calculer le zoom, en fonction de la différence de taille entre la forme et la div.
     * @param dataModel model de donnée, pour trouver la taille de la forme
     * @param path fonction de path, pour calculer la taille de la forme
     * @param width longueur de la div
     * @param height Largeur de la div
     */
    private getZoomScale(dataModel: DataModel, width: number, height: number): number {
        var bound = util.GETEXTREMUMBOUND(dataModel.data, this.path);
        var boundMax = bound[1];
        var boundMin = bound[0];
        var shapeWidth = boundMax[0] - boundMin[0];
        var shapeHeight = boundMax[1] - boundMin[1];
        return Math.min(width / shapeWidth, (height / shapeHeight) * 0.8); // on diminue unpeu le scale de la hauteur pour pas que ca dépasse
    }

    /**
     * permet de réduire le nombre de forme a afficher, en supprimant les formes vide qui sont trop loin et ne seront pas vu par l'utilisateur.
     * @param dataModel model de donnée, contient la forme a déssiné et les formes vide
     * @param width largeur de la div
     * @param height hauteur de la div
     * @param scale taux de zoom
     */
    private cleanShape(dataModel: DataModel, width: number, height: number, scale: number) {
        var filledmap: DataPoint[] = dataModel.data;
        var emptymap: DataPoint[] = dataModel.emptyShape;
        var centroid = util.GETCENTROID(filledmap, this.path);
        width = width / scale;
        height = height / scale;
        var maxDist = (Math.pow(width, 2) + Math.pow(height, 2));
        for (var i = 0; i < emptymap.length; ++i) {
            var center = this.path.centroid(emptymap[i].mapData);
            var dist = Math.pow((center[0] - centroid[0]), 2) + Math.pow((center[1] - centroid[1]), 2);
            if (dist < maxDist) {
                filledmap.push(emptymap[i]);
            }
        }
    }


    public draw(dataModel: DataModel, settings: VisualSettings, selectionManager: ISelectionManager, x: number, y: number, toolTip: ITooltipServiceWrapper) {
        var _this = this;
        //supprimer le dessin précédent
        this.erase();
        this.projection.translate([x, y]) //on place la carte au centre de la div
        this.path = d3.geoPath().projection(this.projection); //on initialise la fonction de traçage avec la prise en compte de la projection        
        //on calcule le zoom et la translation a appliquer
        var scale = this.getZoomScale(dataModel, x * 2, y * 2); //on considère la hauteur entière car on veut que la forme prenne toute la hauteur de la div
        var translate = this.getTranslation(dataModel, x, y, scale);
        this.cleanShape(dataModel, x * 2, y * 2, scale);

        //si on effectue un Drill on désélectionne tout
        if (settings.mapBackground.drillLevel != _this.previousDrillLevel) {
            _this.previousSelected = []
            d3.selectAll('path').each(function () { _this.neutral(<SVGPathElement>this, scale); })
            selectionManager.clear();
        }

        //dessin
        this.div.selectAll('path')
            .data(dataModel.data)
            .enter().append('path')
            .attr('class', 'path')
            .attr('d', (d) => { return _this.path(d.mapData) }) //dessin de la forme
            .attr('id', (d) => { return d.name }) //nom de la forme
            .attr('fill', (d) => { return d.color }) //couleur
            .each(function (d) {
                //si une forme est sélectionner
                if (selectionManager.hasSelection()) {
                    if (d && util.CONTAIN(d.selectionId, _this.previousSelected)) //update créer une nouvelle instance de selectionId, il faut donc trouve un autre moyen de tester l'égalité. 
                        _this.selected(<SVGPathElement>this, scale);
                    //sinon en transparent
                    else
                        _this.unselected(<SVGPathElement>this, scale);
                }
                //si pas de région sélectionner
                else {
                    //si il y a un highlight
                    if (d.highlight != null) {
                        //cette forme n'est pas sélectionner
                        if (d.highlight === 0)
                            _this.unselected(<SVGPathElement>this, scale);
                        else //elle est sélectionner
                            _this.selected(<SVGPathElement>this, scale);
                    }
                    else //si il n'y en a pas de highlight
                        _this.neutral(<SVGPathElement>this, scale);
                }
            })
            .on('click', function (d) { //gestion du clic droit
                if (d.selectionId == null)
                    return;
                //si on clic sur la forme déja sélectionner, on la désélectionne
                if (selectionManager.hasSelection() && util.CONTAIN(d.selectionId, _this.previousSelected)) {
                    if (d3.event.ctrlKey) {
                        let index = _this.previousSelected.findIndex(id => JSON.stringify(id) === JSON.stringify(d.selectionId));
                        _this.previousSelected.splice(index, 1);
                        _this.unselected(<SVGPathElement>this,scale);
                        selectionManager.clear();
                        selectionManager.select(_this.previousSelected);
                    }
                    else {
                        _this.previousSelected = []
                        d3.selectAll('path').each(function () { _this.neutral(<SVGPathElement>this, scale); })
                        selectionManager.clear();
                    }
                }
                //sinon on sélectionne la forme cliquer
                else {
                    if (d3.event.ctrlKey) {
                        _this.previousSelected.push(d.selectionId);
                        d3.selectAll('path').each(function (d: DataPoint) {
                            if (d && util.CONTAIN(d.selectionId, _this.previousSelected))
                                _this.selected(<SVGPathElement>this, scale)
                            else
                                _this.unselected(<SVGPathElement>this, scale)
                        });
                        selectionManager.select(d.selectionId, true);
                    }
                    else {
                        _this.previousSelected = [d.selectionId]
                        d3.selectAll('path').each(function (d) { _this.unselected(<SVGPathElement>this, scale) })
                        _this.selected(<SVGPathElement>this, scale);
                        selectionManager.select(d.selectionId);
                    }

                }
            })
            .on('contextmenu', (d) => { //gestion du clic gauche
                if (d.selectionId == null)
                    return;
                const mouseEvent: MouseEvent = <MouseEvent>d3.event;
                selectionManager.showContextMenu(d.selectionId, {
                    x: mouseEvent.clientX,
                    y: mouseEvent.clientY
                });
                mouseEvent.preventDefault();
                d3.event.stopPropagation();
            });

        this.previousDrillLevel = settings.mapBackground.drillLevel;
        //animation
        this.div
            .transition().duration(750)
            .attr("transform", "translate(" + translate[0] + "," + translate[1] + ")scale(" + scale + ")");
        //tooltip
        this.tooltip(settings, toolTip);
    }
}