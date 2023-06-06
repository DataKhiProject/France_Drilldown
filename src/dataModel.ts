import powerbi from "powerbi-visuals-api";
import ISelectionId = powerbi.extensibility.ISelectionId;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import DataView = powerbi.DataView;
import * as geoProvider from './geoJsonProvider';
import * as d3 from "d3";
import { util } from "./util";
import { VisualSettings } from "./VisualSettings";

export interface DataPoint {
    mapData; //donné de la forme géographique
    name: string; //nom de la forme
    color: string; //couleur de la forme
    value: number; //valeur de la forme
    selectionId: ISelectionId; //Id permettant le drilldown
    highlight: number; //valeur highlight, null si aucune valeur n'est highlight, 0 sinon
}

export interface DataModel {
    data: DataPoint[]; //tableau de datapoint
    minValue: number; //valeur minimal du dataview
    maxValue: number; //valeur maximal du dataview
    emptyShape: DataPoint[];
}


export function parseDataModel(dataView: DataView, settings: VisualSettings, host: IVisualHost): DataModel {
    var dps: DataPoint[] = [];
    var empty: DataPoint[] = [];
    var values: number[] = <number[]>dataView.categorical.values[0].values;
    var highlight: number[] = <number[]>dataView.categorical.values[0].highlights;
    var categories: string[] = <string[]>dataView.categorical.categories[0].values;

    //détermines si les valeurs sont des noms ou des codes
    var isCode: boolean = util.ISCODE(categories[0] ?? categories[1]);
    if (!isCode) {     //si ce n'est pas des codes, on simplifie les noms
        var categoriesSimple: string[] = util.SIMPLIFYSTRINGARRAY(categories); //on simplifie le nom des catégorie pour facilité le matching avec le nom des formes
    }

    //valeur extrême du dataview
    var minValue: number = <number>dataView.categorical.values[0].minLocal;
    let maxValue: number = <number>dataView.categorical.values[0].maxLocal;
    
    //on récupère le fond de carte si il y en a un de selectionner ou régions par défaut
    var map: string = settings.mapBackground.selectedMap ? settings.mapBackground.selectedMap : "regions";
    var geo = geoProvider.geoJsonProvider(map);

    //on créer la fonction d'échelle d3. Cela permettras de définir la couleur de la forme en fonction de la valeur
    var quantile = d3.scaleQuantile()
        .domain([settings.scale.minValue0?0:minValue, maxValue])
        .range(d3.range(settings.scale.rangeLevel));

    //booleen pour savoir si il y a une valeur highlighté
    var hasHighlight: boolean = highlight ? true : false;

    //on boucle sur les formes, pour récupérer les informations
    for (var i = 0; i < geo.features.length; ++i) {
        //récupération du nom de la forme
        var name = geo.features[i].nom;

        //récupération du tracer de la forme
        var feat = geo.features[i];

        //récupération de l'index de catégories et values correspondant à la forme traité
        var index: number;
        if (isCode) {
            var code: string = geo.features[i].code;
            index = util.VALUEMATCHER(code, categories);
        }
        else {
            var nameSimple: string = util.SIMPLIFYSTRING(name); //on simplifie le nom de la forme pour faciliter le matching avec le nom des catégories
            index = util.VALUEMATCHER(nameSimple, categoriesSimple);
        }
        if (index == -1) //Si l'index retourner est -1, on passe a l'ittération suivante
        {
            var dp: DataPoint = { name: name, mapData: feat, value: 0, color: "#FFFFFF", selectionId: null, highlight: null };
            empty.push(dp);
            continue;
        }

        //assignation de la valeur
        var value = values[index];

        var highVal = null;
        //si il y a un highlight
        if (hasHighlight) {
            //et que cette forme est highlighté, on récupère sa valeur, sinon on la met a 0
            highVal = highlight[index] ? highlight[index] : 0;
        }
        //si il n'y a pas de highlight, on garde la valeur null.

        //création de la couleur
        var color = settings.scale.colors.getColor(quantile(value)); //on utilise la fonction d'échelle créer précedemment

        //création de l'id de selection de la forme
        var selectionId = host.createSelectionIdBuilder().withCategory(dataView.categorical.categories[0], index).createSelectionId()

        var dp: DataPoint = { name: name, mapData: feat, value: value, color: color, selectionId: selectionId, highlight: highVal };
        dps.push(dp);
    }
    

    //resultat
    return { data: dps, minValue: minValue, maxValue: maxValue, emptyShape: empty }
}

