import departementsJson from "../assets/geoJson/departement_map_wgs84.json";
import regionsJson from "../assets/geoJson/region_map_wgs84.json";
import arrondissementsJson from "../assets/geoJson/arrondissement_map_wgs84.json";
import communesJson from "../assets/geoJson/commune_map_wgs84.json";
import cantonJson from "../assets/geoJson/canton_map_wgs84.json";
import irisJson from "../assets/geoJson/iris_map_wgs84.json";
import emploiJson from "../assets/geoJson/zone_emploi_map_wgs84.json";

/**
 * Permet de récupérer les fichiers geoJson.
 * Les valeurs possible sont departements, regions et arrondissements.
 * @param name nom de json a récupérer
 */
export function geoJsonProvider(name: string) {
    var result;
    switch (name) {
        case 'regions':
            console.log("regions");
            result = regionsJson;
            break;
        case 'departements':
            console.log("departements");
            result = departementsJson;
            break;
        case 'arrondissements':
            console.log("arrondissement");
            result = arrondissementsJson;
            break;
        case 'communes':
            console.log("communes");
            result = communesJson;
            break;
        case 'canton':
            console.log("cantons");
            result = cantonJson;
            break;
        case 'IRIS':
            console.log("iris");
            result = irisJson;
            break;
        case 'Zone_emploi':
            console.log("emploi");
            result = emploiJson;
            break;
    }
    return result;
}
