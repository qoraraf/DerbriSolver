import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { CdmEvent, SimulationResult } from '../types';

interface EncounterPlaneProps {
  event: CdmEvent;
  mcResult?: SimulationResult | null;
}

const EncounterPlane: React.FC<EncounterPlaneProps> = ({ event, mcResult }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 400;
    const height = 300;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); 

    const maxExtent = Math.max(event.hbr * 4, event.missDistance * 1.5);
    const xScale = d3.scaleLinear().domain([-maxExtent, maxExtent]).range([0, width]);
    const yScale = d3.scaleLinear().domain([-maxExtent, maxExtent]).range([height, 0]);

    // Grid System
    svg.append("g")
        .attr("transform", `translate(0,${height/2})`)
        .call(d3.axisBottom(xScale).ticks(8).tickSize(-height).tickFormat(() => ""))
        .attr("class", "text-indigo-500/10 stroke-[0.5]");

    svg.append("g")
        .attr("transform", `translate(${width/2},0)`)
        .call(d3.axisLeft(yScale).ticks(8).tickSize(-width).tickFormat(() => ""))
        .attr("class", "text-indigo-500/10 stroke-[0.5]");

    // Radar Concentric Circles
    [0.25, 0.5, 0.75, 1.0].forEach(factor => {
        svg.append("circle")
            .attr("cx", xScale(0))
            .attr("cy", yScale(0))
            .attr("r", Math.abs(xScale(maxExtent * factor) - xScale(0)))
            .attr("fill", "none")
            .attr("stroke", "rgba(99, 102, 241, 0.05)")
            .attr("stroke-dasharray", "2 4");
    });

    // Radar Sweep Line
    const sweepGroup = svg.append("g")
        .attr("transform", `translate(${xScale(0)}, ${yScale(0)})`)
        .attr("class", "animate-radar");
    
    sweepGroup.append("line")
        .attr("x1", 0).attr("y1", 0)
        .attr("x2", 0).attr("y2", -height/2)
        .attr("stroke", "url(#radar-gradient)")
        .attr("stroke-width", 2);

    // Gradient Definitions
    const defs = svg.append("defs");
    const radGrad = defs.append("linearGradient").attr("id", "radar-gradient").attr("x1", "0%").attr("y1", "0%").attr("x2", "0%").attr("y2", "100%");
    radGrad.append("stop").attr("offset", "0%").attr("stop-color", "#6366f1").attr("stop-opacity", 0.5);
    radGrad.append("stop").attr("offset", "100%").attr("stop-color", "#6366f1").attr("stop-opacity", 0);

    // Primary Object
    svg.append("circle")
      .attr("cx", xScale(0))
      .attr("cy", yScale(0))
      .attr("r", Math.abs(xScale(event.hbr) - xScale(0)))
      .attr("fill", "rgba(56, 189, 248, 0.1)")
      .attr("stroke", "#38bdf8")
      .attr("stroke-width", 2)
      .attr("class", "animate-pulse");

    // MC Results
    if (mcResult) {
       svg.selectAll("circle.mc-point")
          .data(mcResult.points)
          .enter()
          .append("circle")
          .attr("cx", d => xScale(d.x))
          .attr("cy", d => yScale(d.y))
          .attr("r", 1.5)
          .attr("fill", d => d.hit ? "#f43f5e" : "#94a3b8")
          .attr("opacity", 0.8)
          .attr("filter", d => d.hit ? "drop-shadow(0 0 4px #f43f5e)" : "none");
    } else {
        const sigmaX = event.covarianceDiagonal.x;
        const sigmaY = event.covarianceDiagonal.y;
        svg.append("ellipse")
           .attr("cx", xScale(event.relativePosition.x / 5))
           .attr("cy", yScale(event.relativePosition.y / 5))
           .attr("rx", Math.abs(xScale(sigmaX) - xScale(0)))
           .attr("ry", Math.abs(yScale(sigmaY/1.5) - yScale(0)))
           .attr("fill", "rgba(245, 158, 11, 0.05)")
           .attr("stroke", "#f59e0b")
           .attr("stroke-dasharray", "3 3");
    }

  }, [event, mcResult]);

  return (
    <div className="w-full bg-black/40 rounded-lg border border-white/5 flex flex-col items-center justify-center p-4 relative overflow-hidden group">
      <div className="absolute top-2 right-4 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>
          <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Active Scan</span>
      </div>
      <h3 className="text-space-700 text-[10px] font-black mb-4 w-full text-left uppercase tracking-widest">
        B-Plane Projection / Encounter Geometry
      </h3>
      <div className="relative bg-space-950/40 border border-white/5 rounded p-1 shadow-inner">
        <svg ref={svgRef} width={400} height={300} className="overflow-visible" />
      </div>
      <div className="w-full mt-4 flex justify-between text-[10px] text-space-700 font-mono">
        <span className="bg-white/5 px-2 py-0.5 rounded">R_EXT: {Math.round(event.missDistance * 1.5)}m</span>
        <div className="flex gap-4">
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_5px_#38bdf8]"></span> Primary</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_5px_#f43f5e]"></span> Contact</span>
        </div>
      </div>
    </div>
  );
};

export default EncounterPlane;