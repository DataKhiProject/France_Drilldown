import powerbi from "powerbi-visuals-api";
import ISelectionManager = powerbi.extensibility.ISelectionManager;

import * as d3 from "d3";
type Selection<T extends d3.BaseType> = d3.Selection<T, any, any, any>;

import {DataModel} from "./dataModel"
import { VisualSettings } from "./VisualSettings";

export class Scale {
    private div: Selection<SVGElement>

    constructor(svg:Selection<SVGElement>){
        this.div = svg.append('g');
    }

    
    public erase(){
        this.div.selectAll('#legend').remove(); //suppression de l'échelle de couleur
        this.div.selectAll('#legendAxis').remove(); //suppression de l'axe de l'échelle de couleur
    }



    
    public draw(dataModel: DataModel,settings: VisualSettings,selectionManager: ISelectionManager,width,height){
        //supprime le dessin précédent
        this.erase();

        if ( ! settings.scale.show)
            return;
        
        var elementHeight = (height*0.6)/settings.scale.rangeLevel; 
        
        var x = width/2
        var y = height*0.2

        //échelle de couleur
        this.div.append('g') //on va supperposer les carréer de couleur pour créer notre échelle de couleur
            .attr('id', 'legend')
            .attr('transform', 'translate(' + x + ',' + y + ')')
            .selectAll('.colorbar')
            .data(d3.range(settings.scale.rangeLevel))
            .enter()
            .append('rect')
            .attr('x', '0px')
            .attr('y', (d:number) => { return d * elementHeight + 'px' })
            .attr('height', elementHeight + 'px')
            .attr('width', '20px')
            .attr('fill', (d:number) =>
             { return settings.scale.colors.getColor(d); })

        //axe gradué
        var legendScale = d3.scaleLinear() //échelle linéaire pour nous permettre d'afficher les valeurs
            .domain([dataModel.minValue < 0 ? dataModel.minValue : 0 , dataModel.maxValue])
            .range([0, settings.scale.rangeLevel * elementHeight]);
        x = x - 10; //Pour décaler l'axe pour qu'il ne soit pas collé à l'échelle

        this.div.append('g')
            .attr('id', 'legendAxis')
            .attr('transform', 'translate(' + x + ',' + y + ')')
            .call(d3.axisLeft(legendScale)
                    .ticks(settings.scale.extremum ? 1 : (settings.scale.rangeLevel - 1))
                );

    }
}