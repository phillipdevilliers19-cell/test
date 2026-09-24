# AVA Internal v11 — Reference-Correct Pump Animation

This version refines the AVA pull-down pump animation using the supplied vertical turbine pump bowl reference.

Key changes:
- Bowl geometry now follows the supplied reference: broad top flange, rounded/flared shoulder, cylindrical lower bowl, internal throat and central bearing region.
- The bowl is built as a true left/right split of one common geometry, so the halves meet on the shaft centreline rather than behaving like two unrelated side panels.
- The casing wear ring and pressed-in grooved bush are represented concentrically inside the bowl.
- Shaft, bowl halves and bearing interface remain separate animation elements.
- Top inspection view shows the flange, cavity, wear ring, grooved bush and rotating shaft.
- Existing AVA application data and portfolio functionality are unchanged.

Test gesture: on Home, at the top of the page, pull down and hold, then release.
