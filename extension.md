The hackathon starts Saturday, Nov. 14, two days from now. Here are the specific things I’d add, ranked by how much they should help you win.
What the research says about winning
The challenge is real. It appears in the 2026 list as “Interplanetary Survival Guide: Martian Map,” which asks teams to build an interactive map for exploring and navigating Mars. 
therecursive
Judging has five criteria. Projects are scored on Impact, Creativity, Validity, Relevance and Presentation. These are from the 2025 guide, so check the 2026 version. The guide also tells teams to pay equal attention to presentation, which most teams neglect. 
spaceappschallenge
spaceappschallenge
Eligibility. You must register for the hackathon to be eligible for Global Judging. Older judging rules also required code in a public repository, so keep yours open source. I’m not sure those older rules still apply, so check the 2026 guide. 
spaceappschallenge
Your idea has precedent. NASA’s Mars Trek already offers distance measuring, elevation plots, and lighting and slope analysis, so those alone won’t impress judges. A 2016 Mars map competition said it wanted a product astronauts can use during their mission, not simply a geologic map. That is the gap to aim at. 
nasa
maproomblog
What I’d add, in priority order
1. A “safe return envelope” as the hero feature.
Instead of just routing, shade the map to show everywhere the crew can walk to and still get back with a consumables reserve. It is one clear picture that combines slope, hazard terrain, suit speed and oxygen. Mars Trek has no equivalent, and it makes the safety story visible in seconds. It is also cheap to build, because it is a Dijkstra (shortest-path) flood fill on the cost grid you already have.
2. A validation test against Perseverance’s real path.
Compare your hazard map and planned routes with where Perseverance actually drove. A NASA GeoJSON traverse layer exists, as a student Mars 2020 tracker project pulled its traverse path from NASA data. A slide like “our model avoided X% of cells that real drivers avoided” speaks directly to the Validity criterion. I haven’t confirmed the traverse data is easy to download, so check that first, and drop this idea if it takes too long. 
texas
3. Dose-aware planning with honest labels.
Add a solar-particle-event scenario that shows the nearest shelter and re-ranks the route by exposure time. Label the radiation numbers as proxy values, since measured surface data at Jezero doesn’t exist. Judges reward visible honesty about limits.
4. A “planned versus expected” panel for each waypoint.
When a waypoint is selected, show one orbital view, one derived hazard value and one real Perseverance photo. For photos, don’t use the old Mars Rover Photos API. A Python wrapper’s docs list its backend as down. Use the raw-image feed at mars.nasa.gov/rss/api instead, which community tools query for Mars 2020 raw images. This is an unofficial feed, so cache a sample set in case it fails during the demo. 
pypi
docs
5. A presentation plan.
A fixed 60–90 second story: “Two astronauts, 7 hours of air, one question: how far can we safely go?” Then show the envelope, a route, an SPE alert flipping the safety status, and the HUD view.
What I’d cut
With about two days, drop 3D terrain, two-astronaut mode, offline mode and PDF export. Build 5–6 layers well, plus items 1 and 3, before touching anything else.
Want me to update goal.md, architecture.md and agent.md to add the return envelope and the validation test, switch the POV source, and cut the scope to a 2-day plan?
