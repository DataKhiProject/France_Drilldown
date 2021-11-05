import departementsJson from "../assets/geoJson/departement_map_wgs84.json";
import regionsJson from "../assets/geoJson/region_map_wgs84.json";
import arrondissementsJson from "../assets/geoJson/arrondissement_map_wgs84.json";
import communesJson from "../assets/geoJson/commune_map_wgs84.json";
import cantonJson from "../assets/geoJson/arrondissement_map_wgs84.json";
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
            result = regionsJson;
            break;
        case 'departements':
            result = departementsJson;
            break;
        case 'arrondissements':
            result = arrondissementsJson;
            break;
        case 'communes':
            result = communesJson;
            break;
        case 'cantons':
            result = cantonJson;
            break;
        case 'iris':
            result = irisJson;
            break;
        case 'zone d\'emploi':
            result = emploiJson;
            break;
    }
    return result;
}
