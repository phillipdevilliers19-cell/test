# AVA Internal

A mobile-first internal engineering web app for Vesconite.

## Included

- General bearing design calculator
- Pump bearing calculator
- Marine bearing calculator
- Motion / PV calculator
- Freezer-fit cooling-time estimator
- Warm-up-time estimator
- Application library
- Add new industries from the app
- Photo capture/upload
- Common application questions
- Search and industry filtering
- Local browser storage
- JSON backup / restore
- GitHub Pages compatible
- No AI, API key or paid service required

## GitHub Pages

1. Create a public GitHub repository.
2. Upload `index.html`, `style.css` and `app.js` to the repository root.
3. Go to Settings → Pages.
4. Set deployment to the `main` branch and `/ (root)`.
5. Open the GitHub Pages URL.

## Important database note

GitHub Pages is static hosting. The application library in this first version is stored locally in each employee's browser. It is therefore not a shared company database.

Use Export / Import to move records between devices.

For a true shared multi-user database, the next version can connect this interface to a backend such as Supabase/Firebase or another company-approved service.

## Engineering note

The bearing calculations are based on published Vesconite design guidance where formulas are available. The freezer calculator is an engineering estimate using a lumped thermal model and must be validated against actual installation trials before being used as a production instruction.


## Portfolio linking

Open any application, choose **Link applications**, select related records, and save. **Export / Print PDF** then creates a combined A4 application portfolio with a cover page and one section per linked application.
