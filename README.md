# Entry Task — Procedural Perlin noise map generator
## Overview

For the entry task, I built a deterministic procedural Perlin noise map generator using fractional Brownian motion (fBm).

This map represents terrain structure and serves as the foundation for generating full environments. The system is fully seed-driven, ensuring identical outputs across devices.

---

## How the System Works

At its core, the terrain is generated using Perlin noise, which produces smooth and continuous variation. Instead of random, disconnected values, nearby points are related — which naturally results in terrain that looks structured rather than chaotic.

On top of this, fBm is used to layer multiple levels of detail:
- large-scale structure defines the overall shape (deep vs shallow regions)  
- mid-scale variation introduces ridges and formations  
- fine detail adds surface complexity  

The result is terrain that has both global structure and local detail, similar to real marine environments.

---

## Key Controls

Rather than treating parameters as isolated values, they act together to define the character of the terrain:

- **Scale** controls how large or small features appear  
- **Octaves** define how much detail is layered into the terrain  
- **Persistence** controls how strong higher-frequency details are  
- **Lacunarity** controls how quickly detail scales between layers  

By adjusting these, the same generator can produce very different environments — from smooth seabeds to highly complex reef structures.

---

## Determinism (Seed-Based Generation)

The entire system is driven by a seed value.

Given the same seed and parameters:
- the terrain is identical every time  
- results are consistent across devices  

This ensures that multiple users can experience the same generated environment without storing or transmitting large datasets.

---

## How This Scales Further

This entry task is a 2D representation of a much larger system.

The same foundation can be extended into:

- **3D terrain generation**  
  Extending noise into 3D enables caves, reef walls, and volumetric structures.

- **Intelligent placement**  
  The terrain can act as a probability field for placing elements like coral, based on conditions such as depth or slope.

- **Ecosystem behavior**  
  A simulation layer can evolve the environment over time — growth, competition, and decay — while remaining deterministic.

- **Streaming and LOD**  
  Terrain can be generated in chunks around the user, allowing large-scale environments to run efficiently.

---

## Further Work

Building on this foundation, I developed a more complete proof of concept that includes:
- terrain generation inside Unity  
- clustered coral placement  
- rule-based ecosystem simulation  

Repository:
https://github.com/KarruHarin/Marine_Map_Generator

---

## Summary

This task demonstrates a deterministic procedural system that:
- generates structured terrain using fBm  
- is fully reproducible via seed control  
- scales naturally into a full ecosystem simulation pipeline  
