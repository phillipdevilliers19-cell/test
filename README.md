# AVA Internal v10

This build includes the revised interactive vertical-turbine-pump pull-down animation.

## Animation
1. Start at the top of Home.
2. Pull down from the top edge and hold.
3. The shaft extends and the release cue appears.
4. Release after the hold threshold.
5. The shaft launches into the centre and rotates.
6. Two pump-bowl halves enter from opposite sides and close around the shaft.
7. The exposed assembly shows the Vesconite wear-ring / grooved-bush interface.
8. The view tips toward a top inspection view.
9. The shaft rotation is shown inside the grooved Vesconite bearing.
10. The engineering view slows and fades back to AVA.

The animation is implemented with inline SVG, CSS and JavaScript; it is not a prerecorded video.

## Existing data
Application data remains under the existing localStorage keys. Replace only `index.html`, `app.js`, and `style.css` when updating an existing AVA deployment.
