import powerbi from "powerbi-visuals-api";
import DataViewObjects = powerbi.DataViewObjects;
import ISelectionId = powerbi.extensibility.ISelectionId;
import { DataModel } from "./dataModel";


export class util {

    /**
     * Permet de tester si un string est un code (composer entiérement de numero)
     * @param value valeur a tester
     */
    public static ISCODE(value: string) {
        return !isNaN(+value);
    }

    /**
     * Permet de retouver l'index de la categories et values qui correspond a la forme actuel
     * Elle réalise un match entre le nom de la forme et le nom de la catégorie, lorsqu'il y a un match, il renvoie l'index
     * L'index retourné est égale à -1 si il n'y a pas de match
     * @param shapeName nom de la forme
     * @param categories liste de toute les catégorie
     */
    public static VALUEMATCHER(shapeName: string, categories: string[]): number {
        for (var i = 0; i < categories.length; ++i) {
            if (shapeName == categories[i]) {
                return i;
            }
        }
        return -1;
    }

    /**
     * retire tous les charactères spéciaux et les espaces
     * @param str string a simplifier
     */
    public static SIMPLIFYSTRING(str: string): string {
        if(str)
            return str.replace(/[^a-zA-Z ]|\s/g, "");
        else
            return str;
    }

    /**
     * retire tous les charactères spéciaux et les espaces
     * @param strs tableau de string a simplifier
     */
    public static SIMPLIFYSTRINGARRAY(strs: string[]): string[] {
        var result: string[] = [];
        for (var str of strs) {
            result.push(util.SIMPLIFYSTRING(str));
        }
        return result;
    }

    /**
     * Permet d'avoir le niveau de drilldown grâce aux métadonnées
     * @param metadata metadonnée des colonnes (dataview.metadata.columns)
     */
    public static GETDRILLLEVEL(metadata: powerbi.DataViewMetadataColumn[]): number {
        var result: number = 0;
        var indexMeasure:number =0;
        for (var i = 0; i < metadata.length; ++i) { // parcour les métadonnées de toute les colonnes
            if (metadata[i].roles.category) { //regarde si la colonnes est bien une category (et pas une value ou measure)
                if (result < metadata[i].index) //prend l'index le plus haut
                    result = metadata[i].index;
            }
            else {
                indexMeasure = metadata[i].index;
            }
        }
        if (indexMeasure<result) //on corrige le décalage d'index si besoin
            result = result - 1
        return result;
    }

    /**
     * Permet de récupérer une valeur d'objet (options) dans les métadonnées
     * @param objects metadata.objects
     * @param objectName nom de l'objet
     * @param propertyName nom de la propriété
     * @param defaultValue valeur par défault
     *     */
    public static GETVALUE<T>(objects: DataViewObjects, objectName: string, propertyName: string, defaultValue: T): T {
        if (objects) {
            let object = objects[objectName];
            if (object) {
                let property: T = <T>object[propertyName];
                if (property !== undefined) {
                    return property;
                }
            }
        }
        return defaultValue;
    }

    /**
     * Permet de savoir si un selectionId se trouve dans une liste de selectionID
     * @param value SelectionID courant
     * @param array Tableau de SelectionID
     */
    public static CONTAIN(value: ISelectionId, array: ISelectionId[]): boolean {
        for (var i = 0; i < array.length; ++i) {
            if (JSON.stringify(value) === JSON.stringify(array[i]))
                return true
        }
        return false;
    }

    /**
     * Permet d'avoir les limites maximum et minimum d'un groupe de formes
     * @param data donnée des formes
     * @param path objet de tracage
     */
    public static GETEXTREMUMBOUND(data, path): [[number, number], [number, number]] {
        var boundMax: [number, number] = [0, 0];
        var boundMin: [number, number] = [10000, 10000];
        for (var i = 0; i < data.length; ++i) {
            var bound = path.bounds(data[i].mapData);
            if (bound[0] && bound[1]) {
                boundMax[0] = Math.max(boundMax[0], bound[1][0]);
                boundMax[1] = Math.max(boundMax[1], bound[1][1]);
                boundMin[0] = Math.min(boundMin[0], bound[0][0]);
                boundMin[1] = Math.min(boundMin[1], bound[0][1]);
            }
        }
        return [boundMin, boundMax];
    }

    /**
     * Permet d'avoir le centre d'un groupe de formes
     * @param data donnée des formes
     * @param path objet de tracage
     */
    public static GETCENTROID(data, path): [number, number] {
        var xtot = 0;
        var ytot = 0;
        var len = 0;
        for (var i = 0; i < data.length; ++i) {
            var center = path.centroid(data[i].mapData);
            if (center[0] && center[1]) {
                xtot = xtot + center[0];
                ytot = ytot + center[1];
                len = len + 1;
            }
        }
        return [xtot / len, ytot / len]
    }
}
